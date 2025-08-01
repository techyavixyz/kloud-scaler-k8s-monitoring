const { execKubectl } = require('../utils/kubectl');

const getNodes = async (req, res) => {
  const userId = req.user?.id;
  
  try {
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
    
    res.json({ nodes });
  } catch (err) {
    console.error('Get nodes error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

const getNodeMetrics = async (req, res) => {
  const userId = req.user?.id;
  
  try {
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