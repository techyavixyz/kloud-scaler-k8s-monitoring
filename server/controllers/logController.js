const { execShell } = require('../utils/kubectl');

const getLogs = async (req, res) => {
  const { namespace, appLabel, podName, tail = 50 } = req.query;
  
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