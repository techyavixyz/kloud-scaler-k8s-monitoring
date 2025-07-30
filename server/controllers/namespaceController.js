const { execShell } = require('../utils/kubectl');

const getNamespaces = async (req, res) => {
  try {
    const output = await execShell('kubectl get namespaces --no-headers');
    const lines = output.split('\n');
    const namespaces = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        namespaces.push({
          name: parts[0],
          status: parts[1],
          age: parts[2]
        });
      }
    }

    res.json({ namespaces });
  } catch (err) {
    console.error('Get namespaces error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

module.exports = {
  getNamespaces
};