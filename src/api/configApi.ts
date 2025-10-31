import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiConfigBaseUrl } from '../config/global.config';

interface CreateOrUpdateConfigArgs {
  csrf: string;
  body: unknown;
  clientKey: string;
}

// Fetch functions
const fetchToolConfig = (clientRegistrationId: string) =>
  fetch(`${apiConfigBaseUrl}/${clientRegistrationId}`).then(res => res.json());

const createOrUpdateConfig = ({ clientKey, body, csrf }: CreateOrUpdateConfigArgs) =>
  fetch(`${apiConfigBaseUrl}/${clientKey}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': csrf 
    },
    body: JSON.stringify(body),
  }).then(res => res.json());

// React Query hooks
export const useGetToolConfigQuery = (clientRegistrationId: string, enabled = true) =>
  useQuery({
    queryKey: ['toolConfig', clientRegistrationId],
    queryFn: () => fetchToolConfig(clientRegistrationId),
    enabled
  });

export const useCreateOrUpdateConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrUpdateConfig,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toolConfig', variables.clientKey] });
    },
  });
};

export const invalidateConfigApiCache = () => {
  console.warn('invalidateConfigApiCache needs to be called within a React component with useQueryClient');
};
