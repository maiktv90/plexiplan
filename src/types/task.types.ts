/**
 * Unified Task Types
 *
 * These types provide a normalized interface for tasks from any tool
 * (Trello, Jira, GitHub Issues, etc.). Each tool provider maps its
 * native task format to these unified types.
 */

/**
 * Supported task source tools
 */
export type TaskSource = 'trello' | 'jira' | 'github' | 'bitbucket' | 'azure-devops';

/**
 * Task status normalized across tools
 */
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

/**
 * Task priority normalized across tools
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Unified task interface - all tool providers map to this
 */
export interface UnifiedTask {
  id: string;
  source: TaskSource;
  sourceId: string; // Original ID from the tool
  title: string;
  description?: string | object; // Can be plain text or ADF (Atlassian Document Format) object
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  url?: string;

  // Progress tracking
  percentComplete?: number;
  checklistTotal?: number;
  checklistCompleted?: number;

  // Organization
  boardId?: string;
  boardName?: string;
  listId?: string; // Column/List ID (for filtering)
  listName?: string; // Column/List name (e.g., "In Progress")

  // Labels/Tags
  labels?: TaskLabel[];

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Multi-account support
  /** External account ID for multi-account support (e.g., Trello user ID) */
  externalAccountId?: string;
  /** User-friendly label for multi-account support (e.g., "Work Trello") */
  accountLabel?: string;
}

/**
 * Task label/tag
 */
export interface TaskLabel {
  id: string;
  name: string;
  color?: string;
}

/**
 * Unified board interface
 */
export interface UnifiedBoard {
  id: string;
  source: TaskSource;
  sourceId: string;
  name: string;
  description?: string;
  url?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  taskCount?: number;
}

/**
 * Task filter options
 */
export interface TaskFilter {
  source?: TaskSource | TaskSource[];
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  boardId?: string;
  listName?: string; // Filter by list/column name
  search?: string;
}

/**
 * Aggregated tasks response from multiple sources
 */
export interface AggregatedTasksResponse {
  tasks: UnifiedTask[];
  sources: {
    source: TaskSource;
    connected: boolean;
    taskCount: number;
    error?: string;
  }[];
  totalCount: number;
}

/**
 * Aggregated boards response from multiple sources
 */
export interface AggregatedBoardsResponse {
  boards: UnifiedBoard[];
  sources: {
    source: TaskSource;
    connected: boolean;
    boardCount: number;
    error?: string;
  }[];
  totalCount: number;
}
