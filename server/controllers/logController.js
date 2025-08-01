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

const getLogs = async (req, res) => {
  let { namespace, appLabel, podName, tail = '50' } = req.query;
  namespace = encodeURI(namespace || '');
  appLabel = encodeURI(appLabel || '');
  podName = encodeURI(podName || '');
  tail = encodeURI (String(tail).trim() || '50'); // Default to 50 lines if not provided or empty
  

  
  if (!namespace || (!appLabel && !podName)) {
    return res.status(400).json({ error: 'Missing namespace and either appLabel or podName' });
  }

  let cmd = appLabel
    ? `kubectl logs -n ${namespace} --selector app=${appLabel} --tail=${tail}`
    : `kubectl logs -n ${namespace} ${podName} --tail=${tail}`;

  try {
    const logs = await execShell(cmd);
    return res.json({ logs });
  } catch (err1) {
    if (appLabel && podName) {
      try {
        const fallbackCmd = `kubectl logs -n ${namespace} ${podName} --tail=${tail}`;
        const fallbackLogs = await execShell(fallbackCmd);
        return res.json({ logs: fallbackLogs });
      } catch (err2) {
        return res.status(500).json({ error: err2.toString() });
      }
    }
    return res.status(500).json({ error: err1.toString() });
  }
};

module.exports = {
  getLogs
};