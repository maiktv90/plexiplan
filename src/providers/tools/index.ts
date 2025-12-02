/**
 * Tool Providers Module
 *
 * Central export point for all tool provider functionality.
 *
 * Architecture Overview:
 * ----------------------
 * This module implements a Plugin/Provider pattern for tool integrations:
 *
 * 1. IToolProvider Interface - Contract all tools must implement
 * 2. ToolProviderRegistry - Central registry for discovering providers
 * 3. Individual Providers - Trello, Jira, GitHub, etc.
 *
 * Adding a New Tool:
 * ------------------
 * 1. Create a new folder: providers/tools/[toolname]/
 * 2. Implement [ToolName]Service.ts - API wrapper
 * 3. Implement [ToolName]Provider.ts - IToolProvider implementation
 * 4. Export from index.ts
 * 5. Register in initializeToolProviders()
 *
 * Example:
 *   // providers/tools/jira/JiraProvider.ts
 *   export class JiraProvider implements IToolProvider { ... }
 *
 *   // providers/tools/index.ts
 *   import { jiraProvider } from './jira';
 *   ToolProviderRegistry.register(jiraProvider);
 */

// Core interfaces and registry
export type {
  IToolProvider,
  IMutableToolProvider,
  ToolProviderMeta,
  ToolCapabilities,
  ProviderResult,
} from './ToolProvider.interface';
export { DEFAULT_CAPABILITIES } from './ToolProvider.interface';
export { ToolProviderRegistry } from './ToolProviderRegistry';

// Trello Provider
export { TrelloProvider, trelloProvider, TrelloService } from './trello';
export type { TrelloBoard, TrelloCard, TrelloLabel } from './trello';

// GitHub Provider
export { GitHubProvider, githubProvider, GitHubService } from './github';
export type { GitHubRepo, GitHubPullRequest, GitHubBranch } from './github';

// Bitbucket Provider
export { BitbucketProvider, bitbucketProvider, BitbucketService } from './bitbucket';
export type { BitbucketRepo, BitbucketPullRequest } from './bitbucket';

// Jira Provider
export { JiraProvider, jiraProvider, JiraService } from './jira';
export type { JiraProject, JiraIssue, JiraStatus, JiraPriority } from './jira';

// Initialize all providers
import { ToolProviderRegistry } from './ToolProviderRegistry';
import { trelloProvider } from './trello';
import { githubProvider } from './github';
import { bitbucketProvider } from './bitbucket';
import { jiraProvider } from './jira';

/**
 * Initialize and register all tool providers
 * Call this once during app startup
 */
export function initializeToolProviders(): void {
  // Register Trello
  ToolProviderRegistry.register(trelloProvider);

  // Register GitHub
  ToolProviderRegistry.register(githubProvider);

  // Register Bitbucket
  ToolProviderRegistry.register(bitbucketProvider);

  // Register Jira
  ToolProviderRegistry.register(jiraProvider);
}
