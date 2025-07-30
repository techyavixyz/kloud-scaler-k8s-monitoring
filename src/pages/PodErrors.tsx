import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Search, Eye, X, Package, AlertCircle, Clock, Info } from 'lucide-react';
import { fetchNamespaces } from '../services/api';

interface FailedPod {
  namespace: string;
  pod: string;
  status: string;
  reason?: string;
  message?: string;
  events?: string;
  age?: string;
  restarts?: number;
}

export default function PodErrors() {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [failedPods, setFailedPods] = useState<FailedPod[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPod, setSelectedPod] = useState<FailedPod | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadNamespaces();
  }, []);

  const loadNamespaces = async () => {
    try {
      const data = await fetchNamespaces();
      const nsNames = ['', ...data.namespaces.map((ns: any) => ns.name)];
      setNamespaces(nsNames);
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    }
  };

  const checkFailedPods = async () => {
    setLoading(true);
    try {
      const nsParam = selectedNamespace ? `?namespace=${selectedNamespace}` : '';
      const response = await fetch(`http://localhost:3001/api/failed-pods${nsParam}`);
      const data = await response.json();
      setFailedPods(data.failedPods || []);
    } catch (error) {
      console.error('Failed to fetch failed pods:', error);
      setFailedPods([]);
    } finally {
      setLoading(false);
    }
  };

  const getFailureDetails = async (pod: FailedPod) => {
    try {
      const response = await fetch(`http://localhost:3001/api/pod-details?namespace=${pod.namespace}&pod=${pod.pod}`);
      const data = await response.json();
      setSelectedPod({ ...pod, ...data });
      setShowDetails(true);
    } catch (error) {
      console.error('Failed to fetch pod details:', error);
    }
  };

  const filteredPods = failedPods.filter(pod =>
    pod.pod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    if (status.includes('Error') || status.includes('Failed')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (status.includes('CrashLoopBackOff')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (status.includes('ImagePullBackOff')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (status.includes('Evicted')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('CrashLoopBackOff')) return <RefreshCw className="w-4 h-4" />;
    if (status.includes('ImagePullBackOff')) return <Package className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Pod Errors
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor and troubleshoot failed pods across your cluster
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={checkFailedPods}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Failed Pods</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Namespace Filter
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="text-white w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option className= "text-white" value="">All Namespaces</option>
              {namespaces.slice(1).map(ns => (
                <option className= "text-white" key={ns} value={ns}>{ns}</option>
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
                placeholder="Search by pod name, namespace, or status..."
                className="text-white pl-10 pr-4 py-2 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Failed Pods List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Failed Pods</span>
            {filteredPods.length > 0 && (
              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-sm">
                {filteredPods.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
              <span>Checking for failed pods...</span>
            </div>
          </div>
        ) : filteredPods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPods.map((pod, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(pod.status)}
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {pod.pod}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {pod.namespace}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => getFailureDetails(pod)}
                    className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pod.status)}`}>
                    {pod.status}
                  </span>
                  
                  {pod.age && (
                    <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Age: {pod.age}</span>
                    </div>
                  )}
                  
                  {pod.restarts && pod.restarts > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                      <RefreshCw className="w-3 h-3" />
                      <span>Restarts: {pod.restarts}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Failed Pods Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {selectedNamespace 
                ? `All pods in "${selectedNamespace}" namespace are running successfully.`
                : 'All pods across all namespaces are running successfully.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pod Details Modal */}
      {showDetails && selectedPod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-500" />
                <span>Pod Details: {selectedPod.pod}</span>
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-white">Namespace:</span> <span className="text-white ml-1">{selectedPod.namespace}</span></div>
                    <div><span className="font-medium text-white">Status:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPod.status)}`}>
                        {selectedPod.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPod.reason && (
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Failure Reason</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {selectedPod.reason}
                    </p>
                  </div>
                )}
              </div>

              {selectedPod.message && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Error Message</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    {selectedPod.message}
                  </p>
                </div>
              )}

              {selectedPod.events && selectedPod.events !== 'N/A' && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">Recent Events</h3>
                  <pre className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {selectedPod.events}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}