import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { useCreateTimeTrackingMutation, useDeleteTimeTrackingMutation, useDeleteMultipleTimeTrackingsMutation } from '@/api/hooks/useTimeTracking';
import type { CreateTimeTrackingRequest, TimeTrackingDto } from '@/api/services/TimeTrackingService';

// Optimistic versions of the mutation hooks that provide immediate UI feedback
export const useOptimisticTimeTracking = () => {
  const store = useBackendTimeTrackingStore();
  const createMutation = useCreateTimeTrackingMutation();
  const deleteMutation = useDeleteTimeTrackingMutation();
  const bulkDeleteMutation = useDeleteMultipleTimeTrackingsMutation();

  const createOptimistic = (request: CreateTimeTrackingRequest) => {
    // Create optimistic tracking object
    const optimisticTracking = {
      uuid: request.uuid || '',
      start: request.start,
      end: request.end,
      isActive: !request.end,
      task: request.task
    };

    // Immediate UI update
    store.createTimeTrackingOptimistic(optimisticTracking);

    // If online, make the actual API call
    if (store.isOnline) {
      createMutation.mutate(request, {
        onError: (error: Error) => {
          console.error('Create failed, reverting optimistic update:', error);
          // Revert optimistic update on error
          store.removeTimeTrackingLocally(optimisticTracking.uuid);
        },
        onSuccess: (data: TimeTrackingDto | undefined) => {
          if (data) {
            // Update with server response (may have different data)
            store.updateActiveTrackingLocally(data);
          }
        }
      });
    }
  };

  const deleteOptimistic = (uuid: string) => {
    // Store original tracking for potential revert
    const originalTracking = store.timeTrackings.find(t => t.uuid === uuid);
    
    // Immediate UI update
    store.deleteTimeTrackingOptimistic(uuid);

    // If online, make the actual API call
    if (store.isOnline) {
      deleteMutation.mutate(uuid, {
        onError: (error: Error) => {
          console.error('Delete failed, reverting optimistic update:', error);
          // Revert optimistic update on error
          if (originalTracking) {
            store.addTimeTrackingLocally(originalTracking);
          }
        }
      });
    }
  };

  const bulkDeleteOptimistic = (uuids: string[]) => {
    // Store original trackings for potential revert
    const originalTrackings = store.timeTrackings.filter(t => uuids.includes(t.uuid));
    
    // Immediate UI update
    uuids.forEach(uuid => store.deleteTimeTrackingOptimistic(uuid));

    // If online, make the actual API call
    if (store.isOnline) {
      bulkDeleteMutation.mutate(uuids, {
        onError: (error: Error) => {
          console.error('Bulk delete failed, reverting optimistic updates:', error);
          // Revert optimistic updates on error
          originalTrackings.forEach(tracking => {
            store.addTimeTrackingLocally(tracking);
          });
        }
      });
    }
  };

  return {
    createOptimistic,
    deleteOptimistic,
    bulkDeleteOptimistic,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
};