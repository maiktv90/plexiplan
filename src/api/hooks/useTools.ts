import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToolService } from '../services/ToolService';
import type { RegisterPATRequest } from '@/types/tool.types';

/**
 * Query keys for tool-related queries
 */
export const TOOL_KEYS = {
  all: ['tools'] as const,
  integrations: () => [...TOOL_KEYS.all, 'integrations'] as const,
};

/**
 * Query hook to fetch all integrations (connected + available tools)
 */
export const useIntegrationsQuery = (enabled = true) => {
  return useQuery({
    queryKey: TOOL_KEYS.integrations(),
    queryFn: () => ToolService.getIntegrations(),
    staleTime: 60_000, // 1 minute
    enabled,
  });
};

/**
 * Mutation hook to register a PAT for a tool
 */
export const useRegisterPATMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RegisterPATRequest) => ToolService.registerPAT(request),
    onSuccess: () => {
      // Invalidate integrations to refetch connected/available tools
      queryClient.invalidateQueries({ queryKey: TOOL_KEYS.integrations() });
    },
  });
};

/**
 * Mutation hook to disconnect a tool
 */
export const useDisconnectToolMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientRegistrationId: string) => ToolService.disconnectTool(clientRegistrationId),
    onSuccess: () => {
      // Invalidate integrations to refetch connected/available tools
      queryClient.invalidateQueries({ queryKey: TOOL_KEYS.integrations() });
    },
  });
};

/**
 * Mutation hook to validate PAT credentials
 */
export const useValidatePATMutation = () => {
  return useMutation({
    mutationFn: (request: RegisterPATRequest) => ToolService.validatePAT(request),
  });
};

/**
 * Mutation hook to initiate OAuth connection for a tool.
 * This calls the backend to get an auth URL with encrypted state,
 * then redirects the browser to begin the OAuth flow.
 */
export const useInitiateOAuthMutation = () => {
  return useMutation({
    mutationFn: (provider: string) => ToolService.initiateOAuthConnection(provider),
  });
};

/**
 * Helper hook to initiate tool connection
 * Note: This triggers a browser redirect, not an async operation
 * @deprecated Use useInitiateOAuthMutation for OAuth tools instead
 */
export const useToolConnect = () => {
  return {
    connect: (connectUrl: string) => {
      ToolService.initiateConnection(connectUrl);
    },
  };
};

/**
 * @deprecated Use useInitiateOAuthMutation instead
 */
export const useOAuthConnect = useToolConnect;
