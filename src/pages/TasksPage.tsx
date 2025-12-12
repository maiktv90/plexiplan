/**
 * Tasks Page
 *
 * Full page view of all tasks aggregated from connected tools.
 * Grouped by source (Jira, Trello, etc.) and then by board.
 *
 * Performance optimizations:
 * - React.memo on all list components to prevent unnecessary re-renders
 * - useCallback for event handlers to maintain referential equality
 * - useMemo for expensive computations (grouping, sorting, filtering)
 * - O(N) algorithm for task count instead of O(N×M)
 * - Virtual scrolling for task lists with many items (>15)
 * - Single Dashboard API call (no separate boards query)
 * - Async localStorage persistence via useEffect
 * - Persistent collapse state via Zustand store
 */
import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  ListTodo,
} from 'lucide-react';
import { getTaskSourceColor } from '@/api/hooks/useUnifiedTasks';
import { useDashboardQuery } from '@/api/hooks/useDashboard';
import { useIntegrationsQuery } from '@/api/hooks/useTools';
import { useTasksPageStore } from '@/stores/useTasksPageStore';
import type { TaskStatusFilter } from '@/api/services/DashboardService';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BoardMultiSelect } from '@/components/features/tasks/BoardMultiSelect';
import { TaskDetailSheet } from '@/components/features/tasks/TaskDetailSheet';
import type { UnifiedTask, UnifiedBoard, TaskSource, TaskStatus } from '@/types/task.types';

/** Threshold for enabling virtualization (number of tasks) */
const VIRTUALIZATION_THRESHOLD = 15;
/** Estimated height of each task item in pixels */
const TASK_ITEM_HEIGHT = 140;
/** Maximum height for virtualized list container */
const MAX_VIRTUAL_LIST_HEIGHT = 600;

const getSourceDisplayName = (source: string) => {
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
    default:
      return source.charAt(0).toUpperCase() + source.slice(1);
  }
};

const getSourceBadgeClass = (source: string) => {
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
    default:
      return 'bg-gray-500 text-white';
  }
};

const getSourceBorderColor = (source: string) => {
  switch (source) {
    case 'jira':
      return 'border-blue-600';
    case 'trello':
      return 'border-sky-500';
    case 'github':
      return 'border-gray-900';
    case 'bitbucket':
      return 'border-blue-700';
    case 'azure-devops':
      return 'border-blue-500';
    default:
      return 'border-gray-500';
  }
};

/**
 * Status icon component - memoized
 */
const StatusIcon = memo<{ status: TaskStatus; size?: 'sm' | 'md' }>(({ status, size = 'sm' }) => {
  const sizeClass = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  switch (status) {
    case 'done':
      return <CheckCircle2 className={`${sizeClass} text-green-500`} />;
    case 'in_progress':
      return <Clock className={`${sizeClass} text-blue-500`} />;
    case 'blocked':
      return <AlertCircle className={`${sizeClass} text-red-500`} />;
    default:
      return (
        <div
          className={`${sizeClass} rounded-full border-2 border-gray-300 dark:border-gray-600`}
        />
      );
  }
});
StatusIcon.displayName = 'StatusIcon';

/**
 * Source badge - memoized
 */
const SourceBadge = memo<{ source: TaskSource }>(({ source }) => {
  const color = getTaskSourceColor(source);
  return (
    <span
      className="px-2 py-0.5 text-xs font-medium rounded text-white capitalize"
      style={{ backgroundColor: color }}
    >
      {source}
    </span>
  );
});
SourceBadge.displayName = 'SourceBadge';

/**
 * Task list item - memoized for performance
 */
