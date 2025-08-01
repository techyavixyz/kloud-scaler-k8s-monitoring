import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, Clock, RefreshCw, Settings, Upload, FileText, Users } from 'lucide-react';
import { fetchContexts, setContext, uploadKubeconfig, getUserContext, setUserContext } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Context {
  name: string;
  kubeconfigFile: string;
  kubeconfigPath: string;
  displayName: string;
}

export default function Contexts() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [userContext, setUserContextState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contextName, setContextName] = useState('');
  const { hasRole } = useAuth();

  useEffect(() => {
    loadContexts();
    loadUserContext();
  }, []);

  const loadContexts = async () => {
    try {
      setLoading(true);
      const data = await fetchContexts();
      setContexts(data.contexts);
    } catch (error) {
      console.error('Failed to load contexts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserContext = async () => {
    try {
      const data = await getUserContext();
      setUserContextState(data.currentContext);
    } catch (error) {
      console.error('Failed to load user context:', error);
    }
  };

  const handleSetUserContext = async (context: Context) => {
    try {
      setSwitching(context.name);
      await setUserContext(context.name, context.kubeconfigPath);
      setUserContextState(context.name);
      alert('Context switched successfully!');
    } catch (error) {
      console.error('Failed to set user context:', error);
      alert('Failed to switch context');
    } finally {
      setSwitching(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !contextName.trim()) {
      alert('Please select a file and enter a context name');
      return;
    }

    try {
      setUploading(true);
      await uploadKubeconfig(selectedFile, contextName.trim());
      alert('Kubeconfig file uploaded successfully!');
      setShowUpload(false);
      setSelectedFile(null);
      setContextName('');
      await loadContexts();
    } catch (error) {
      console.error('Failed to upload kubeconfig:', error);
      alert('Failed to upload kubeconfig file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Kubernetes Contexts
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and switch between different Kubernetes cluster contexts
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {hasRole('admin') && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Kubeconfig</span>
            </button>
          )}
          
          <button
            onClick={loadContexts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Current Context Card */}
      {userContext && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200 dark:border-green-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Your Active Context
              </h2>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {userContext}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Kubeconfig</span>
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Context Name *
                </label>
                <input
                  type="text"
                  value={contextName}
                  onChange={(e) => setContextName(e.target.value)}
                  placeholder="Enter a name for this context (e.g., Production, Staging)"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This name will be displayed in the context list
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Kubeconfig File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800"
                  accept=".yaml,.yml,.config,*"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload your Kubernetes config file
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !contextName.trim() || uploading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Contexts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Available Contexts
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {contexts.length} context{contexts.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Loading contexts...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contexts.map((context) => (
              <div
                key={context.name}
                className={`relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                  context.name === userContext
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      context.name === userContext
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      <GitBranch className={`w-5 h-5 ${
                        context.name === userContext ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {context.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {context.kubeconfigFile}
                      </p>
                      {context.name === userContext && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <FileText className="w-3 h-3" />
                    <span>Kubeconfig File</span>
                  </div>

                  {context.name !== userContext && (
                    <button
                      onClick={() => handleSetUserContext(context)}
                      disabled={switching === context.name}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                    >
                      {switching === context.name ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Switching...</span>
                        </>
                      ) : (
                        <>
                          <Settings className="w-3 h-3" />
                          <span>Switch</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && contexts.length === 0 && (
          <div className="text-center py-8">
            <GitBranch className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Kubeconfig Files Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {hasRole('admin') 
                ? 'Upload a kubeconfig file to get started.'
                : 'Ask an administrator to upload kubeconfig files.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Context Information */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Context Management Tips
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Personal Context</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Each user has their own active context. Switching contexts only affects your personal view and operations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full mt-0.5">
                <span className="text-green-600 dark:text-green-400 text-xs font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">File Upload</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Only administrators can upload kubeconfig files. Files are stored securely and made available to all users.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full mt-0.5">
                <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Multiple Clusters</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Manage development, staging, and production clusters from a single interface. Each context represents a different cluster configuration.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full mt-0.5">
                <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">4</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Security</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  All kubeconfig files are stored securely on the server. Your context selection is private and doesn't affect other users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}