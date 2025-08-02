const { pool } = require('./authController');

// Initialize metrics tables
const initializeMetricsTables = async () => {
  try {
    // Resource usage metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        namespace VARCHAR(255) NOT NULL,
        cpu_raw DECIMAL(10,3) NOT NULL,
        memory_raw INTEGER NOT NULL,
        pod_count INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pod metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pod_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        namespace VARCHAR(255) NOT NULL,
        pod_name VARCHAR(255) NOT NULL,
        cpu_usage VARCHAR(50) NOT NULL,
        memory_usage VARCHAR(50) NOT NULL,
        cpu_raw DECIMAL(10,3) NOT NULL,
        memory_raw INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        node_name VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Node metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS node_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        node_name VARCHAR(255) NOT NULL,
        cpu_usage VARCHAR(50) NOT NULL,
        memory_usage VARCHAR(50) NOT NULL,
        cpu_percentage DECIMAL(5,2) NOT NULL,
        memory_percentage DECIMAL(5,2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_resource_metrics_timestamp ON resource_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_resource_metrics_namespace ON resource_metrics(namespace);
      CREATE INDEX IF NOT EXISTS idx_pod_metrics_timestamp ON pod_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_pod_metrics_pod_name ON pod_metrics(pod_name);
      CREATE INDEX IF NOT EXISTS idx_pod_metrics_namespace ON pod_metrics(namespace);
      CREATE INDEX IF NOT EXISTS idx_node_metrics_timestamp ON node_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_node_metrics_node_name ON node_metrics(node_name);
    `);

    console.log('✅ Metrics tables initialized successfully');
  } catch (error) {
    console.error('❌ Metrics tables initialization error:', error);
  }
};

// Store resource metrics
const storeResourceMetrics = async (metrics) => {
  try {
    for (const metric of metrics) {
      await pool.query(`
        INSERT INTO resource_metrics (namespace, cpu_raw, memory_raw, pod_count, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        metric.namespace,
        metric.cpuRaw,
        metric.memoryRaw,
        metric.podCount,
        new Date(metric.timestamp)
      ]);
    }
  } catch (error) {
    console.error('Error storing resource metrics:', error);
  }
};

// Store pod metrics
const storePodMetrics = async (podMetrics) => {
  try {
    for (const metric of podMetrics) {
      for (const pod of metric.pods) {
        const cpuValue = pod.cpu.endsWith('m') ? parseInt(pod.cpu) : parseFloat(pod.cpu) * 1000;
        const memoryValue = pod.memory.endsWith('Mi') ? parseInt(pod.memory) : 
                           pod.memory.endsWith('Gi') ? parseInt(pod.memory) * 1024 : parseInt(pod.memory);

        await pool.query(`
          INSERT INTO pod_metrics (namespace, pod_name, cpu_usage, memory_usage, cpu_raw, memory_raw, status, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          metric.namespace,
          pod.pod,
          pod.cpu,
          pod.memory,
          cpuValue,
          memoryValue,
          'Running', // Default status, can be enhanced
          new Date()
        ]);
      }
    }
  } catch (error) {
    console.error('Error storing pod metrics:', error);
  }
};

// Store node metrics
const storeNodeMetrics = async (nodeMetrics) => {
  try {
    for (const metric of nodeMetrics) {
      await pool.query(`
        INSERT INTO node_metrics (node_name, cpu_usage, memory_usage, cpu_percentage, memory_percentage, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        metric.name,
        metric.cpu,
        metric.memory,
        parseFloat(metric.cpuPercentage),
        parseFloat(metric.memoryPercentage),
        new Date()
      ]);
    }
  } catch (error) {
    console.error('Error storing node metrics:', error);
  }
};

// Get historical resource metrics (15 seconds delayed)
const getHistoricalResourceMetrics = async (req, res) => {
  try {
    const delayedTimestamp = new Date(Date.now() - 15000); // 15 seconds ago
    
    const result = await pool.query(`
      SELECT DISTINCT ON (namespace) 
        namespace, 
        cpu_raw as "cpuRaw", 
        memory_raw as "memoryRaw", 
        pod_count as "podCount",
        timestamp
      FROM resource_metrics 
      WHERE timestamp <= $1
      ORDER BY namespace, timestamp DESC
    `, [delayedTimestamp]);

    const metrics = result.rows.map(row => ({
      namespace: row.namespace,
      cpu: row.cpuRaw >= 1 ? `${row.cpuRaw.toFixed(2)} cores` : `${(row.cpuRaw * 1000).toFixed(0)} millicores`,
      cpuRaw: parseFloat(row.cpuRaw),
      memory: row.memoryRaw >= 1024 ? `${(row.memoryRaw / 1024).toFixed(2)} GiB` : `${row.memoryRaw} MiB`,
      memoryRaw: row.memoryRaw,
      podCount: row.podCount,
      timestamp: row.timestamp.toISOString()
    }));

    res.json(metrics);
  } catch (error) {
    console.error('Get historical resource metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch historical metrics' });
  }
};

