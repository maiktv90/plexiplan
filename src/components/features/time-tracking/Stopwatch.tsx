import React, { useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { DateTime } from 'luxon';
import { TimeCounter } from './TimeCounter';
import { ButtonWrapper, TrackingCard, IconButtonStyled } from './styles.tracking';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { useCreateTimeTrackingMutation } from '@/api/hooks/useTimeTracking';
import { v4 as uuid } from 'uuid';

export const Stopwatch: React.FC = () => {
  const {
    activeTracking,
    isTimeTrackingActive,
    setActiveTracking,
    // Global pause state from store
    isPaused,
    pausedElapsedSeconds,
    lastResumeTime,
    setPauseState,
    resetPauseState
  } = useBackendTimeTrackingStore();

  const createTimeTrackingMutation = useCreateTimeTrackingMutation();

  const [isLoading, setIsLoading] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');

  const cropSeconds = (dateTime: DateTime) => {
    return dateTime.set({ second: 0, millisecond: 0 });
  };

  // Get the effective start time (either original or resume time from store)
  const getEffectiveStartTime = () => {
    if (lastResumeTime) {
      return lastResumeTime;
    }
    return activeTracking?.start;
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const now = DateTime.now();
      const start = cropSeconds(now).toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");
      const trackingId = uuid();

      const trimmedDescription = taskDescription.trim();
      const request = {
        uuid: trackingId,
        start: start,
        task: {
          name: trimmedDescription || 'Untitled Task'
        },
        // Include pause fields (starting fresh)
        isPaused: false,
        pausedElapsedSeconds: 0,
        lastResumeTime: null
      };

      console.log('Creating time tracking with request:', request);

      createTimeTrackingMutation.mutate(request, {
        onSuccess: (data) => {
          if (data) {
            setActiveTracking(data);
            // Reset pause state in store
            resetPauseState();
          }
        }
      });
    } catch (error) {
      console.error('Failed to start time tracking:', error);
    } finally {
      setIsLoading(false);
    }
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
    const request = {
      uuid: activeTracking.uuid,
      start: activeTracking.start,
      task: activeTracking.task ?? { name: 'Untitled Task' },
      isPaused: true,
      pausedElapsedSeconds: newPausedElapsedSeconds,
      lastResumeTime: null
    };

    console.log('Pausing timer with request:', request);
    createTimeTrackingMutation.mutate(request);
  };

  const handleResume = () => {
    if (!activeTracking || !isPaused) return;

    // Set new resume start time - use full precision, don't crop seconds
    const now = DateTime.now();
    const resumeTime = now.toISO();

    // Update store
    setPauseState(false, pausedElapsedSeconds, resumeTime);

    // Send to backend
    const request = {
      uuid: activeTracking.uuid,
      start: activeTracking.start,
      task: activeTracking.task ?? { name: 'Untitled Task' },
      isPaused: false,
      pausedElapsedSeconds: pausedElapsedSeconds,
      lastResumeTime: resumeTime
    };

    console.log('Resuming timer with request:', request);
    createTimeTrackingMutation.mutate(request);
  };

  const handleStop = async () => {
    if (!activeTracking) return;

    setIsLoading(true);
    try {
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
      // This ensures the backend gets the correct duration
      const effectiveStart = cropSeconds(now.minus({ seconds: totalElapsedSeconds }))
        .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");

      const request = {
        uuid: activeTracking.uuid,
        start: effectiveStart,
        end: stop,
        task: activeTracking.task ?? { name: 'Untitled Task' },
        // Clear pause state on stop
        isPaused: false,
        pausedElapsedSeconds: 0,
        lastResumeTime: null
      };

      console.log('Stopping time tracking with request:', request);
      console.log('Total elapsed time:', totalElapsedSeconds, 'seconds');

      createTimeTrackingMutation.mutate(request, {
        onSuccess: () => {
          setActiveTracking(null);
          setTaskDescription('');
          // Reset pause state in store
          resetPauseState();
        }
      });
    } catch (error) {
      console.error('Failed to stop time tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TrackingCard>
      <div style={{ textAlign: 'center' }}>
        <TimeCounter
          startTime={getEffectiveStartTime()}
          isActive={isTimeTrackingActive && !isPaused}
          isPaused={isPaused}
          pausedElapsedTime={pausedElapsedSeconds}
          size="large"
          showSeconds={false}
        />

        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={taskDescription || activeTracking?.task?.name || ''}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="What are you working on?"
            disabled={isTimeTrackingActive || isPaused}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-inria focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <ButtonWrapper>
          {!isTimeTrackingActive && !isPaused ? (
            <IconButtonStyled
              onClick={handleStart}
              disabled={isLoading}
              aria-label="Start timer"
              style={{ fontSize: '3rem' }}
            >
              <Play style={{ width: '3rem', height: '3rem' }} />
            </IconButtonStyled>
          ) : (
            <>
              {isPaused ? (
                <IconButtonStyled
                  onClick={handleResume}
                  disabled={isLoading}
                  aria-label="Resume timer"
                  style={{ fontSize: '2.5rem' }}
                >
                  <Play style={{ width: '2.5rem', height: '2.5rem' }} />
                </IconButtonStyled>
              ) : (
                <IconButtonStyled
                  onClick={handlePause}
                  disabled={isLoading}
                  aria-label="Pause timer"
                  style={{ fontSize: '2.5rem' }}
                >
                  <Pause style={{ width: '2.5rem', height: '2.5rem' }} />
                </IconButtonStyled>
              )}
              <button
                onClick={handleStop}
                disabled={isLoading}
                aria-label="Stop timer"
                className="p-2 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                style={{ color: '#ef4444' }}
              >
                <Square style={{ width: '2.5rem', height: '2.5rem' }} />
              </button>
            </>
          )}
        </ButtonWrapper>
      </div>
    </TrackingCard>
  );
};