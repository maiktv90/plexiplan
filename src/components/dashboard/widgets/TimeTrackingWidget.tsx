import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';

export const TimeTrackingWidget: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setDescription('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Time Tracking</h2>
        <Clock className="h-5 w-5 text-gray-400" />
      </div>

      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white mb-2">
          {formatTime(elapsedTime)}
        </div>
        {description && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isRunning}
        />

        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Play className="h-4 w-4" />
              <span>Start</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};