// Clean Architecture - Time Tracking Widget Feature Component
import React from 'react';
import { useTimeTrackingStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const TimeTrackingWidget: React.FC = () => {
  const { 
    isTimeTrackingActive, 
    activeTracking, 
    computedBooking 
  } = useTimeTrackingStore();

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '00:00';
    return timeString;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Time Tracking
        </h3>
        <div className={`w-3 h-3 rounded-full ${
          isTimeTrackingActive 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-gray-300 dark:bg-gray-600'
        }`} />
      </div>

      <div className="space-y-4">
        {/* Current Session */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white mb-2">
            {isTimeTrackingActive ? formatTime(activeTracking?.duration) : '00:00'}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isTimeTrackingActive ? 'Current session' : 'No active session'}
          </p>
        </div>

        {/* Today's Total */}
        {(computedBooking && typeof computedBooking === 'object') ? (
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {formatTime(computedBooking.bookableHours)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Today's total
            </p>
          </div>
        ) : null}

        {/* Action Button */}
        <div className="pt-2">
          <Button 
            className="w-full" 
            variant={isTimeTrackingActive ? 'destructive' : 'primary'}
          >
            {isTimeTrackingActive ? 'Stop Timer' : 'Start Timer'}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            Break
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Log Time
          </Button>
        </div>
      </div>
    </Card>
  );
};