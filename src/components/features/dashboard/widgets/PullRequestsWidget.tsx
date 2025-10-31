// Clean Architecture - Pull Requests Widget Feature Component
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// TODO: Replace with actual PR data when API is available
const mockPRs = [
  { id: 1, title: 'Fix authentication bug', status: 'open', repository: 'backend' },
  { id: 2, title: 'Add dark mode support', status: 'review', repository: 'frontend' },
  { id: 3, title: 'Update documentation', status: 'merged', repository: 'docs' },
];

export const PullRequestsWidget: React.FC = () => {
  const openPRs = mockPRs.filter(pr => pr.status !== 'merged');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
      case 'review':
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300';
      case 'merged':
        return 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Pull Requests
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {openPRs.length} open
        </span>
      </div>

      {openPRs.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            No open pull requests
          </p>
          <Button size="sm" variant="outline">
            Create PR
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {openPRs.map((pr) => (
            <div
              key={pr.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {pr.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pr.repository}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pr.status)}`}>
                {pr.status}
              </span>
            </div>
          ))}
          
          <Button variant="outline" size="sm" className="w-full">
            View All PRs
          </Button>
        </div>
      )}
    </Card>
  );
};