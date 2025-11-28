/**
 * Unified Tasks Hook
 *
 * Provides React Query hooks for fetching tasks and boards
 * from all connected tool providers.
 */

import { useQuery } from '@tanstack/react-query';
import { ToolProviderRegistry } from '@/providers/tools';
import type { TaskFilter, TaskSource } from '@/types/task.types';

/**
 * Query keys for task-related queries
 */
export const unifiedTaskKeys = {
  all: ['unified-tasks'] as const,
  tasks: (filter?: TaskFilter) => [...unifiedTaskKeys.all, 'tasks', filter] as const,
  task: (source: TaskSource, id: string) => [...unifiedTaskKeys.all, 'task', source, id] as const,
  boards: () => [...unifiedTaskKeys.all, 'boards'] as const,
  boardTasks: (boardId: string) => [...unifiedTaskKeys.all, 'board-tasks', boardId] as const,
};

/**
 * Fetch all tasks from all connected providers
 */
export function useUnifiedTasksQuery(filter?: TaskFilter, enabled = true) {
  return useQuery({
    queryKey: unifiedTaskKeys.tasks(filter),
    queryFn: async () => {
      const { tasks, results } = await ToolProviderRegistry.aggregateTasks(filter);

      // Check for any errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        console.warn('[useUnifiedTasks] Some providers failed:', errors);
      }

      return {
        tasks,
        sources: results.map((r) => ({
          source: r.source,
          connected: !r.error,
          taskCount: r.data?.length || 0,
          error: r.error || undefined,
        })),
        totalCount: tasks.length,
      };
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

/**
 * Fetch active tasks only (not done)
 */
export function useActiveTasksQuery(enabled = true) {
  return useQuery({
    queryKey: unifiedTaskKeys.tasks({ status: ['todo', 'in_progress'] }),
    queryFn: async () => {
      const { tasks, results } = await ToolProviderRegistry.aggregateTasks({
        status: ['todo', 'in_progress'],
      });

      return {
        tasks,
        sources: results.map((r) => ({
          source: r.source,
          connected: !r.error,
          taskCount: r.data?.length || 0,
          error: r.error || undefined,
        })),
        totalCount: tasks.length,
      };
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Fetch a specific task
 */
export function useUnifiedTaskQuery(
  source: TaskSource | undefined,
  taskId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: unifiedTaskKeys.task(source!, taskId!),
    queryFn: async () => {
      if (!source || !taskId) {
        throw new Error('Source and taskId are required');
      }
      const result = await ToolProviderRegistry.getTask(source, taskId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: enabled && !!source && !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all boards from all connected providers
 */
export function useUnifiedBoardsQuery(enabled = true) {
  return useQuery({
    queryKey: unifiedTaskKeys.boards(),
    queryFn: async () => {
      const { boards, results } = await ToolProviderRegistry.aggregateBoards();

      return {
        boards,
        sources: results.map((r) => ({
          source: r.source,
          connected: !r.error,
          boardCount: r.data?.length || 0,
          error: r.error || undefined,
        })),
        totalCount: boards.length,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Fetch tasks for a specific board
 */
export function useBoardTasksQuery(boardId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: unifiedTaskKeys.boardTasks(boardId!),
    queryFn: async () => {
      if (!boardId) {
        throw new Error('Board ID is required');
      }

      // Extract source from unified board ID (e.g., "trello-abc123" -> "trello")
      const [source] = boardId.split('-') as [TaskSource];
      const provider = ToolProviderRegistry.get(source);

      if (!provider) {
        throw new Error(`Provider not found for source: ${source}`);
      }

      // Get original board ID without prefix
      const originalBoardId = boardId.replace(`${source}-`, '');
      const result = await provider.getTasksForBoard(originalBoardId);

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data || [];
    },
    enabled: enabled && !!boardId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Helper to get task source icon
 */
export function getTaskSourceIcon(source: TaskSource): string {
  const icons: Record<TaskSource, string> = {
    trello: 'trello',
    jira: 'jira',
    github: 'github',
    'azure-devops': 'azure',
  };
  return icons[source] || 'task';
}

/**
 * Helper to get task source color
 */
export function getTaskSourceColor(source: TaskSource): string {
  const colors: Record<TaskSource, string> = {
    trello: '#0079BF',
    jira: '#0052CC',
    github: '#24292F',
    'azure-devops': '#0078D4',
  };
  return colors[source] || '#6B7280';
}
