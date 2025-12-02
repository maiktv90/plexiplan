/**
 * Dashboard Data Provider
 *
 * Provides aggregated dashboard data to all dashboard widgets via React Context.
 * Fetches tasks and pull requests in a single API call for better performance.
 */
import React, { createContext, useContext } from 'react';
import { useDashboardQuery } from '@/api/hooks/useDashboard';
import type { DashboardDataResponse, DashboardTask, DashboardPullRequest } from '@/api/services/DashboardService';
import type { UnifiedTask, TaskStatus, TaskSource } from '@/types/task.types';
import type { UnifiedPullRequest } from '@/providers/tools/ToolProvider.interface';

/**
 * Map dashboard task to unified task format
 */
function mapDashboardTaskToUnifiedTask(task: DashboardTask): UnifiedTask {
  return {
    id: task.id,
    source: task.source as TaskSource,
    sourceId: task.sourceId,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as UnifiedTask['priority'],
    dueDate: task.dueDate,
    url: task.url,
    boardId: task.boardId,
    boardName: task.boardName,
    listId: task.listId,
    listName: task.listName,
    labels: task.labels?.map((l) => ({ id: l.id, name: l.name, color: l.color })),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Map dashboard PR to unified PR format
 */
function mapDashboardPRToUnifiedPR(pr: DashboardPullRequest): UnifiedPullRequest {
  return {
    id: pr.id,
    source: pr.source as TaskSource,
    title: pr.title,
    branchName: pr.branchName || '',
    repository: pr.repository,
    owner: pr.owner,
    url: pr.url || '',
    status: pr.status as UnifiedPullRequest['status'],
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    isAuthor: pr.isAuthor,
  };
}

/**
 * Dashboard data context value
 */
interface DashboardDataContextValue {
  // Raw data
  data: DashboardDataResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;

  // Derived data for widgets
  tasks: UnifiedTask[];
  activeTasks: UnifiedTask[];
  taskSources: { source: TaskSource; connected: boolean; taskCount: number; error?: string }[];

  pullRequests: UnifiedPullRequest[];
  openPullRequests: UnifiedPullRequest[];
  pullRequestSources: { source: TaskSource; connected: boolean; prCount: number; error?: string }[];

  // Metadata
  fetchedAt: string | undefined;
}

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(undefined);

/**
 * Dashboard Data Provider Component
 */
export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, isError, error, refetch } = useDashboardQuery();

  // Map tasks to unified format
  const tasks = data?.tasks.map(mapDashboardTaskToUnifiedTask) ?? [];
  const activeTasks = tasks.filter((t) => t.status !== 'done');

  // Map task sources
  const taskSources = data?.taskSources.map((s) => ({
    source: s.source as TaskSource,
    connected: s.connected,
    taskCount: s.count,
    error: s.error,
  })) ?? [];

  // Map pull requests to unified format
  const pullRequests = data?.pullRequests.map(mapDashboardPRToUnifiedPR) ?? [];
  const openPullRequests = pullRequests.filter((pr) => pr.status === 'open' || pr.status === 'draft');

  // Map PR sources
  const pullRequestSources = data?.pullRequestSources.map((s) => ({
    source: s.source as TaskSource,
    connected: s.connected,
    prCount: s.count,
    error: s.error,
  })) ?? [];

  const value: DashboardDataContextValue = {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    tasks,
    activeTasks,
    taskSources,
    pullRequests,
    openPullRequests,
    pullRequestSources,
    fetchedAt: data?.fetchedAt,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
};

/**
 * Hook to access dashboard data from the context
 */
export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}

/**
 * Hook for tasks widget - provides tasks data in the expected format
 */
export function useDashboardTasks() {
  const { activeTasks, taskSources, isLoading, isError, error, refetch } = useDashboardData();

  return {
    data: {
      tasks: activeTasks,
      sources: taskSources,
      totalCount: activeTasks.length,
    },
    isLoading,
    error: isError ? error : null,
    refetch,
  };
}

/**
 * Hook for pull requests widget - provides PR data in the expected format
 */
export function useDashboardPullRequests() {
  const { openPullRequests, pullRequestSources, isLoading, isError, refetch } = useDashboardData();

  return {
    data: {
      pullRequests: openPullRequests,
      sources: pullRequestSources,
      totalCount: openPullRequests.length,
    },
    isLoading,
    isError,
    refetch,
  };
}
