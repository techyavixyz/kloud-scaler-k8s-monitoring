import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { fetchResourceUsage, fetchMetricsHistory } from '../services/api';
import MetricsCard from '../components/MetricsCard';
import HistoricalChart from '../components/HistoricalChart';

interface ResourceMetric {
  namespace: string;
  cpu: string;
  cpuRaw: number;
  memory: string;
  memoryRaw: number;
  podCount: number;
  timestamp: string;
}

export default function ResourceUsage() {
  const [metrics, setMetrics] = useState<ResourceMetric[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('24');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadMetrics, 10000); // Every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadMetrics = async () => {
    try {
      const data = await fetchResourceUsage();
      setMetrics(data);
      if (!selectedNamespace && data.length > 0) {
        setSelectedNamespace(data[0].namespace);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCPU = metrics.reduce((sum, m) => sum + m.cpuRaw, 0);
  const totalMemory = metrics.reduce((sum, m) => sum + m.memoryRaw, 0);
  const totalPods = metrics.reduce((sum, m) => sum + m.podCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Resource Usage
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor CPU, memory, and pod usage across all namespaces
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}</span>
          </button>

          <button
            onClick={loadMetrics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Total CPU Usage"
          value={`${totalCPU.toFixed(2)} cores`}
          icon={Activity}
          trend="+5%"
          trendUp={true}
          color="blue"
        />
        <MetricsCard
          title="Total Memory Usage"
          value={`${(totalMemory / 1024).toFixed(2)} GiB`}
          icon={BarChart3}
          trend="+12%"
          trendUp={true}
          color="purple"
        />
        <MetricsCard
          title="Total Pods"
          value={totalPods.toString()}
          icon={TrendingUp}
          trend="+2"
          trendUp={true}
          color="green"
        />
      </div>

      {/* Historical Chart */}
      {selectedNamespace && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Historical Usage - {selectedNamespace}
            </h2>
            
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {metrics.map(metric => (
                  <option key={metric.namespace} value={metric.namespace}>
                    {metric.namespace}
                  </option>
                ))}
              </select>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Last Hour</option>
                <option value="6">Last 6 Hours</option>
                <option value="24">Last 24 Hours</option>
                <option value="168">Last Week</option>
              </select>
            </div>
          </div>

          <HistoricalChart 
            namespace={selectedNamespace} 
            timeRange={parseInt(timeRange)} 
          />
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Namespace Resource Details
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Namespace
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  CPU Usage
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Memory Usage
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Pod Count
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  CPU %
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Memory %
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => {
                const cpuPercentage = ((metric.cpuRaw / totalCPU) * 100).toFixed(1);
                const memoryPercentage = ((metric.memoryRaw / totalMemory) * 100).toFixed(1);
                
                return (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                      {metric.namespace}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          {metric.cpu}
                        </span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(parseFloat(cpuPercentage), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          {metric.memory}
                        </span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(parseFloat(memoryPercentage), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {metric.podCount}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parseFloat(cpuPercentage) > 70 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : parseFloat(cpuPercentage) > 40
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {cpuPercentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parseFloat(memoryPercentage) > 70 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : parseFloat(memoryPercentage) > 40
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {memoryPercentage}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedNamespace(metric.namespace)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Loading resource data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}