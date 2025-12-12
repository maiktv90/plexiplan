/**
 * Bitbucket API Service
 *
 * Handles direct API calls to the Bitbucket backend endpoints.
 * This is a thin wrapper around the API client.
 */

import { timeTrackingApiClient } from '@/api/client/instances';
import type { BitbucketConfiguration, UpdateBitbucketConfigurationRequest } from '@/types/tool.types';

/**
 * Bitbucket Workspace from API
 */
export interface BitbucketWorkspace {
  uuid?: string;
  slug?: string;
  name?: string;
}

/**
 * Bitbucket Workspace Membership from API
 * Represents the user's membership in a workspace with their permission level
 */
export interface BitbucketWorkspaceMembership {
  permission?: 'owner' | 'collaborator' | 'member';
  workspace?: BitbucketWorkspace;
}

/**
 * Bitbucket Repository from API
 */
export interface BitbucketRepo {
  uuid: string;
  slug: string;
  name: string;
  fullName: string;
  workspace: string;
  isPrivate: boolean;
}

/**
 * Bitbucket Pull Request from API
 */
export interface BitbucketPullRequest {
  id: number;
  title: string;
  branchName: string;
  workspace: string;
  repo: string;
  url: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  createdOn?: string;
  updatedOn?: string;
  isAuthor?: boolean; // true if current user created this PR
}

/**
 * Bitbucket Service - API wrapper
 * Uses timeTrackingApiClient which has baseURL /planner/api/v1
 */
export const BitbucketService = {
  /**
   * Get all workspaces the authenticated user is a member of
   * GET /planner/api/v1/bitbucket/workspaces
   * @see https://developer.atlassian.com/cloud/bitbucket/rest/api-group-workspaces/#api-user-permissions-workspaces-get
   */
  async getWorkspaces() {
    return timeTrackingApiClient.get<BitbucketWorkspaceMembership[]>('/bitbucket/workspaces');
  },

  /**
   * Get all repositories for the authenticated user
   * GET /planner/api/v1/bitbucket/repo
   */
  async getRepos() {
    return timeTrackingApiClient.get<BitbucketRepo[]>('/bitbucket/repo');
  },

  /**
   * Get all pull requests from selected repositories
   * GET /planner/api/v1/bitbucket/pr
   */
  async getPullRequests() {
    return timeTrackingApiClient.get<BitbucketPullRequest[]>('/bitbucket/pr');
  },

  /**
   * Get user's Bitbucket configuration (selected repositories)
   * GET /planner/api/v1/bitbucket/configuration
   */
  async getConfiguration() {
    return timeTrackingApiClient.get<BitbucketConfiguration>('/bitbucket/configuration');
  },

  /**
   * Update user's Bitbucket configuration (selected repositories)
   * PUT /planner/api/v1/bitbucket/configuration
   */
  async updateConfiguration(request: UpdateBitbucketConfigurationRequest) {
    return timeTrackingApiClient.put<void>('/bitbucket/configuration', request);
  },
};
