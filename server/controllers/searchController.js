import { execShell } from '../utils/kubectl.js';

export const searchResources = async (req, res) => {
  try {
    const { namespace, query = '', type = 'all' } = req.query;

    if (!namespace) {
      return res.status(400).json({ error: 'Namespace required' });
    }

    const results = {
      pods: [],
      services: [],
      deployments: [],
      configmaps: [],
      secrets: []
    };

    // Search pods
    if (type === 'all' || type === 'pods') {
      try {
        const podsOutput = await execShell(`kubectl get pods -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.conditions[?(@.type=="Ready")].status`);
        const podLines = podsOutput.split('\n').filter(Boolean);
        
        results.pods = podLines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              status: parts[1] || 'Unknown',
              ready: parts[2] === 'True',
              type: 'pod'
            };
          })
          .filter(pod => !query || pod.name.toLowerCase().includes(query.toLowerCase()));
      } catch (error) {
        console.log('No pods found or error:', error.message);
      }
    }

    // Search services
    if (type === 'all' || type === 'services') {
      try {
        const servicesOutput = await execShell(`kubectl get services -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name,TYPE:.spec.type,CLUSTER-IP:.spec.clusterIP`);
        const serviceLines = servicesOutput.split('\n').filter(Boolean);
        
        results.services = serviceLines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              serviceType: parts[1] || 'ClusterIP',
              clusterIP: parts[2] || 'None',
              type: 'service'
            };
          })
          .filter(service => !query || service.name.toLowerCase().includes(query.toLowerCase()));
      } catch (error) {
        console.log('No services found or error:', error.message);
      }
    }

    // Search deployments
    if (type === 'all' || type === 'deployments') {
      try {
        const deploymentsOutput = await execShell(`kubectl get deployments -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name,READY:.status.readyReplicas,UP-TO-DATE:.status.updatedReplicas,AVAILABLE:.status.availableReplicas`);
        const deploymentLines = deploymentsOutput.split('\n').filter(Boolean);
        
        results.deployments = deploymentLines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              ready: parts[1] || '0',
              upToDate: parts[2] || '0',
              available: parts[3] || '0',
              type: 'deployment'
            };
          })
          .filter(deployment => !query || deployment.name.toLowerCase().includes(query.toLowerCase()));
      } catch (error) {
        console.log('No deployments found or error:', error.message);
      }
    }

    // Search configmaps
    if (type === 'all' || type === 'configmaps') {
      try {
        const configmapsOutput = await execShell(`kubectl get configmaps -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name,DATA:.data`);
        const configmapLines = configmapsOutput.split('\n').filter(Boolean);
        
        results.configmaps = configmapLines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              dataKeys: parts.slice(1).join(' ') || 'No data',
              type: 'configmap'
            };
          })
          .filter(configmap => !query || configmap.name.toLowerCase().includes(query.toLowerCase()));
      } catch (error) {
        console.log('No configmaps found or error:', error.message);
      }
    }

    // Search secrets
    if (type === 'all' || type === 'secrets') {
      try {
        const secretsOutput = await execShell(`kubectl get secrets -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name,TYPE:.type,DATA:.data`);
        const secretLines = secretsOutput.split('\n').filter(Boolean);
        
        results.secrets = secretLines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              secretType: parts[1] || 'Opaque',
              dataCount: Object.keys(parts.slice(2).join(' ') || {}).length,
              type: 'secret'
            };
          })
          .filter(secret => !query || secret.name.toLowerCase().includes(query.toLowerCase()));
      } catch (error) {
        console.log('No secrets found or error:', error.message);
      }
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, items) => sum + items.length, 0);

    res.json({
      results,
      totalResults,
      namespace,
      query
    });
  } catch (error) {
    console.error('Search resources error:', error);
    res.status(500).json({ error: 'Failed to search resources' });
  }
};

export const getResourceSuggestions = async (req, res) => {
  try {
    const { namespace, query = '', limit = 10 } = req.query;

    if (!namespace || !query) {
      return res.json({ suggestions: [] });
    }

    const suggestions = [];

    // Get pod suggestions
    try {
      const podsOutput = await execShell(`kubectl get pods -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name`);
      const podNames = podsOutput.split('\n').filter(Boolean).map(line => line.trim());
      
      const matchingPods = podNames
        .filter(name => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map(name => ({
          name,
          type: 'pod',
          namespace,
          icon: '📦'
        }));
      
      suggestions.push(...matchingPods);
    } catch (error) {
      console.log('No pods found for suggestions');
    }

    // Get service suggestions
    try {
      const servicesOutput = await execShell(`kubectl get services -n ${namespace} --no-headers -o custom-columns=NAME:.metadata.name`);
      const serviceNames = servicesOutput.split('\n').filter(Boolean).map(line => line.trim());
      
      const matchingServices = serviceNames
        .filter(name => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, Math.max(0, limit - suggestions.length))
        .map(name => ({
          name,
          type: 'service',
          namespace,
          icon: '🌐'
        }));
      
      suggestions.push(...matchingServices);
    } catch (error) {
      console.log('No services found for suggestions');
    }

    res.json({ suggestions: suggestions.slice(0, limit) });
  } catch (error) {
    console.error('Get resource suggestions error:', error);
    res.status(500).json({ error: 'Failed to get resource suggestions' });
  }
};