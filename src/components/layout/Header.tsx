import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layers, LayoutDashboard, Settings, Menu, LogOut, ExternalLink, Clock, FileText, X, ListTodo, GitPullRequest } from 'lucide-react';
import { logout } from "@/api/auth.ts";
import { baseuserUrl, keycloakClientRegistrationId } from "@/config/auth.config.ts";
import { popupUrl } from "@/config/global.config.ts";
import { useIntegrationsQuery } from '@/api/hooks/useTools';
import { getToolsByCategory } from '@/config/tools.config';

interface HeaderProps {
  isPopup: boolean;
}

const Header: React.FC<HeaderProps> = ({ isPopup }) => {
  const [showNav, setShowNav] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  // Close nav when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showNav && navRef.current && !navRef.current.contains(e.target as Node)) {
        setShowNav(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNav]);

  // Close nav on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNav) {
        setShowNav(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showNav]);


  const logoutCallback = async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      // In extension context, use chrome.tabs.create to avoid popup blockers
      chrome.tabs.create({ url: popupUrl });
    } else {
      window.location.assign(popupUrl);
    }
  };

  const handleLogout = async () => {
    await logout(keycloakClientRegistrationId, baseuserUrl, logoutCallback);
    setShowNav(false);
  };

  // Check if we're in extension context
  const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

  // Fetch connected tools to show dynamic nav items
  const { data: integrations } = useIntegrationsQuery();

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

  // Open extension as a full browser tab
  const handleOpenAsTab = () => {
    if (isExtensionContext) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="h-16 flex items-center justify-between px-4">
          {/* Left: Menu/Title */}
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 mr-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
              onClick={() => setShowNav(!showNav)}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <Layers className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {isPopup ? 'Plexify' : 'Plexify Planner'}
              </span>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Open as Tab button - only show in extension popup */}
            {isPopup && isExtensionContext && (
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                onClick={handleOpenAsTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      {showNav && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setShowNav(false)}
        />
      )}

      {/* Slide-in Navigation */}
      {showNav && (
        <div
          ref={navRef}
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
            showNav ? 'translate-x-0' : '-translate-x-full'
          } z-50`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-8 w-8 text-primary-500" />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">Plexify Planner</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNav(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <nav className="flex-1 pt-4 pb-4">
            <ul className="space-y-1 px-3">
              <li>
                <button
                  onClick={() => {
                    navigate('/')
                    setShowNav(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                    location.pathname === '/' || location.pathname === '/dashboard'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/time-tracking')
                    setShowNav(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                    location.pathname === '/time-tracking'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <Clock className="h-5 w-5 mr-3" />
                  <span>Time Tracking</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/bookings')
                    setShowNav(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                    location.pathname.startsWith('/bookings')
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  <span>Bookings</span>
                </button>
              </li>
              {hasProjectTools && (
                <li>
                  <button
                    onClick={() => {
                      navigate('/tasks')
                      setShowNav(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                      location.pathname === '/tasks'
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <ListTodo className="h-5 w-5 mr-3" />
                    <span>Tasks</span>
                  </button>
                </li>
              )}
              {hasCodeTools && (
                <li>
                  <button
                    onClick={() => {
                      navigate('/repositories')
                      setShowNav(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                      location.pathname === '/repositories'
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <GitPullRequest className="h-5 w-5 mr-3" />
                    <span>Pull Requests</span>
                  </button>
                </li>
              )}
            </ul>
            
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
              <ul className="space-y-1 px-3">
                <li>
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setShowNav(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                      location.pathname === '/settings'
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    <span>Settings</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 rounded-md text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export { Header };