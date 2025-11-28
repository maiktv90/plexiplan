import React from 'react';
import { Wrench, User, SlidersHorizontal } from 'lucide-react';

export type SettingsSection = 'tools' | 'account' | 'preferences';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

interface SidebarItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
  disabled?: boolean;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'tools',
    label: 'Tools',
    icon: <Wrench className="h-5 w-5" />,
    description: 'Manage connected integrations',
  },
  {
    id: 'account',
    label: 'Account',
    icon: <User className="h-5 w-5" />,
    description: 'Your profile and security',
    disabled: true,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: <SlidersHorizontal className="h-5 w-5" />,
    description: 'App settings and display',
    disabled: true,
  },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <nav className="w-64 flex-shrink-0">
      <ul className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const isDisabled = item.disabled;

          return (
            <li key={item.id}>
              <button
                onClick={() => !isDisabled && onSectionChange(item.id)}
                disabled={isDisabled}
                className={`
                  w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : isDisabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className={`mt-0.5 ${isActive ? 'text-primary-500' : ''}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {isDisabled && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
