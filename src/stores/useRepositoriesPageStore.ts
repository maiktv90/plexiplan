/**
 * Repositories Page Store
 *
 * Persists the expanded/collapsed state of source groups and repository groups
 * on the Repositories (Pull Requests) page using localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RepositoriesPageState {
  // Expanded state for source groups (e.g., 'github', 'bitbucket')
  expandedSources: Record<string, boolean>;
  // Expanded state for repository groups (e.g., 'owner/repo')
  expandedRepos: Record<string, boolean>;

  // Actions
  toggleSource: (source: string) => void;
  toggleRepo: (repoKey: string) => void;
  setSourceExpanded: (source: string, expanded: boolean) => void;
  setRepoExpanded: (repoKey: string, expanded: boolean) => void;
  isSourceExpanded: (source: string) => boolean;
  isRepoExpanded: (repoKey: string) => boolean;
}

export const useRepositoriesPageStore = create<RepositoriesPageState>()(
  persist(
    (set, get) => ({
      expandedSources: {},
      expandedRepos: {},

      toggleSource: (source: string) => {
        set((state) => ({
          expandedSources: {
            ...state.expandedSources,
            [source]: !(state.expandedSources[source] ?? true), // Default to expanded
          },
        }));
      },

      toggleRepo: (repoKey: string) => {
        set((state) => ({
          expandedRepos: {
            ...state.expandedRepos,
            [repoKey]: !(state.expandedRepos[repoKey] ?? true), // Default to expanded
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

      setRepoExpanded: (repoKey: string, expanded: boolean) => {
        set((state) => ({
          expandedRepos: {
            ...state.expandedRepos,
            [repoKey]: expanded,
          },
        }));
      },

      isSourceExpanded: (source: string) => {
        return get().expandedSources[source] ?? true; // Default to expanded
      },

      isRepoExpanded: (repoKey: string) => {
        return get().expandedRepos[repoKey] ?? true; // Default to expanded
      },
    }),
    {
      name: 'repositories-page-state',
    }
  )
);
