/**
 * Tool Provider Registry
 *
 * Central registry for all tool providers. Implements the Registry Pattern
 * to allow dynamic registration and discovery of tool providers.
 *
 * Usage:
 *   // Register a provider
 *   ToolProviderRegistry.register(new TrelloProvider());
 *
 *   // Get all providers
 *   const providers = ToolProviderRegistry.getAll();
 *
 *   // Get specific provider
 *   const trello = ToolProviderRegistry.get('trello');
 *
 *   // Aggregate tasks from all connected providers
 *   const tasks = await ToolProviderRegistry.aggregateTasks();
 */

import type { TaskSource, UnifiedTask, UnifiedBoard, TaskFilter } from '@/types/task.types';
import type { IToolProvider, ProviderResult, ToolProviderMeta, UnifiedPullRequest } from './ToolProvider.interface';

/**
 * Connection status cache entry
 */
interface ConnectionCacheEntry {
  isConnected: boolean;
  timestamp: number;
}

class ToolProviderRegistryClass {
  private providers: Map<TaskSource, IToolProvider> = new Map();
  private connectionCache: Map<TaskSource, ConnectionCacheEntry> = new Map();
  private readonly CONNECTION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Register a tool provider
   */
  register(provider: IToolProvider): void {
    this.providers.set(provider.meta.id, provider);
  }

  /**
   * Unregister a tool provider
   */
  unregister(source: TaskSource): void {
    this.providers.delete(source);
  }

  /**
   * Get a specific provider
   */
  get(source: TaskSource): IToolProvider | undefined {
    return this.providers.get(source);
  }

  /**
   * Get all registered providers
   */
  getAll(): IToolProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get metadata for all registered providers
   */
  getAllMeta(): ToolProviderMeta[] {
    return this.getAll().map((p) => p.meta);
  }

  /**
   * Check if a provider is connected, with caching
   */
  private async isProviderConnected(provider: IToolProvider): Promise<boolean> {
    const now = Date.now();
    const cached = this.connectionCache.get(provider.meta.id);

    // Return cached value if still valid
    if (cached && (now - cached.timestamp) < this.CONNECTION_CACHE_TTL_MS) {
      return cached.isConnected;
    }

    // Fetch fresh value
    try {
      const isConnected = await provider.isConnected();
      this.connectionCache.set(provider.meta.id, { isConnected, timestamp: now });
      return isConnected;
    } catch (error) {
      console.error(`[ToolProviderRegistry] ${provider.meta.id}.isConnected() threw:`, error);
      // Cache the failure as not connected
      this.connectionCache.set(provider.meta.id, { isConnected: false, timestamp: now });
      return false;
    }
  }

  /**
   * Invalidate connection cache for a specific provider (call after connect/disconnect)
   */
  invalidateConnectionCache(source: TaskSource): void {
    this.connectionCache.delete(source);
  }

  /**
   * Clear all connection caches
   */
  clearConnectionCache(): void {
    this.connectionCache.clear();
  }

  /**
   * Get all connected providers
   */
  async getConnected(): Promise<IToolProvider[]> {
    const providers = this.getAll();
    const connected: IToolProvider[] = [];

    await Promise.all(
      providers.map(async (provider) => {
        const isConnected = await this.isProviderConnected(provider);
        if (isConnected) {
          connected.push(provider);
        }
      })
    );

    return connected;
  }

  /**
   * Aggregate tasks from all connected providers that support task fetching
   */
  async aggregateTasks(filter?: TaskFilter): Promise<{
    tasks: UnifiedTask[];
    results: ProviderResult<UnifiedTask[]>[];
  }> {
    const connectedProviders = await this.getConnected();

    const results: ProviderResult<UnifiedTask[]>[] = [];
    const allTasks: UnifiedTask[] = [];

    await Promise.all(
      connectedProviders.map(async (provider) => {
        // Skip providers that don't support task fetching
        if (!provider.meta.capabilities.canFetchTasks) {
          console.log(`[ToolProviderRegistry] Skipping ${provider.meta.id} - canFetchTasks is false`);
          return;
        }

        try {
          const result = await provider.getTasks(filter);

          results.push(result);
          if (result.data) {
            allTasks.push(...result.data);
          }
        } catch (error) {
          console.error(`[ToolProviderRegistry] ${provider.meta.id} threw error:`, error);
          results.push({
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: provider.meta.id,
          });
        }
      })
    );

    // Sort by due date (tasks with due dates first, then by date)
    allTasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return { tasks: allTasks, results };
  }

  /**
   * Aggregate boards from all connected providers
   */
  async aggregateBoards(): Promise<{
    boards: UnifiedBoard[];
    results: ProviderResult<UnifiedBoard[]>[];
  }> {
    const connectedProviders = await this.getConnected();
    const results: ProviderResult<UnifiedBoard[]>[] = [];
    const allBoards: UnifiedBoard[] = [];

    await Promise.all(
      connectedProviders.map(async (provider) => {
        if (!provider.meta.capabilities.canFetchBoards) return;

        try {
          const result = await provider.getBoards();
          results.push(result);
          if (result.data) {
            allBoards.push(...result.data);
          }
        } catch (error) {
          results.push({
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: provider.meta.id,
          });
        }
      })
    );

    return { boards: allBoards, results };
  }

  /**
   * Aggregate pull requests from all connected code management providers
   */
  async aggregatePullRequests(): Promise<{
    pullRequests: UnifiedPullRequest[];
    results: ProviderResult<UnifiedPullRequest[]>[];
  }> {
    const connectedProviders = await this.getConnected();
    const results: ProviderResult<UnifiedPullRequest[]>[] = [];
    const allPullRequests: UnifiedPullRequest[] = [];

    await Promise.all(
      connectedProviders.map(async (provider) => {
        // Skip providers that don't support PR fetching
        if (!provider.meta.capabilities.canFetchPullRequests || !provider.getPullRequests) return;

        try {
          const result = await provider.getPullRequests();
          results.push(result);
          if (result.data) {
            allPullRequests.push(...result.data);
          }
        } catch (error) {
          results.push({
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: provider.meta.id,
          });
        }
      })
    );

    return { pullRequests: allPullRequests, results };
  }

  /**
   * Get a specific task from the appropriate provider
   */
  async getTask(source: TaskSource, taskId: string): Promise<ProviderResult<UnifiedTask>> {
    const provider = this.get(source);
    if (!provider) {
      return { data: null, error: `Provider ${source} not found`, source };
    }
    return provider.getTask(taskId);
  }

  /**
   * Clear all providers and caches (useful for testing)
   */
  clear(): void {
    this.providers.clear();
    this.connectionCache.clear();
  }
}

// Singleton instance
export const ToolProviderRegistry = new ToolProviderRegistryClass();
