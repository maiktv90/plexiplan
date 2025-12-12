/**
 * Task Detail Sheet
 *
 * Slide-out panel displaying detailed information about a task.
 * Provides quick access to task details without leaving the task list,
 * with a prominent button to open the task in its source tool.
 */
import { memo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  FolderKanban,
  ListTodo,
  Tag,
} from 'lucide-react';
import { DescriptionRenderer } from '@/utils/adfRenderer';
import type { UnifiedTask, TaskStatus, TaskSource } from '@/types/task.types';

const getSourceDisplayName = (source: TaskSource): string => {
  switch (source) {
    case 'jira':
      return 'Jira';
    case 'trello':
      return 'Trello';
    case 'github':
      return 'GitHub';
    case 'bitbucket':
      return 'Bitbucket';
    case 'azure-devops':
      return 'Azure DevOps';
  }
};

const getSourceBadgeClass = (source: TaskSource): string => {
  switch (source) {
    case 'jira':
      return 'bg-blue-600 text-white';
    case 'trello':
      return 'bg-sky-500 text-white';
    case 'github':
      return 'bg-gray-900 dark:bg-gray-700 text-white';
    case 'bitbucket':
      return 'bg-blue-700 text-white';
    case 'azure-devops':
      return 'bg-blue-500 text-white';
  }
};

const getSourceButtonStyle = (source: TaskSource): string => {
  switch (source) {
    case 'jira':
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    case 'trello':
      return 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-500';
    case 'github':
      return 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-gray-500';
    case 'bitbucket':
      return 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-600';
    case 'azure-devops':
      return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400';
  }
};

const getStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case 'done':
      return {
        icon: CheckCircle2,
        label: 'Done',
        className: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      };
    case 'in_progress':
      return {
        icon: Clock,
        label: 'In Progress',
        className: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      };
    case 'blocked':
      return {
        icon: AlertCircle,
        label: 'Blocked',
        className: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      };
    default:
      return {
        icon: null,
        label: 'To Do',
        className: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
      };
  }
};

const getPriorityConfig = (priority?: string) => {
  switch (priority) {
    case 'critical':
      return { label: 'Critical', className: 'text-red-700 bg-red-100 dark:bg-red-900/30' };
    case 'high':
      return { label: 'High', className: 'text-orange-700 bg-orange-100 dark:bg-orange-900/30' };
    case 'medium':
      return { label: 'Medium', className: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30' };
    case 'low':
      return { label: 'Low', className: 'text-green-700 bg-green-100 dark:bg-green-900/30' };
    default:
      return null;
  }
};

interface TaskDetailSheetProps {
  task: UnifiedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailSheet = memo<TaskDetailSheetProps>(({ task, open, onOpenChange }) => {
  if (!task) return null;

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;
  const priorityConfig = getPriorityConfig(task.priority);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3 pr-8">
          {/* Source Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSourceBadgeClass(task.source)}`}>
              {getSourceDisplayName(task.source)}
            </span>
            {task.accountLabel && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {task.accountLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <SheetTitle className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
            {task.title}
          </SheetTitle>

          {/* Status & Priority Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-md ${statusConfig.className}`}>
              {StatusIcon && <StatusIcon className="w-4 h-4" />}
              {statusConfig.label}
            </span>
            {priorityConfig && (
              <span className={`px-2.5 py-1 text-sm font-medium rounded-md ${priorityConfig.className}`}>
                {priorityConfig.label}
              </span>
            )}
          </div>

          {/* Hidden description for accessibility */}
          <SheetDescription className="sr-only">
            Task details for {task.title}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Open in Tool Button */}
          {task.url && (
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                w-full inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg
                text-white font-medium text-sm
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                shadow-sm hover:shadow-md
                ${getSourceButtonStyle(task.source)}
              `}
            >
              <ExternalLink className="w-4 h-4" />
              Open in {getSourceDisplayName(task.source)}
            </a>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </h3>
              <DescriptionRenderer
                description={task.description}
                className="text-sm text-gray-600 dark:text-gray-400"
              />
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-3">
            {/* Board */}
            {task.boardName && (
              <div className="flex items-center gap-3 text-sm">
                <FolderKanban className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Board: </span>
                  <span className="text-gray-900 dark:text-white">{task.boardName}</span>
                </div>
              </div>
            )}

            {/* List/Column */}
            {task.listName && (
              <div className="flex items-center gap-3 text-sm">
                <ListTodo className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400">List: </span>
                  <span className="text-gray-900 dark:text-white">{task.listName}</span>
                </div>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Due: </span>
                  <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {task.checklistTotal && task.checklistTotal > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Progress
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${task.percentComplete || 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {task.checklistCompleted}/{task.checklistTotal} ({task.percentComplete || 0}%)
                </span>
              </div>
            </div>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Labels
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2.5 py-1 text-sm rounded-md"
                    style={{
                      backgroundColor: label.color ? `${label.color}20` : '#E5E7EB',
                      color: label.color || '#4B5563',
                      border: `1px solid ${label.color || '#D1D5DB'}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(task.createdAt || task.updatedAt) && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {task.createdAt && (
                <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
              )}
              {task.updatedAt && (
                <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

TaskDetailSheet.displayName = 'TaskDetailSheet';
