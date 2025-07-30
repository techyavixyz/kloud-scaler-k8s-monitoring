import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, FileText, Settings, GitBranch, X, ShieldIcon as Kubernetes } from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resource Usage', href: '/resources', icon: Activity },
  { name: 'Pod Logs', href: '/logs', icon: FileText },
  { name: 'Contexts', href: '/contexts', icon: GitBranch },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700",
        isOpen ? "w-64" : "w-16 lg:w-16"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className={cn(
            "flex items-center space-x-3 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 lg:opacity-0"
          )}>
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Kubernetes className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Kloud-scaler
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                K8s Monitoring
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 pb-4 w-50">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "w-15 h-15 flex justify-center items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-200 flex-shrink-0",
                      "group-hover:scale-110 "
                    )} />
                    
                    <span className={cn(
                      "font-medium transition-opacity duration-300 truncate",
                      isOpen ? "opacity-100 flex" : "opacity-0 lg:opacity-0 hidden"
                    )}>
                      {item.name}
                    </span>

                    {/* Tooltip for collapsed state */}
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className={cn(
            "flex items-center space-x-3 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">K</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                K8s Cluster
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Active Connection
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}