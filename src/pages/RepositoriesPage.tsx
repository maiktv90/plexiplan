/**
 * Repositories Page
 *
 * Full page view of all pull requests from connected code management tools.
 * Grouped by source (GitHub, Bitbucket, etc.) and then by repository.
 *
 * Performance optimizations:
 * - React.memo on all list components to prevent unnecessary re-renders
 * - useCallback for event handlers to maintain referential equality
 * - useMemo for expensive computations (grouping, sorting, filtering)
 * - Virtual scrolling for repositories with many PRs (>10 items)
 * - Dashboard API for single-call data fetching
 */
import React, { useMemo, memo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ExternalLink,
  GitPullRequest,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FolderGit2,
} from 'lucide-react';
import { usePullRequestsQuery } from '@/api/hooks/usePullRequests';
import { useIntegrationsQuery } from '@/api/hooks/useTools';
import { useRepositoriesPageStore } from '@/stores/useRepositoriesPageStore';
import { Button } from '@/components/ui/Button';
import type { UnifiedPullRequest } from '@/providers/tools/ToolProvider.interface';

/** Threshold for enabling virtualization (number of PRs) */
const VIRTUALIZATION_THRESHOLD = 10;
/** Estimated height of each PR item in pixels */
const PR_ITEM_HEIGHT = 72;
/** Maximum height for virtualized list container */
const MAX_VIRTUAL_LIST_HEIGHT = 400;

/**
 * Format a date string as relative time (e.g., "2h ago", "3d ago")
 */
const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const getSourceBadge = (source: string) => {
  switch (source) {
    case 'github':
      return 'bg-gray-900 dark:bg-gray-700 text-white';
    case 'bitbucket':
      return 'bg-blue-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getSourceBorderColor = (source: string) => {
  switch (source) {
    case 'github':
      return 'border-gray-900';
    case 'bitbucket':
      return 'border-blue-600';
    default:
      return 'border-gray-200';
  }
}

const getSourceDisplayName = (source: string) => {
  switch (source) {
    case 'github':
      return 'GitHub';
    case 'bitbucket':
      return 'Bitbucket';
    default:
      return source.charAt(0).toUpperCase() + source.slice(1);
  }
};

/**
 * Single pull request item - memoized to prevent unnecessary re-renders
 */
const PullRequestItem = memo<{ pr: UnifiedPullRequest; style?: React.CSSProperties }>(
  ({ pr, style }) => {
    const isReviewer = pr.isAuthor === false;

    return (
      <div style={style}>
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isReviewer ? (
                <span title="You are a reviewer" className="flex-shrink-0">
                  👀
                </span>
              ) : (
                <span title="You are the creator" className="flex-shrink-0">
                  🧘
                </span>
              )}
              <p className="font-medium text-gray-900 dark:text-white truncate">{pr.title}</p>
              <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            {pr.branchName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {pr.branchName}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4">
            {formatRelativeTime(pr.updatedAt)}
          </span>
        </a>
      </div>
    );
  }
);
PullRequestItem.displayName = 'PullRequestItem';

/**
 * Virtualized list for rendering many pull requests efficiently
 * Only renders items visible in the viewport + overscan buffer
 */
const VirtualizedPRList = memo<{ pullRequests: UnifiedPullRequest[] }>(({ pullRequests }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: pullRequests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => PR_ITEM_HEIGHT,
    overscan: 3, // Render 3 extra items above/below viewport for smooth scrolling
  });

  const containerHeight = Math.min(pullRequests.length * PR_ITEM_HEIGHT, MAX_VIRTUAL_LIST_HEIGHT);

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
          const pr = pullRequests[virtualItem.index];
          return (
            <div
              key={pr.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: '4px 0',
              }}
            >
              <PullRequestItem pr={pr} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
VirtualizedPRList.displayName = 'VirtualizedPRList';

/**
 * Standard (non-virtualized) list for small number of PRs
 */
const StandardPRList = memo<{ pullRequests: UnifiedPullRequest[] }>(({ pullRequests }) => (
  <div className="space-y-2">
    {pullRequests.map((pr) => (
      <PullRequestItem key={pr.id} pr={pr} />
    ))}
  </div>
));
StandardPRList.displayName = 'StandardPRList';

/**
 * Collapsible repository group for PRs (nested inside source group)
 * Uses virtualization when PR count exceeds threshold
 */
const RepositoryGroup = memo<{
  repoKey: string;
  owner: string;
  repository: string;
  pullRequests: UnifiedPullRequest[];
}>(({ repoKey, owner, repository, pullRequests }) => {
  const { isRepoExpanded, toggleRepo } = useRepositoriesPageStore();
  const isExpanded = isRepoExpanded(repoKey);

  const handleToggle = useCallback(() => toggleRepo(repoKey), [toggleRepo, repoKey]);

  // Determine if we should use virtualization
  const useVirtualization = pullRequests.length > VIRTUALIZATION_THRESHOLD;

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
          <FolderGit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {owner}/{repository}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            {pullRequests.length}
            <GitPullRequest className="w-3 h-3" />
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-2 bg-gray-50 dark:bg-gray-800">
          {useVirtualization ? (
            <VirtualizedPRList pullRequests={pullRequests} />
          ) : (
            <StandardPRList pullRequests={pullRequests} />
          )}
        </div>
      )}
    </div>
  );
});
RepositoryGroup.displayName = 'RepositoryGroup';

