/**
 * Tool Provider Interface
 *
 * This is the core abstraction for integrating external tools.
 * Each tool (Trello, Jira, GitHub, etc.) implements this interface.
 *
 * Design Patterns Used:
 * - Strategy Pattern: Each provider is a strategy for fetching tasks/boards
 * - Adapter Pattern: Providers adapt tool-specific APIs to unified interfaces
 * - Plugin Pattern: Providers can be registered/unregistered at runtime
 *
 * To add a new tool:
 * 1. Create a new provider implementing IToolProvider
 * 2. Register it in the ToolProviderRegistry
 * 3. The system automatically aggregates data from all registered providers
 */

import type {
  TaskSource,
  UnifiedTask,
  UnifiedBoard,
  TaskFilter,
} from '@/types/task.types';

/**
 * Tool provider capabilities
 */
export interface ToolCapabilities {
  canFetchTasks: boolean;
  canFetchBoards: boolean;
  canFetchPullRequests: boolean;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canDeleteTask: boolean;
  canAssignTask: boolean;
  supportsChecklists: boolean;
  supportsLabels: boolean;
  supportsDueDate: boolean;
  supportsPriority: boolean;
}

/**
 * Unified Pull Request representation
 */
export interface UnifiedPullRequest {
  id: string;
  source: TaskSource;
  title: string;
  branchName: string;
  repository: string;
  owner: string;
  url: string;
  status: 'open' | 'merged' | 'closed' | 'draft';
  createdAt?: string;
  updatedAt?: string;
  isAuthor?: boolean; // true if current user created this PR, false if they're a reviewer
}

/**
 * Provider metadata
 */
export interface ToolProviderMeta {
  id: TaskSource;
  name: string;
  icon: string;
  description: string;
  capabilities: ToolCapabilities;
}

/**
 * Result wrapper for provider operations
 */
export interface ProviderResult<T> {
  data: T | null;
  error: string | null;
  source: TaskSource;
}

/**
 * Main Tool Provider Interface
 *
 * All tool integrations must implement this interface.
 * The interface is designed to be async-first and error-tolerant.
 */
export interface IToolProvider {
  /**
   * Provider metadata
   */
  readonly meta: ToolProviderMeta;

  /**
   * Check if the user is connected to this tool
   */
  isConnected(): Promise<boolean>;

  /**
   * Fetch all boards/projects from this tool
   */
  getBoards(): Promise<ProviderResult<UnifiedBoard[]>>;

  /**
   * Fetch tasks assigned to the current user
   * @param filter Optional filter criteria
   */
  getTasks(filter?: TaskFilter): Promise<ProviderResult<UnifiedTask[]>>;

  /**
   * Fetch a specific task by ID
   * @param taskId The task ID (source-specific)
   */
  getTask(taskId: string): Promise<ProviderResult<UnifiedTask>>;

  /**
   * Fetch tasks for a specific board
   * @param boardId The board ID
   */
  getTasksForBoard(boardId: string): Promise<ProviderResult<UnifiedTask[]>>;

  /**
   * Fetch pull requests from this tool (for code management tools)
   * Optional - only implement if canFetchPullRequests is true
   */
  getPullRequests?(): Promise<ProviderResult<UnifiedPullRequest[]>>;
}

/**
 * Optional extended interface for tools that support mutations
 */
export interface IMutableToolProvider extends IToolProvider {
  createTask(task: Partial<UnifiedTask>): Promise<ProviderResult<UnifiedTask>>;
  updateTask(taskId: string, updates: Partial<UnifiedTask>): Promise<ProviderResult<UnifiedTask>>;
  deleteTask(taskId: string): Promise<ProviderResult<boolean>>;
}

/**
 * Default capabilities (all false) - providers override what they support
 */
export const DEFAULT_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: false,
  canFetchBoards: false,
  canFetchPullRequests: false,
  canCreateTask: false,
  canUpdateTask: false,
  canDeleteTask: false,
  canAssignTask: false,
  supportsChecklists: false,
  supportsLabels: false,
  supportsDueDate: false,
  supportsPriority: false,
};
