import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLogoutMutation } from '@/api';
import { useIntegrationsQuery } from '@/api/hooks/useTools';
import { getToolsByCategory } from '@/config/tools.config';
import { Menu, X, LogOut, User, Layers, Settings, GitPullRequest, ListTodo } from 'lucide-react';

interface NavbarProps {
  isOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isOpen = false }) => {
  const [menuOpen, setMenuOpen] = useState(isOpen);
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const location = useLocation();
  const { data: integrations } = useIntegrationsQuery(!!user);

  // Check if any code management or project management tools are connected
  const { hasCodeTools, hasProjectTools } = useMemo(() => {
    if (!integrations?.connectedTools || integrations.connectedTools.length === 0) {
      return { hasCodeTools: false, hasProjectTools: false };
    }

    const codeToolIds = getToolsByCategory('code_management').map(t => t.clientRegistrationId);
    const projectToolIds = getToolsByCategory('project_management').map(t => t.clientRegistrationId);

    const connectedKeys = integrations.connectedTools.map(t => t.clientKey);
    const hasCodeTools = connectedKeys.some(key => codeToolIds.includes(key));
    const hasProjectTools = connectedKeys.some(key => projectToolIds.includes(key));

    return { hasCodeTools, hasProjectTools };
  }, [integrations?.connectedTools]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 min-h-[60px] relative">
      {/* Left: Logo and Navigation */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-md flex items-center justify-center shadow-primary">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:block">Plexify Planner</span>
        </Link>

        {/* Navigation Links - Desktop */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {hasProjectTools && (
              <Link
                to="/tasks"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive('/tasks')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800'
                }`}
              >
                <ListTodo className="h-4 w-4" />
                <span>Tasks</span>
              </Link>
            )}
            {hasCodeTools && (
              <Link
                to="/repositories"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive('/repositories')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800'
                }`}
              >
                <GitPullRequest className="h-4 w-4" />
                <span>Pull Requests</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Right: User actions */}
      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4" />
              <span>{user.name}</span>
            </div>
            <Link
              to="/settings"
              className={`p-2 rounded-md transition-colors ${
                isActive('/settings')
                  ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                  : 'text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors md:hidden"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="p-4 space-y-1">
            {user && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 md:hidden">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </div>
                {hasProjectTools && (
                  <Link
                    to="/tasks"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 text-sm py-2 px-2 rounded-md ${
                      isActive('/tasks')
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400'
                    }`}
                  >
                    <ListTodo className="h-4 w-4" />
                    <span>Tasks</span>
                  </Link>
                )}
                {hasCodeTools && (
                  <Link
                    to="/repositories"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 text-sm py-2 px-2 rounded-md ${
                      isActive('/repositories')
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400'
                    }`}
                  >
                    <GitPullRequest className="h-4 w-4" />
                    <span>Pull Requests</span>
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 text-sm py-2 px-2 rounded-md md:hidden ${
                    isActive('/settings')
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};