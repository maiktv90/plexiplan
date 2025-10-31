import React from 'react';
import { useUIStore } from '@/store';
import { TasksWidget } from './widgets/TasksWidget';
import { PullRequestsWidget } from './widgets/PullRequestsWidget';
import { TimeTrackingWidget } from './widgets/TimeTrackingWidget';
import { SettingsWidget } from './widgets/SettingsWidget';

export const Dashboard: React.FC = () => {
  const { isPopup } = useUIStore();

  console.log({test: isPopup})
  return (
    <div className="space-y-8">
      {!isPopup && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Plexify Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your productivity hub for tasks, time tracking, and more
          </p>
        </div>
      )}
      
      <div className={`grid gap-6 ${
        isPopup 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2'
      }`}>
        <TasksWidget />
        <PullRequestsWidget />
        <TimeTrackingWidget />
        <SettingsWidget />
      </div>
    </div>
  );
};