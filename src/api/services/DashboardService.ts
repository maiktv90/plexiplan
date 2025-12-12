/**
 * Dashboard API Service
 *
 * Fetches aggregated dashboard data from the backend in a single call.
 * This reduces multiple frontend API calls to one, improving dashboard load time.
 */

import { timeTrackingApiClient } from '@/api/client/instances';

/**
 * Task label
 */
export interface DashboardTaskLabel {
  id: string;
  name: string;
  color?: string;
}

/**
 * Unified task from the dashboard endpoint
 */
export interface DashboardTask {
  id: string;
  source: string; // "jira", "trello"
  sourceId: string;
  title: string;
  description?: string | object; // Can be plain text or ADF (Atlassian Document Format) object
  status: string; // "todo", "in_progress", "done"
  priority?: string;
  dueDate?: string;
  url?: string;
  boardId?: string;
  boardName?: string;
  listId?: string;
  listName?: string;
  labels?: DashboardTaskLabel[];
  createdAt?: string;
  updatedAt?: string;
  /** External account ID for multi-account support (e.g., Trello user ID) */
  externalAccountId?: string;
  /** User-friendly label for multi-account support (e.g., "Work Trello") */
  accountLabel?: string;
}

/**
 * Unified pull request from the dashboard endpoint
 */
export interface DashboardPullRequest {
  id: string;
  source: string; // "github", "bitbucket"
  title: string;
  branchName?: string;
  repository: string;
  owner: string;
  url?: string;
  status: string; // "open", "draft", "merged", "closed"
  createdAt?: string;
  updatedAt?: string;
  isAuthor: boolean;
  /** External account ID for multi-account support */
  externalAccountId?: string;
  /** User-friendly label for multi-account support */
  accountLabel?: string;
}

/**
 * Source status for each provider
 */
export interface SourceStatus {
  source: string;
  connected: boolean;
  count: number;
  error?: string;
}

/**
 * Dashboard data response from the backend
 */
export interface DashboardDataResponse {
  tasks: DashboardTask[];
  taskSources: SourceStatus[];
  pullRequests: DashboardPullRequest[];
  pullRequestSources: SourceStatus[];
  fetchedAt: string; // ISO timestamp for cache staleness detection
}

/**
 * Status filter for tasks
 * - "all": Returns all tasks regardless of status
 * - "todo": Returns only tasks that are not done (todo, in_progress, blocked)
 * - "done": Returns only completed tasks
 */
export type TaskStatusFilter = 'all' | 'todo' | 'done';

/**
 * Dashboard Service - API wrapper
 * Uses timeTrackingApiClient which has baseURL /planner/api/v1
 */
export const DashboardService = {
  /**
   * Get aggregated dashboard data (tasks + pull requests) in a single call
   * GET /planner/api/v1/dashboard
   * @param statusFilter Optional status filter for tasks (default: "todo")
   */
  async getDashboardData(statusFilter: TaskStatusFilter = 'todo') {
    return timeTrackingApiClient.get<DashboardDataResponse>('/dashboard', {
      params: { statusFilter },
    });
  },
};