const TaskListItem = memo<{
  task: UnifiedTask;
  showBoardName?: boolean;
  showSource?: boolean;
  onClick?: (task: UnifiedTask) => void;
}>(({ task, showBoardName = true, showSource = true, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  const handleExternalLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
    >
      <StatusIcon status={task.status} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
          {showSource && <SourceBadge source={task.source} />}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {showBoardName && task.boardName && <span>{task.boardName}</span>}
          {task.listName && (
            <>
              {showBoardName && task.boardName && <span>•</span>}
              <span>{task.listName}</span>
            </>
          )}
          {task.dueDate && (
            <>
              <span>•</span>
              <span className="text-orange-600 dark:text-orange-400">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </>
          )}
        </div>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="px-2 py-0.5 text-xs rounded"
                style={{
                  backgroundColor: label.color ? `${label.color}20` : '#E5E7EB',
                  color: label.color || '#4B5563',
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Progress */}
        {task.checklistTotal && task.checklistTotal > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${task.percentComplete || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {task.checklistCompleted}/{task.checklistTotal}
            </span>
          </div>
        )}
      </div>

      {task.url && (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalLinkClick}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Open in external tool"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      )}
    </div>
  );
});
TaskListItem.displayName = 'TaskListItem';

/**
 * Virtualized task list for rendering many tasks efficiently
 */
const VirtualizedTaskList = memo<{
  tasks: UnifiedTask[];
  showBoardName?: boolean;
  showSource?: boolean;
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ tasks, showBoardName = true, showSource = true, onTaskClick }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TASK_ITEM_HEIGHT,
    overscan: 5,
  });

  const containerHeight = Math.min(tasks.length * TASK_ITEM_HEIGHT, MAX_VIRTUAL_LIST_HEIGHT);

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: containerHeight, maxHeight: MAX_VIRTUAL_LIST_HEIGHT }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index];
          return (
            <div
              key={task.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '12px',
              }}
            >
              <TaskListItem task={task} showBoardName={showBoardName} showSource={showSource} onClick={onTaskClick} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
VirtualizedTaskList.displayName = 'VirtualizedTaskList';

/**
 * Standard (non-virtualized) task list for small datasets
 */
const StandardTaskList = memo<{
  tasks: UnifiedTask[];
  showBoardName?: boolean;
  showSource?: boolean;
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ tasks, showBoardName = true, showSource = true, onTaskClick }) => (
  <div className="space-y-3">
    {tasks.map((task) => (
      <TaskListItem
        key={task.id}
        task={task}
        showBoardName={showBoardName}
        showSource={showSource}
        onClick={onTaskClick}
      />
    ))}
  </div>
));
StandardTaskList.displayName = 'StandardTaskList';

/**
 * Compact task card for Kanban board view
 */
