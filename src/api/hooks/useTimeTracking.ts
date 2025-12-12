// Clean Architecture - Time Tracking Hooks with Service Layer
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TimeTrackingService,
  type CreateTimeTrackingRequest,
  type TimeBookingRequest,
  type TimeTrackingDto
} from '@/api/services/TimeTrackingService';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';

// Query for loading time trackings
export const useTimeTrackingsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['timetracking', 'list'],
    queryFn: async () => {
      const response = await TimeTrackingService.getTimeTrackings();
      if (response.success) {
        return response.data;
      }
      // Handle 404 as empty array (backend returns 404 when no time trackings exist)
      if (response.error?.includes('404')) {
        return [];
      }
      throw new Error(response.error || 'Failed to fetch time trackings');
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutation for creating/updating time tracking
export const useCreateTimeTrackingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTimeTrackingRequest) => {
      const response = await TimeTrackingService.createOrUpdateTimeTracking(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create time tracking');
    },
    onSuccess: () => {
      // Invalidate time trackings list
      queryClient.invalidateQueries({ queryKey: ['timetracking', 'list'] });
    },
  });
};

// Mutation for deleting time tracking
export const useDeleteTimeTrackingMutation = () => {
  const queryClient = useQueryClient();
  const removeTimeTrackingLocally = useBackendTimeTrackingStore(state => state.removeTimeTrackingLocally);

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await TimeTrackingService.deleteTimeTracking(uuid);
      if (!response.success && response.error) {
        throw new Error(response.error);
      }
      return uuid; // Return the uuid so we can use it in onMutate/onSuccess
    },
    onMutate: async (uuid: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['timetracking', 'list'] });

      // Snapshot the previous value
      const previousTrackings = queryClient.getQueryData<TimeTrackingDto[]>(['timetracking', 'list']);

      // Optimistically update React Query cache
      if (previousTrackings) {
        queryClient.setQueryData<TimeTrackingDto[]>(
          ['timetracking', 'list'],
          previousTrackings.filter(t => t.uuid !== uuid)
        );
      }

      // Also optimistically update Zustand store (which persists to localStorage)
      removeTimeTrackingLocally(uuid);

      return { previousTrackings };
    },
    onError: (_err, _uuid, context) => {
      // Rollback on error
      if (context?.previousTrackings) {
        queryClient.setQueryData(['timetracking', 'list'], context.previousTrackings);
        // Also restore Zustand store from previous data
        useBackendTimeTrackingStore.getState().setTimeTrackings(context.previousTrackings);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['timetracking', 'list'] });
    },
  });
};

// Mutation for bulk deleting time trackings
export const useDeleteMultipleTimeTrackingsMutation = () => {
  const queryClient = useQueryClient();
  const removeTimeTrackingLocally = useBackendTimeTrackingStore(state => state.removeTimeTrackingLocally);

  return useMutation({
    mutationFn: async (uuids: string[]) => {
      const response = await TimeTrackingService.deleteMultipleTimeTrackings(uuids);
      if (!response.success && response.error) {
        throw new Error(response.error);
      }
      return uuids; // Return the uuids so we can use them
    },
    onMutate: async (uuids: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['timetracking', 'list'] });

      // Snapshot the previous value
      const previousTrackings = queryClient.getQueryData<TimeTrackingDto[]>(['timetracking', 'list']);

      // Optimistically update React Query cache
      if (previousTrackings) {
        const uuidSet = new Set(uuids);
        queryClient.setQueryData<TimeTrackingDto[]>(
          ['timetracking', 'list'],
          previousTrackings.filter(t => !uuidSet.has(t.uuid))
        );
      }

      // Also optimistically update Zustand store (which persists to localStorage)
      uuids.forEach(uuid => removeTimeTrackingLocally(uuid));

      return { previousTrackings };
    },
    onError: (_err, _uuids, context) => {
      // Rollback on error
      if (context?.previousTrackings) {
        queryClient.setQueryData(['timetracking', 'list'], context.previousTrackings);
        // Also restore Zustand store from previous data
        useBackendTimeTrackingStore.getState().setTimeTrackings(context.previousTrackings);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['timetracking', 'list'] });
    },
  });
};

// Mutation for booking time
export const useBookTimeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TimeBookingRequest) => {
      const response = await TimeTrackingService.bookTime(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to book time');
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['timetracking'] });
    },
  });
};