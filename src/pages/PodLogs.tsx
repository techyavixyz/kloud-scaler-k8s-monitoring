import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Play, Pause, Maximize2, Filter, RefreshCw } from 'lucide-react';
import { fetchLogs, fetchPods, fetchNamespaces } from '../services/api';

interface Pod {
  name: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: string;
  labels: Record<string, string>;
  node: string;
}

export default function PodLogs() {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [pods, setPods] = useState<Pod[]>([]);
  const [selectedPod, setSelectedPod] = useState('');
  const [appLabel, setAppLabel] = useState('');
  const [logs, setLogs] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [tailLines, setTailLines] = useState('50');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logsRef = useRef<HTMLPreElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      loadPods();
    }
  }, [selectedNamespace]);

  useEffect(() => {
    if (isLive && (selectedPod || appLabel) && selectedNamespace) {
      startLiveLogging();
    } else {
      stopLiveLogging();
    }

    return () => stopLiveLogging();
  }, [isLive, selectedPod, appLabel, selectedNamespace]);

  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const loadNamespaces = async () => {
    try {
      const data = await fetchNamespaces();
      const nsNames = data.namespaces.map((ns: any) => ns.name);
      setNamespaces(nsNames);
      if (nsNames.length > 0) {
        setSelectedNamespace(nsNames[0]);
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    }
  };

  const loadPods = async () => {
    if (!selectedNamespace) return;
    
    try {
      const data = await fetchPods(selectedNamespace);
      setPods(data.pods);
    } catch (error) {
      console.error('Failed to load pods:', error);
      setPods([]);
    }
  };

  const loadLogs = async () => {
    if (!selectedNamespace || (!selectedPod && !appLabel)) return;

    setLoading(true);
    try {
      const data = await fetchLogs({
        namespace: selectedNamespace,
        podName: selectedPod,
        appLabel: appLabel,
        tail: parseInt(tailLines)
      });
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs('Error: Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const startLiveLogging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(loadLogs, 2000);
  };

  const stopLiveLogging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleLiveLogging = () => {
    setIsLive(!isLive);
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNamespace}-${selectedPod || appLabel}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs('');
  };

  const filteredLogs = searchTerm 
    ? logs.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : logs;

  const highlightedLogs = searchTerm && filteredLogs
    ? filteredLogs.replace(
        new RegExp(searchTerm, 'gi'),
        match => `<mark class="bg-yellow-300 dark:bg-yellow-600">${match}</mark>`
      )
    : filteredLogs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pod Logs
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Stream and search through pod logs in real-time
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={toggleLiveLogging}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isLive 
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            }`}
          >
            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLive ? 'Stop Live' : 'Start Live'}</span>
          </button>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Namespace
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select namespace</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pod Name
            </label>
            <select
              value={selectedPod}
              onChange={(e) => setSelectedPod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select pod</option>
              {pods.map(pod => (
                <option key={pod.name} value={pod.name}>
                  {pod.name} ({pod.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              App Label (Alternative)
            </label>
            <input
              type="text"
              value={appLabel}
              onChange={(e) => setAppLabel(e.target.value)}
              placeholder="e.g., frontend, backend"
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tail Lines
            </label>
            <select
              value={tailLines}
              onChange={(e) => setTailLines(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="50">50 lines</option>
              <option value="100">100 lines</option>
              <option value="200">200 lines</option>
              <option value="500">500 lines</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search in logs..."
                className="pl-10 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoScroll 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span>Auto Scroll</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>

            <button
              onClick={downloadLogs}
              disabled={!logs}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={clearLogs}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Logs Output
              {selectedPod && ` - ${selectedPod}`}
              {appLabel && ` - app=${appLabel}`}
            </h2>
            
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className={`bg-slate-900 dark:bg-slate-800 rounded-lg p-4 ${
            isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-96'
          } overflow-hidden`}>
            <pre
              ref={logsRef}
              className="text-green-400 font-mono text-sm h-full overflow-auto whitespace-pre-wrap scrollbar-thin scrollbar-track-slate-700 scrollbar-thumb-slate-500"
              dangerouslySetInnerHTML={{ __html: highlightedLogs || 'No logs available. Select a namespace and pod, then fetch logs.' }}
            />
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-lg flex items-center justify-center">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span>Loading logs...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pod Information */}
      {selectedPod && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Pod Information
          </h2>
          
          {(() => {
            const pod = pods.find(p => p.name === selectedPod);
            if (!pod) return <p className="text-slate-500">Pod not found</p>;
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pod.status === 'Running' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {pod.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ready:</span>
                  <span className={`ml-2 ${pod.ready ? 'text-green-600' : 'text-red-600'}`}>
                    {pod.ready ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Restarts:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{pod.restarts}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Node:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{pod.node}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Labels:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(pod.labels).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs">
                        {key}={value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}