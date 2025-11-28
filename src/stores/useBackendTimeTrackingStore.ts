import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import type { TimeTrackingDto } from '@/api/services/TimeTrackingService';

// Offline queue types
interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  retries: number;
}

interface OfflineState {
  isOnline: boolean;
  queue: QueuedAction[];
  isSyncing: boolean;
}

interface BackendTimeTrackingState extends OfflineState {
  // Current active tracking
  activeTracking: TimeTrackingDto | null;

  // All time trackings
  timeTrackings: TimeTrackingDto[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Computed properties
  isTimeTrackingActive: boolean;
  todaysTotalTime: number; // in seconds

  // Pause state (global, synced with backend)
  isPaused: boolean;
  pausedElapsedSeconds: number;
  lastResumeTime: string | null;

  // Actions
  setActiveTracking: (tracking: TimeTrackingDto | null) => void;
  setTimeTrackings: (trackings: TimeTrackingDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Pause actions
  setPauseState: (isPaused: boolean, pausedElapsedSeconds: number, lastResumeTime: string | null) => void;
  resetPauseState: () => void;

  // Offline queue actions
  setOnlineStatus: (isOnline: boolean) => void;
  addToQueue: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => void;
  removeFromQueue: (actionId: string) => void;
  setSyncing: (syncing: boolean) => void;
  processQueue: () => Promise<void>;

  // Optimistic update actions
  createTimeTrackingOptimistic: (tracking: TimeTrackingDto) => void;
  updateTimeTrackingOptimistic: (tracking: TimeTrackingDto) => void;
  deleteTimeTrackingOptimistic: (uuid: string) => void;

  // Business logic actions (these will be called from components using the API hooks)
  updateActiveTrackingLocally: (tracking: TimeTrackingDto) => void;
  addTimeTrackingLocally: (tracking: TimeTrackingDto) => void;
  removeTimeTrackingLocally: (uuid: string) => void;
}

// Helper functions
const getTodaysTotalTime = (trackings: TimeTrackingDto[]): number => {
  const today = DateTime.now().toISODate();
  
  return trackings
    .filter(tracking => {
      const trackingDate = DateTime.fromISO(tracking.start).toISODate();
      return trackingDate === today && tracking.end; // Only count completed trackings
    })
    .reduce((total, tracking) => {
      const start = DateTime.fromISO(tracking.start);
      const end = DateTime.fromISO(tracking.end!);
      return total + end.diff(start, 'seconds').seconds;
    }, 0);
};

const getActiveTracking = (trackings: TimeTrackingDto[]): TimeTrackingDto | null => {
  return trackings.find(tracking => tracking.isActive) || null;
};

export const useBackendTimeTrackingStore = create<BackendTimeTrackingState>()(
  devtools(
    persist(
      (set, get) => ({
        activeTracking: null,
        timeTrackings: [],
        isLoading: false,
        error: null,
        isTimeTrackingActive: false,
        todaysTotalTime: 0,

        // Pause state
        isPaused: false,
        pausedElapsedSeconds: 0,
        lastResumeTime: null,

        // Offline state
        isOnline: navigator.onLine,
        queue: [],
        isSyncing: false,

        setActiveTracking: (tracking) => set({
          activeTracking: tracking,
          isTimeTrackingActive: tracking !== null && tracking.isActive,
          // Also update pause state from tracking
          isPaused: tracking?.isPaused ?? false,
          pausedElapsedSeconds: tracking?.pausedElapsedSeconds ?? 0,
          lastResumeTime: tracking?.lastResumeTime ?? null,
        }),

        setTimeTrackings: (trackings) => {
          const currentState = get();
          const activeTracking = getActiveTracking(trackings);
          const todaysTotalTime = getTodaysTotalTime(trackings);

          // Check if active tracking changed (different UUID or no active tracking)
          const activeTrackingChanged =
            currentState.activeTracking?.uuid !== activeTracking?.uuid;

          // Only sync pause state from backend if it provides values,
          // otherwise preserve local pause state (for when backend doesn't support pause yet)
          // If active tracking changed, reset pause state
          let isPaused = currentState.isPaused;
          let pausedElapsedSeconds = currentState.pausedElapsedSeconds;
          let lastResumeTime = currentState.lastResumeTime;

          if (activeTrackingChanged) {
            // New active tracking or no active tracking - use backend values or reset
            isPaused = activeTracking?.isPaused ?? false;
            pausedElapsedSeconds = activeTracking?.pausedElapsedSeconds ?? 0;
            lastResumeTime = activeTracking?.lastResumeTime ?? null;
          }
          // When same active tracking, preserve local pause state
          // Local state is more recent than backend response during pause/resume operations

          set({
            timeTrackings: trackings,
            activeTracking,
            isTimeTrackingActive: !!activeTracking,
            todaysTotalTime,
            isPaused,
            pausedElapsedSeconds,
            lastResumeTime
          });
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Pause actions
        setPauseState: (isPaused, pausedElapsedSeconds, lastResumeTime) => set({
          isPaused,
          pausedElapsedSeconds,
          lastResumeTime
        }),

        resetPauseState: () => set({
          isPaused: false,
          pausedElapsedSeconds: 0,
          lastResumeTime: null
        }),

        updateActiveTrackingLocally: (updatedTracking) => {
          const { timeTrackings } = get();
          
          // If this tracking exists, update it; if not, add it
          const existingIndex = timeTrackings.findIndex(tracking => tracking.uuid === updatedTracking.uuid);
          let updatedTrackings;
          
          if (existingIndex !== -1) {
            updatedTrackings = timeTrackings.map(tracking => 
              tracking.uuid === updatedTracking.uuid ? updatedTracking : tracking
            );
          } else {
            updatedTrackings = [...timeTrackings, updatedTracking];
          }
          
          const activeTracking = getActiveTracking(updatedTrackings);
          const todaysTotalTime = getTodaysTotalTime(updatedTrackings);
          
          set({
            timeTrackings: updatedTrackings,
            activeTracking,
            isTimeTrackingActive: !!activeTracking,
            todaysTotalTime
          });
        },

        addTimeTrackingLocally: (newTracking) => {
          const { timeTrackings } = get();
          const updatedTrackings = [...timeTrackings, newTracking];
          
          const activeTracking = getActiveTracking(updatedTrackings);
          const todaysTotalTime = getTodaysTotalTime(updatedTrackings);
          
          set({
            timeTrackings: updatedTrackings,
            activeTracking,
            isTimeTrackingActive: !!activeTracking,
            todaysTotalTime
          });
        },

        removeTimeTrackingLocally: (uuid) => {
          const { timeTrackings } = get();
          const updatedTrackings = timeTrackings.filter(tracking => tracking.uuid !== uuid);
          
          const activeTracking = getActiveTracking(updatedTrackings);
          const todaysTotalTime = getTodaysTotalTime(updatedTrackings);
          
          set({
            timeTrackings: updatedTrackings,
            activeTracking,
            isTimeTrackingActive: !!activeTracking,
            todaysTotalTime
          });
        },

        // Offline queue management
        setOnlineStatus: (isOnline) => {
          set({ isOnline });
          if (isOnline) {
            // Process queue when coming back online
            const { processQueue } = get();
            processQueue();
          }
        },

        addToQueue: (action) => {
          const { queue } = get();
          const queuedAction: QueuedAction = {
            id: uuidv4(),
            timestamp: DateTime.now().toISO(),
            retries: 0,
            ...action
          };
          
          set({ queue: [...queue, queuedAction] });
        },

        removeFromQueue: (actionId) => {
          const { queue } = get();
          set({ queue: queue.filter(action => action.id !== actionId) });
        },

        setSyncing: (syncing) => set({ isSyncing: syncing }),

        processQueue: async () => {
          const { queue, isOnline, isSyncing } = get();
          
          if (!isOnline || isSyncing || queue.length === 0) return;
          
          set({ isSyncing: true });
          
          try {
            // Import the service dynamically to avoid circular imports
            const { TimeTrackingService } = await import('@/api/services/TimeTrackingService');
            
            for (const action of [...queue]) {
              try {
                let success = false;
                
                switch (action.type) {
                  case 'create':
                  case 'update':
                    const response = await TimeTrackingService.createOrUpdateTimeTracking(action.payload);
                    success = response.success;
                    if (success && response.data) {
                      get().updateActiveTrackingLocally(response.data);
                    }
                    break;
                  case 'delete':
                    if (Array.isArray(action.payload)) {
                      const deleteResponse = await TimeTrackingService.deleteMultipleTimeTrackings(action.payload);
                      success = deleteResponse.success;
                    } else {
                      const deleteResponse = await TimeTrackingService.deleteTimeTracking(action.payload);
                      success = deleteResponse.success;
                    }
                    break;
                }
                
                if (success) {
                  get().removeFromQueue(action.id);
                } else {
                  // Increment retry count
                  const { queue: currentQueue } = get();
                  const updatedQueue = currentQueue.map(qAction => 
                    qAction.id === action.id 
                      ? { ...qAction, retries: qAction.retries + 1 }
                      : qAction
                  );
                  set({ queue: updatedQueue });
                  
                  // Remove action if it has failed too many times (5 retries)
                  if (action.retries >= 5) {
                    get().removeFromQueue(action.id);
                  }
                }
              } catch (error) {
                console.error('Queue processing error:', error);
                // Don't remove from queue on error, will retry next time
              }
            }
          } finally {
            set({ isSyncing: false });
          }
        },

        // Optimistic update actions
        createTimeTrackingOptimistic: (tracking) => {
          const { isOnline, addToQueue, updateActiveTrackingLocally } = get();
          
          // Immediately update local state for optimistic UI
          updateActiveTrackingLocally(tracking);
          
          if (!isOnline) {
            // Add to queue for later sync
            addToQueue({
              type: 'create',
              payload: tracking
            });
          }
        },

        updateTimeTrackingOptimistic: (tracking) => {
          const { isOnline, addToQueue, updateActiveTrackingLocally } = get();
          
          // Immediately update local state for optimistic UI
          updateActiveTrackingLocally(tracking);
          
          if (!isOnline) {
            // Add to queue for later sync
            addToQueue({
              type: 'update',
              payload: tracking
            });
          }
        },

        deleteTimeTrackingOptimistic: (uuid) => {
          const { isOnline, addToQueue, removeTimeTrackingLocally } = get();
          
          // Immediately update local state for optimistic UI
          removeTimeTrackingLocally(uuid);
          
          if (!isOnline) {
            // Add to queue for later sync
            addToQueue({
              type: 'delete',
              payload: uuid
            });
          }
        },
      }),
      {
        name: 'backend-time-tracking-storage',
        partialize: (state) => ({
          // Only persist essential data, not loading states
          timeTrackings: state.timeTrackings,
          activeTracking: state.activeTracking,
          // Persist pause state
          isPaused: state.isPaused,
          pausedElapsedSeconds: state.pausedElapsedSeconds,
          lastResumeTime: state.lastResumeTime,
          // Persist offline queue for recovery after app restart
          queue: state.queue,
          isOnline: state.isOnline,
        }),
      }
    )
  )
);

// Helper hook for common time tracking operations
export const useTimeTrackingActions = () => {
  const store = useBackendTimeTrackingStore();

  const createNewTimeTracking = (taskName: string): TimeTrackingDto => {
    return {
      uuid: uuidv4(),
      start: DateTime.now().toISO(),
      isActive: true,
      task: {
        name: taskName,
      }
    };
  };

  const stopActiveTracking = (tracking: TimeTrackingDto): TimeTrackingDto => {
    return {
      ...tracking,
      end: DateTime.now().toISO(),
      isActive: false,
    };
  };

  const getCurrentActiveTime = (): number => {
    const { activeTracking } = store;
    if (!activeTracking) return 0;

    const start = DateTime.fromISO(activeTracking.start);
    const now = DateTime.now();
    return now.diff(start, 'seconds').seconds;
  };

  return {
    createNewTimeTracking,
    stopActiveTracking,
    getCurrentActiveTime,
  };
};