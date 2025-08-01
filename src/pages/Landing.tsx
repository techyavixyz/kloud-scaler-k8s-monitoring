import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Activity, 
  Zap, 
  Users, 
  Github, 
  Linkedin, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Server, 
  AlertTriangle,
  Eye,
  Download,
  GitBranch,
  Clock
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Monitor CPU, memory, and pod usage across all namespaces with live updates every 10 seconds"
    },
    {
      icon: FileText,
      title: "Advanced Log Streaming",
      description: "Stream, search, and export pod logs with regex support and real-time filtering"
    },
    {
      icon: GitBranch,
      title: "Multi-Cluster Management",
      description: "Switch between different Kubernetes clusters seamlessly with context management"
    },
    {
      icon: AlertTriangle,
      title: "Error Detection",
      description: "Automatically detect and troubleshoot failed pods with detailed error analysis"
    },
    {
      icon: BarChart3,
      title: "Interactive Charts",
      description: "Visualize resource usage trends with beautiful, interactive charts and graphs"
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Role-based authentication with admin and viewer permissions for team collaboration"
    }
  ];

  const benefits = [
    "Reduce troubleshooting time by 80%",
    "Prevent resource exhaustion issues",
    "Streamline multi-cluster operations",
    "Improve team collaboration",
    "Get instant alerts for critical issues",
    "Export logs for compliance and auditing"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto mb-8 shadow-2xl">
              <Server className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Kloud-scaler
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-4 max-w-3xl mx-auto">
              The Ultimate Kubernetes Monitoring Dashboard
            </p>
            
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Monitor, troubleshoot, and optimize your Kubernetes clusters with real-time insights, 
              advanced log streaming, and intelligent error detection.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/login"
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span className="text-lg font-semibold">Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <a
                href="https://github.com/abhinashdubey/kloud-scaler"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-8 py-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Github className="w-5 h-5" />
                <span className="text-lg font-semibold">View on GitHub</span>
              </a>
            </div>

            {/* Hero Image */}
            <div className="relative max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="bg-slate-800 px-6 py-4 flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-slate-400 text-sm font-mono">
                    kloud-scaler-dashboard.local
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CPU Usage Chart */}
                    <div className="bg-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">CPU Usage</h3>
                        <Activity className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">production</span>
                          <span className="text-blue-400">2.4 cores</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">staging</span>
                          <span className="text-green-400">0.8 cores</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Pod Status */}
                    <div className="bg-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Pod Status</h3>
                        <Server className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-slate-300 text-sm">frontend-app</span>
                          <span className="text-green-400 text-xs">Running</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-slate-300 text-sm">backend-api</span>
                          <span className="text-green-400 text-xs">Running</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-slate-300 text-sm">worker-queue</span>
                          <span className="text-red-400 text-xs">Error</span>
                        </div>
                      </div>
                    </div>

                    {/* Logs Preview */}
                    <div className="bg-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Live Logs</h3>
                        <FileText className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="text-green-400">✓ Server started on port 3000</div>
                        <div className="text-blue-400">→ GET /api/health 200</div>
                        <div className="text-red-400">✗ Database connection failed</div>
                        <div className="text-yellow-400">⚠ High memory usage detected</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features for Modern DevOps
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Everything you need to monitor, troubleshoot, and optimize your Kubernetes infrastructure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Why Choose Kloud-scaler?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                Transform your Kubernetes operations with intelligent monitoring and proactive issue detection.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <span className="text-white font-semibold">Issue Detected</span>
                  </div>
                  
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <div className="text-red-400 text-sm font-mono mb-2">
                      Pod: worker-queue-7d8f9b-xyz
                    </div>
                    <div className="text-red-300 text-sm">
                      CrashLoopBackOff: Container failed to start
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-300">Analyzing logs...</span>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-blue-400 text-sm font-mono mb-2">
                      Root Cause Identified
                    </div>
                    <div className="text-blue-300 text-sm">
                      Database connection string missing in environment variables
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300">Issue resolved in 2 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Kubernetes Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of DevOps teams who trust Kloud-scaler for their monitoring needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <span>Start Monitoring Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <a
              href="https://github.com/abhinashdubey/kloud-scaler"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-2xl transition-all duration-200 font-semibold"
            >
              <Github className="w-5 h-5" />
              <span>View Source Code</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Kloud-scaler</span>
              </div>
              <p className="text-slate-400 mb-4">
                The ultimate Kubernetes monitoring dashboard for modern DevOps teams.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/abhinashdubey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Github className="w-6 h-6" />
                </a>
                <a
                  href="https://linkedin.com/in/abhinash-dubey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Real-time Monitoring</li>
                <li>Log Streaming</li>
                <li>Multi-cluster Support</li>
                <li>Error Detection</li>
                <li>Interactive Charts</li>
                <li>Role-based Access</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="https://github.com/abhinashdubey/kloud-scaler" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://github.com/abhinashdubey/kloud-scaler/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com/in/abhinash-dubey" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 Kloud-scaler. Created by{' '}
              <a 
                href="https://linkedin.com/in/abhinash-dubey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Abhinash Dubey
              </a>
              . Open source and available on{' '}
              <a 
                href="https://github.com/abhinashdubey/kloud-scaler" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}