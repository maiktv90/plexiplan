import React, { useState, useEffect } from 'react';
import { Clock, Plus, Play, Calendar, Edit2, Trash2 } from 'lucide-react';
import { DateTime } from 'luxon';
import { useBackendTimeTrackingStore, useTimeTrackingActions } from '@/stores/useBackendTimeTrackingStore';
import { 
  useTimeTrackingsQuery, 
  useCreateTimeTrackingMutation
} from '@/api/hooks/useTimeTracking';
import type { TimeTrackingDto } from '@/api/services/TimeTrackingService';

export const BackendTimeTrackingPage: React.FC = () => {
  const {
    timeTrackings,
    activeTracking,
    isTimeTrackingActive,
    todaysTotalTime,
    setTimeTrackings,
    addTimeTrackingLocally,
    updateActiveTrackingLocally
  } = useBackendTimeTrackingStore();

  const { createNewTimeTracking, stopActiveTracking, getCurrentActiveTime } = useTimeTrackingActions();

  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(DateTime.now().toISODate());
  const [currentTimer, setCurrentTimer] = useState(0);

  // API calls - using existing Keycloak authentication
  const { data: fetchedTimeTrackings, isLoading } = useTimeTrackingsQuery();
  const createTimeTrackingMutation = useCreateTimeTrackingMutation();
  // Note: Delete is not implemented in backend yet
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string>('');

  // Update store when data is fetched
  useEffect(() => {
    if (fetchedTimeTrackings) {
      setTimeTrackings(fetchedTimeTrackings);
    }
  }, [fetchedTimeTrackings, setTimeTrackings]);


  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTimeTrackingActive) {
        const activeTime = getCurrentActiveTime();
        setCurrentTimer(Math.floor(todaysTotalTime + activeTime));
      } else {
        setCurrentTimer(Math.floor(todaysTotalTime));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimeTrackingActive, todaysTotalTime, getCurrentActiveTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (start: string, end?: string) => {
    const startTime = DateTime.fromISO(start).toFormat('HH:mm');
    if (end) {
      const endTime = DateTime.fromISO(end).toFormat('HH:mm');
      return `${startTime} - ${endTime}`;
    }
    return `${startTime} - Running`;
  };

  const formatDate = (dateStr: string) => {
    return DateTime.fromISO(dateStr).toLocaleString(DateTime.DATE_FULL);
  };

  const calculateDuration = (start: string, end?: string): string => {
    const startTime = DateTime.fromISO(start);
    const endTime = end ? DateTime.fromISO(end) : DateTime.now();
    const duration = endTime.diff(startTime, ['hours', 'minutes']);
    return `${Math.floor(duration.hours)}h ${Math.floor(duration.minutes % 60)}m`;
  };

  const handleStartTimer = () => {
    const description = newTaskDescription.trim() || 'New Task';
    const newTracking = createNewTimeTracking(description);
    
    // Optimistically update UI
    addTimeTrackingLocally(newTracking);
    
    // Create on backend
    createTimeTrackingMutation.mutate({
      uuid: newTracking.uuid,
      start: newTracking.start,
      task: newTracking.task
    }, {
      onSuccess: (backendTracking) => {
        updateActiveTrackingLocally(backendTracking);
        setNewTaskDescription('');
      }
    });
  };

  const handleStopTimer = () => {
    if (!activeTracking) return;
    
    const stoppedTracking = stopActiveTracking(activeTracking);
    
    // Update UI
    updateActiveTrackingLocally(stoppedTracking);
    
    // Update backend
    createTimeTrackingMutation.mutate({
      uuid: stoppedTracking.uuid,
      start: stoppedTracking.start,
      end: stoppedTracking.end,
      task: stoppedTracking.task
    });
  };

  // Filter trackings by selected date
  const filteredTrackings = timeTrackings.filter(tracking => {
    if (!selectedDate) return true;
    return DateTime.fromISO(tracking.start).toISODate() === selectedDate;
  });

  // Group trackings by date
  const trackingsByDate = filteredTrackings.reduce((groups, tracking) => {
    const date = DateTime.fromISO(tracking.start).toISODate();
    if (date && !groups[date]) {
      groups[date] = [];
    }
    if (date) {
      groups[date].push(tracking);
    }
    return groups;
  }, {} as Record<string, TimeTrackingDto[]>);


  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track your time with backend integration
          </p>
        </div>
        <Clock className="h-8 w-8 text-gray-400" />
      </div>

      {/* Current Timer Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center mb-6">
          <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
            {formatTime(currentTimer)}
          </div>
          {isTimeTrackingActive && activeTracking?.task && (
            <div className="text-lg text-gray-600 dark:text-gray-400">
              {activeTracking.task.name}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isTimeTrackingActive ? 'Timer is running' : 'Timer is stopped'}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="What are you working on?"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isTimeTrackingActive || createTimeTrackingMutation.isPending}
            />
            <button
              onClick={handleStartTimer}
              disabled={isTimeTrackingActive || createTimeTrackingMutation.isPending}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>

          <div className="flex justify-center space-x-3">
            {!isTimeTrackingActive ? (
              <button
                onClick={handleStartTimer}
                disabled={createTimeTrackingMutation.isPending}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
              >
                <Play className="h-5 w-5" />
                <span>Start Timer</span>
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                disabled={createTimeTrackingMutation.isPending}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-400"
              >
                <Clock className="h-5 w-5" />
                <span>Stop Timer</span>
              </button>
            )}
          </div>
        </div>

        {createTimeTrackingMutation.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error: {createTimeTrackingMutation.error.message}
            </p>
          </div>
        )}
      </div>

      {/* Date Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Date</h2>
        </div>
        <input
          type="date"
          value={selectedDate || ''}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Time Entries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Time Entries</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.keys(trackingsByDate).length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No time entries
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start tracking time to see your entries here.
              </p>
            </div>
          ) : (
            Object.entries(trackingsByDate)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort by date desc
              .map(([date, dateTrackings]) => (
                <div key={date} className="px-6 py-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {formatDate(dateTrackings[0].start)}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {dateTrackings.length} {dateTrackings.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dateTrackings
                      .sort((a, b) => DateTime.fromISO(b.start).toMillis() - DateTime.fromISO(a.start).toMillis())
                      .map((tracking) => (
                        <div
                          key={tracking.uuid}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {editingId === tracking.uuid ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editingTask}
                                    onChange={(e) => setEditingTask(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      createTimeTrackingMutation.mutate({
                                        uuid: tracking.uuid,
                                        start: tracking.start,
                                        end: tracking.end,
                                        task: { name: editingTask }
                                      }, {
                                        onSuccess: () => {
                                          setEditingId(null);
                                          setEditingTask('');
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                    disabled={createTimeTrackingMutation.isPending}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingTask('');
                                    }}
                                    className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {tracking.task?.name || 'Untitled Task'}
                                  </p>
                                  {tracking.isActive && (
                                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatTimeRange(tracking.start, tracking.end)}
                              </p>
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {calculateDuration(tracking.start, tracking.end)}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setEditingId(tracking.uuid);
                                setEditingTask(tracking.task?.name || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              disabled={tracking.isActive}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                alert('Delete functionality is not available yet in the backend API');
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-50 cursor-not-allowed"
                              disabled={true}
                              title="Delete not available yet"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};