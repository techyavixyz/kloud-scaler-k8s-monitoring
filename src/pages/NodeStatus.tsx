import React, { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, RefreshCw, AlertTriangle, CheckCircle, Activity, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import NodeHistoricalChart from '../components/NodeHistoricalChart';

interface Node {
  name: string;
  status: string;
  roles: string;
  age: string;
  version: string;
}

interface NodeMetric {
  name: string;
  cpu: string;
  cpuPercentage: string;
  memory: string;
  memoryPercentage: string;
}

export default function NodeStatus() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetric[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('24');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    checkClusterStatus();
    const interval = setInterval(checkClusterStatus, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkClusterStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const [nodesResponse, metricsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/nodes', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://localhost:3001/api/node-metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      const nodesData = await nodesResponse.json();
      const metricsData = await metricsResponse.json();

      setNodes(nodesData.nodes || []);
      setNodeMetrics(metricsData.nodeMetrics || []);
      setLastUpdated(new Date());
      
      // Set first node as selected if none selected
      if (!selectedNode && nodesData.nodes && nodesData.nodes.length > 0) {
        setSelectedNode(nodesData.nodes[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch cluster status:', error);
    } finally {
      setLoading(false);
    }
  };

  const readyNodes = nodes.filter(node => node.status === 'Ready').length;
  const totalNodes = nodes.length;
  const highUsageNodes = nodeMetrics.filter(metric => 
    parseInt(metric.cpuPercentage) > 80 || parseInt(metric.memoryPercentage) > 80
  ).length;

  const averageCpuUsage = nodeMetrics.length > 0 
    ? (nodeMetrics.reduce((sum, metric) => sum + parseInt(metric.cpuPercentage), 0) / nodeMetrics.length).toFixed(1)
    : '0';

  const averageMemoryUsage = nodeMetrics.length > 0
    ? (nodeMetrics.reduce((sum, metric) => sum + parseInt(metric.memoryPercentage), 0) / nodeMetrics.length).toFixed(1)
    : '0';

  const getNodeStatusColor = (status: string) => {
    return status === 'Ready' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getUsageColor = (percentage: string) => {
    const value = parseInt(percentage);
    if (value > 80) return 'text-red-600 dark:text-red-400';
    if (value > 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUsageBarColor = (percentage: string) => {
    const value = parseInt(percentage);
    if (value > 80) return 'bg-red-500';
    if (value > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Node Status
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor the health and performance of your Kubernetes nodes
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {lastUpdated && (
            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          
          <button
            onClick={checkClusterStatus}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Ready Nodes"
          value={`${readyNodes}/${totalNodes}`}
          icon={CheckCircle}
          trend={readyNodes === totalNodes ? "All Ready" : `${totalNodes - readyNodes} Not Ready`}
          trendUp={readyNodes === totalNodes}
          color="green"
        />
        <MetricsCard
          title="Average CPU Usage"
          value={`${averageCpuUsage}%`}
          icon={Cpu}
          trend={parseInt(averageCpuUsage) > 70 ? "High" : "Normal"}
          trendUp={parseInt(averageCpuUsage) <= 70}
          color="blue"
        />
        <MetricsCard
          title="Average Memory Usage"
          value={`${averageMemoryUsage}%`}
          icon={HardDrive}
          trend={parseInt(averageMemoryUsage) > 70 ? "High" : "Normal"}
          trendUp={parseInt(averageMemoryUsage) <= 70}
          color="purple"
        />
        <MetricsCard
          title="High Usage Nodes"
          value={highUsageNodes.toString()}
          icon={AlertTriangle}
          trend={highUsageNodes === 0 ? "All Normal" : "Attention Needed"}
          trendUp={highUsageNodes === 0}
          color={highUsageNodes === 0 ? "green" : "red"}
        />
      </div>

      {/* Historical Chart */}
      {selectedNode && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span>Historical Node Usage - {selectedNode}</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Monitor CPU and memory usage trends over time
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="text-white px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {nodes.map(node => (
                  <option key={node.name} value={node.name}>
                    {node.name}
                  </option>
                ))}
              </select>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-white px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Last Hour</option>
                <option value="6">Last 6 Hours</option>
                <option value="24">Last 24 Hours</option>
                <option value="168">Last Week</option>
              </select>
            </div>
          </div>

          <NodeHistoricalChart 
            nodeName={selectedNode} 
            timeRange={parseInt(timeRange)} 
          />
        </div>
      )}

      {/* Resource Usage Trends */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span>Resource Usage Trends</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Compare resource usage across all nodes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Usage Comparison */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>CPU Usage Comparison</span>
            </h3>
            <div className="space-y-3">
              {nodeMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {metric.name}
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          parseInt(metric.cpuPercentage) > 80 ? 'bg-red-500' :
                          parseInt(metric.cpuPercentage) > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(parseInt(metric.cpuPercentage), 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-medium ml-3 ${
                    parseInt(metric.cpuPercentage) > 80 ? 'text-red-600 dark:text-red-400' :
                    parseInt(metric.cpuPercentage) > 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {metric.cpuPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Usage Comparison */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span>Memory Usage Comparison</span>
            </h3>
            <div className="space-y-3">
              {nodeMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {metric.name}
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          parseInt(metric.memoryPercentage) > 80 ? 'bg-red-500' :
                          parseInt(metric.memoryPercentage) > 60 ? 'bg-yellow-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(parseInt(metric.memoryPercentage), 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-medium ml-3 ${
                    parseInt(metric.memoryPercentage) > 80 ? 'text-red-600 dark:text-red-400' :
                    parseInt(metric.memoryPercentage) > 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-purple-600 dark:text-purple-400'
                  }`}>
                    {metric.memoryPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Node Status Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>Node Information</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Loading node status...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Node Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Roles
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Age
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Version
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    CPU Usage
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Memory Usage
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node, index) => {
                  const metrics = nodeMetrics.find(m => m.name === node.name);
                  return (
                    <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <Server className="w-4 h-4 text-blue-500" />
                          <span>{node.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNodeStatusColor(node.status)}`}>
                          {node.status === 'Ready' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {node.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        {node.roles}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        {node.age}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        {node.version}
                      </td>
                      <td className="py-4 px-4">
                        {metrics ? (
                          <div className="flex items-center space-x-3">
                            <span className={`font-medium ${getUsageColor(metrics.cpuPercentage)}`}>
                              {metrics.cpuPercentage}%
                            </span>
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(metrics.cpuPercentage)}`}
                                style={{ width: `${Math.min(parseInt(metrics.cpuPercentage), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {metrics.cpu}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {metrics ? (
                          <div className="flex items-center space-x-3">
                            <span className={`font-medium ${getUsageColor(metrics.memoryPercentage)}`}>
                              {metrics.memoryPercentage}%
                            </span>
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(metrics.memoryPercentage)}`}
                                style={{ width: `${Math.min(parseInt(metrics.memoryPercentage), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {metrics.memory}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedNode(node.name)}
                          className={`font-medium transition-colors ${
                            selectedNode === node.name
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                          }`}
                        >
                          {selectedNode === node.name ? 'Selected' : 'View History'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && nodes.length === 0 && (
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Nodes Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Unable to retrieve node information. Check your cluster connection.
            </p>
          </div>
        )}
      </div>

      {/* Cluster Health Summary */}
      {nodes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Cluster Health Summary</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${readyNodes === totalNodes ? 'text-green-600' : 'text-red-600'}`}>
                {readyNodes === totalNodes ? '✅' : '⚠️'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {readyNodes === totalNodes ? 'All nodes are ready' : `${totalNodes - readyNodes} nodes need attention`}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${parseInt(averageCpuUsage) <= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                {parseInt(averageCpuUsage) <= 70 ? '🟢' : '🟡'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                CPU usage is {parseInt(averageCpuUsage) <= 70 ? 'normal' : 'elevated'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${parseInt(averageMemoryUsage) <= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                {parseInt(averageMemoryUsage) <= 70 ? '🟢' : '🟡'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Memory usage is {parseInt(averageMemoryUsage) <= 70 ? 'normal' : 'elevated'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}