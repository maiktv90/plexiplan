/**
 * Pull Requests Hook
 *
 * Provides React Query hooks for fetching pull requests
 * from all connected code management tools (GitHub, Bitbucket, etc.)
 *
 * Uses the Dashboard API endpoint for efficient single-call data fetching
 * instead of frontend aggregation via ToolProviderRegistry.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService, type DashboardPullRequest } from '@/api/services/DashboardService';
import type { UnifiedPullRequest } from '@/providers/tools/ToolProvider.interface';
import type { TaskSource } from '@/types/task.types';

/**
 * Query keys for PR-related queries
 */
export const pullRequestKeys = {
  all: ['pull-requests'] as const,
  list: () => [...pullRequestKeys.all, 'list'] as const,
};

/**
 * Result type for the hook
 */
export interface PullRequestsResult {
  pullRequests: UnifiedPullRequest[];
  sources: {
    source: TaskSource;
    connected: boolean;
    prCount: number;
    error?: string;
  }[];
  totalCount: number;
}

/**
 * Transform DashboardPullRequest to UnifiedPullRequest
 * Ensures compatibility with existing components
 */
function transformToUnified(pr: DashboardPullRequest): UnifiedPullRequest {
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
    externalAccountId: pr.externalAccountId,
    accountLabel: pr.accountLabel,
  };
}

/**
 * Fetch all pull requests from all connected code management providers
 *
 * Now uses the Dashboard API endpoint which fetches all data in a single
 * backend call, instead of multiple frontend requests via ToolProviderRegistry.
 * This significantly reduces load time and network overhead.
 */
export function usePullRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: pullRequestKeys.list(),
    queryFn: async (): Promise<PullRequestsResult> => {
      // Use Dashboard API for efficient single-call fetching
      const result = await DashboardService.getDashboardData('all');

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch pull requests');
      }

      const { pullRequests: rawPRs, pullRequestSources } = result.data;

      // Transform to UnifiedPullRequest format for compatibility
      const pullRequests = rawPRs.map(transformToUnified);

      return {
        pullRequests,
        sources: pullRequestSources.map((s) => ({
          source: s.source as TaskSource,
          connected: s.connected,
          prCount: s.count,
          error: s.error,
        })),
        totalCount: pullRequests.length,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - extended for better performance
    refetchOnWindowFocus: true, // Keep data fresh when user returns to the page
    retry: 1,
  });
}

/**
 * Get open pull requests only
 */
export function useOpenPullRequestsQuery(enabled = true) {
  const query = usePullRequestsQuery(enabled);

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          pullRequests: query.data.pullRequests.filter((pr) => pr.status === 'open'),
          totalCount: query.data.pullRequests.filter((pr) => pr.status === 'open').length,
        }
      : undefined,
  };
}
