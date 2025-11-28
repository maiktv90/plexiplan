import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLogoutMutation } from '@/api';
import { Menu, X, LogOut, User, Layers, Settings } from 'lucide-react';

interface NavbarProps {
  isOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isOpen = false }) => {
  const [menuOpen, setMenuOpen] = useState(isOpen);
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 min-h-[60px] relative">
      <div className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
        <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-md flex items-center justify-center shadow-primary">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <span className="block">
          Plexify Planner
        </span>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4" />
              <span>{user.name}</span>
            </div>
            <Link
              to="/settings"
              className="p-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
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
          className="p-2 text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors sm:hidden"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sm:hidden z-50">
          <div className="p-4">
            {user && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 py-2"
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