import React, { useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { DateTime } from 'luxon';
import { TimeCounter } from './TimeCounter';
import { ButtonWrapper, TrackingCard, IconButtonStyled } from './styles.tracking';
import { TimeTrackingService } from '@/api/services/TimeTrackingService';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { v4 as uuid } from 'uuid';

export const Stopwatch: React.FC = () => {
  const {
    activeTracking,
    isTimeTrackingActive,
    setActiveTracking,
    refreshTimeTrackings
  } = useBackendTimeTrackingStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');

  const cropSeconds = (dateTime: DateTime) => {
    return dateTime.set({ second: 0, millisecond: 0 });
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const now = DateTime.now();
      const start = cropSeconds(now).toISO();
      const trackingId = uuid();
      
      const request = {
        uuid: trackingId,
        start: start!,
        task: taskDescription ? {
          name: taskDescription
        } : undefined
      };

      const response = await TimeTrackingService.createOrUpdateTimeTracking(request);
      if (response.success && response.data) {
        setActiveTracking(response.data);
        await refreshTimeTrackings();
      }
    } catch (error) {
      console.error('Failed to start time tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeTracking) return;
    
    setIsLoading(true);
    try {
      const now = DateTime.now();
      const stop = cropSeconds(now).toISO();
      
      const request = {
        uuid: activeTracking.uuid,
        start: activeTracking.start,
        end: stop,
        task: activeTracking.task
      };

      const response = await TimeTrackingService.createOrUpdateTimeTracking(request);
      if (response.success) {
        setActiveTracking(null);
        setTaskDescription('');
        await refreshTimeTrackings();
      }
    } catch (error) {
      console.error('Failed to stop time tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    // For now, pause acts like stop
    // You can implement pause/resume logic if needed
    await handleStop();
  };

  return (
    <TrackingCard>
      <div style={{ textAlign: 'center' }}>
        <TimeCounter 
          startTime={activeTracking?.start}
          isActive={isTimeTrackingActive}
          size="large"
        />
        
        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="What are you working on?"
            disabled={isTimeTrackingActive}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'Inria Sans, sans-serif'
            }}
          />
        </div>
        
        <ButtonWrapper>
          {!isTimeTrackingActive ? (
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
              <IconButtonStyled
                onClick={handlePause}
                disabled={isLoading}
                aria-label="Pause timer"
                style={{ fontSize: '2.5rem' }}
              >
                <Pause style={{ width: '2.5rem', height: '2.5rem' }} />
              </IconButtonStyled>
              <IconButtonStyled
                onClick={handleStop}
                disabled={isLoading}
                aria-label="Stop timer"
                style={{ fontSize: '2.5rem', color: '#ef4444' }}
              >
                <Square style={{ width: '2.5rem', height: '2.5rem' }} />
              </IconButtonStyled>
            </>
          )}
        </ButtonWrapper>
      </div>
    </TrackingCard>
  );
};