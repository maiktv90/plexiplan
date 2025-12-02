/**
 * Tasks Page
 *
 * Full page view of all tasks aggregated from connected tools.
 * Shows boards and their associated tasks with filtering capabilities.
 */
import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  useUnifiedBoardsQuery,
  getTaskSourceColor,
} from '@/api/hooks/useUnifiedTasks';
import { useDashboardQuery } from '@/api/hooks/useDashboard';
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
import type { UnifiedTask, TaskSource, TaskStatus } from '@/types/task.types';

/**
 * Status icon component
 */
const StatusIcon: React.FC<{ status: TaskStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
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
};

/**
 * Source badge
 */
const SourceBadge: React.FC<{ source: TaskSource }> = ({ source }) => {
  const color = getTaskSourceColor(source);
  return (
    <span
      className="px-2 py-0.5 text-xs font-medium rounded text-white capitalize"
      style={{ backgroundColor: color }}
    >
      {source}
    </span>
  );
};

/**
 * Collapsible board group for tasks
 */
const BoardGroup: React.FC<{
  boardName: string;
  boardId: string;
  source: TaskSource;
  tasks: UnifiedTask[];
  defaultExpanded?: boolean;
}> = ({ boardName, source, tasks, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">{boardName}</span>
          <SourceBadge source={source} />
          <span className="text-sm text-muted-foreground">({tasks.length})</span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3 bg-background">
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} showBoardName={false} showSource={false} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Task list item
 */
const TaskListItem: React.FC<{
  task: UnifiedTask;
  showBoardName?: boolean;
  showSource?: boolean;
}> = ({ task, showBoardName = true, showSource = true }) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
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

        {task.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}

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
          className="flex-shrink-0 p-2 text-gray-400 hover:text-primary-500 transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      )}
    </div>
  );
};

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

  // Persist selected boards to localStorage
  const handleBoardSelectionChange = (boardIds: string[]) => {
    setSelectedBoardIds(boardIds);
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_BOARDS, JSON.stringify(boardIds));
    } catch {
      // Ignore storage errors
    }
  };

  // Persist status filter to localStorage
  const handleStatusFilterChange = (value: 'all' | 'todo' | 'done') => {
    setStatusFilter(value);
    try {
      localStorage.setItem(STORAGE_KEY_STATUS_FILTER, value);
    } catch {
      // Ignore storage errors
    }
  };

  // Use dashboard endpoint with status filter for server-side filtering
  const {
    data: dashboardData,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useDashboardQuery(statusFilter as TaskStatusFilter);
  const { data: boardsData } = useUnifiedBoardsQuery();

  // Map dashboard tasks to unified task format
  const tasks: UnifiedTask[] = (dashboardData?.tasks || []).map((t) => ({
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
  }));
  const boards = boardsData?.boards || [];

  // Build task count per board for the dropdown
  const taskCountByBoard = useMemo(() => {
    const counts = new Map<string, number>();
    for (const board of boards) {
      const count = tasks.filter(
        (t) => t.source === board.source && t.boardId === board.sourceId
      ).length;
      counts.set(board.id, count);
    }
    return counts;
  }, [tasks, boards]);

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
    // If none selected, return empty
    if (isNoneSelected) {
      return [];
    }

    let result = tasks;

    // Filter by boards (if specific boards selected)
    if (!isAllBoardsSelected) {
      result = result.filter((t) => selectedBoardIdSet.has(`${t.source}-${t.boardId}`));
    }

    // Note: Status filtering is now done server-side via the statusFilter query param
    return result;
  }, [tasks, isAllBoardsSelected, selectedBoardIdSet, isNoneSelected]);

  // Helper to get board name from boards array
  const getBoardName = (task: UnifiedTask): string => {
    // First try from the task itself
    if (task.boardName) return task.boardName;
    // Otherwise look it up from the boards array
    const board = boards.find(
      (b) => b.source === task.source && b.sourceId === task.boardId
    );
    return board?.name || 'Unknown Board';
  };

  // Group tasks by board (always group for better organization)
  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const key = `${task.source}-${task.boardId}`;
      if (!acc[key]) {
        acc[key] = {
          boardId: key,
          boardName: getBoardName(task),
          source: task.source,
          tasks: [],
        };
      }
      acc[key].tasks.push(task);
      return acc;
    }, {} as Record<string, { boardId: string; boardName: string; source: TaskSource; tasks: UnifiedTask[] }>);
  }, [filteredTasks, boards]);

  // Sort grouped tasks by source then board name
  const sortedGroupedTasks = useMemo(() => {
    const sourceOrder: TaskSource[] = ['jira', 'trello', 'github', 'bitbucket'];
    return Object.values(groupedTasks).sort((a, b) => {
      const aSourceIndex = sourceOrder.indexOf(a.source);
      const bSourceIndex = sourceOrder.indexOf(b.source);
      const sourceCompare = (aSourceIndex === -1 ? 999 : aSourceIndex) - (bSourceIndex === -1 ? 999 : bSourceIndex);
      if (sourceCompare !== 0) return sourceCompare;
      return a.boardName.localeCompare(b.boardName);
    });
  }, [groupedTasks]);

  // Determine if we should show grouped view
  const showGroupedView = isAllBoardsSelected || selectedBoardIds.length > 1;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tasks Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredTasks.length})
              </span>
            </h2>

            <div className="flex items-center gap-2">
              {/* Board Filter - Multi-Select with Grouping */}
              <BoardMultiSelect
                boards={boards}
                selectedBoardIds={selectedBoardIds}
                onSelectionChange={handleBoardSelectionChange}
                taskCountByBoard={taskCountByBoard}
              />

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[100px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
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
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={`p-1.5 ${
                    viewMode === 'board'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh Button - Icon only */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchTasks()}
                title="Refresh tasks"
                className="p-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
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
          ) : showGroupedView ? (
            // Grouped view when multiple boards are shown
            <div className="space-y-4">
              {sortedGroupedTasks.map((group) => (
                <BoardGroup
                  key={group.boardId}
                  boardId={group.boardId}
                  boardName={group.boardName}
                  source={group.source}
                  tasks={group.tasks}
                />
              ))}
            </div>
          ) : (
            // Flat list when a single board is selected
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