const KanbanTaskCard = memo<{ task: UnifiedTask; onClick?: (task: UnifiedTask) => void }>(({ task, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  const handleExternalLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`block p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow group ${onClick ? 'cursor-pointer' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
    >
      <div className="flex items-start gap-2">
        <StatusIcon status={task.status} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {task.title}
          </p>
          {task.boardName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {task.boardName}
            </p>
          )}
          {task.dueDate && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.slice(0, 3).map((label) => (
                <span
                  key={label.id}
                  className="px-1.5 py-0.5 text-xs rounded"
                  style={{
                    backgroundColor: label.color ? `${label.color}20` : '#E5E7EB',
                    color: label.color || '#4B5563',
                  }}
                >
                  {label.name}
                </span>
              ))}
              {task.labels.length > 3 && (
                <span className="text-xs text-gray-400">+{task.labels.length - 3}</span>
              )}
            </div>
          )}
        </div>
        {task.url && (
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalLinkClick}
            className="w-5 h-5 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all flex-shrink-0"
            title="Open in external tool"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
});
KanbanTaskCard.displayName = 'KanbanTaskCard';

/**
 * Board column - shows tasks for a specific board
 */
const BoardColumn = memo<{
  boardName: string;
  tasks: UnifiedTask[];
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ boardName, tasks, onTaskClick }) => {
  return (
    <div className="flex-shrink-0 w-[280px] flex flex-col bg-gray-100 dark:bg-gray-800/50 rounded-lg">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <FolderKanban className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{boardName}</h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full flex-shrink-0">
          {tasks.length}
        </span>
      </div>
      {/* Column Content */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No tasks</p>
        ) : (
          tasks.map((task) => <KanbanTaskCard key={task.id} task={task} onClick={onTaskClick} />)
        )}
      </div>
    </div>
  );
});
BoardColumn.displayName = 'BoardColumn';

/**
 * Tool row - horizontal row for a tool with board columns
 */
const ToolRow = memo<{
  source: TaskSource;
  tasks: UnifiedTask[];
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ source, tasks, onTaskClick }) => {
  // Group tasks by board
  const tasksByBoard = useMemo(() => {
    const groups: Record<string, { boardName: string; tasks: UnifiedTask[] }> = {};

    for (const task of tasks) {
      const boardKey = task.boardId || '__no_board__';
      if (!groups[boardKey]) {
        groups[boardKey] = {
          boardName: task.boardName || 'Unknown Board',
          tasks: [],
        };
      }
      groups[boardKey].tasks.push(task);
    }

    return groups;
  }, [tasks]);

  // Sort boards alphabetically
  const sortedBoardKeys = useMemo(() => {
    return Object.keys(tasksByBoard).sort((a, b) =>
      tasksByBoard[a].boardName.localeCompare(tasksByBoard[b].boardName)
    );
  }, [tasksByBoard]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Tool Header */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className={`px-2 py-0.5 text-xs rounded ${getSourceBadgeClass(source)}`}>
          {getSourceDisplayName(source)}
        </span>
      </div>
      {/* Board Columns - Horizontal Scroll */}
      <div className="p-3 overflow-x-auto">
        <div className="flex gap-3">
          {sortedBoardKeys.map((boardKey) => {
            const { boardName, tasks: boardTasks } = tasksByBoard[boardKey];
            return (
              <BoardColumn
                key={boardKey}
                boardName={boardName}
                tasks={boardTasks}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
ToolRow.displayName = 'ToolRow';

/**
 * Board view - tasks organized by tool (rows) and boards (columns)
 */
const BoardView = memo<{
  tasks: UnifiedTask[];
  toolOrderMap: Map<string, number>;
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ tasks, toolOrderMap, onTaskClick }) => {
  // Group tasks by source
  const tasksBySource = useMemo(() => {
    const groups: Record<string, UnifiedTask[]> = {};

    for (const task of tasks) {
      if (!groups[task.source]) {
        groups[task.source] = [];
      }
      groups[task.source].push(task);
    }

    return groups;
  }, [tasks]);

  // Sort sources by configured tool order
  const sortedSources = useMemo(() => {
    return Object.keys(tasksBySource).sort((a, b) => {
      const aOrder = toolOrderMap.get(a) ?? 999;
      const bOrder = toolOrderMap.get(b) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b);
    }) as TaskSource[];
  }, [tasksBySource, toolOrderMap]);

  return (
    <div className="space-y-4">
      {sortedSources.map((source) => (
        <ToolRow
          key={source}
          source={source}
          tasks={tasksBySource[source]}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
});
BoardView.displayName = 'BoardView';

/**
 * Collapsible board group for tasks (nested inside source group)
 * Uses persistent state from Zustand store
 */
const BoardGroup = memo<{
  boardKey: string;
  boardName: string;
  tasks: UnifiedTask[];
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ boardKey, boardName, tasks, onTaskClick }) => {
  const { isBoardExpanded, toggleBoard } = useTasksPageStore();
  const isExpanded = isBoardExpanded(boardKey);

  const handleToggle = useCallback(() => toggleBoard(boardKey), [toggleBoard, boardKey]);

  // Use virtualization for large task groups
  const useVirtualization = tasks.length > VIRTUALIZATION_THRESHOLD;

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          )}
          <FolderKanban className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{boardName}</span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            {tasks.length}
            <ListTodo className="w-3 h-3" />
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-2 bg-gray-50 dark:bg-gray-800">
          {useVirtualization ? (
            <VirtualizedTaskList tasks={tasks} showBoardName={false} showSource={false} onTaskClick={onTaskClick} />
          ) : (
            <StandardTaskList tasks={tasks} showBoardName={false} showSource={false} onTaskClick={onTaskClick} />
          )}
        </div>
      )}
    </div>
  );
});
BoardGroup.displayName = 'BoardGroup';

/**
 * Collapsible source group for tasks
 * Uses persistent state from Zustand store
 */
const SourceGroup = memo<{
  source: TaskSource;
  tasks: UnifiedTask[];
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ source, tasks, onTaskClick }) => {
  const { isSourceExpanded, toggleSource } = useTasksPageStore();
  const isExpanded = isSourceExpanded(source);

  const handleToggle = useCallback(() => toggleSource(source), [toggleSource, source]);

  // Group tasks by board within this source
  const groupedByBoard = useMemo(() => {
    const groups: Record<string, { boardKey: string; boardName: string; tasks: UnifiedTask[] }> =
      {};

    for (const task of tasks) {
      const boardKey = `${task.source}-${task.boardId}`;
      if (!groups[boardKey]) {
        groups[boardKey] = {
          boardKey,
          boardName: task.boardName || 'Unknown Board',
          tasks: [],
        };
      }
      groups[boardKey].tasks.push(task);
    }

    return groups;
  }, [tasks]);

  // Sort boards alphabetically
  const sortedBoardKeys = useMemo(() => {
    return Object.keys(groupedByBoard).sort((a, b) =>
      groupedByBoard[a].boardName.localeCompare(groupedByBoard[b].boardName)
    );
  }, [groupedByBoard]);

  return (
    <div className={`border-l-2 ${getSourceBorderColor(source)} rounded-r-lg overflow-hidden`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className={`px-2 py-0.5 text-xs rounded ${getSourceBadgeClass(source)}`}>
            {getSourceDisplayName(source)}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
          {sortedBoardKeys.map((boardKey) => {
            const { boardName, tasks: boardTasks } = groupedByBoard[boardKey];
            return (
              <BoardGroup
                key={boardKey}
                boardKey={boardKey}
                boardName={boardName}
                tasks={boardTasks}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
SourceGroup.displayName = 'SourceGroup';

/**
 * Collapsible account group for tasks (multi-account support)
 * Groups tasks by source + externalAccountId, showing account label
 * Uses persistent state from Zustand store
 */
const AccountGroup = memo<{
  accountKey: string;
  source: TaskSource;
  accountLabel?: string;
  tasks: UnifiedTask[];
  onTaskClick?: (task: UnifiedTask) => void;
}>(({ accountKey, source, accountLabel, tasks, onTaskClick }) => {
  const { isSourceExpanded, toggleSource } = useTasksPageStore();
  // Use accountKey for expand state to support per-account collapse
  const isExpanded = isSourceExpanded(accountKey);

  const handleToggle = useCallback(() => toggleSource(accountKey), [toggleSource, accountKey]);

  // Group tasks by board within this account
  const groupedByBoard = useMemo(() => {
    const groups: Record<string, { boardKey: string; boardName: string; tasks: UnifiedTask[] }> =
      {};

    for (const task of tasks) {
      const boardKey = `${task.source}-${task.boardId}`;
      if (!groups[boardKey]) {
        groups[boardKey] = {
          boardKey,
          boardName: task.boardName || 'Unknown Board',
          tasks: [],
        };
      }
      groups[boardKey].tasks.push(task);
    }

    return groups;
  }, [tasks]);

  // Sort boards alphabetically
  const sortedBoardKeys = useMemo(() => {
    return Object.keys(groupedByBoard).sort((a, b) =>
      groupedByBoard[a].boardName.localeCompare(groupedByBoard[b].boardName)
    );
  }, [groupedByBoard]);

  // Display name: show account label if available, otherwise just source name
  const displayName = accountLabel
    ? `${getSourceDisplayName(source)} - ${accountLabel}`
    : getSourceDisplayName(source);

  return (
    <div className={`border-l-2 ${getSourceBorderColor(source)} rounded-r-lg overflow-hidden`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className={`px-2 py-0.5 text-xs rounded ${getSourceBadgeClass(source)}`}>
            {displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({tasks.length})
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
          {sortedBoardKeys.map((boardKey) => {
            const { boardName, tasks: boardTasks } = groupedByBoard[boardKey];
            return (
              <BoardGroup
                key={boardKey}
                boardKey={boardKey}
                boardName={boardName}
                tasks={boardTasks}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
AccountGroup.displayName = 'AccountGroup';

const STORAGE_KEY_SELECTED_BOARDS = 'plexify-tasks-selected-boards';
const STORAGE_KEY_STATUS_FILTER = 'plexify-tasks-status-filter';

/**
 * Main Tasks Page Component
 */
export const TasksPage: React.FC = () => {
  // Empty array means "all boards" selected - persist to localStorage
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED_BOARDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATUS_FILTER);
      return (stored as 'all' | 'todo' | 'done') || 'todo';
    } catch {
      return 'todo';
    }
  });

  // Task detail sheet state
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // Persist to localStorage via useEffect (non-blocking)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_BOARDS, JSON.stringify(selectedBoardIds));
    } catch {
      // Ignore storage errors
    }
  }, [selectedBoardIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATUS_FILTER, statusFilter);
    } catch {
      // Ignore storage errors
    }
  }, [statusFilter]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleBoardSelectionChange = useCallback((boardIds: string[]) => {
    setSelectedBoardIds(boardIds);
  }, []);

  const handleStatusFilterChange = useCallback((value: 'all' | 'todo' | 'done') => {
    setStatusFilter(value);
  }, []);

  const handleViewModeList = useCallback(() => setViewMode('list'), []);
  const handleViewModeBoard = useCallback(() => setViewMode('board'), []);

  // Handler for opening task detail sheet
  const handleTaskClick = useCallback((task: UnifiedTask) => {
    setSelectedTask(task);
    setIsDetailSheetOpen(true);
  }, []);

  const handleDetailSheetOpenChange = useCallback((open: boolean) => {
    setIsDetailSheetOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  }, []);

  // Use dashboard endpoint with status filter for server-side filtering
  // This single API call replaces the slow useUnifiedBoardsQuery
  const {
    data: dashboardData,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useDashboardQuery(statusFilter as TaskStatusFilter);

  // Get integrations for tool order configuration
  const { data: integrations } = useIntegrationsQuery();

  const handleRefresh = useCallback(() => refetchTasks(), [refetchTasks]);

  // Get tool order from connected tools settings
  // Now supports per-account ordering with composite key: "source:externalAccountId"
  const toolOrderMap = useMemo(() => {
    const orderMap = new Map<string, number>();
    if (integrations?.connectedTools) {
      integrations.connectedTools.forEach((tool) => {
        // Map clientKey to source name (e.g., 'jira-oauth' -> 'jira', 'trello-pat' -> 'trello')
        const source = tool.clientKey.replace(/-oauth$/, '').replace(/-pat$/, '');
        // For multi-account support, use composite key: "source:externalAccountId"
        if (tool.externalAccountId) {
          orderMap.set(`${source}:${tool.externalAccountId}`, tool.order ?? 999);
        }
        // Also set source-level order (fallback for tasks without externalAccountId)
        // Use the minimum order among accounts for this source
        const currentSourceOrder = orderMap.get(source);
        if (currentSourceOrder === undefined || (tool.order ?? 999) < currentSourceOrder) {
          orderMap.set(source, tool.order ?? 999);
        }
      });
    }
    return orderMap;
  }, [integrations?.connectedTools]);

  // Map dashboard tasks to unified task format
  const tasks: UnifiedTask[] = useMemo(
    () =>
      (dashboardData?.tasks || []).map((t) => ({
        id: t.id,
        source: t.source as TaskSource,
        sourceId: t.sourceId,
        title: t.title,
        description: t.description,
        status: t.status as TaskStatus,
        priority: t.priority as UnifiedTask['priority'],
        dueDate: t.dueDate,
        url: t.url,
        boardId: t.boardId,
        boardName: t.boardName,
        listId: t.listId,
        listName: t.listName,
        labels: t.labels?.map((l) => ({ id: l.id, name: l.name, color: l.color })),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        externalAccountId: t.externalAccountId,
        accountLabel: t.accountLabel,
      })),
    [dashboardData?.tasks]
  );

  // Derive boards from tasks - O(N) single pass
  // This eliminates the need for slow useUnifiedBoardsQuery
  const { boards, taskCountByBoard } = useMemo(() => {
    const boardMap = new Map<string, UnifiedBoard>();
    const counts = new Map<string, number>();

    for (const task of tasks) {
      if (!task.boardId) continue;

      const boardKey = `${task.source}-${task.boardId}`;

      // Count tasks per board
      counts.set(boardKey, (counts.get(boardKey) ?? 0) + 1);

      // Build board entry if not exists
      if (!boardMap.has(boardKey)) {
        boardMap.set(boardKey, {
          id: boardKey,
          source: task.source,
          sourceId: task.boardId,
          name: task.boardName || 'Unknown Board',
        });
      }
    }

    return {
      boards: Array.from(boardMap.values()),
      taskCountByBoard: counts,
    };
  }, [tasks]);

  // Build set of selected board IDs for efficient lookup
  // Special marker '__none__' means explicitly no boards selected
  const isNoneSelected = selectedBoardIds.length === 1 && selectedBoardIds[0] === '__none__';
  const isAllBoardsSelected = selectedBoardIds.length === 0;

  const selectedBoardIdSet = useMemo(
    () => new Set(isNoneSelected ? [] : selectedBoardIds),
    [selectedBoardIds, isNoneSelected]
  );

  // Filter tasks by selected boards (status is already filtered by backend)
  const filteredTasks = useMemo(() => {
    if (isNoneSelected) return [];
    if (isAllBoardsSelected) return tasks;

    return tasks.filter((t) => selectedBoardIdSet.has(`${t.source}-${t.boardId}`));
  }, [tasks, isAllBoardsSelected, selectedBoardIdSet, isNoneSelected]);

  // Group tasks by account (source + externalAccountId for multi-account support)
  // Key format: "source:externalAccountId" or just "source" for legacy tasks
  const groupedByAccount = useMemo(() => {
    const groups: Record<string, { source: TaskSource; accountLabel?: string; externalAccountId?: string; tasks: UnifiedTask[] }> = {};

    for (const task of filteredTasks) {
      // Use composite key for multi-account support
      const accountKey = task.externalAccountId
        ? `${task.source}:${task.externalAccountId}`
        : task.source;

      if (!groups[accountKey]) {
        groups[accountKey] = {
          source: task.source,
          accountLabel: task.accountLabel,
          externalAccountId: task.externalAccountId,
          tasks: [],
        };
      }
      groups[accountKey].tasks.push(task);
    }

    return groups;
  }, [filteredTasks]);

  // Sort accounts by configured tool order, then alphabetically
  const sortedAccountKeys = useMemo(() => {
    return Object.keys(groupedByAccount).sort((a, b) => {
      // Try composite key first (for multi-account), then fall back to source-only key
      const aOrder = toolOrderMap.get(a) ?? toolOrderMap.get(groupedByAccount[a].source) ?? 999;
      const bOrder = toolOrderMap.get(b) ?? toolOrderMap.get(groupedByAccount[b].source) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Secondary sort by account label
      const aLabel = groupedByAccount[a].accountLabel ?? a;
      const bLabel = groupedByAccount[b].accountLabel ?? b;
      return aLabel.localeCompare(bLabel);
    });
  }, [groupedByAccount, toolOrderMap]);

  // Determine if we should show grouped view
  const showGroupedView = isAllBoardsSelected || selectedBoardIds.length > 1;

  // Determine if we should use virtualization for flat list
  const useVirtualization = !showGroupedView && filteredTasks.length > VIRTUALIZATION_THRESHOLD;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tasks Section */}
        <section>
          <div className="flex flex-col gap-3 mb-4">
            {/* Title row with refresh button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tasks
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                title="Refresh tasks"
                className="p-1.5 sm:p-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {/* Board Filter - Multi-Select with Grouping */}
              <BoardMultiSelect
                boards={boards}
                selectedBoardIds={selectedBoardIds}
                onSelectionChange={handleBoardSelectionChange}
                taskCountByBoard={taskCountByBoard}
              />

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[85px] sm:w-[100px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <button
                  onClick={handleViewModeList}
                  className={`p-1.5 ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={handleViewModeBoard}
                  className={`p-1.5 ${
                    viewMode === 'board'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Task List */}
          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No tasks found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {!isAllBoardsSelected
                  ? 'Selected boards have no matching tasks'
                  : 'No tasks assigned to you'}
              </p>
            </div>
          ) : viewMode === 'board' ? (
            // Board view: tools as rows, boards as columns with task cards
            <BoardView tasks={filteredTasks} toolOrderMap={toolOrderMap} onTaskClick={handleTaskClick} />
          ) : showGroupedView ? (
            // Grouped view: Account → Board → Tasks (supports multi-account ordering)
            <div className="space-y-4">
              {sortedAccountKeys.map((accountKey) => {
                const account = groupedByAccount[accountKey];
                return (
                  <AccountGroup
                    key={accountKey}
                    accountKey={accountKey}
                    source={account.source}
                    accountLabel={account.accountLabel}
                    tasks={account.tasks}
                    onTaskClick={handleTaskClick}
                  />
                );
              })}
            </div>
          ) : useVirtualization ? (
            // Virtualized flat list for large datasets
            <VirtualizedTaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />
          ) : (
            // Standard flat list for small datasets
            <StandardTaskList tasks={filteredTasks} onTaskClick={handleTaskClick} />
          )}
        </section>
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={isDetailSheetOpen}
        onOpenChange={handleDetailSheetOpenChange}
      />
    </div>
  );
};
