const { execShell } = require('../utils/kubectl');

const getPods = async (req, res) => {
  const { namespace } = req.query;
  if (!namespace) {
    return res.status(400).json({ error: 'Missing namespace' });
  }

  try {
    const cmd = `kubectl get pods -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.conditions[?(@.type=="Ready")].status,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp,NODE:.spec.nodeName`;
    const output = await execShell(cmd);
    
    if (!output) {
      return res.json({ pods: [] });
    }

    const podLines = output.split('\n').filter(Boolean);
    const pods = [];

    for (const line of podLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        // Get pod labels
        let labels = {};
        try {
          const labelCmd = `kubectl get pod ${parts[0]} -n ${namespace} -o jsonpath='{.metadata.labels}'`;
          const labelOutput = await execShell(labelCmd);
          if (labelOutput && labelOutput !== '{}') {
            labels = JSON.parse(labelOutput.replace(/'/g, '"'));
          }
        } catch (err) {
          // Ignore label fetch errors
        }

        pods.push({
          name: parts[0],
          status: parts[1] || 'Unknown',
          ready: parts[2] === 'True',
          restarts: parseInt(parts[3]) || 0,
          age: parts[4] || 'Unknown',
          node: parts[5] || 'Unknown',
          labels: labels
        });
      }
    }

    res.json({ pods });
  } catch (err) {
    console.error('Get pods error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

const getFailedPods = async (req, res) => {
  const { namespace } = req.query;
  
  try {
    const nsArg = namespace ? `-n ${namespace}` : '--all-namespaces';
    const output = await execShell(`kubectl get pods ${nsArg} --no-headers`);
    
    if (!output) {
      return res.json({ failedPods: [] });
    }

    const lines = output.split('\n');
    const failedPods = [];

    for (let line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;

      const ns = namespace || parts[0];
      const pod = parts[namespace ? 0 : 1];
      const status = parts[namespace ? 2 : 3];
      const restarts = parts[namespace ? 4 : 5];
      const age = parts[namespace ? 5 : 6];

      if (['Error', 'Evicted', 'ImagePullBackOff', 'CrashLoopBackOff', 'Failed'].some(err => status.includes(err))) {
        failedPods.push({ 
          namespace: ns, 
          pod, 
          status,
          restarts: parseInt(restarts) || 0,
          age: age || 'Unknown'
        });
      }
    }

    res.json({ failedPods });
  } catch (err) {
    console.error('Failed pods error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

const getPodDetails = async (req, res) => {
  const { namespace, pod } = req.query;
  
  if (!namespace || !pod) {
    return res.status(400).json({ error: 'Missing namespace or pod name' });
  }

  try {
    const output = await execShell(`kubectl describe pod ${pod} -n ${namespace}`);
    const lines = output.split('\n');

    let reason = '';
    let message = '';
    let events = [];

    let inEventSection = false;
    for (let line of lines) {
      if (line.includes('Reason:') && reason === '') {
        reason = line.split('Reason:')[1].trim();
      }
      if (line.includes('Message:') && message === '') {
        message = line.split('Message:')[1].trim();
      }
      if (line.includes('Events:')) {
        inEventSection = true;
        continue;
      }
      if (inEventSection) {
        if (line.trim() === '' || line.includes('Conditions:')) break;
        events.push(line.trim());
      }
    }

    res.json({
      reason,
      message,
      events: events.length > 0 ? events.join('\n') : 'N/A'
    });
  } catch (err) {
    console.error('Pod details error:', err);
    res.status(500).json({ 
      reason: 'Failed to fetch details',
      message: err.toString(),
      events: 'N/A'
    });
  }
};

const getAllPodMetrics = async (req, res) => {
  try {
    // Get all namespaces
    const nsOutput = await execShell('kubectl get ns --no-headers -o custom-columns=":metadata.name"');
    const namespaces = nsOutput.split('\n').map(ns => ns.trim()).filter(Boolean);

    const namespaceMetrics = [];

    for (const ns of namespaces) {
      try {
        const output = await execShell(`kubectl top pods -n ${ns} --no-headers`);
        if (!output) continue;

        const lines = output.split('\n');
        const pods = [];
        let totalCpu = 0;
        let totalMemory = 0;

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const cpuValue = parts[1].endsWith('m') ? parseInt(parts[1]) : parseFloat(parts[1]) * 1000;
            const memoryValue = parts[2].endsWith('Mi') ? parseInt(parts[2]) : 
                               parts[2].endsWith('Gi') ? parseInt(parts[2]) * 1024 : parseInt(parts[2]);

            pods.push({
              pod: parts[0],
              cpu: parts[1],
              memory: parts[2],
              namespace: ns
            });

            totalCpu += cpuValue;
            totalMemory += memoryValue;
          }
        }

        if (pods.length > 0) {
          namespaceMetrics.push({
            namespace: ns,
            pods,
            totalCpu,
            totalMemory,
            podCount: pods.length
          });
        }
      } catch (err) {
        // Skip namespaces with no metrics
        continue;
      }
    }

    res.json({ namespaceMetrics });
  } catch (err) {
    console.error('All pod metrics error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

module.exports = {
  getPods,
  getFailedPods,
  getPodDetails,
  getAllPodMetrics
};