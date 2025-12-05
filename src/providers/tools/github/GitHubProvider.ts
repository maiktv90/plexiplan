/**
 * GitHub Tool Provider
 *
 * Implements IToolProvider for GitHub integration.
 * Maps GitHub's API responses to unified task/board interfaces.
 *
 * Note: The backend focuses on repositories, branches, and pull requests
 * rather than GitHub Issues. PRs are mapped as tasks for code review workflows.
 */

import type {
  IToolProvider,
  ToolProviderMeta,
  ProviderResult,
  ToolCapabilities,
  UnifiedPullRequest,
} from '../ToolProvider.interface';
import type { UnifiedTask, UnifiedBoard, TaskFilter, TaskStatus } from '@/types/task.types';
import { GitHubService, type GitHubRepo, type GitHubPullRequest } from './GitHubService';

/**
 * GitHub-specific capabilities
 * Note: canFetchTasks is false - PRs are not "tasks" in the project management sense.
 * PRs are fetched via canFetchPullRequests and shown on the dedicated PR widget.
 */
const GITHUB_CAPABILITIES: ToolCapabilities = {
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
 * Maps GitHub PR to unified task
 * PRs are treated as code review tasks
 */
function mapGitHubPRToTask(pr: GitHubPullRequest): UnifiedTask {
  // PRs are always in progress until merged/closed
  const status: TaskStatus = 'in_progress';

  // Create a unique ID combining owner, repo, and branch
  const uniqueId = `${pr.owner}-${pr.repo}-${pr.branchName}`.replace(/[^a-zA-Z0-9-]/g, '-');

  return {
    id: `github-${uniqueId}`,
    source: 'github',
    sourceId: uniqueId,
    title: pr.title || `PR: ${pr.branchName}`,
    description: `Pull request on ${pr.owner}/${pr.repo}`,
    status,
    url: pr.url,

    // Organization - use repo as board
    boardId: `${pr.owner}/${pr.repo}`,
    boardName: `${pr.owner}/${pr.repo}`,
    listId: 'pull-requests',
    listName: 'Pull Requests',
  };
}

/**
 * Maps GitHub PR to unified pull request
 */
function mapGitHubPRToUnifiedPR(pr: GitHubPullRequest): UnifiedPullRequest {
  const uniqueId = `${pr.owner}-${pr.repo}-${pr.branchName}`.replace(/[^a-zA-Z0-9-]/g, '-');

  return {
    id: `github-${uniqueId}`,
    source: 'github',
    title: pr.title || `PR: ${pr.branchName}`,
    branchName: pr.branchName,
    repository: pr.repo,
    owner: pr.owner,
    url: pr.url,
    status: 'open', // Backend doesn't provide status, assume open
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
  };
}

/**
 * Maps GitHub repository to unified board
 */
function mapGitHubRepoToBoard(repo: GitHubRepo): UnifiedBoard {
  const fullName = repo.org ? `${repo.org}/${repo.name}` : repo.name;

  return {
    id: `github-${repo.id}`,
    source: 'github',
    sourceId: repo.id,
    name: fullName,
    description: repo.archived ? '(Archived)' : undefined,
    url: `https://github.com/${fullName}`,
  };
}

/**
 * GitHub Provider Implementation
 */
export class GitHubProvider implements IToolProvider {
  readonly meta: ToolProviderMeta = {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    description: 'GitHub repositories and pull requests',
    capabilities: GITHUB_CAPABILITIES,
  };

  private connectionStatus: boolean | null = null;

  async isConnected(): Promise<boolean> {
    // Cache connection status for performance
    if (this.connectionStatus !== null) {
      return this.connectionStatus;
    }

    try {
      // Try to fetch repos - if it works, we're connected
      const result = await GitHubService.getRepos();
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
      const result = await GitHubService.getRepos();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch GitHub repositories',
          source: 'github',
        };
      }

      // Filter out archived repos by default
      const activeRepos = result.data.filter((repo) => !repo.archived);
      const boards = activeRepos.map(mapGitHubRepoToBoard);

      return { data: boards, error: null, source: 'github' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'github',
      };
    }
  }

  async getTasks(filter?: TaskFilter): Promise<ProviderResult<UnifiedTask[]>> {
    try {
      const result = await GitHubService.getPullRequests();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch GitHub pull requests',
          source: 'github',
        };
      }

      let tasks = result.data.map(mapGitHubPRToTask);

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
              (typeof t.description === 'string' && t.description.toLowerCase().includes(searchLower))
          );
        }
      }

      return { data: tasks, error: null, source: 'github' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'github',
      };
    }
  }

  async getTask(taskId: string): Promise<ProviderResult<UnifiedTask>> {
    try {
      // Since we don't have a single PR endpoint, fetch all and find
      const result = await this.getTasks();

      if (!result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch GitHub tasks',
          source: 'github',
        };
      }

      const task = result.data.find((t) => t.sourceId === taskId);

      if (!task) {
        return {
          data: null,
          error: `Task ${taskId} not found`,
          source: 'github',
        };
      }

      return { data: task, error: null, source: 'github' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'github',
      };
    }
  }

  async getTasksForBoard(boardId: string): Promise<ProviderResult<UnifiedTask[]>> {
    // Filter PRs by repository
    return this.getTasks({ boardId });
  }

  async getPullRequests(): Promise<ProviderResult<UnifiedPullRequest[]>> {
    try {
      const result = await GitHubService.getPullRequests();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch GitHub pull requests',
          source: 'github',
        };
      }

      const pullRequests = result.data.map(mapGitHubPRToUnifiedPR);
      return { data: pullRequests, error: null, source: 'github' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'github',
      };
    }
  }
}

// Export singleton instance
export const githubProvider = new GitHubProvider();
