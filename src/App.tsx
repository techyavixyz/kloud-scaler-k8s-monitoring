import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Login />;
  }
  
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ThemeProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
              
              <main className="p-4 lg:p-6">
                <Routes>
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/resources" element={<ProtectedRoute><ResourceUsage /></ProtectedRoute>} />
                  <Route path="/logs" element={<ProtectedRoute><PodLogs /></ProtectedRoute>} />
                  <Route path="/pod-errors" element={<ProtectedRoute><PodErrors /></ProtectedRoute>} />
                  <Route path="/node-status" element={<ProtectedRoute><NodeStatus /></ProtectedRoute>} />
                  <Route path="/pod-status" element={<ProtectedRoute><PodStatus /></ProtectedRoute>} />
                  <Route path="/contexts" element={<ProtectedRoute><Contexts /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
                  <Route path="/login" element={<Login />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;