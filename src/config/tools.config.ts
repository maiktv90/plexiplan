import { plannerBackendBaseUrl } from './global.config';
import type { ToolDefinition, AuthMethod } from '@/types/tool.types';

/**
 * Supported tools configuration
 * Matches backend ToolConfigurations.kt
 */
export const SUPPORTED_TOOLS: ToolDefinition[] = [
  // Code Management Tools
  {
    id: 'github',
    clientRegistrationId: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub repositories and pull requests',
    icon: 'github',
    category: 'code_management',
    authMethod: 'OAUTH2',
    docsUrl: 'https://docs.github.com/en/apps/oauth-apps',
  },
  {
    id: 'bitbucket',
    clientRegistrationId: 'bitbucket',
    name: 'Bitbucket',
    description: 'Connect your Bitbucket repositories and pull requests',
    icon: 'bitbucket',
    category: 'code_management',
    authMethod: 'OAUTH2',
    docsUrl: 'https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/',
  },

  // Project Management Tools
  {
    id: 'jira-cloud',
    clientRegistrationId: 'jira',
    name: 'Jira Cloud',
    description: 'Connect to Atlassian Jira Cloud for issue tracking',
    icon: 'jira',
    category: 'project_management',
    authMethod: 'OAUTH2',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/',
  },
  {
    id: 'jira-server',
    clientRegistrationId: 'jiraserver',
    name: 'Jira Server',
    description: 'Connect to self-hosted Jira Server or Data Center',
    icon: 'jira',
    category: 'project_management',
    authMethod: 'PAT',
    configFields: [
      {
        key: 'domain',
        label: 'Jira Server URL',
        type: 'url',
        required: true,
        placeholder: 'https://jira.yourcompany.com',
        helpText: 'The base URL of your Jira Server instance',
      },
      {
        key: 'token',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your PAT',
        helpText: 'Generate a PAT from your Jira profile settings',
      },
    ],
    docsUrl: 'https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html',
  },
  {
    id: 'trello',
    clientRegistrationId: 'trello',
    name: 'Trello',
    description: 'Connect your Trello boards and cards',
    icon: 'trello',
    category: 'project_management',
    authMethod: 'CUSTOM',
    docsUrl: 'https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/',
  },
];

/**
 * Get OAuth authorization URL for a tool
 * OAuth endpoints are on the planner backend (port 8081)
 */
export const getOAuthUrl = (clientRegistrationId: string): string => {
  return `${plannerBackendBaseUrl}/planner/oauth2/authorization/${clientRegistrationId}`;
};

/**
 * Get tool definition by client registration ID
 */
export const getToolByClientId = (clientRegistrationId: string): ToolDefinition | undefined => {
  return SUPPORTED_TOOLS.find((tool) => tool.clientRegistrationId === clientRegistrationId);
};

/**
 * Get tool definition by tool ID
 */
export const getToolById = (id: string): ToolDefinition | undefined => {
  return SUPPORTED_TOOLS.find((tool) => tool.id === id);
};

/**
 * Alias for getToolById for clarity
 */
export const getToolDefinitionById = getToolById;

/**
 * Get tool display name from tool ID or client registration ID
 * Falls back to formatted ID if not found
 */
export const getToolName = (toolIdOrClientId: string): string => {
  const tool =
    SUPPORTED_TOOLS.find((t) => t.id === toolIdOrClientId) ||
    SUPPORTED_TOOLS.find((t) => t.clientRegistrationId === toolIdOrClientId);

  if (tool) return tool.name;

  // Format ID as readable name (e.g., 'jira-cloud' -> 'Jira Cloud')
  return toolIdOrClientId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get tools by category
 */
export const getToolsByCategory = (category: ToolDefinition['category']): ToolDefinition[] => {
  return SUPPORTED_TOOLS.filter((tool) => tool.category === category);
};

/**
 * Get tools by auth method
 */
export const getToolsByAuthMethod = (authMethod: AuthMethod): ToolDefinition[] => {
  return SUPPORTED_TOOLS.filter((tool) => tool.authMethod === authMethod);
};

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<ToolDefinition['category'], string> = {
  code_management: 'Code Management',
  project_management: 'Project Management',
};

/**
 * Category descriptions
 */
export const CATEGORY_DESCRIPTIONS: Record<ToolDefinition['category'], string> = {
  code_management: 'Connect your code repositories and track pull requests',
  project_management: 'Connect your project boards and track tasks',
};
