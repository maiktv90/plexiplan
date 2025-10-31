// Clean Architecture - Tasks Widget Feature Component
import React from 'react';
import { useTaskListQuery } from '@/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const TasksWidget: React.FC = () => {
  const { data: tasks, isLoading, error } = useTaskListQuery();

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-4">
          <p className="text-red-600 dark:text-red-400 mb-2">Failed to load tasks</p>
          <Button size="sm" variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const allTasks = tasks?.flatMap(taskList => taskList.tasks) || [];
  const activeTasks = allTasks.filter(task => task.percentComplete < 100);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Active Tasks
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {activeTasks.length} active
        </span>
      </div>

      {activeTasks.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            No active tasks
          </p>
          <Button size="sm">
            Create Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTasks.slice(0, 3).map((task, index) => (
            <div
              key={task.id || index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {task.title || 'Untitled Task'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {task.percentComplete}% complete
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.priority > 3 
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : task.priority > 1
                    ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                }`}>
                  P{task.priority}
                </span>
              </div>
            </div>
          ))}
          
          {activeTasks.length > 3 && (
            <Button variant="outline" size="sm" className="w-full">
              View All ({activeTasks.length - 3} more)
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};