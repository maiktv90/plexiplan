// Clean Architecture - Time Tracking Widget Feature Component
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate }                                                     from 'react-router-dom';
import { Play, Pause, Square, ChevronRightSquare } from 'lucide-react';
import { DateTime }                                                        from 'luxon';
import { useBackendTimeTrackingStore, useTimeTrackingActions } from '@/stores/useBackendTimeTrackingStore';
import { useCreateTimeTrackingMutation, useTimeTrackingsQuery } from '@/api/hooks/useTimeTracking';
import { Card } from '@/components/ui/Card';
import { IconButtonStyled, ButtonWrapper } from '@/components/features/time-tracking/styles.tracking';

export const TimeTrackingWidget: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [currentTimer, setCurrentTimer] = useState(0);
  const [colonVisible, setColonVisible] = useState(true);
  const colonIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isTimeTrackingActive,
    activeTracking,
    todaysTotalTime,
    setTimeTrackings,
    addTimeTrackingLocally,
    updateActiveTrackingLocally,
    // Global pause state from store
    isPaused,
    pausedElapsedSeconds,
    lastResumeTime,
    setPauseState,
    resetPauseState
  } = useBackendTimeTrackingStore();

  const { createNewTimeTracking } = useTimeTrackingActions();
  
  // API calls
  const { data: fetchedTimeTrackings } = useTimeTrackingsQuery();
  const createTimeTrackingMutation = useCreateTimeTrackingMutation();

  // Update store when data is fetched (including empty arrays)
  useEffect(() => {
    if (fetchedTimeTrackings !== undefined) {
      setTimeTrackings(fetchedTimeTrackings ?? []);
    }
  }, [fetchedTimeTrackings, setTimeTrackings]);

  // Get the effective start time (either original or resume time from store)
  const getEffectiveStartTime = () => {
    if (lastResumeTime) {
      return lastResumeTime;
    }
    return activeTracking?.start;
  };

  // Timer effect - same logic as the main time tracking page
  useEffect(() => {
    // Calculate elapsed time based on pause state
    const calculateElapsedTime = () => {
      if (isPaused) {
        return pausedElapsedSeconds;
      }
      if (isTimeTrackingActive && activeTracking) {
        const startTime = getEffectiveStartTime();
        if (startTime) {
          const start = DateTime.fromISO(startTime);
          const currentSessionElapsed = DateTime.now().diff(start, 'seconds').seconds;
          return pausedElapsedSeconds + currentSessionElapsed;
        }
      }
      return 0;
    };

    // Immediately calculate and set the current time
    setCurrentTimer(Math.floor(calculateElapsedTime()));

    const interval = setInterval(() => {
      setCurrentTimer(Math.floor(calculateElapsedTime()));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimeTrackingActive, activeTracking, isPaused, pausedElapsedSeconds, lastResumeTime]);

  // Colon blinking animation when timer is active and not paused
  useEffect(() => {
    if (isTimeTrackingActive && !isPaused) {
      colonIntervalRef.current = setInterval(() => {
        setColonVisible(prev => !prev);
      }, 500);
    } else {
      if (colonIntervalRef.current) {
        clearInterval(colonIntervalRef.current);
        colonIntervalRef.current = null;
      }
      setColonVisible(true); // Always show colon when not active or paused
    }

    return () => {
      if (colonIntervalRef.current) {
        clearInterval(colonIntervalRef.current);
      }
    };
  }, [isTimeTrackingActive, isPaused]);

  const formatTimeParts = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
    };
  };

  const formatTimeShort = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    const taskDescription = description.trim() || 'Untitled Task';
    const newTracking = createNewTimeTracking(taskDescription);

    // Reset pause state in store
    resetPauseState();

    // Optimistically update UI
    addTimeTrackingLocally(newTracking);

    // Create on backend with pause fields
    createTimeTrackingMutation.mutate({
      uuid: newTracking.uuid,
      start: newTracking.start,
      task: newTracking.task ?? { name: taskDescription },
      isPaused: false,
      pausedElapsedSeconds: 0,
      lastResumeTime: null
    }, {
      onSuccess: (backendTracking) => {
        updateActiveTrackingLocally(backendTracking);
        setDescription('');
      }
    });
  };

  const cropSeconds = (dateTime: DateTime) => {
    return dateTime.set({ second: 0, millisecond: 0 });
  };

  const handleStopTimer = () => {
    if (!activeTracking) return;

    const now = DateTime.now();
    const stop = cropSeconds(now).toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");

    // Calculate total elapsed time including paused periods
    let totalElapsedSeconds = pausedElapsedSeconds;

    if (!isPaused) {
      // Add current running session time
      const startTime = lastResumeTime || activeTracking.start;
      const start = DateTime.fromISO(startTime);
      const currentSessionElapsed = now.diff(start, 'seconds').seconds;
      totalElapsedSeconds += currentSessionElapsed;
    }

    // Calculate the effective start time based on total elapsed
    const effectiveStart = cropSeconds(now.minus({ seconds: totalElapsedSeconds }))
      .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");

    // Update backend with pause fields cleared
    createTimeTrackingMutation.mutate({
      uuid: activeTracking.uuid,
      start: effectiveStart,
      end: stop,
      task: activeTracking.task ?? { name: 'Untitled Task' },
      isPaused: false,
      pausedElapsedSeconds: 0,
      lastResumeTime: null
    }, {
      onSuccess: () => {
        // Reset pause state in store
        resetPauseState();
      }
    });

    // Update UI - use stopActiveTracking but with effective start
    const stoppedTracking = { ...activeTracking, start: effectiveStart, end: stop, isActive: false };
    updateActiveTrackingLocally(stoppedTracking);
  };

  const handlePause = () => {
    if (!activeTracking || isPaused) return;

    // Calculate elapsed time so far
    const startTime = lastResumeTime || activeTracking.start;
    const start = DateTime.fromISO(startTime);
    const now = DateTime.now();
    const currentSessionElapsed = now.diff(start, 'seconds').seconds;

    // Calculate new total paused elapsed time
    const newPausedElapsedSeconds = pausedElapsedSeconds + currentSessionElapsed;

    // Update store
    setPauseState(true, newPausedElapsedSeconds, null);

    // Send to backend
    createTimeTrackingMutation.mutate({
      uuid: activeTracking.uuid,
      start: activeTracking.start,
      task: activeTracking.task ?? { name: 'Untitled Task' },
      isPaused: true,
      pausedElapsedSeconds: newPausedElapsedSeconds,
      lastResumeTime: null
    });
  };

  const handleResume = () => {
    if (!activeTracking || !isPaused) return;

    // Set new resume start time
    const now = DateTime.now();
    const resumeTime = now.toISO();

    // Update store
    setPauseState(false, pausedElapsedSeconds, resumeTime);

    // Send to backend
    createTimeTrackingMutation.mutate({
      uuid: activeTracking.uuid,
      start: activeTracking.start,
      task: activeTracking.task ?? { name: 'Untitled Task' },
      isPaused: false,
      pausedElapsedSeconds: pausedElapsedSeconds,
      lastResumeTime: resumeTime
    });
  };

  // Determine if we're in an active tracking session (started or paused)
  const hasActiveSession = isTimeTrackingActive || (activeTracking && isPaused);

  return (
    <Card className="transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Time Tracking
          </h3>
          <button
            onClick={() => navigate('/time-tracking')}
            className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Open Time Tracking"
          >
            <ChevronRightSquare className="w-5 h-5 text-gray-700 dark:text-gray-800" />
          </button>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          isTimeTrackingActive && !isPaused
            ? 'bg-green-500 animate-pulse'
            : isPaused
              ? 'bg-yellow-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`} />
      </div>

      <div className="space-y-4">
        {/* Current Session */}
        <div className="text-center">
          <div className={`text-3xl font-inria font-bold mb-2 tracking-wider ${hasActiveSession ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {(() => {
              const { hours, minutes } = formatTimeParts(currentTimer);
              return (
                <>
                  <span>{hours}</span>
                  <span
                    style={{
                      opacity: colonVisible ? 1 : 0,
                      transition: 'opacity 0.1s ease-in-out'
                    }}
                  >
                    :
                  </span>
                  <span>{minutes}</span>
                </>
              );
            })()}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasActiveSession
              ? (isPaused ? `${activeTracking?.task?.name || 'Current session'} (paused)` : (activeTracking?.task?.name || 'Current session'))
              : 'No active session'}
          </p>
        </div>

        {/* Today's Total */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-lg font-inria font-medium text-primary-600 dark:text-primary-400">
            {formatTimeShort(todaysTotalTime)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Today's total
          </p>
        </div>

        {/* Task Input (only show when not active and not paused) */}
        {!isTimeTrackingActive && !isPaused && (
          <div className="pt-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2">
          <ButtonWrapper>
            {!isTimeTrackingActive && !isPaused ? (
              <IconButtonStyled
                onClick={handleStartTimer}
                disabled={createTimeTrackingMutation.isPending}
                style={{ fontSize: '2rem' }}
              >
                <Play style={{ width: '2rem', height: '2rem' }} />
              </IconButtonStyled>
            ) : (
              <>
                {isPaused ? (
                  <IconButtonStyled
                    onClick={handleResume}
                    disabled={createTimeTrackingMutation.isPending}
                    style={{ fontSize: '1.75rem' }}
                  >
                    <Play style={{ width: '1.75rem', height: '1.75rem' }} />
                  </IconButtonStyled>
                ) : (
                  <IconButtonStyled
                    onClick={handlePause}
                    disabled={createTimeTrackingMutation.isPending}
                    style={{ fontSize: '1.75rem' }}
                  >
                    <Pause style={{ width: '1.75rem', height: '1.75rem' }} />
                  </IconButtonStyled>
                )}
                <button
                  onClick={handleStopTimer}
                  disabled={createTimeTrackingMutation.isPending}
                  className="p-2 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                  style={{ color: '#ef4444' }}
                >
                  <Square style={{ width: '1.75rem', height: '1.75rem' }} />
                </button>
              </>
            )}
          </ButtonWrapper>
        </div>

        {/* Error display */}
        {createTimeTrackingMutation.error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-400">
              Error: {createTimeTrackingMutation.error.message}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};