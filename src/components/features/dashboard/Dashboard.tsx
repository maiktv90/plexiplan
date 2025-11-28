// Clean Architecture - Dashboard Feature Component
import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { TasksWidget } from '@/components';
import { TimeTrackingWidget } from '@/components';
import { SettingsWidget } from '@/components';
import { PullRequestsWidget } from '@/components';

export const Dashboard: React.FC = () => {
  const { isPopup } = useUIStore();

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {/* Widget Grid */}
      <div className={`grid gap-6 ${isPopup
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
        <TasksWidget />
        <TimeTrackingWidget />
        <PullRequestsWidget />

        {/* Settings widget - only show in expanded view */}
        {!isPopup && <SettingsWidget />}
      </div>

      {/* Quick Actions - only in popup */}
      {isPopup && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-2 text-sm bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/70 transition-colors">
              New Task
            </button>
            <button className="p-2 text-sm bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/70 transition-colors">
              Start Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};