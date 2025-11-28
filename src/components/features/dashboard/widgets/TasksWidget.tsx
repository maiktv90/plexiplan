/**
 * Tasks Widget
 *
 * Displays active tasks aggregated from all connected tools (Trello, Jira, etc.)
 * Uses the unified task provider system for seamless multi-tool integration.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useActiveTasksQuery } from '@/api/hooks/useUnifiedTasks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { UnifiedTask, TaskStatus } from '@/types/task.types';

/**
 * Get status icon component
 */
const StatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'blocked':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
  }
};

/**
 * Single task item display (compact for widget)
 */
const TaskItem: React.FC<{ task: UnifiedTask }> = ({ task }) => {
  const handleClick = () => {
    if (task.url) {
      window.open(task.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
    >
      <StatusIcon status={task.status} />
      <p className="flex-1 text-sm text-gray-900 dark:text-white truncate">
        {task.title}
      </p>
      {task.dueDate && (
        <span className="text-xs text-orange-600 dark:text-orange-400 flex-shrink-0">
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
      {task.url && (
        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </div>
  );
};

/**
 * Main Tasks Widget Component
 */
export const TasksWidget: React.FC = () => {
  const { data, isLoading, error, refetch } = useActiveTasksQuery();

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-6">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 mb-3">Failed to load tasks</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const { tasks = [], sources = [], totalCount = 0 } = data || {};
  const connectedSources = sources.filter((s) => s.connected);

  // No tools connected
  if (connectedSources.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Tools
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
            Connect Trello, Jira, or other tools to see your active tasks here.
          </p>
          <Link to="/settings">
            <Button size="sm">Connect Tools</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const MAX_TASKS = 4;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Tasks</h3>
        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
          {totalCount}
        </span>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.slice(0, MAX_TASKS).map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* View All link */}
      {tasks.length > 0 && (
        <Link
          to="/tasks"
          className="block mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-center text-primary-600 dark:text-primary-400 hover:underline"
        >
          View all {tasks.length > MAX_TASKS ? `(${tasks.length - MAX_TASKS} more)` : ''}
        </Link>
      )}
    </Card>
  );
};
