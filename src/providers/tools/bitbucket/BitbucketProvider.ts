/**
 * Bitbucket Tool Provider
 *
 * Implements IToolProvider for Bitbucket integration.
 * Maps Bitbucket's API responses to unified task/board interfaces.
 *
 * Similar to GitHub, focuses on repositories and pull requests.
 */

import type {
  IToolProvider,
  ToolProviderMeta,
  ProviderResult,
  ToolCapabilities,
  UnifiedPullRequest,
} from '../ToolProvider.interface';
import type { UnifiedTask, UnifiedBoard, TaskFilter, TaskStatus } from '@/types/task.types';
import { BitbucketService, type BitbucketRepo, type BitbucketPullRequest } from './BitbucketService';

/**
 * Bitbucket-specific capabilities
 * Similar to GitHub - PRs are fetched via dedicated method, not as tasks
 */
const BITBUCKET_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: false, // PRs are NOT tasks - they have their own widget
  canFetchBoards: true, // Repos as boards
  canFetchPullRequests: true, // PRs are fetched via dedicated method
  canCreateTask: false,
  canUpdateTask: false,
  canDeleteTask: false,
  canAssignTask: false,
  supportsChecklists: false,
  supportsLabels: false,
  supportsDueDate: false,
  supportsPriority: false,
};

/**
 * Maps Bitbucket PR state to unified PR status
 */
function mapBitbucketState(state: BitbucketPullRequest['state']): UnifiedPullRequest['status'] {
  switch (state) {
    case 'OPEN':
      return 'open';
    case 'MERGED':
      return 'merged';
    case 'DECLINED':
    case 'SUPERSEDED':
      return 'closed';
    default:
      return 'open';
  }
}

/**
 * Maps Bitbucket PR to unified task
 * PRs are treated as code review tasks
 */
function mapBitbucketPRToTask(pr: BitbucketPullRequest): UnifiedTask {
  const status: TaskStatus = 'in_progress';
  const uniqueId = `${pr.workspace}-${pr.repo}-${pr.id}`;

  return {
    id: `bitbucket-${uniqueId}`,
    source: 'bitbucket',
    sourceId: String(pr.id),
    title: pr.title || `PR: ${pr.branchName}`,
    description: `Pull request on ${pr.workspace}/${pr.repo}`,
    status,
    url: pr.url,

    // Organization - use repo as board
    boardId: `${pr.workspace}/${pr.repo}`,
    boardName: `${pr.workspace}/${pr.repo}`,
    listId: 'pull-requests',
    listName: 'Pull Requests',

    createdAt: pr.createdOn,
    updatedAt: pr.updatedOn,
  };
}

/**
 * Maps Bitbucket PR to unified pull request
 */
function mapBitbucketPRToUnifiedPR(pr: BitbucketPullRequest): UnifiedPullRequest {
  const uniqueId = `${pr.workspace}-${pr.repo}-${pr.id}`;

  return {
    id: `bitbucket-${uniqueId}`,
    source: 'bitbucket',
    title: pr.title || `PR: ${pr.branchName}`,
    branchName: pr.branchName,
    repository: pr.repo,
    owner: pr.workspace,
    url: pr.url,
    status: mapBitbucketState(pr.state),
    createdAt: pr.createdOn,
    updatedAt: pr.updatedOn,
    isAuthor: pr.isAuthor,
  };
}

/**
 * Maps Bitbucket repository to unified board
 */
function mapBitbucketRepoToBoard(repo: BitbucketRepo): UnifiedBoard {
  return {
    id: `bitbucket-${repo.uuid}`,
    source: 'bitbucket',
    sourceId: repo.uuid,
    name: repo.fullName,
    description: repo.isPrivate ? '(Private)' : undefined,
    url: `https://bitbucket.org/${repo.fullName}`,
  };
}

/**
 * Bitbucket Provider Implementation
 */
export class BitbucketProvider implements IToolProvider {
  readonly meta: ToolProviderMeta = {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: 'bitbucket',
    description: 'Bitbucket repositories and pull requests',
    capabilities: BITBUCKET_CAPABILITIES,
  };

  private connectionStatus: boolean | null = null;

  async isConnected(): Promise<boolean> {
    // Cache connection status for performance
    if (this.connectionStatus !== null) {
      return this.connectionStatus;
    }

    try {
      // Try to fetch repos - if it works, we're connected
      const result = await BitbucketService.getRepos();
      this.connectionStatus = result.success;
      return this.connectionStatus;
    } catch {
      this.connectionStatus = false;
      return false;
    }
  }

  /**
   * Reset connection status (call after connect/disconnect)
   */
  resetConnectionStatus(): void {
    this.connectionStatus = null;
  }

  async getBoards(): Promise<ProviderResult<UnifiedBoard[]>> {
    try {
      const result = await BitbucketService.getRepos();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Bitbucket repositories',
          source: 'bitbucket',
        };
      }

      const boards = result.data.map(mapBitbucketRepoToBoard);
      return { data: boards, error: null, source: 'bitbucket' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'bitbucket',
      };
    }
  }

  async getTasks(filter?: TaskFilter): Promise<ProviderResult<UnifiedTask[]>> {
    try {
      const result = await BitbucketService.getPullRequests();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Bitbucket pull requests',
          source: 'bitbucket',
        };
      }

      let tasks = result.data.map(mapBitbucketPRToTask);

      // Apply filter if provided
      if (filter) {
        if (filter.status) {
          const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
          tasks = tasks.filter((t) => statuses.includes(t.status));
        }
        if (filter.boardId) {
          tasks = tasks.filter((t) => t.boardId === filter.boardId);
        }
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          tasks = tasks.filter(
            (t) =>
              t.title.toLowerCase().includes(searchLower) ||
              t.description?.toLowerCase().includes(searchLower)
          );
        }
      }

      return { data: tasks, error: null, source: 'bitbucket' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'bitbucket',
      };
    }
  }

  async getTask(taskId: string): Promise<ProviderResult<UnifiedTask>> {
    try {
      const result = await this.getTasks();

      if (!result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Bitbucket tasks',
          source: 'bitbucket',
        };
      }

      const task = result.data.find((t) => t.sourceId === taskId);

      if (!task) {
        return {
          data: null,
          error: `Task ${taskId} not found`,
          source: 'bitbucket',
        };
      }

      return { data: task, error: null, source: 'bitbucket' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'bitbucket',
      };
    }
  }

  async getTasksForBoard(boardId: string): Promise<ProviderResult<UnifiedTask[]>> {
    return this.getTasks({ boardId });
  }

  async getPullRequests(): Promise<ProviderResult<UnifiedPullRequest[]>> {
    try {
      const result = await BitbucketService.getPullRequests();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Bitbucket pull requests',
          source: 'bitbucket',
        };
      }

      const pullRequests = result.data.map(mapBitbucketPRToUnifiedPR);
      return { data: pullRequests, error: null, source: 'bitbucket' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'bitbucket',
      };
    }
  }
}

// Export singleton instance
export const bitbucketProvider = new BitbucketProvider();
