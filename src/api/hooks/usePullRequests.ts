/**
 * Pull Requests Hook
 *
 * Provides React Query hooks for fetching pull requests
 * from all connected code management tools (GitHub, Bitbucket, etc.)
 */

import { useQuery } from '@tanstack/react-query';
import { ToolProviderRegistry } from '@/providers/tools';
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
 * Fetch all pull requests from all connected code management providers
 */
export function usePullRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: pullRequestKeys.list(),
    queryFn: async (): Promise<PullRequestsResult> => {
      const { pullRequests, results } = await ToolProviderRegistry.aggregatePullRequests();

      // Check for any errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        console.warn('[usePullRequests] Some providers failed:', errors);
      }

      return {
        pullRequests,
        sources: results.map((r) => ({
          source: r.source,
          connected: !r.error,
          prCount: r.data?.length || 0,
          error: r.error || undefined,
        })),
        totalCount: pullRequests.length,
      };
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
