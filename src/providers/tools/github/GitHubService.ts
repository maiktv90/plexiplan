/**
 * GitHub API Service
 *
 * Handles direct API calls to the GitHub backend endpoints.
 * This is a thin wrapper around the API client.
 */

import { timeTrackingApiClient } from '@/api/client/instances';

/**
 * GitHub Repository from API
 */
export interface GitHubRepo {
  id: string;
  name: string;
  archived: boolean;
  org: string | null;
}

/**
 * GitHub Pull Request from API
 */
export interface GitHubPullRequest {
  title: string;
  branchName: string;
  owner: string;
  repo: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GitHub Branch from API
 */
export interface GitHubBranch {
  name: string;
  repo: string;
  url: string;
  org: string | null;
}

/**
 * GitHub Service - API wrapper
 * Uses timeTrackingApiClient which has baseURL /planner/api/v1
 */
export const GitHubService = {
  /**
   * Get all repositories for the authenticated user
   * GET /planner/api/v1/github/repo
   */
  async getRepos() {
    return timeTrackingApiClient.get<GitHubRepo[]>('/github/repo');
  },

  /**
   * Get all pull requests assigned to the authenticated user
   * GET /planner/api/v1/github/pr
   */
  async getPullRequests() {
    return timeTrackingApiClient.get<GitHubPullRequest[]>('/github/pr');
  },

  /**
   * Get branches for a specific repository
   * GET /planner/api/v1/github/repo/:repoName/branches
   */
  async getBranches(repoName: string) {
    return timeTrackingApiClient.get<GitHubBranch[]>(`/github/repo/${encodeURIComponent(repoName)}/branches`);
  },
};
