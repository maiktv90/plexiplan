import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToolService } from '../services/ToolService';
import type { RegisterPATRequest, UpdateToolOrderRequest } from '@/types/tool.types';

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

/**
 * Mutation hook to update tool display order with optimistic updates
 */
export const useUpdateToolOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateToolOrderRequest) => ToolService.updateToolOrder(request),
    // Optimistic update - update cache immediately before server response
    onMutate: async (request) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TOOL_KEYS.integrations() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(TOOL_KEYS.integrations());

      // Optimistically update the cache
      queryClient.setQueryData(TOOL_KEYS.integrations(), (old: { connectedTools: Array<{ clientKey: string; order?: number }>; availableTools: unknown[] } | undefined) => {
        if (!old) return old;

        // Create a map of clientKey -> new order
        const orderMap = new Map(request.toolOrders.map(t => [t.clientKey, t.order]));

        // Update the order for each connected tool
        const updatedConnectedTools = old.connectedTools.map(tool => ({
          ...tool,
          order: orderMap.get(tool.clientKey) ?? tool.order,
        }));

        return {
          ...old,
          connectedTools: updatedConnectedTools,
        };
      });

      // Return context with previous data for rollback
      return { previousData };
    },
    // Rollback on error
    onError: (_err, _request, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(TOOL_KEYS.integrations(), context.previousData);
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TOOL_KEYS.integrations() });
    },
  });
};
