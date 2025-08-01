const { execKubectl } = require('../utils/kubectl');
const { storeResourceMetrics, getHistoricalResourceMetrics } = require('./metricsController');

function parseCPU(value) {
  return value.endsWith('m') ? parseInt(value) / 1000 : parseFloat(value);
}

function formatCPU(value) {
  return value >= 1 ? `${value.toFixed(2)} cores` : `${(value * 1000).toFixed(0)} millicores`;
}

function parseMemory(value) {
  const lower = value.toLowerCase();
  if (lower.endsWith('mi')) return parseInt(lower.replace('mi', ''));
  if (lower.endsWith('gi')) return parseInt(lower.replace('gi', '')) * 1024;
  return parseInt(value);
}

function formatMemory(valueMi) {
  return valueMi >= 1024 ? `${(valueMi / 1024).toFixed(2)} GiB` : `${valueMi} MiB`;
}

const getResourceUsage = async (req, res) => {
  const userId = req.user?.id;
  const { live } = req.query;

  // If not requesting live data, return historical data (15 seconds delayed)
  if (!live) {
    return getHistoricalResourceMetrics(req, res);
  }

  try {
    console.log(`📊 Getting resource usage for user: ${userId}`);
    const output = await execKubectl('kubectl top pods --all-namespaces --no-headers', userId);
    const lines = output.split('\n');
    const nsUsage = {};

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const namespace = parts[0];
        const cpuRaw = parts[2];
        const memoryRaw = parts[3];
        
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
      timestamp: new Date().toISOString()
    }));

    console.log(`📊 Resource usage result for user ${userId}:`, result.length, 'namespaces');
    
    // Store metrics in database for historical data
    await storeResourceMetrics(result);
    
    res.json(result);
  } catch (err) {
    console.error('Resource usage error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

const getMetricsHistory = async (req, res) => {
  const { namespace } = req.params;
  const { hours = 24 } = req.query;
  
  // For now, return mock data since we don't have historical storage yet
  // In production, this would query the PostgreSQL database
  const mockData = [];
  const now = new Date();
  
  for (let i = parseInt(hours); i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    mockData.push({
      cpu_usage: Math.random() * 2,
      memory_usage: Math.random() * 1000,
      pod_count: Math.floor(Math.random() * 10) + 1,
      timestamp: timestamp.toISOString()
    });
  }
  
  res.json(mockData);
};

module.exports = {
  getResourceUsage,
  getMetricsHistory
};