/**
 * Jira Tool Provider
 *
 * Implements IToolProvider for Jira integration.
 * Maps Jira's API responses to unified task/board interfaces.
 *
 * Supports both Jira Cloud and Jira Server/Data Center.
 * Jira issues are mapped to unified tasks, projects to boards.
 */

import type {
  IToolProvider,
  ToolProviderMeta,
  ProviderResult,
  ToolCapabilities,
}                                                                               from '@/providers/tools';
import type { UnifiedTask, UnifiedBoard, TaskFilter, TaskStatus, TaskPriority } from '@/types/task.types';
import { JiraService, type JiraProject, type JiraIssue } from './JiraService';
import type { JiraConfiguration } from '@/types/tool.types';

/**
 * Jira-specific capabilities
 */
const JIRA_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: true,
  canFetchBoards: true, // Projects as boards
  canFetchPullRequests: false, // Jira is not a code management tool
  canCreateTask: false, // TODO: Implement
  canUpdateTask: false, // TODO: Implement
  canDeleteTask: false, // TODO: Implement
  canAssignTask: false,
  supportsChecklists: false, // Jira uses subtasks instead
  supportsLabels: true,
  supportsDueDate: true,
  supportsPriority: true,
};

/**
 * Maps Jira status category to unified task status
 * Jira uses statusCategory.key: 'new' | 'indeterminate' | 'done'
 */
