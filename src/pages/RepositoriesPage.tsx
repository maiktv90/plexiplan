/**
 * Repositories Page
 *
 * Full page view of all pull requests from connected code management tools.
 * Grouped by source (GitHub, Bitbucket, etc.) and then by repository.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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

const PullRequestItem: React.FC<{ pr: UnifiedPullRequest }> = ({ pr }) => {
  const isReviewer = pr.isAuthor === false;

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isReviewer ? (
            <span title="You are a reviewer" className="flex-shrink-0">👀</span>
          ) : (
            <span title="You are the creator" className="flex-shrink-0">🧘</span>
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
  );
};

/**
 * Collapsible repository group for PRs (nested inside source group)
 */
const RepositoryGroup: React.FC<{
  repoKey: string;
  owner: string;
  repository: string;
  pullRequests: UnifiedPullRequest[];
}> = ({ repoKey, owner, repository, pullRequests }) => {
  const { isRepoExpanded, toggleRepo } = useRepositoriesPageStore();
  const isExpanded = isRepoExpanded(repoKey);

  const openCount = pullRequests.filter(
    (pr) => pr.status === 'open' || pr.status === 'draft'
  ).length;

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleRepo(repoKey)}
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
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({pullRequests.length} PR{pullRequests.length !== 1 ? 's' : ''}, {openCount} open)
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="p-2 space-y-2 bg-gray-50 dark:bg-gray-800">
          {pullRequests.map((pr) => (
            <PullRequestItem key={pr.id} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Collapsible source group for PRs
 */
const SourceGroup: React.FC<{
  source: string;
  pullRequests: UnifiedPullRequest[];
}> = ({ source, pullRequests }) => {
  const { isSourceExpanded, toggleSource } = useRepositoriesPageStore();
  const isExpanded = isSourceExpanded(source);

  const openCount = pullRequests.filter(
    (pr) => pr.status === 'open' || pr.status === 'draft'
  ).length;

  // Group PRs by repository within this source
  const groupedByRepo = useMemo(() => {
    const groups: Record<string, { owner: string; repository: string; prs: UnifiedPullRequest[] }> = {};

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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSource(source)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className={`px-2 py-0.5 text-xs rounded ${getSourceBadge(source)}`}>
            {getSourceDisplayName(source)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({pullRequests.length} total, {openCount} open, {sortedRepoKeys.length} repo{sortedRepoKeys.length !== 1 ? 's' : ''})
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
};

export const RepositoriesPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = usePullRequestsQuery();
  const { data: integrations } = useIntegrationsQuery();

  const pullRequests = data?.pullRequests || [];

  // Get tool order from connected tools
  const toolOrderMap = useMemo(() => {
    const orderMap = new Map<string, number>();
    if (integrations?.connectedTools) {
      integrations.connectedTools.forEach((tool) => {
        // Map clientKey to source name (e.g., 'github-oauth' -> 'github')
        const source = tool.clientKey.replace(/-oauth$/, '').replace(/-pat$/, '');
        orderMap.set(source, tool.order ?? 999);
      });
    }
    return orderMap;
  }, [integrations?.connectedTools]);

  // Group PRs by source
  const groupedBySource = useMemo(() => {
    const groups: Record<string, UnifiedPullRequest[]> = {};

    for (const pr of pullRequests) {
      if (!groups[pr.source]) {
        groups[pr.source] = [];
      }
      groups[pr.source].push(pr);
    }

    return groups;
  }, [pullRequests]);

  // Sort sources by configured tool order, then alphabetically for unconfigured
  const sortedSources = useMemo(() => {
    return Object.keys(groupedBySource).sort((a, b) => {
      const aOrder = toolOrderMap.get(a) ?? 999;
      const bOrder = toolOrderMap.get(b) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b);
    });
  }, [groupedBySource, toolOrderMap]);

  const totalOpen = pullRequests.filter(
    (pr) => pr.status === 'open' || pr.status === 'draft'
  ).length;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pull Requests
            {!isLoading && !isError && pullRequests.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({pullRequests.length} total, {totalOpen} open)
              </span>
            )}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            title="Refresh pull requests"
            className="p-2"
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
            <Button size="sm" variant="outline" onClick={() => refetch()}>
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
            {sortedSources.map((source) => (
              <SourceGroup
                key={source}
                source={source}
                pullRequests={groupedBySource[source]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
