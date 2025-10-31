import React from 'react';
import { GitPullRequest } from 'lucide-react';

export const PullRequestsWidget: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pull Requests</h2>
        <GitPullRequest className="h-5 w-5 text-gray-400" />
      </div>

      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <GitPullRequest className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm mb-2">Connect to GitHub to see your pull requests</p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
          Connect GitHub
        </button>
      </div>
    </div>
  );
};