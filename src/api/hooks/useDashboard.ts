/**
 * Dashboard Hook
 *
 * Provides React Query hook for fetching aggregated dashboard data
 * from the backend in a single API call.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService, type DashboardDataResponse, type TaskStatusFilter } from '@/api/services/DashboardService';

/**
 * Query keys for dashboard-related queries
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: (statusFilter: TaskStatusFilter = 'todo') => [...dashboardKeys.all, 'data', statusFilter] as const,
};

/**
 * Fetch aggregated dashboard data (tasks + pull requests) in a single call
 * This replaces multiple separate API calls for better performance
 * @param statusFilter Filter for task status: "all", "todo" (default), "done"
 * @param enabled Whether the query is enabled
 */
export function useDashboardQuery(statusFilter: TaskStatusFilter = 'todo', enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.data(statusFilter),
    queryFn: async (): Promise<DashboardDataResponse> => {
      const result = await DashboardService.getDashboardData(statusFilter);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      return result.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - extended for better performance
    refetchOnWindowFocus: true, // Refresh data when user returns to the app
    retry: 1,
  });
}

/**
 * Helper to get active tasks (not done) from dashboard data
 */
export function getActiveTasks(data: DashboardDataResponse | undefined) {
  if (!data) return [];
  return data.tasks.filter((task) => task.status !== 'done');
}

/**
 * Helper to get open pull requests from dashboard data
 */
export function getOpenPullRequests(data: DashboardDataResponse | undefined) {
  if (!data) return [];
  return data.pullRequests.filter((pr) => pr.status === 'open' || pr.status === 'draft');
}
