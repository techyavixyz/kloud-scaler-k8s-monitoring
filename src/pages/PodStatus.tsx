import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertTriangle, CheckCircle, Activity, Clock, TrendingUp, Cpu, HardDrive } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import PodHistoricalChart from '../components/PodHistoricalChart';

interface Pod {
  name: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: string;
  labels: Record<string, string>;
  node: string;
}

interface PodMetric {
  pod: string;
  cpu: string;
  memory: string;
  namespace: string;
}

interface NamespaceMetric {
  namespace: string;
  pods: PodMetric[];
  totalCpu: number;
  totalMemory: number;
  podCount: number;
}

export default function PodStatus() {
  const [namespaceMetrics, setNamespaceMetrics] = useState<NamespaceMetric[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedPod, setSelectedPod] = useState<string>('');
  const [availablePods, setAvailablePods] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    checkPodStatus();
    const interval = setInterval(checkPodStatus, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      loadPodsForNamespace();
    }
  }, [selectedNamespace]);

  const checkPodStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/all-pod-metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setNamespaceMetrics(data.namespaceMetrics || []);
      setLastUpdated(new Date());
      
      // Set first namespace as selected if none selected
      if (!selectedNamespace && data.namespaceMetrics && data.namespaceMetrics.length > 0) {
        setSelectedNamespace(data.namespaceMetrics[0].namespace);
      }
    } catch (error) {
      console.error('Failed to fetch pod status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPodsForNamespace = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/pods?namespace=${selectedNamespace}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const podNames = data.pods.map((pod: any) => pod.name);
      setAvailablePods(podNames);
      if (podNames.length > 0 && !selectedPod) {
        setSelectedPod(podNames[0]);
      }
    } catch (error) {
      console.error('Failed to load pods for namespace:', error);
      setAvailablePods([]);
    }
  };
  const totalPods = namespaceMetrics.reduce((sum, ns) => sum + ns.podCount, 0);
  const totalCpu = namespaceMetrics.reduce((sum, ns) => sum + ns.totalCpu, 0);
  const totalMemory = namespaceMetrics.reduce((sum, ns) => sum + ns.totalMemory, 0);
  const runningNamespaces = namespaceMetrics.length;

  const getStatusColor = (status: string) => {
    return status === 'Running' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : status === 'Pending'
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const formatCpu = (cpu: number) => {
    return cpu >= 1000 ? `${(cpu / 1000).toFixed(2)} cores` : `${cpu.toFixed(0)}m`;
  };

  const formatMemory = (memory: number) => {
    return memory >= 1024 ? `${(memory / 1024).toFixed(2)} GiB` : `${memory.toFixed(0)} MiB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pod Status
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor pod performance and resource usage across all namespaces
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
            onClick={checkPodStatus}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Pods"
          value={totalPods.toString()}
          icon={Package}
          trend={`${runningNamespaces} namespaces`}
          trendUp={true}
          color="purple"
        />
        <MetricsCard
          title="Total CPU Usage"
          value={formatCpu(totalCpu)}
          icon={Cpu}
          trend="Across all pods"
          trendUp={true}
          color="blue"
        />
        <MetricsCard
          title="Total Memory Usage"
          value={formatMemory(totalMemory)}
          icon={HardDrive}
          trend="Across all pods"
          trendUp={true}
          color="green"
        />
        <MetricsCard
          title="Active Namespaces"
          value={runningNamespaces.toString()}
          icon={Activity}
          trend="With running pods"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* Historical Chart */}
      {selectedNamespace && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span>Historical Pod Usage</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedPod ? `Pod: ${selectedPod} in ${selectedNamespace}` : `Namespace: ${selectedNamespace}`}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3 mt-4 md:mt-0">
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="text-white px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {namespaceMetrics.map(ns => (
                  <option key={ns.namespace} value={ns.namespace}>
                    {ns.namespace}
                  </option>
                ))}
              </select>

              <select
                value={selectedPod}
                onChange={(e) => setSelectedPod(e.target.value)}
                className="text-white px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Pods in Namespace</option>
                {availablePods.map(pod => (
                  <option key={pod} value={pod}>{pod}</option>
                ))}
              </select>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-white px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1">Last Hour</option>
                <option value="6">Last 6 Hours</option>
                <option value="24">Last 24 Hours</option>
                <option value="168">Last Week</option>
              </select>
            </div>
          </div>

          <PodHistoricalChart 
            namespace={selectedNamespace} 
            podName={selectedPod}
            timeRange={parseInt(timeRange)} 
          />
        </div>
      )}

      {/* Namespace Pod Metrics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Pod Metrics by Namespace</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              <span>Loading pod metrics...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {namespaceMetrics.map((nsMetric, nsIndex) => (
              <div key={nsIndex} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {nsMetric.namespace}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {nsMetric.podCount} pods • {formatCpu(nsMetric.totalCpu)} CPU • {formatMemory(nsMetric.totalMemory)} Memory
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedNamespace(nsMetric.namespace)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedNamespace === nsMetric.namespace
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    {selectedNamespace === nsMetric.namespace ? 'Selected' : 'View History'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          Pod Name
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          CPU Usage
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          Memory Usage
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          CPU %
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                          Memory %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {nsMetric.pods.map((pod, podIndex) => {
                        const cpuValue = pod.cpu.endsWith('m') ? parseInt(pod.cpu) : parseFloat(pod.cpu) * 1000;
                        const memoryValue = pod.memory.endsWith('Mi') ? parseInt(pod.memory) : 
                                           pod.memory.endsWith('Gi') ? parseInt(pod.memory) * 1024 : parseInt(pod.memory);
                        
                        const cpuPercentage = nsMetric.totalCpu > 0 ? ((cpuValue / nsMetric.totalCpu) * 100).toFixed(1) : '0';
                        const memoryPercentage = nsMetric.totalMemory > 0 ? ((memoryValue / nsMetric.totalMemory) * 100).toFixed(1) : '0';
                        
                        return (
                          <tr key={podIndex} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="truncate">{pod.pod}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              {pod.cpu}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              {pod.memory}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {cpuPercentage}%
                                </span>
                                <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(parseFloat(cpuPercentage), 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {memoryPercentage}%
                                </span>
                                <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                  <div 
                                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(parseFloat(memoryPercentage), 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && namespaceMetrics.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Pod Metrics Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Unable to retrieve pod metrics. Check your cluster connection and ensure metrics-server is running.
            </p>
          </div>
        )}
      </div>

      {/* Pod Health Summary */}
      {namespaceMetrics.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Pod Health Summary</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 text-green-600">
                ✅
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {totalPods} pods are running across {runningNamespaces} namespaces
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 text-blue-600">
                📊
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total resource usage: {formatCpu(totalCpu)} CPU
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 text-purple-600">
                💾
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Memory consumption: {formatMemory(totalMemory)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}