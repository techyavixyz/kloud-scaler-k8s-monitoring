const { execKubectl } = require('../utils/kubectl');

const getLogs = async (req, res) => {
  let { namespace, appLabel, podName, tail = '50' } = req.query;
  const userId = req.user?.id;
  
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
    console.log(`📝 Getting logs for user: ${userId}, namespace: ${namespace}, pod: ${podName || 'app=' + appLabel}`);
    const logs = await execKubectl(cmd, userId);
    console.log(`📝 Logs retrieved for user ${userId}:`, logs.length, 'characters');
    return res.json({ logs });
  } catch (err1) {
    if (appLabel && podName) {
      try {
        const fallbackCmd = `kubectl logs -n ${namespace} ${podName} --tail=${tail}`;
        const fallbackLogs = await execKubectl(fallbackCmd, userId);
        console.log(`📝 Fallback logs retrieved for user ${userId}:`, fallbackLogs.length, 'characters');
        return res.json({ logs: fallbackLogs });
      } catch (err2) {
        console.error(`📝 Logs error for user ${userId}:`, err2);
        return res.status(500).json({ error: err2.toString() });
      }
    }
    console.error(`📝 Logs error for user ${userId}:`, err1);
    return res.status(500).json({ error: err1.toString() });
  }
};

module.exports = {
  getLogs
};