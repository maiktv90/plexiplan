import { toolsApiClient } from '../client/instances';
import type { IntegrationsResponse, RegisterPATRequest, UpdateToolOrderRequest, ToolOrderResponse } from '@/types/tool.types';

/**
 * Response from OAuth initiation endpoint
 */
interface OAuthInitiateResponse {
  authUrl: string;
  provider: string;
}

/**
 * Service for managing tool integrations
 * Communicates with backend /planner/api/v1/tools endpoints
 */
export const ToolService = {
  /**
   * Get all integrations (connected and available tools) for current user
   * GET /planner/api/v1/tools/integrations
   */
  async getIntegrations(): Promise<IntegrationsResponse> {
    const response = await toolsApiClient.get<IntegrationsResponse>('/integrations');
    return response.data;
  },

  /**
   * Initiate OAuth flow for a tool provider.
   * This endpoint stores the user's ID in the HTTP session, then returns
   * Spring Security's OAuth authorization URL. The session-based approach
   * allows OAuth flows to work without requiring a Keycloak session.
   *
   * GET /planner/api/v1/tools/oauth/initiate?provider={provider}
   *
   * @param provider The OAuth provider (e.g., 'github', 'jira', 'bitbucket')
   * @returns The OAuth authorization URL to redirect to
   */
  async initiateOAuth(provider: string): Promise<OAuthInitiateResponse> {
    const response = await toolsApiClient.get<OAuthInitiateResponse>(
      `/oauth/initiate?provider=${encodeURIComponent(provider)}`
    );
    return response.data;
  },

  /**
   * Initiate connection for an OAuth tool.
   * Calls the initiate endpoint to store user ID in session and get Spring's OAuth URL,
   * then redirects the browser to begin the OAuth flow.
   *
   * @param provider The OAuth provider (e.g., 'github', 'jira')
   */
  async initiateOAuthConnection(provider: string): Promise<void> {
    const { authUrl } = await this.initiateOAuth(provider);
    window.location.href = authUrl;
  },

  /**
   * Initiate connection for a tool using the connectUrl from backend
   * Redirects browser to OAuth provider or custom auth URL
   * @deprecated Use initiateOAuthConnection for OAuth tools instead
   */
  initiateConnection(connectUrl: string): void {
    window.location.href = connectUrl;
  },

  /**
   * Register a Personal Access Token for a tool
   * POST /planner/api/v1/tools/pat/{clientRegistrationId}
   */
  async registerPAT(request: RegisterPATRequest): Promise<void> {
    // Backend expects full RegisterPATRequest in body (client, token, domain)
    await toolsApiClient.post(`/pat/${request.client}`, request);
  },

  /**
   * Disconnect a tool (delete PAT or OAuth token)
   * DELETE /planner/api/v1/tools/pat/{clientRegistrationId}/{externalAccountId}
   *
   * @param clientRegistrationId The provider identifier (e.g., "github", "bitbucket")
   * @param externalAccountId External account ID to disconnect (required for multi-account support)
   */
  async disconnectTool(clientRegistrationId: string, externalAccountId: string): Promise<void> {
    await toolsApiClient.delete(`/pat/${clientRegistrationId}/${encodeURIComponent(externalAccountId)}`);
  },

  /**
   * Validate PAT credentials before saving
   * POST /planner/api/v1/tools/pat/{clientRegistrationId}/validate
   */
  async validatePAT(request: RegisterPATRequest): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await toolsApiClient.post<{ valid: boolean; error?: string }>(
        `/pat/${request.client}/validate`,
        {
          token: request.token,
          domain: request.domain,
        }
      );
      return response.data;
    } catch {
      return { valid: false, error: 'Failed to validate credentials' };
    }
  },

  /**
   * Update the display order of connected tools
   * PUT /planner/api/v1/tools/order
   */
  async updateToolOrder(request: UpdateToolOrderRequest): Promise<ToolOrderResponse> {
    console.log('ToolService.updateToolOrder - sending request:', JSON.stringify(request));
    const response = await toolsApiClient.put<ToolOrderResponse>('/order', request);
    console.log('ToolService.updateToolOrder - response:', response);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update tool order');
    }
    return response.data;
  },
};
