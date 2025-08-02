const { execKubectl } = require('../utils/kubectl');
const { storeNodeMetrics, getHistoricalNodeMetrics } = require('./metricsController');

const getNodes = async (req, res) => {
  const userId = req.user?.id;
  
  try {
    console.log(`🖥️ Getting nodes for user: ${userId}`);
    const output = await execKubectl('kubectl get nodes', userId);
    const lines = output.trim().split('\n');
    const nodes = [];
    
    // Skip header line and process each node line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 5) {
        nodes.push({
          name: parts[0],
          status: parts[1],
          roles: parts[2],
          age: parts[3],
          version: parts[4]
        });
      }
    }
    
    console.log(`🖥️ Nodes result for user ${userId}:`, nodes.length, 'nodes');
    res.json({ nodes });
  } catch (err) {
    console.error('Get nodes error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

const getNodeMetrics = async (req, res) => {
  const userId = req.user?.id;
  const { live } = req.query;

  // If not requesting live data, return historical data (15 seconds delayed)
  if (!live) {
    return getHistoricalNodeMetrics(req, res);
  }
  
  try {
    console.log(`📊 Getting node metrics for user: ${userId}`);
    const output = await execKubectl('kubectl top nodes', userId);
    const lines = output.trim().split('\n');
    const nodeMetrics = [];
    
    // Skip header line and process each node line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 5) {
        nodeMetrics.push({
          name: parts[0],
          cpu: parts[1],
          cpuPercentage: parts[2].replace('%', ''),
          memory: parts[3],
          memoryPercentage: parts[4].replace('%', '')
        });
      }
    }
    
    console.log(`📊 Node metrics result for user ${userId}:`, nodeMetrics.length, 'nodes');
    
    // Store metrics in database for historical data
    await storeNodeMetrics(nodeMetrics);
    
    res.json({ nodeMetrics });
  } catch (err) {
    console.error('Node metrics error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

module.exports = {
  getNodes,
  getNodeMetrics
};