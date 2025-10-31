import React, { useState } from 'react';
import { useAuthStore } from '@/store';
import { useLogoutMutation } from '@/api';
import { Menu, X, LogOut, User, Layers } from 'lucide-react';

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
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center">
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
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors sm:hidden"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sm:hidden">
          <div className="p-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};