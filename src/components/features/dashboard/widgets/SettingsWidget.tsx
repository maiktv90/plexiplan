// Clean Architecture - Settings Widget Feature Component
import React from 'react';
import { useUIStore } from '@/store';
import { useLogoutMutation } from '@/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const SettingsWidget: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const logoutMutation = useLogoutMutation();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Settings
        </h3>
      </div>

      <div className="space-y-4">
        {/* Theme Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${
                  theme === themeOption
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Settings */}
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <span className="text-left">Notifications</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <span className="text-left">Keyboard Shortcuts</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <span className="text-left">Data & Privacy</span>
          </Button>
        </div>

        {/* Account Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            Account Settings
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={handleLogout}
            loading={logoutMutation.isPending}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </Card>
  );
};