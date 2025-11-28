import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, Layers, LayoutDashboard, Settings, Menu, LogOut, ExternalLink, Clock, FileText } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme.ts';
import { logout }                                    from "@/api/auth.ts";
import { baseuserUrl, keycloakClientRegistrationId } from "@/config/auth.config.ts";
import { popupUrl } from "@/config/global.config.ts";

interface HeaderProps {
  isPopup: boolean;
}

const Header: React.FC<HeaderProps> = ({ isPopup }) => {
  const [showNav, setShowNav] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle mouse position for slide-in nav
  React.useEffect(() => {
    let timeoutId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 20) {
        setShowNav(true);
      } else if (e.clientX > 250) {
        timeoutId = window.setTimeout(() => setShowNav(false), 300);
      }
    };

    if (!isPopup) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPopup]);


  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

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
            {isPopup && (
              <button
                type="button"
                className="p-2 mr-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                onClick={() => setShowNav(!showNav)}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
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
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
              onClick={toggleTheme}
            >
              {theme === 'light' && <Sun className="h-5 w-5" />}
              {theme === 'dark' && <Moon className="h-5 w-5" />}
              {theme === 'system' && <Monitor className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-in Navigation */}
      {showNav && (
        <div 
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
            showNav ? 'translate-x-0' : '-translate-x-full'
          } z-50`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Layers className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Plexify Planner</span>
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