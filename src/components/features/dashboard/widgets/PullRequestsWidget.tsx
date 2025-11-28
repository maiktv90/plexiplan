// Pull Requests Widget - Shows PRs from connected code management tools
import React from 'react';
import { ExternalLink, GitPullRequest, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePullRequestsQuery } from '@/api/hooks/usePullRequests';
import type { UnifiedPullRequest } from '@/providers/tools/ToolProvider.interface';

const getStatusColor = (status: UnifiedPullRequest['status']) => {
  switch (status) {
    case 'open':
      return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
    case 'draft':
      return 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300';
    case 'merged':
      return 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300';
    case 'closed':
      return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
    default:
      return 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300';
  }
};

const getSourceBadge = (source: string) => {
  switch (source) {
    case 'github':
      return 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900';
    case 'bitbucket':
      return 'bg-blue-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const PullRequestsWidget: React.FC = () => {
  const { data, isLoading, isError, refetch } = usePullRequestsQuery();

  const pullRequests = data?.pullRequests || [];
  const openPRs = pullRequests.filter((pr) => pr.status === 'open' || pr.status === 'draft');

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
          <span className="text-sm text-gray-500 dark:text-gray-400">{openPRs.length} open</span>
          <Button size="sm" variant="ghost" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {pullRequests.length === 0 ? (
        <div className="text-center py-6">
          <GitPullRequest className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">No pull requests found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Connect a code management tool to see your PRs
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {openPRs.slice(0, 5).map((pr) => (
            <a
              key={pr.id}
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
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
              <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${getStatusColor(pr.status)}`}>
                {pr.status}
              </span>
            </a>
          ))}

          {openPRs.length > 5 && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              +{openPRs.length - 5} more
            </p>
          )}
        </div>
      )}
    </Card>
  );
};