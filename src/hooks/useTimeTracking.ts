import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';

export const useTimeTracking = () => {
  return useBackendTimeTrackingStore();
};