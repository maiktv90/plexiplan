/**
 * Tasks Page
 *
 * Full page view of all tasks aggregated from connected tools.
 * Shows boards and their associated tasks with filtering capabilities.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
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
  useUnifiedTasksQuery,
  useUnifiedBoardsQuery,
  getTaskSourceColor,
} from '@/api/hooks/useUnifiedTasks';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UnifiedTask, UnifiedBoard, TaskSource, TaskStatus } from '@/types/task.types';

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

/**
 * Main Tasks Page Component
 */
export const TasksPage: React.FC = () => {
  const [selectedBoardId, setSelectedBoardId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>('all');

  const {
    data: tasksData,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useUnifiedTasksQuery();
  const { data: boardsData } = useUnifiedBoardsQuery();
  const tasks = tasksData?.tasks || [];
  const boards = boardsData?.boards || [];

  // Get task count per board (for dropdown labels)
  const getTaskCountForBoard = (board: UnifiedBoard) => {
    return tasks.filter((t) => t.source === board.source && t.boardId === board.sourceId).length;
  };

  // Filter tasks
  let filteredTasks = tasks;
  if (selectedBoardId !== 'all') {
    filteredTasks = filteredTasks.filter((t) => `${t.source}-${t.boardId}` === selectedBoardId);
  }
  if (statusFilter === 'done') {
    filteredTasks = filteredTasks.filter((t) => t.status === 'done');
  } else if (statusFilter === 'todo') {
    // "To Do" means everything that's not done
    filteredTasks = filteredTasks.filter((t) => t.status !== 'done');
  }

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

  // Group tasks by board when "All Boards" is selected
  const groupedTasks = selectedBoardId === 'all'
    ? filteredTasks.reduce((acc, task) => {
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
      }, {} as Record<string, { boardId: string; boardName: string; source: TaskSource; tasks: UnifiedTask[] }>)
    : null;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks & Boards</h1>
            <Button variant="outline" size="sm" onClick={() => refetchTasks()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

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
              {/* Board Filter */}
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder="All Boards" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All Boards</SelectItem>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name} ({getTaskCountForBoard(board)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: 'all' | 'todo' | 'done') => setStatusFilter(value)}>
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
                {selectedBoardId !== 'all'
                  ? 'This board has no matching tasks'
                  : 'No tasks assigned to you'}
              </p>
            </div>
          ) : groupedTasks ? (
            // Grouped view when "All Boards" is selected
            <div className="space-y-4">
              {Object.values(groupedTasks).map((group) => (
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
            // Flat list when a specific board is selected
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