function mapJiraStatusToTaskStatus(status?: JiraIssue['fields']['status']): TaskStatus {
  if (!status?.statusCategory?.key) return 'todo';

  switch (status.statusCategory.key) {
    case 'new':
      return 'todo';
    case 'indeterminate':
      return 'in_progress';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}

/**
 * Maps Jira priority to unified priority
 */
function mapJiraPriorityToTaskPriority(priority?: JiraIssue['fields']['priority']): TaskPriority | undefined {
  if (!priority?.name) return undefined;

  const name = priority.name.toLowerCase();

  if (name.includes('highest') || name.includes('blocker') || name.includes('critical')) {
    return 'critical';
  }
  if (name.includes('high')) {
    return 'high';
  }
  if (name.includes('medium') || name.includes('normal')) {
    return 'medium';
  }
  if (name.includes('low') || name.includes('lowest') || name.includes('trivial')) {
    return 'low';
  }

  return 'medium'; // Default fallback
}

/**
 * Maps Jira issue to unified task
 * Handles potential null fields defensively
 */
function mapJiraIssueToTask(issue: JiraIssue): UnifiedTask | null {
  const { fields } = issue;

  // Skip issues without required fields
  if (!fields?.project?.key || !fields?.summary) {
    console.warn('[JiraProvider] Skipping issue with missing required fields:', issue.key);
    return null;
  }

  // Calculate progress if available
  const percentComplete = fields.progress?.percent ?? undefined;

  // Build browse URL from self URL
  let url = issue.self;
  if (issue.self && issue.key) {
    // Transform /rest/api/3/issue/12345 to /browse/PROJ-123
    url = issue.self.replace(/\/rest\/api\/\d+\/issue\/\d+$/, `/browse/${issue.key}`);
  }

  return {
    id: `jira-${issue.id}`,
    source: 'jira',
    sourceId: issue.key, // Use key (e.g., "PROJ-123") as sourceId for easier lookup
    title: fields.summary,
    description: typeof fields.description === 'string' ? fields.description : undefined,
    status: mapJiraStatusToTaskStatus(fields.status),
    priority: mapJiraPriorityToTaskPriority(fields.priority),
    dueDate: fields.duedate || undefined,
    url,

    // Progress
    percentComplete,

    // Organization
    boardId: fields.project.key,
    boardName: fields.project.name,
    listId: fields.status?.id,
    listName: fields.status?.name,

    // Labels
    labels: fields.labels?.map((label, index) => ({
      id: `label-${index}`,
      name: label,
    })),

    // Timestamps
    createdAt: fields.created,
    updatedAt: fields.updated,
  };
}

/**
 * Maps Jira project to unified board
 * Note: sourceId uses project.key (not project.id) to match task.boardId
 */
function mapJiraProjectToBoard(project: JiraProject): UnifiedBoard {
  return {
    id: `jira-${project.key}`,
    source: 'jira',
    sourceId: project.key, // Use key to match task.boardId (fields.project.key)
    name: project.name,
    description: `${project.key} - ${project.projectTypeKey}`,
    url: project.url,
    backgroundImage: project.avatarUrl,
  };
}

/**
 * Jira Provider Implementation
 */
export class JiraProvider implements IToolProvider {
  readonly meta: ToolProviderMeta = {
    id: 'jira',
    name: 'Jira',
    icon: 'jira',
    description: 'Jira projects and issues',
    capabilities: JIRA_CAPABILITIES,
  };

  private connectionStatus: boolean | null = null;
  private configurationCache: JiraConfiguration | null = null;
  private configurationCacheTime: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  async isConnected(): Promise<boolean> {
    // Cache connection status for performance
    if (this.connectionStatus !== null) {
      return this.connectionStatus;
    }

    try {
      // Try to fetch projects - if it works, we're connected
      const result = await JiraService.getProjects();

      this.connectionStatus = result.success;
      return this.connectionStatus;
    } catch (error) {
      console.error('[JiraProvider] isConnected() error:', error);
      this.connectionStatus = false;
      return false;
    }
  }

  /**
   * Reset connection status (call after connect/disconnect)
   */
  resetConnectionStatus(): void {
    this.connectionStatus = null;
    this.configurationCache = null;
    this.configurationCacheTime = 0;
  }

  /**
   * Get user's configuration with caching
   */
  private async getConfiguration(): Promise<JiraConfiguration | null> {
    const now = Date.now();
    if (this.configurationCache && (now - this.configurationCacheTime) < this.CACHE_TTL_MS) {
      return this.configurationCache;
    }

    try {
      const result = await JiraService.getConfiguration();
      if (result.success && result.data) {
        this.configurationCache = result.data;
        this.configurationCacheTime = now;
        return result.data;
      }
    } catch {
      // If configuration fetch fails, return null (no projects selected)
    }
    return null;
  }

  /**
   * Invalidate configuration cache (call after saving configuration)
   */
  invalidateConfigurationCache(): void {
    this.configurationCache = null;
    this.configurationCacheTime = 0;
  }

  async getBoards(): Promise<ProviderResult<UnifiedBoard[]>> {
    try {
      // Get user's configuration to filter by selected projects
      const config = await this.getConfiguration();
      const selectedProjectIds = new Set(config?.selectedProjectIds ?? []);

      // If no projects selected, return empty array (strict filtering)
      if (selectedProjectIds.size === 0) {
        return { data: [], error: null, source: 'jira' };
      }

      // Fetch all projects
      const result = await JiraService.getProjects();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Jira projects',
          source: 'jira',
        };
      }

      // Filter to only selected projects (selectedProjectIds contains project IDs)
      const selectedProjects = result.data.filter((p) => selectedProjectIds.has(p.id));
      const boards = selectedProjects.map(mapJiraProjectToBoard);
      return { data: boards, error: null, source: 'jira' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'jira',
      };
    }
  }

  async getTasks(filter?: TaskFilter): Promise<ProviderResult<UnifiedTask[]>> {
    try {
      console.log('[JiraProvider] getTasks called with filter:', filter);

      // Fetch config, projects, and issues in PARALLEL for better performance
      const [config, projectsResult, issuesResult] = await Promise.all([
        this.getConfiguration(),
        JiraService.getProjects(),
        JiraService.getIssues(),
      ]);

      const selectedProjectIds = config?.selectedProjectIds ?? [];
      console.log('[JiraProvider] Configuration:', { selectedProjectIds });

      // If no projects selected, return empty array (strict filtering)
      if (selectedProjectIds.length === 0) {
        console.log('[JiraProvider] No projects selected, returning empty array');
        return { data: [], error: null, source: 'jira' };
      }

      // Build mapping of project ID to project key
      const projectIdToKey = new Map<string, string>();
      if (projectsResult.success && projectsResult.data) {
        projectsResult.data.forEach((p) => projectIdToKey.set(p.id, p.key));
      }

      // Get selected project keys for filtering issues
      const selectedProjectKeys = new Set(
        selectedProjectIds
          .map((id) => projectIdToKey.get(id))
          .filter((key): key is string => key !== undefined)
      );

      const result = issuesResult;

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Jira issues',
          source: 'jira',
        };
      }

      // Filter issues to only those from selected projects (with null check for project)
      const filteredIssues = result.data.filter((issue) =>
        issue.fields?.project?.key && selectedProjectKeys.has(issue.fields.project.key)
      );

      // Map to tasks, filtering out any that fail mapping
      let tasks = filteredIssues
        .map(mapJiraIssueToTask)
        .filter((t): t is UnifiedTask => t !== null);

      // Apply additional filter if provided
      if (filter) {
        if (filter.status) {
          const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
          tasks = tasks.filter((t) => statuses.includes(t.status));
        }
        if (filter.priority) {
          const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
          tasks = tasks.filter((t) => t.priority && priorities.includes(t.priority));
        }
        if (filter.boardId) {
          tasks = tasks.filter((t) => t.boardId === filter.boardId);
        }
        if (filter.listName) {
          tasks = tasks.filter((t) => t.listName === filter.listName);
        }
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          tasks = tasks.filter(
            (t) =>
              t.title.toLowerCase().includes(searchLower) ||
              t.description?.toLowerCase().includes(searchLower) ||
              t.sourceId.toLowerCase().includes(searchLower) // Also search by issue key
          );
        }
      }

      return { data: tasks, error: null, source: 'jira' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'jira',
      };
    }
  }

  async getTask(taskId: string): Promise<ProviderResult<UnifiedTask>> {
    try {
      // taskId could be the issue key (e.g., "PROJ-123")
      const result = await JiraService.getIssue(taskId);

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Jira issue',
          source: 'jira',
        };
      }

      const task = mapJiraIssueToTask(result.data);
      if (!task) {
        return {
          data: null,
          error: 'Failed to map Jira issue (missing required fields)',
          source: 'jira',
        };
      }
      return { data: task, error: null, source: 'jira' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'jira',
      };
    }
  }

  async getTasksForBoard(boardId: string): Promise<ProviderResult<UnifiedTask[]>> {
    try {
      // Get user's configuration to check if board is in selected projects
      const config = await this.getConfiguration();
      const selectedProjectIds = config?.selectedProjectIds ?? [];

      // If no projects selected, return empty array
      if (selectedProjectIds.length === 0) {
        return { data: [], error: null, source: 'jira' };
      }

      // Fetch projects to validate board is selected
      const projectsResult = await JiraService.getProjects();
      if (projectsResult.success && projectsResult.data) {
        const selectedProjectKeys = new Set(
          projectsResult.data
            .filter((p) => selectedProjectIds.includes(p.id))
            .map((p) => p.key)
        );

        // If requested board is not in selected projects, return empty
        if (!selectedProjectKeys.has(boardId)) {
          return { data: [], error: null, source: 'jira' };
        }
      }

      // boardId is the project key
      const result = await JiraService.getIssuesForProject(boardId);

      if (!result.success || !result.data) {
        // Fallback to filtering all issues
        return this.getTasks({ boardId });
      }

      const tasks = result.data
        .map(mapJiraIssueToTask)
        .filter((t): t is UnifiedTask => t !== null);
      return { data: tasks, error: null, source: 'jira' };
    } catch {
      // Fallback to filtering all issues
      return this.getTasks({ boardId });
    }
  }
}

// Export singleton instance
export const jiraProvider = new JiraProvider();
