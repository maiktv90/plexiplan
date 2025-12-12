import { useEffect } from 'react';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';

export const useOnlineStatus = () => {
  const { setOnlineStatus, isOnline, queue, isSyncing } = useBackendTimeTrackingStore();

  useEffect(() => {
    // Set initial status
    setOnlineStatus(navigator.onLine);

    const handleOnline = () => {
      console.log('🌐 Back online - processing queued actions');
      setOnlineStatus(true);
    };

    const handleOffline = () => {
      console.log('📴 Gone offline - queueing actions');
      setOnlineStatus(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return {
    isOnline,
    pendingActions: queue.length,
    isSyncing
  };
};