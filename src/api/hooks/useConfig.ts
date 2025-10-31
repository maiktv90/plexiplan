// Clean Architecture - Config Hooks with Service Layer
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ConfigService, 
  type CreateConfigParams, 
  type UpdateConfigParams 
} from '../services/ConfigService';

export const useToolConfigQuery = (clientRegistrationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['config', 'tool', clientRegistrationId],
    queryFn: async () => {
      const response = await ConfigService.getToolConfig(clientRegistrationId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch tool config');
    },
    enabled: enabled && !!clientRegistrationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllConfigsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['config', 'all'],
    queryFn: async () => {
      const response = await ConfigService.getAllConfigs();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch all configs');
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

export const useCreateConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateConfigParams) => {
      const response = await ConfigService.createConfig(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create config');
    },
    onSuccess: (data, variables) => {
      // Add to cache and invalidate lists
      queryClient.setQueryData(['config', 'tool', variables.clientRegistrationId], data);
      queryClient.invalidateQueries({ queryKey: ['config', 'all'] });
    },
  });
};

export const useUpdateConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateConfigParams) => {
      const response = await ConfigService.updateConfig(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to update config');
    },
    onSuccess: (data, variables) => {
      // Update in cache
      queryClient.setQueryData(['config', 'tool', variables.clientRegistrationId], data);
      queryClient.invalidateQueries({ queryKey: ['config', 'all'] });
    },
  });
};

export const useDeleteConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientRegistrationId: string) => {
      const response = await ConfigService.deleteConfig(clientRegistrationId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to delete config');
    },
    onSuccess: (_, clientRegistrationId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['config', 'tool', clientRegistrationId] });
      queryClient.invalidateQueries({ queryKey: ['config', 'all'] });
    },
  });
};

export const useToggleConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientRegistrationId, enabled }: { clientRegistrationId: string; enabled: boolean }) => {
      const response = await ConfigService.toggleConfigStatus(clientRegistrationId, enabled);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to toggle config status');
    },
    onSuccess: (data, variables) => {
      // Update in cache
      queryClient.setQueryData(['config', 'tool', variables.clientRegistrationId], data);
      queryClient.invalidateQueries({ queryKey: ['config', 'all'] });
    },
  });
};

export const useResetConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientRegistrationId: string) => {
      const response = await ConfigService.resetConfig(clientRegistrationId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to reset config');
    },
    onSuccess: (data, clientRegistrationId) => {
      // Update in cache
      queryClient.setQueryData(['config', 'tool', clientRegistrationId], data);
      queryClient.invalidateQueries({ queryKey: ['config', 'all'] });
    },
  });
};

export const useValidateConfigMutation = () => {
  return useMutation({
    mutationFn: async ({ clientRegistrationId, settings }: { clientRegistrationId: string; settings: Record<string, unknown> }) => {
      const response = await ConfigService.validateConfig(clientRegistrationId, settings);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to validate config');
    },
  });
};