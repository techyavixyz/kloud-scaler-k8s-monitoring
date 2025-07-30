import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Search, Filter, BarChart3, Cpu, HardDrive } from 'lucide-react';
import { fetchNamespaces } from '../services/api';

interface PodMetric {
  pod: string;
  cpu: string;
  memory: string;
  namespace: string;
}

interface NamespaceMetrics {
  namespace: string;
  pods: PodMetric[];
  totalCpu: number;
  totalMemory: number;
  podCount: number;
}

export default function PodStatus() {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [namespaceMetrics, setNamespaceMetrics] = useState<NamespaceMetrics[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'cpu' | 'memory'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadNamespaces();
    loadAllPodMetrics();
  }, []);

  const loadNamespaces = async () => {
    try {
      const data = await fetchNamespaces();
      const nsNames = data.namespaces.map((ns: any) => ns.name);
      setNamespaces(nsNames);
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    }
  };

  const loadAllPodMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/all-pod-metrics');
      const data = await response.json();
      setNamespaceMetrics(data.namespaceMetrics || []);
    } catch (error) {
      console.error('Failed to fetch pod metrics:', error);
      setNamespaceMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const parseCpuValue = (cpu: string): number => {
    if (cpu.endsWith('m')) {
      return parseInt(cpu.replace('m', ''));
    }
    return parseFloat(cpu) * 1000;
  };

  const parseMemoryValue = (memory: string): number => {
    if (memory.endsWith('Mi')) {
      return parseInt(memory.replace('Mi', ''));
    }
    if (memory.endsWith('Gi')) {
      return parseInt(memory.replace('Gi', '')) * 1024;
    }
    return parseInt(memory);
  };

  const filteredMetrics = namespaceMetrics.filter(nsMetric => {
    if (selectedNamespace && nsMetric.namespace !== selectedNamespace) {
      return false;
    }
    if (searchTerm) {
      return nsMetric.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
             nsMetric.pods.some(pod => pod.pod.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  const sortPods = (pods: PodMetric[]) => {
    return [...pods].sort((a, b) => {
      let aValue: string | number = a.pod;
      let bValue: string | number = b.pod;

      if (sortBy === 'cpu') {
        aValue = parseCpuValue(a.cpu);
        bValue = parseCpuValue(b.cpu);
      } else if (sortBy === 'memory') {
        aValue = parseMemoryValue(a.memory);
        bValue = parseMemoryValue(b.memory);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field: 'name' | 'cpu' | 'memory') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalPods = namespaceMetrics.reduce((sum, ns) => sum + ns.podCount, 0);
  const totalCpu = namespaceMetrics.reduce((sum, ns) => sum + ns.totalCpu, 0);
  const totalMemory = namespaceMetrics.reduce((sum, ns) => sum + ns.totalMemory, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pod Status & Metrics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor resource usage and performance metrics for all pods
          </p>
        </div>

        <button
          onClick={loadAllPodMetrics}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors mt-4 md:mt-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Total Pods
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalPods}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Total CPU Usage
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalCpu >= 1000 ? `${(totalCpu / 1000).toFixed(2)} cores` : `${totalCpu}m`}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Cpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Total Memory Usage
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalMemory >= 1024 ? `${(totalMemory / 1024).toFixed(2)} GiB` : `${totalMemory} MiB`}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filter by Namespace
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Pods
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pods or namespaces..."
                className="pl-10 pr-4 py-2 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'name' | 'cpu' | 'memory');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="cpu-desc">CPU (High to Low)</option>
              <option value="cpu-asc">CPU (Low to High)</option>
              <option value="memory-desc">Memory (High to Low)</option>
              <option value="memory-asc">Memory (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pod Metrics by Namespace */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              <span>Loading pod metrics...</span>
            </div>
          </div>
        ) : filteredMetrics.length > 0 ? (
          filteredMetrics.map((nsMetric, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span>Namespace: {nsMetric.namespace}</span>
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-sm">
                    {nsMetric.podCount} pods
                  </span>
                </h2>
                
                <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Cpu className="w-4 h-4" />
                    <span>Total CPU: {nsMetric.totalCpu >= 1000 ? `${(nsMetric.totalCpu / 1000).toFixed(2)} cores` : `${nsMetric.totalCpu}m`}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HardDrive className="w-4 h-4" />
                    <span>Total Memory: {nsMetric.totalMemory >= 1024 ? `${(nsMetric.totalMemory / 1024).toFixed(2)} GiB` : `${nsMetric.totalMemory} MiB`}</span>
                  </div>
                </div>
              </div>

              {nsMetric.pods.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th 
                          className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                          onClick={() => handleSort('name')}
                        >
                          Pod Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                          onClick={() => handleSort('cpu')}
                        >
                          CPU Usage {sortBy === 'cpu' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                          onClick={() => handleSort('memory')}
                        >
                          Memory Usage {sortBy === 'memory' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortPods(nsMetric.pods).map((pod, podIndex) => (
                        <tr key={podIndex} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-purple-500" />
                              <span>{pod.pod}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center space-x-2">
                              <Cpu className="w-4 h-4 text-blue-500" />
                              <span>{pod.cpu}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center space-x-2">
                              <HardDrive className="w-4 h-4 text-green-500" />
                              <span>{pod.memory}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No metrics available for pods in this namespace
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Pod Metrics Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm || selectedNamespace 
                ? 'No pods match your current filters.'
                : 'Unable to retrieve pod metrics. Make sure metrics-server is running.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}