/**
 * Trello API Service
 *
 * Handles direct API calls to the Trello backend endpoints.
 * This is a thin wrapper around the API client.
 */

import { timeTrackingApiClient } from '@/api/client/instances';

/**
 * Trello Board from API
 */
export interface TrelloBoard {
  id: string;
  name: string;
  desc?: string;
  url: string;
  shortUrl: string;
  closed: boolean;
  prefs?: {
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

/**
 * Trello Card/Task from API
 */
export interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  shortUrl: string;
  due?: string;
  dueComplete?: boolean;
  dateLastActivity?: string;
  idBoard: string;
  idList?: string;
  idChecklists?: string[];
  badges?: {
    checkItems?: number;
    checkItemsChecked?: number;
  };
  labels?: TrelloLabel[];
  board?: {
    id: string;
    name: string;
  };
  list?: {
    id: string;
    name: string;
  };
}

/**
 * Trello Label
 */
export interface TrelloLabel {
  id: string;
  name?: string;
  color: string;
}

/**
 * Trello Service - API wrapper
 * Uses timeTrackingApiClient which has baseURL /planner/api/v1
 */
export const TrelloService = {
  /**
   * Get all boards for the authenticated user
   * GET /planner/api/v1/trello/boards
   */
  async getBoards() {
    return timeTrackingApiClient.get<TrelloBoard[]>('/trello/boards');
  },

  /**
   * Get all tasks assigned to the authenticated user
   * GET /planner/api/v1/trello/tasks
   */
  async getTasks() {
    return timeTrackingApiClient.get<TrelloCard[]>('/trello/tasks');
  },

  /**
   * Get a specific task by ID
   * GET /planner/api/v1/trello/tasks/:id
   */
  async getTask(taskId: string) {
    return timeTrackingApiClient.get<TrelloCard>(`/trello/tasks/${taskId}`);
  },
};
