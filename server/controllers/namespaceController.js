const { exec } = require('child_process');

function execShell(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
      if (error) return reject(`❌ Error: ${error.message}`);
      if (stderr && !stdout) return reject(`❌ stderr: ${stderr}`);
      resolve(stdout.trim());
    });
  });
}

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