/**
 * Collapsible account group for PRs (multi-account support)
 * Groups PRs by source + externalAccountId, showing account label
 * Uses persistent state from Zustand store
 */
const AccountGroup = memo<{
  accountKey: string;
  source: string;
  accountLabel?: string;
  pullRequests: UnifiedPullRequest[];
}>(({ accountKey, source, accountLabel, pullRequests }) => {
  const { isSourceExpanded, toggleSource } = useRepositoriesPageStore();
  // Use accountKey for expand state to support per-account collapse
  const isExpanded = isSourceExpanded(accountKey);

  const handleToggle = useCallback(() => toggleSource(accountKey), [toggleSource, accountKey]);

  // Group PRs by repository within this account
  const groupedByRepo = useMemo(() => {
    const groups: Record<string, { owner: string; repository: string; prs: UnifiedPullRequest[] }> =
      {};

    for (const pr of pullRequests) {
      const repoKey = `${pr.owner}/${pr.repository}`;
      if (!groups[repoKey]) {
        groups[repoKey] = {
          owner: pr.owner,
          repository: pr.repository,
          prs: [],
        };
      }
      groups[repoKey].prs.push(pr);
    }

    // Sort PRs within each repo: open/draft first
    for (const repoKey of Object.keys(groups)) {
      groups[repoKey].prs.sort((a, b) => {
        const aIsOpen = a.status === 'open' || a.status === 'draft';
        const bIsOpen = b.status === 'open' || b.status === 'draft';
        if (aIsOpen && !bIsOpen) return -1;
        if (!aIsOpen && bIsOpen) return 1;
        return 0;
      });
    }

    return groups;
  }, [pullRequests]);

  // Sort repositories alphabetically
  const sortedRepoKeys = useMemo(() => {
    return Object.keys(groupedByRepo).sort((a, b) => a.localeCompare(b));
  }, [groupedByRepo]);

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
          <span className={`px-2 py-0.5 text-xs rounded ${getSourceBadge(source)}`}>
            {displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({pullRequests.length})
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
          {sortedRepoKeys.map((repoKey) => {
            const { owner, repository, prs } = groupedByRepo[repoKey];
            return (
              <RepositoryGroup
                key={repoKey}
                repoKey={repoKey}
                owner={owner}
                repository={repository}
                pullRequests={prs}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
AccountGroup.displayName = 'AccountGroup';

export const RepositoriesPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = usePullRequestsQuery();
  const { data: integrations } = useIntegrationsQuery();

  const pullRequests = data?.pullRequests || [];

  // Get tool order from connected tools settings
  // Now supports per-account ordering with composite key: "source:externalAccountId"
  const toolOrderMap = useMemo(() => {
    const orderMap = new Map<string, number>();
    if (integrations?.connectedTools) {
      integrations.connectedTools.forEach((tool) => {
        // Map clientKey to source name (e.g., 'github-oauth' -> 'github')
        const source = tool.clientKey.replace(/-oauth$/, '').replace(/-pat$/, '');
        // For multi-account support, use composite key: "source:externalAccountId"
        if (tool.externalAccountId) {
          orderMap.set(`${source}:${tool.externalAccountId}`, tool.order ?? 999);
        }
        // Also set source-level order (fallback for PRs without externalAccountId)
        // Use the minimum order among accounts for this source
        const currentSourceOrder = orderMap.get(source);
        if (currentSourceOrder === undefined || (tool.order ?? 999) < currentSourceOrder) {
          orderMap.set(source, tool.order ?? 999);
        }
      });
    }
    return orderMap;
  }, [integrations?.connectedTools]);

  // Group PRs by account (source + externalAccountId for multi-account support)
  // Key format: "source:externalAccountId" or just "source" for legacy PRs
  const groupedByAccount = useMemo(() => {
    const groups: Record<string, { source: string; accountLabel?: string; externalAccountId?: string; prs: UnifiedPullRequest[] }> = {};

    for (const pr of pullRequests) {
      // Use composite key for multi-account support
      const accountKey = pr.externalAccountId
        ? `${pr.source}:${pr.externalAccountId}`
        : pr.source;

      if (!groups[accountKey]) {
        groups[accountKey] = {
          source: pr.source,
          accountLabel: pr.accountLabel,
          externalAccountId: pr.externalAccountId,
          prs: [],
        };
      }
      groups[accountKey].prs.push(pr);
    }

    return groups;
  }, [pullRequests]);

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

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pull Requests
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            title="Refresh pull requests"
            className="p-1.5 sm:p-2"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-red-600 dark:text-red-400 mb-3">Failed to load pull requests</p>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        ) : pullRequests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <GitPullRequest className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No pull requests found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Connect a code management tool or select repositories in settings to see your PRs
            </p>
            <Link to="/settings" className="inline-block mt-4">
              <Button size="sm">Go to Settings</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAccountKeys.map((accountKey) => {
              const account = groupedByAccount[accountKey];
              return (
                <AccountGroup
                  key={accountKey}
                  accountKey={accountKey}
                  source={account.source}
                  accountLabel={account.accountLabel}
                  pullRequests={account.prs}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
