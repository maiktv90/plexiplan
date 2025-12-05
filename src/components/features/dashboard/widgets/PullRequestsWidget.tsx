// Pull Requests Widget - Shows PRs from connected code management tools
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, GitPullRequest, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDashboardPullRequests } from '../DashboardDataProvider';
import { useIntegrationsQuery } from '@/api/hooks/useTools';

const MAX_PULL_REQUESTS = 4;

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
      return 'bg-gray-900 dark:bg-gray-800 text-white';
    case 'bitbucket':
      return 'bg-blue-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const PullRequestsWidget: React.FC = () => {
  // Use aggregated dashboard data (single API call for all widgets)
  const { data, isLoading, isError, refetch } = useDashboardPullRequests();
  const { data: integrations } = useIntegrationsQuery();

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

  // Sort PRs by tool order, then by updated date
  const openPRs = useMemo(() => {
    const prs = data?.pullRequests || [];
    return [...prs].sort((a, b) => {
      const aOrder = toolOrderMap.get(a.source) ?? 999;
      const bOrder = toolOrderMap.get(b.source) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Same source: sort by updated date (most recent first)
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [data?.pullRequests, toolOrderMap]);

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pull Requests</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pull Requests</h3>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 mb-3">Failed to load pull requests</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pull Requests</h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
          {openPRs.length}
        </span>
          <Button size="sm" variant="ghost" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {openPRs.length === 0 ? (
        <div className="text-center py-6">
          <GitPullRequest className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">No pull requests found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Connect a code management tool to see your PRs
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {openPRs.slice(0, MAX_PULL_REQUESTS).map((pr) => {
              const isReviewer = pr.isAuthor === false;
              return (
                <a
                  key={pr.id}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isReviewer && (
                        <span title="You are a reviewer" className="flex-shrink-0 text-sm">👀</span>
                      )}
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {pr.title}
                      </p>
                      <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getSourceBadge(pr.source)}`}>
                        {pr.source}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {pr.owner}/{pr.repository}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                    {formatRelativeTime(pr.updatedAt)}
                  </span>
                </a>
              );
            })}
          </div>

          {/* View All link */}
          <Link
            to="/repositories"
            className="block mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-center text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all {openPRs.length > MAX_PULL_REQUESTS ? `(${openPRs.length - MAX_PULL_REQUESTS} more)` : ''}
          </Link>
        </>
      )}
    </Card>
  );
};