// Get historical pod metrics by pod name
const getHistoricalPodMetrics = async (req, res) => {
  const { podName, namespace, hours = 24 } = req.query;
  
  if (!podName || !namespace) {
    return res.status(400).json({ error: 'Pod name and namespace are required' });
  }

  try {
    const hoursAgo = new Date(Date.now() - (parseInt(hours) * 60 * 60 * 1000));
    const delayedTimestamp = new Date(Date.now() - 15000); // 15 seconds ago
    
    const result = await pool.query(`
      SELECT 
        cpu_raw as "cpuRaw",
        memory_raw as "memoryRaw", 
        cpu_usage as "cpuUsage",
        memory_usage as "memoryUsage",
        timestamp
      FROM pod_metrics 
      WHERE pod_name = $1 
        AND namespace = $2 
        AND timestamp >= $3 
        AND timestamp <= $4
      ORDER BY timestamp ASC
    `, [podName, namespace, hoursAgo, delayedTimestamp]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get historical pod metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch pod historical metrics' });
  }
};

// Get all pods for namespace (15 seconds delayed)
const getHistoricalPodMetrics15SecDelay = async (req, res) => {
  try {
    const delayedTimestamp = new Date(Date.now() - 15000); // 15 seconds ago
    
    const result = await pool.query(`
      SELECT 
        namespace,
        array_agg(
          json_build_object(
            'pod', pod_name,
            'cpu', cpu_usage,
            'memory', memory_usage,
            'namespace', namespace
          )
        ) as pods,
        sum(cpu_raw) as "totalCpu",
        sum(memory_raw) as "totalMemory",
        count(*) as "podCount"
      FROM (
        SELECT DISTINCT ON (namespace, pod_name) 
          namespace, pod_name, cpu_usage, memory_usage, cpu_raw, memory_raw
        FROM pod_metrics 
        WHERE timestamp <= $1
        ORDER BY namespace, pod_name, timestamp DESC
      ) latest_pods
      GROUP BY namespace
      ORDER BY namespace
    `, [delayedTimestamp]);

    const namespaceMetrics = result.rows.map(row => ({
      namespace: row.namespace,
      pods: row.pods,
      totalCpu: parseFloat(row.totalCpu),
      totalMemory: parseInt(row.totalMemory),
      podCount: parseInt(row.podCount)
    }));

    res.json({ namespaceMetrics });
  } catch (error) {
    console.error('Get historical pod metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch pod metrics' });
  }
};

// Get historical node metrics (15 seconds delayed)
const getHistoricalNodeMetrics = async (req, res) => {
  try {
    const delayedTimestamp = new Date(Date.now() - 15000); // 15 seconds ago
    
    const result = await pool.query(`
      SELECT DISTINCT ON (node_name) 
        node_name as name,
        cpu_usage as cpu,
        memory_usage as memory,
        cpu_percentage as "cpuPercentage",
        memory_percentage as "memoryPercentage"
      FROM node_metrics 
      WHERE timestamp <= $1
      ORDER BY node_name, timestamp DESC
    `, [delayedTimestamp]);

    res.json({ nodeMetrics: result.rows });
  } catch (error) {
    console.error('Get historical node metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch node metrics' });
  }
};

// Cleanup old metrics (keep last 30 days)
const cleanupOldMetrics = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    await pool.query('DELETE FROM resource_metrics WHERE timestamp < $1', [thirtyDaysAgo]);
    await pool.query('DELETE FROM pod_metrics WHERE timestamp < $1', [thirtyDaysAgo]);
    await pool.query('DELETE FROM node_metrics WHERE timestamp < $1', [thirtyDaysAgo]);
    
    console.log('✅ Old metrics cleaned up');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};

// Initialize on startup
initializeMetricsTables();

// Cleanup old metrics daily
setInterval(cleanupOldMetrics, 24 * 60 * 60 * 1000);

module.exports = {
  storeResourceMetrics,
  storePodMetrics,
  storeNodeMetrics,
  getHistoricalResourceMetrics,
  getHistoricalPodMetrics,
  getHistoricalPodMetrics15SecDelay,
  getHistoricalNodeMetrics,
  initializeMetricsTables
};