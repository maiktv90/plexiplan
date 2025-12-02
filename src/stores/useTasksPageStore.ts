/**
 * Tasks Page Store
 *
 * Persists the expanded/collapsed state of source groups and board groups
 * on the Tasks page using localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TasksPageState {
  // Expanded state for source groups (e.g., 'jira', 'trello')
  expandedSources: Record<string, boolean>;
  // Expanded state for board groups (e.g., 'jira-boardId')
  expandedBoards: Record<string, boolean>;

  // Actions
  toggleSource: (source: string) => void;
  toggleBoard: (boardKey: string) => void;
  setSourceExpanded: (source: string, expanded: boolean) => void;
  setBoardExpanded: (boardKey: string, expanded: boolean) => void;
  isSourceExpanded: (source: string) => boolean;
  isBoardExpanded: (boardKey: string) => boolean;
}

export const useTasksPageStore = create<TasksPageState>()(
  persist(
    (set, get) => ({
      expandedSources: {},
      expandedBoards: {},

      toggleSource: (source: string) => {
        set((state) => ({
          expandedSources: {
            ...state.expandedSources,
            [source]: !(state.expandedSources[source] ?? true), // Default to expanded
          },
        }));
      },

      toggleBoard: (boardKey: string) => {
        set((state) => ({
          expandedBoards: {
            ...state.expandedBoards,
            [boardKey]: !(state.expandedBoards[boardKey] ?? true), // Default to expanded
          },
        }));
      },

      setSourceExpanded: (source: string, expanded: boolean) => {
        set((state) => ({
          expandedSources: {
            ...state.expandedSources,
            [source]: expanded,
          },
        }));
      },

      setBoardExpanded: (boardKey: string, expanded: boolean) => {
        set((state) => ({
          expandedBoards: {
            ...state.expandedBoards,
            [boardKey]: expanded,
          },
        }));
      },

      isSourceExpanded: (source: string) => {
        return get().expandedSources[source] ?? true; // Default to expanded
      },

      isBoardExpanded: (boardKey: string) => {
        return get().expandedBoards[boardKey] ?? true; // Default to expanded
      },
    }),
    {
      name: 'tasks-page-state',
    }
  )
);
