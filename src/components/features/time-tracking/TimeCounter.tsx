import React, { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { theme }    from '@/components';

interface TimeCounterProps {
  startTime?: string;
  isActive?: boolean;
  isPaused?: boolean;
  pausedElapsedTime?: number; // Accumulated time in seconds when paused
  size?: 'small' | 'medium' | 'large';
  showSeconds?: boolean;
}

export const TimeCounter: React.FC<TimeCounterProps> = ({
  startTime,
  isActive = false,
  isPaused = false,
  pausedElapsedTime = 0,
  size = 'medium',
  showSeconds = true
}) => {
  const [elapsedTime, setElapsedTime] = useState(pausedElapsedTime);
  const [colonVisible, setColonVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const colonIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time when running
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isActive && !isPaused && startTime) {
      const startTimestamp = DateTime.fromISO(startTime).toMillis();

      const updateElapsedTime = () => {
        const currentElapsed = (DateTime.now().toMillis() - startTimestamp) / 1000;
        setElapsedTime(pausedElapsedTime + currentElapsed);
      };

      updateElapsedTime(); // Initial update
      intervalRef.current = setInterval(updateElapsedTime, 1000);
    } else if (isPaused) {
      // When paused, show the pausedElapsedTime
      setElapsedTime(pausedElapsedTime);
    } else if (!isActive) {
      setElapsedTime(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, startTime, pausedElapsedTime]);

  // Colon blinking animation when active and not paused
  useEffect(() => {
    if (isActive && !isPaused) {
      colonIntervalRef.current = setInterval(() => {
        setColonVisible(prev => !prev);
      }, 500);
    } else {
      if (colonIntervalRef.current) {
        clearInterval(colonIntervalRef.current);
        colonIntervalRef.current = null;
      }
      setColonVisible(true); // Always show colon when not active
    }

    return () => {
      if (colonIntervalRef.current) {
        clearInterval(colonIntervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const formatTimeParts = () => {
    const totalSeconds = Math.max(0, Math.floor(elapsedTime));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return '1.5rem';
      case 'large': return '3rem';
      default: return '2rem';
    }
  };

  const { hours, minutes, seconds } = formatTimeParts();

  return (
    <div
      className="font-inria tracking-widest select-none"
      style={{
        fontSize: getFontSize(),
        color: isActive ? theme.primary : theme.primaryLight,
      }}
    >
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
      {showSeconds && (
        <>
          <span
            style={{
              opacity: colonVisible ? 1 : 0,
              transition: 'opacity 0.1s ease-in-out'
            }}
          >
            :
          </span>
          <span>{seconds}</span>
        </>
      )}
      {isPaused && (
        <span className="ml-2 text-sm text-yellow-500 dark:text-yellow-400">(paused)</span>
      )}
    </div>
  );
};