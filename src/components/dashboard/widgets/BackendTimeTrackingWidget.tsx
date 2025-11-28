import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBackendTimeTrackingStore, useTimeTrackingActions } from '@/stores/useBackendTimeTrackingStore';
import { 
  useTimeTrackingsQuery, 
  useCreateTimeTrackingMutation 
} from '@/api/hooks/useTimeTracking';

export const BackendTimeTrackingWidget: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeTracking,
    isTimeTrackingActive,
    todaysTotalTime,
    setTimeTrackings,
    updateActiveTrackingLocally,
    addTimeTrackingLocally
  } = useBackendTimeTrackingStore();

  const { createNewTimeTracking, stopActiveTracking, getCurrentActiveTime } = useTimeTrackingActions();
  
  const [description, setDescription] = useState('');
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);

  // Fetch time trackings
  const { data: timeTrackings, isLoading } = useTimeTrackingsQuery();
  
  // Mutation for creating/updating time tracking
  const createTimeTrackingMutation = useCreateTimeTrackingMutation();

  // Update store when data is fetched
  useEffect(() => {
    if (timeTrackings) {
      setTimeTrackings(timeTrackings);
    }
  }, [timeTrackings, setTimeTrackings]);

  // Update description from active tracking
  useEffect(() => {
    if (activeTracking?.task?.name && activeTracking.task.name !== 'Untitled Task') {
      setDescription(activeTracking.task.name);
    }
  }, [activeTracking]);

  // Timer effect for active tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimeTrackingActive && activeTracking) {
      const updateTimer = () => {
        const activeTime = getCurrentActiveTime();
        setCurrentElapsedTime(Math.floor(todaysTotalTime + activeTime));
      };

      updateTimer(); // Initial update
      interval = setInterval(updateTimer, 1000);
    } else {
      setCurrentElapsedTime(Math.floor(todaysTotalTime));
    }

    return () => clearInterval(interval);
  }, [isTimeTrackingActive, activeTracking, todaysTotalTime, getCurrentActiveTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const taskDescription = description.trim() || 'Untitled Task';
    const newTracking = createNewTimeTracking(taskDescription);
    
    console.log('🕐 Starting new tracking:', newTracking);
    
    // Optimistically update store
    addTimeTrackingLocally(newTracking);
    
    // Create on backend
    createTimeTrackingMutation.mutate({
      uuid: newTracking.uuid,
      start: newTracking.start,
      task: newTracking.task
    }, {
      onSuccess: (backendTracking) => {
        console.log('✅ Successfully created on backend:', backendTracking);
        // Update with backend response
        updateActiveTrackingLocally(backendTracking);
      },
      onError: (error) => {
        console.error('❌ Failed to create on backend:', error);
        // Could implement rollback here
      }
    });
  };

  const handleStop = () => {
    if (!activeTracking) return;
    
    const stoppedTracking = stopActiveTracking(activeTracking);
    
    console.log('🛑 Stopping tracking:', stoppedTracking);
    
    // Optimistically update store
    updateActiveTrackingLocally(stoppedTracking);
    
    // Update on backend
    createTimeTrackingMutation.mutate({
      uuid: stoppedTracking.uuid,
      start: stoppedTracking.start,
      end: stoppedTracking.end,
      task: stoppedTracking.task
    }, {
      onSuccess: (backendTracking) => {
        console.log('✅ Successfully stopped on backend:', backendTracking);
        updateActiveTrackingLocally(backendTracking);
      },
      onError: (error) => {
        console.error('❌ Failed to stop on backend:', error);
      }
    });

    setDescription('');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Time Tracking</h2>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <button
            onClick={() => navigate('/time-tracking')}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Open full time tracking"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white mb-2">
          {formatTime(currentElapsedTime)}
        </div>
        {description && isTimeTrackingActive && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isTimeTrackingActive ? 'Timer is running' : 'Timer is stopped'}
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isTimeTrackingActive}
        />

        <div className="flex justify-center space-x-2">
          {!isTimeTrackingActive ? (
            <button
              onClick={handleStart}
              disabled={createTimeTrackingMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400"
            >
              <Play className="h-4 w-4" />
              <span>{createTimeTrackingMutation.isPending ? 'Starting...' : 'Start'}</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={createTimeTrackingMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-400"
            >
              <Square className="h-4 w-4" />
              <span>{createTimeTrackingMutation.isPending ? 'Stopping...' : 'Stop'}</span>
            </button>
          )}
        </div>
      </div>

      {createTimeTrackingMutation.error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          Error: {createTimeTrackingMutation.error.message}
        </div>
      )}
    </div>
  );
};