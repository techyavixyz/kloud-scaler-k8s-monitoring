import React from 'react';
import { Menu, Sun, Moon, Bell, Search, Wifi, WifiOff, LogOut, User, GitBranch, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { fetchContexts, getUserContext, setUserContext } from '../services/api';

interface HeaderProps {
  onMenuClick: () => void;
}

interface Context {
  name: string;
  kubeconfigFile: string;
  kubeconfigPath: string;
  displayName: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useWebSocket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [userContext, setUserContextState] = useState<string | null>(null);
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  const [switchingContext, setSwitchingContext] = useState(false);

  useEffect(() => {
    loadContexts();
    loadUserContext();
  }, []);

  const loadContexts = async () => {
    try {
      const data = await fetchContexts();
      setContexts(data.contexts);
    } catch (error) {
      console.error('Failed to load contexts:', error);
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

  const handleContextSwitch = async (context: Context) => {
    try {
      setSwitchingContext(true);
      console.log('🔄 Header: Switching to context:', context.name);
      await setUserContext(context.name, context.kubeconfigPath);
      setUserContextState(context.name);
      setShowContextDropdown(false);
      console.log('✅ Header: Context switched successfully to:', context.name);
      
      // Force refresh of current page data
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch context:', error);
    } finally {
      setSwitchingContext(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Disconnected</span>
                </>
              )}
            </div>

            {/* Context Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowContextDropdown(!showContextDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                <span className="max-w-32 truncate">
                  {userContext || 'No Context'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showContextDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showContextDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Switch Context
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {contexts.length > 0 ? (
                      contexts.map((context) => (
                        <button
                          key={`${context.name}-${context.kubeconfigFile}`}
                          onClick={() => handleContextSwitch(context)}
                          disabled={switchingContext}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                            context.name === userContext 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{context.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {context.kubeconfigFile}
                              </p>
                            </div>
                            {context.name === userContext && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No contexts available
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setShowContextDropdown(false);
                        navigate('/contexts');
                      }}
                      className="w-full text-left px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Manage Contexts →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clusters, pods..."
              className="pl-10 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Profile */}
          <div className="relative group">
            <button className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <p className="font-medium text-slate-900 dark:text-white">{user?.username}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close context dropdown */}
      {showContextDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowContextDropdown(false)}
        />
      )}
    </header>
  );
}