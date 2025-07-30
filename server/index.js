import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { WebSocketServer } from 'ws';
import http from 'http';
import pg from 'pg';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

const { Pool } = pg;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3001;

// Database setup
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'k8s_monitoring',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Utility function for shell commands
function execShell(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 10000 }, (error, stdout, stderr) => {
      if (error) return reject(`Error: ${error.message}`);
      if (stderr && !stdout) return reject(`stderr: ${stderr}`);
      resolve(stdout.trim());
    });
  });
}

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs_history (
        id SERIAL PRIMARY KEY,
        namespace VARCHAR(255) NOT NULL,
        pod_name VARCHAR(255) NOT NULL,
        app_label VARCHAR(255),
        log_content TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_metrics (
        id SERIAL PRIMARY KEY,
        namespace VARCHAR(255) NOT NULL,
        cpu_usage DECIMAL(10,4),
        memory_usage DECIMAL(10,4),
        pod_count INTEGER,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS k8s_contexts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        cluster VARCHAR(255),
        user_name VARCHAR(255),
        is_current BOOLEAN DEFAULT FALSE,
        last_used TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
});

function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'subscribe_logs':
      subscribeToLogs(ws, data.payload);
      break;
    case 'subscribe_metrics':
      subscribeToMetrics(ws, data.payload);
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

// API Routes

// Resource usage endpoint
app.get('/api/resource-usage', async (req, res) => {
  try {
    const output = await execShell('kubectl top pods --all-namespaces --no-headers');
    const lines = output.split('\n').filter(line => line.trim());
    const nsUsage = {};

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const [namespace, podName, cpuRaw, memoryRaw] = parts;
        const cpu = parseCPU(cpuRaw);
        const memory = parseMemory(memoryRaw);

        if (!nsUsage[namespace]) {
          nsUsage[namespace] = { cpu: 0, memory: 0, podCount: 0 };
        }
        nsUsage[namespace].cpu += cpu;
        nsUsage[namespace].memory += memory;
        nsUsage[namespace].podCount += 1;
      }
    }

    const result = Object.entries(nsUsage).map(([namespace, data]) => ({
      namespace,
      cpu: formatCPU(data.cpu),
      cpuRaw: data.cpu,
      memory: formatMemory(data.memory),
      memoryRaw: data.memory,
      podCount: data.podCount,
      timestamp: new Date()
    }));

    // Store metrics in database
    for (const metric of result) {
      await pool.query(
        'INSERT INTO resource_metrics (namespace, cpu_usage, memory_usage, pod_count) VALUES ($1, $2, $3, $4)',
        [metric.namespace, metric.cpuRaw, metric.memoryRaw, metric.podCount]
      );
    }

    res.json(result);
  } catch (err) {
    console.error('Resource usage error:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Historical metrics endpoint
app.get('/api/metrics/history/:namespace', async (req, res) => {
  try {
    const { namespace } = req.params;
    const { hours = 24 } = req.query;
    
    const result = await pool.query(
      `SELECT cpu_usage, memory_usage, pod_count, timestamp 
       FROM resource_metrics 
       WHERE namespace = $1 AND timestamp > NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp ASC`,
      [namespace]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Pod logs endpoint
app.get('/api/logs', async (req, res) => {
  try {
    const { namespace, appLabel, podName, tail = 50, follow = false } = req.query;

    if (!namespace || (!appLabel && !podName)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let command;
    if (appLabel) {
      command = `kubectl logs -n ${namespace} --selector app=${appLabel} --tail=${tail}`;
    } else {
      command = `kubectl logs -n ${namespace} ${podName} --tail=${tail}`;
    }

    if (follow === 'true') {
      command += ' --follow';
    }

    const logs = await execShell(command);

    // Store logs in database
    await pool.query(
      'INSERT INTO logs_history (namespace, pod_name, app_label, log_content) VALUES ($1, $2, $3, $4)',
      [namespace, podName || 'multiple', appLabel, logs]
    );

    res.json({ logs, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Pods list endpoint
app.get('/api/pods', async (req, res) => {
  try {
    const { namespace } = req.query;
    if (!namespace) {
      return res.status(400).json({ error: 'Missing namespace' });
    }

    const command = `kubectl get pods -n ${namespace} -o json`;
    const output = await execShell(command);
    const data = JSON.parse(output);

    const pods = data.items.map(pod => ({
      name: pod.metadata.name,
      status: pod.status.phase,
      ready: pod.status.conditions?.find(c => c.type === 'Ready')?.status === 'True',
      restarts: pod.status.containerStatuses?.[0]?.restartCount || 0,
      age: pod.metadata.creationTimestamp,
      labels: pod.metadata.labels || {},
      node: pod.spec.nodeName
    }));

    res.json({ pods });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Namespaces endpoint
app.get('/api/namespaces', async (req, res) => {
  try {
    const output = await execShell('kubectl get namespaces -o json');
    const data = JSON.parse(output);
    
    const namespaces = data.items.map(ns => ({
      name: ns.metadata.name,
      status: ns.status.phase,
      age: ns.metadata.creationTimestamp,
      labels: ns.metadata.labels || {}
    }));

    res.json({ namespaces });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Kubernetes contexts endpoints
app.get('/api/contexts', async (req, res) => {
  try {
    const contextList = await execShell('kubectl config get-contexts -o name');
    const currentContext = await execShell('kubectl config current-context');
    
    const contexts = contextList.split('\n').map(name => ({
      name: name.trim(),
      current: name.trim() === currentContext.trim()
    }));

    // Update database
    for (const ctx of contexts) {
      await pool.query(
        `INSERT INTO k8s_contexts (name, is_current, last_used) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (name) DO UPDATE SET 
         is_current = $2, last_used = NOW()`,
        [ctx.name, ctx.current]
      );
    }

    res.json({ contexts });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.post('/api/contexts/set', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'No context provided' });
    }

    await execShell(`kubectl config use-context ${context}`);
    
    // Update database
    await pool.query('UPDATE k8s_contexts SET is_current = FALSE');
    await pool.query(
      'UPDATE k8s_contexts SET is_current = TRUE, last_used = NOW() WHERE name = $1',
      [context]
    );

    res.json({ message: `Context set to ${context}` });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Utility functions
function parseCPU(value) {
  if (value.endsWith('m')) {
    return parseInt(value.replace('m', '')) / 1000;
  }
  return parseFloat(value);
}

function formatCPU(value) {
  return value >= 1 ? `${value.toFixed(2)} cores` : `${(value * 1000).toFixed(0)}m`;
}

function parseMemory(value) {
  const lower = value.toLowerCase();
  if (lower.endsWith('mi')) return parseInt(lower.replace('mi', ''));
  if (lower.endsWith('gi')) return parseInt(lower.replace('gi', '')) * 1024;
  if (lower.endsWith('ki')) return parseInt(lower.replace('ki', '')) / 1024;
  return parseInt(value);
}

function formatMemory(valueMi) {
  if (valueMi >= 1024) {
    return `${(valueMi / 1024).toFixed(2)} GiB`;
  }
  return `${valueMi.toFixed(0)} MiB`;
}

// WebSocket subscription handlers
function subscribeToLogs(ws, payload) {
  const { namespace, appLabel, podName } = payload;
  // Implementation for real-time log streaming
}

function subscribeToMetrics(ws, payload) {
  // Implementation for real-time metrics updates
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start server
async function startServer() {
  await initDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 K8s Monitoring API server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready for connections`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});