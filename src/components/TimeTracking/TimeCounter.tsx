import React, { useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { TimeContainer } from './styles.tracking';

interface TimeCounterProps {
  startTime?: string;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
  showMillis?: boolean;
}

export const TimeCounter: React.FC<TimeCounterProps> = ({ 
  startTime, 
  isActive = false,
  size = 'medium',
  showMillis = false
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateElapsedTime = () => {
    setElapsedTime(DateTime.now().toUnixInteger() - startTimeRef.current);
  };

  useEffect(() => {
    if (isActive && startTime) {
      startTimeRef.current = DateTime.fromISO(startTime).toUnixInteger();
      intervalRef.current = setInterval(updateElapsedTime, showMillis ? 10 : 1000);
    } else if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedTime(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime, showMillis]);

  const formatTime = () => {
    const duration = DateTime.fromSeconds(elapsedTime).minus({ hour: 1 });
    if (showMillis) {
      return duration.toFormat('HH:mm:ss');
    }
    return duration.toFormat('HH:mm');
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return '1.5rem';
      case 'large': return '3rem';
      default: return '2rem';
    }
  };

  return (
    <TimeContainer $isActive={isActive} style={{ fontSize: getFontSize() }}>
      <p>{formatTime()}</p>
    </TimeContainer>
  );
};