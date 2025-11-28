/**
 * Trello Tool Provider
 *
 * Implements IToolProvider for Trello integration.
 * Maps Trello's API responses to unified task/board interfaces.
 */

import type {
  IToolProvider,
  ToolProviderMeta,
  ProviderResult,
  ToolCapabilities,
} from '../ToolProvider.interface';
import type { UnifiedTask, UnifiedBoard, TaskFilter, TaskStatus } from '@/types/task.types';
import { TrelloService, type TrelloBoard, type TrelloCard } from './TrelloService';

/**
 * Trello-specific capabilities
 */
const TRELLO_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: true,
  canFetchBoards: true,
  canFetchPullRequests: false, // Trello is not a code management tool
  canCreateTask: false, // TODO: Implement
  canUpdateTask: false, // TODO: Implement
  canDeleteTask: false, // TODO: Implement
  canAssignTask: false,
  supportsChecklists: true,
  supportsLabels: true,
  supportsDueDate: true,
  supportsPriority: false, // Trello uses labels instead
};

/**
 * Infers task status from Trello list name
 * Uses common naming conventions for Kanban-style boards
 */
function inferStatusFromListName(listName: string | undefined): TaskStatus | null {
  if (!listName) return null;

  const name = listName.toLowerCase();

  // Done/Complete patterns
  if (
    name.includes('done') ||
    name.includes('complete') ||
    name.includes('finished') ||
    name.includes('closed') ||
    name.includes('resolved') ||
    name.includes('deployed') ||
    name.includes('released')
  ) {
    return 'done';
  }

  // In Progress patterns
  if (
    name.includes('progress') ||
    name.includes('doing') ||
    name.includes('working') ||
    name.includes('in dev') ||
    name.includes('development') ||
    name.includes('review') ||
    name.includes('testing') ||
    name.includes('qa')
  ) {
    return 'in_progress';
  }

  // Blocked patterns
  if (
    name.includes('block') ||
    name.includes('waiting') ||
    name.includes('on hold') ||
    name.includes('stuck')
  ) {
    return 'blocked';
  }

  // To Do patterns (explicit)
  if (
    name.includes('todo') ||
    name.includes('to do') ||
    name.includes('to-do') ||
    name.includes('backlog') ||
    name.includes('planned') ||
    name.includes('queue')
  ) {
    return 'todo';
  }

  return null;
}

/**
 * Maps Trello card to unified task
 */
function mapTrelloCardToTask(card: TrelloCard): UnifiedTask {
  // Determine status based on multiple factors (priority order):
  // 1. dueComplete flag (explicit completion marker)
  // 2. List name (Kanban column)
  // 3. Checklist progress (fallback heuristic)
  let status: TaskStatus = 'todo';

  if (card.dueComplete) {
    // Explicit completion marker takes highest priority
    status = 'done';
  } else {
    // Try to infer from list name
    const listStatus = inferStatusFromListName(card.list?.name);
    if (listStatus) {
      status = listStatus;
    } else if (card.badges?.checkItemsChecked && card.badges.checkItemsChecked > 0) {
      // Fallback: if there's checklist progress, consider it in progress
      status = 'in_progress';
    }
  }

  // Calculate progress
  const checklistTotal = card.badges?.checkItems || 0;
  const checklistCompleted = card.badges?.checkItemsChecked || 0;
  const percentComplete = checklistTotal > 0
    ? Math.round((checklistCompleted / checklistTotal) * 100)
    : undefined;

  return {
    id: `trello-${card.id}`,
    source: 'trello',
    sourceId: card.id,
    title: card.name,
    description: card.desc || undefined,
    status,
    dueDate: card.due || undefined,
    url: card.shortUrl,

    // Progress
    percentComplete,
    checklistTotal: checklistTotal || undefined,
    checklistCompleted: checklistCompleted || undefined,

    // Organization
    boardId: card.idBoard,
    boardName: card.board?.name,
    listId: card.idList || card.list?.id,
    listName: card.list?.name,

    // Labels
    labels: card.labels?.map((label) => ({
      id: label.id,
      name: label.name || label.color,
      color: label.color,
    })),

    // Timestamps
    updatedAt: card.dateLastActivity,
  };
}

/**
 * Maps Trello board to unified board
 */
function mapTrelloBoardToBoard(board: TrelloBoard): UnifiedBoard {
  return {
    id: `trello-${board.id}`,
    source: 'trello',
    sourceId: board.id,
    name: board.name,
    description: board.desc || undefined,
    url: board.shortUrl,
    backgroundColor: board.prefs?.backgroundColor,
    backgroundImage: board.prefs?.backgroundImage,
  };
}

/**
 * Trello Provider Implementation
 */
export class TrelloProvider implements IToolProvider {
  readonly meta: ToolProviderMeta = {
    id: 'trello',
    name: 'Trello',
    icon: 'trello',
    description: 'Trello boards and cards',
    capabilities: TRELLO_CAPABILITIES,
  };

  private connectionStatus: boolean | null = null;

  async isConnected(): Promise<boolean> {
    // Cache connection status for performance
    if (this.connectionStatus !== null) {
      return this.connectionStatus;
    }

    try {
      // Try to fetch boards - if it works, we're connected
      const result = await TrelloService.getBoards();
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
      const result = await TrelloService.getBoards();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Trello boards',
          source: 'trello',
        };
      }

      const boards = result.data.map(mapTrelloBoardToBoard);
      return { data: boards, error: null, source: 'trello' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'trello',
      };
    }
  }

  async getTasks(_filter?: TaskFilter): Promise<ProviderResult<UnifiedTask[]>> {
    try {
      const result = await TrelloService.getTasks();

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Trello tasks',
          source: 'trello',
        };
      }

      let tasks = result.data.map(mapTrelloCardToTask);

      // Apply filter if provided
      if (_filter) {
        if (_filter.status) {
          const statuses = Array.isArray(_filter.status) ? _filter.status : [_filter.status];
          tasks = tasks.filter((t) => statuses.includes(t.status));
        }
        if (_filter.boardId) {
          tasks = tasks.filter((t) => t.boardId === _filter.boardId);
        }
        if (_filter.search) {
          const searchLower = _filter.search.toLowerCase();
          tasks = tasks.filter(
            (t) =>
              t.title.toLowerCase().includes(searchLower) ||
              t.description?.toLowerCase().includes(searchLower)
          );
        }
      }

      return { data: tasks, error: null, source: 'trello' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'trello',
      };
    }
  }

  async getTask(taskId: string): Promise<ProviderResult<UnifiedTask>> {
    try {
      const result = await TrelloService.getTask(taskId);

      if (!result.success || !result.data) {
        return {
          data: null,
          error: result.error || 'Failed to fetch Trello task',
          source: 'trello',
        };
      }

      const task = mapTrelloCardToTask(result.data);
      return { data: task, error: null, source: 'trello' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'trello',
      };
    }
  }

  async getTasksForBoard(boardId: string): Promise<ProviderResult<UnifiedTask[]>> {
    // For now, filter from all tasks
    // TODO: Implement board-specific API call for efficiency
    const result = await this.getTasks({ boardId });
    return result;
  }
}

// Export singleton instance
export const trelloProvider = new TrelloProvider();
