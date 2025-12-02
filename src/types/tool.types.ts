// Tool Management Types
// Matches backend DTOs from plexify-planner-backend

export type ToolCategory = 'project_management' | 'code_management';

export type AuthMethod = 'OAUTH2' | 'PAT' | 'CUSTOM';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

/**
 * Static tool definition for UI display
 * Used to show available tools with their metadata
 */
export interface ToolDefinition {
  id: string;
  clientRegistrationId: string;
  name: string;
  description: string;
  icon: ToolIcon;
  category: ToolCategory;
  authMethod: AuthMethod;
  configFields?: ConfigField[];
  docsUrl?: string;
}

export type ToolIcon = 'github' | 'bitbucket' | 'jira' | 'trello' | 'gitlab';

/**
 * Configuration field for PAT/custom auth tools
 */
export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'password';
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * Connected tool from backend (matches ToolDto)
 */
export interface ConnectedTool {
  clientKey: string;
  label: string;
  type: string;
  authMethod: AuthMethod;
  domain?: string;
  connectUrl?: string;
  connectedAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  order?: number; // Display order for custom sorting
}

/**
 * Available tool from backend (matches ToolDto)
 */
export interface AvailableTool {
  clientKey: string;
  label: string;
  type: string;
  authMethod: AuthMethod;
  domain?: string;
  connectUrl?: string;
  connectedAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

/**
 * Response from GET /auth/integrations (matches IntegrationsDto)
 */
export interface IntegrationsResponse {
  connectedTools: ConnectedTool[];
  availableTools: AvailableTool[];
}

/**
 * Request to register a PAT (matches RegisterPATRequest)
 */
export interface RegisterPATRequest {
  client: string;
  token: string;
  domain?: string;
}

/**
 * Tool with UI state for display
 */
export interface ToolWithStatus extends ToolDefinition {
  status: ConnectionStatus;
  connectedData?: ConnectedTool;
  error?: string;
}

/**
 * Props for tool connection dialog
 */
export interface ToolConnectionDialogProps {
  tool: ToolDefinition;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (tool: ToolDefinition, credentials?: PATCredentials) => void;
  isConnecting?: boolean;
  error?: string;
}

/**
 * Credentials for PAT-based authentication
 */
export interface PATCredentials {
  token: string;
  domain?: string;
}

/**
 * Jira configuration for selected projects
 */
export interface JiraConfiguration {
  selectedProjectIds: string[];
  updatedAt?: string;
}

/**
 * Request to update Jira configuration
 */
export interface UpdateJiraConfigurationRequest {
  selectedProjectIds: string[];
}

/**
 * Bitbucket configuration for selected repositories
 */
export interface BitbucketConfiguration {
  selectedRepositoryIds: string[]; // Format: "workspace/repo-slug"
  updatedAt?: string;
}

/**
 * Request to update Bitbucket configuration
 */
export interface UpdateBitbucketConfigurationRequest {
  selectedRepositoryIds: string[]; // Format: "workspace/repo-slug"
}

/**
 * Props for tool disconnect dialog
 */
export interface ToolDisconnectDialogProps {
  tool: ConnectedTool;
  toolDefinition: ToolDefinition;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: (clientKey: string) => void;
  isDisconnecting?: boolean;
}

/**
 * Request to update tool display order
 */
export interface UpdateToolOrderRequest {
  toolOrders: ToolOrderUpdate[];
}

export interface ToolOrderUpdate {
  clientKey: string;
  order: number;
}

/**
 * Response from tool order update
 */
export interface ToolOrderResponse {
  success: boolean;
  message?: string;
}
