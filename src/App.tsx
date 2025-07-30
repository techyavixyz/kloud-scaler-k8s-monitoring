import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ResourceUsage from './pages/ResourceUsage';
import PodLogs from './pages/PodLogs';
import PodErrors from './pages/PodErrors';
import NodeStatus from './pages/NodeStatus';
import PodStatus from './pages/PodStatus';
import Contexts from './pages/Contexts';
import Settings from './pages/Settings';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
    <ThemeProvider>
      <WebSocketProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    
                    <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
                      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                      
                      <main className="p-4 lg:p-6">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/resources" element={<ResourceUsage />} />
                          <Route path="/logs" element={<PodLogs />} />
                          <Route path="/pod-errors" element={<PodErrors />} />
                          <Route path="/node-status" element={<NodeStatus />} />
                          <Route path="/pod-status" element={<PodStatus />} />
                          <Route path="/contexts" element={<Contexts />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/admin" element={
                            <ProtectedRoute requiredRoles={['admin']}>
                              <Admin />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;