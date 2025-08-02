import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import ChartCard from '../components/ChartCard';
import { fetchResourceUsage, fetchNamespaces, fetchLiveResourceUsage } from '../services/api';

interface ResourceMetric {
  namespace: string;
  cpu: string;
  cpuRaw: number;
  memory: string;
  memoryRaw: number;
  podCount: number;
  timestamp: string;
}

interface Namespace {
  name: string;
  status: string;
  age: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<ResourceMetric[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsData, namespacesData] = await Promise.all([
        fetchResourceUsage(),
        fetchNamespaces()
      ]);
      
      setMetrics(metricsData);
      setNamespaces(namespacesData.namespaces);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCPU = metrics.reduce((sum, m) => sum + m.cpuRaw, 0);
  const totalMemory = metrics.reduce((sum, m) => sum + m.memoryRaw, 0);
  const totalPods = metrics.reduce((sum, m) => sum + m.podCount, 0);
  const activeNamespaces = namespaces.filter(ns => ns.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Kloud-Scaler Kubernetes Monitoring Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor your cluster resources and performance in real-time
          </p>
        </div>
        
        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mt-4 md:mt-0">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total CPU Usage"
          value={`${totalCPU.toFixed(2)} cores`}
          icon={Activity}
          trend="+12%"
          trendUp={true}
          color="blue"
        />
        <MetricsCard
          title="Memory Usage"
          value={`${(totalMemory / 1024).toFixed(2)} GiB`}
          icon={Database}
          trend="+8%"
          trendUp={true}
          color="purple"
        />
        <MetricsCard
          title="Running Pods"
          value={totalPods.toString()}
          icon={Server}
          trend="+3"
          trendUp={true}
          color="green"
        />
        <MetricsCard
          title="Active Namespaces"
          value={activeNamespaces.toString()}
          icon={TrendingUp}
          trend="0"
          trendUp={false}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="CPU Usage by Namespace"
          data={metrics}
          type="cpu"
        />
        <ChartCard
          title="Memory Usage by Namespace"
          data={metrics}
          type="memory"
        />
      </div>

      {/* Namespace Status Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Namespace Overview
          </h2>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Namespace
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  CPU
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Memory
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  Pods
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => {
                const namespace = namespaces.find(ns => ns.name === metric.namespace);
                return (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {metric.namespace}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        namespace?.status === 'Active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {namespace?.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {metric.cpu}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {metric.memory}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {metric.podCount}
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
              <span>Loading dashboard data...</span>
            </div>
          </div>
        )}

        {!loading && metrics.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">
              No resource data available. Make sure your cluster is accessible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}