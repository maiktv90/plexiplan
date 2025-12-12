/**
 * Jira API Service
 *
 * Handles direct API calls to the Jira backend endpoints.
 * Supports both Jira Cloud and Jira Server/Data Center.
 */

import { timeTrackingApiClient } from '@/api/client/instances';
import type { JiraConfiguration, UpdateJiraConfigurationRequest } from '@/types/tool.types';

/**
 * Jira Project from API
 */
export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrl?: string;
  url?: string;
}

/**
 * Jira Dashboard Owner
 */
export interface JiraDashboardOwner {
  accountId?: string;
  displayName?: string;
  active?: boolean;
  self?: string;
}

/**
 * Jira Share Permission
 */
export interface JiraSharePermission {
  id?: number;
  type?: string;
}

/**
 * Jira Dashboard from API
 */
export interface JiraDashboard {
  id: string;
  name: string;
  self?: string;
  isFavourite?: boolean;
  owner?: JiraDashboardOwner;
  popularity?: number;
  rank?: number;
  view?: string;
  editPermissions?: JiraSharePermission[];
  sharePermissions?: JiraSharePermission[];
}

/**
 * Jira Issue Status
 */
export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: 'new' | 'indeterminate' | 'done';
    name: string;
  };
}

/**
 * Jira Issue Priority
 */
export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

/**
 * Jira Issue from API
 */
export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string;
    status: JiraStatus;
    priority?: JiraPriority;
    duedate?: string;
    created?: string;
    updated?: string;
    project: {
      id: string;
      key: string;
      name: string;
    };
    issuetype: {
      id: string;
      name: string;
      iconUrl?: string;
    };
    labels?: string[];
    progress?: {
      progress: number;
      total: number;
      percent?: number;
    };
  };
}

/**
 * Jira Service - API wrapper
 * Uses timeTrackingApiClient which has baseURL /planner/api/v1
 */
export const JiraService = {
  /**
   * Get all projects for the authenticated user
   * GET /planner/api/v1/jira/projects
   */
  async getProjects() {
    return timeTrackingApiClient.get<JiraProject[]>('/jira/projects');
  },

  /**
   * Get favourite dashboards for the authenticated user
   * GET /planner/api/v1/jira/dashboards
   */
  async getFavouriteDashboards() {
    return timeTrackingApiClient.get<JiraDashboard[]>('/jira/dashboards');
  },

  /**
   * Get all issues assigned to the authenticated user
   * GET /planner/api/v1/jira/issues
   */
  async getIssues() {
    return timeTrackingApiClient.get<JiraIssue[]>('/jira/issues');
  },

  /**
   * Get a specific issue by key (e.g., "PROJ-123")
   * GET /planner/api/v1/jira/issues/:key
   */
  async getIssue(issueKey: string) {
    return timeTrackingApiClient.get<JiraIssue>(`/jira/issues/${encodeURIComponent(issueKey)}`);
  },

  /**
   * Get issues for a specific project
   * GET /planner/api/v1/jira/projects/:projectKey/issues
   */
  async getIssuesForProject(projectKey: string) {
    return timeTrackingApiClient.get<JiraIssue[]>(
      `/jira/projects/${encodeURIComponent(projectKey)}/issues`
    );
  },

  /**
   * Get user's Jira configuration (selected projects)
   * GET /planner/api/v1/jira/configuration
   */
  async getConfiguration() {
    return timeTrackingApiClient.get<JiraConfiguration>('/jira/configuration');
  },

  /**
   * Update user's Jira configuration (selected projects)
   * PUT /planner/api/v1/jira/configuration
   */
  async updateConfiguration(request: UpdateJiraConfigurationRequest) {
    return timeTrackingApiClient.put<void>('/jira/configuration', request);
  },
};
