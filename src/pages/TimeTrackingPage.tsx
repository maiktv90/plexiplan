import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';
import { DatePicker } from '@/components/ui/date-picker';

// V2 Components
import { Stopwatch } from '@/components/features/time-tracking/Stopwatch';
import { TimeTrackedList } from '@/components/features/time-tracking/TimeTrackedList';
import { BookingActions } from '@/components/features/time-tracking/BookingActions';
import { TabContainer } from '@/components/features/time-tracking/styles.tracking';

// Backend integration
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { useTimeTrackingsQuery } from '@/api/hooks/useTimeTracking';
import { useUIStore } from '@/stores/useUIStore';

export const TimeTrackingPage: React.FC = () => {
  const {
    timeTrackings,
    setTimeTrackings,
  } = useBackendTimeTrackingStore();

  const { timeTrackingTab: activeTab, setTimeTrackingTab: setActiveTab } = useUIStore();

  const [selectedDate, setSelectedDate] = useState<string>(DateTime.now().toISODate() ?? '');

  // Fetch time trackings
  const { data: fetchedTimeTrackings, isLoading } = useTimeTrackingsQuery();

  // Update store when data is fetched (including empty arrays)
  useEffect(() => {
    if (fetchedTimeTrackings !== undefined) {
      setTimeTrackings(fetchedTimeTrackings ?? []);
    }
  }, [fetchedTimeTrackings, setTimeTrackings]);

  /**
   * Get date range based on active tab
   */
  const getDateRange = () => {
    const selected = DateTime.fromISO(selectedDate);

    switch (activeTab) {
      case 'day':
        return [selectedDate];
      case 'week':
        { const startOfWeek = selected.startOf('week');
        return Array.from({ length: 7 }, (_, i) =>
          startOfWeek.plus({ days: i }).toISODate()
        ); }
      case 'month':
        { const startOfMonth = selected.startOf('month');
        const daysInMonth = selected.daysInMonth ?? 30;
        return Array.from({ length: daysInMonth }, (_, i) =>
          startOfMonth.plus({ days: i }).toISODate()
        ); }
      default:
        return [selectedDate];
    }
  };

  /**
   * Navigate to previous/next date period
   */
  const navigateDate = (direction: 'prev' | 'next') => {
    const selected = DateTime.fromISO(selectedDate);
    let newDate: DateTime;

    switch (activeTab) {
      case 'day':
        newDate = direction === 'prev' ? selected.minus({ days: 1 }) : selected.plus({ days: 1 });
        break;
      case 'week':
        newDate = direction === 'prev' ? selected.minus({ weeks: 1 }) : selected.plus({ weeks: 1 });
        break;
      case 'month':
        newDate = direction === 'prev' ? selected.minus({ months: 1 }) : selected.plus({ months: 1 });
        break;
      default:
        newDate = selected;
    }

    setSelectedDate(newDate.toISODate() ?? '');
  };

  /**
   * Get display title for current date range
   */
  const getDateTitle = () => {
    const selected = DateTime.fromISO(selectedDate);

    switch (activeTab) {
      case 'day':
        return selected.toFormat('EEEE, MMM dd, yyyy');
      case 'week':
        { const startOfWeek = selected.startOf('week');
        const endOfWeek = selected.endOf('week');
        const weekNumber = selected.weekNumber;
        return `Week ${weekNumber} • ${startOfWeek.toFormat('MMM dd')} - ${endOfWeek.toFormat('MMM dd, yyyy')}`; }
      case 'month':
        return selected.toFormat('MMMM yyyy');
      default:
        return '';
    }
  };

  /**
   * Calculate total hours for selected time trackings
   */
  const calculateTotalHours = () => {
    const dateRange = getDateRange();
    const filteredTrackings = timeTrackings.filter(tracking => {
      const trackingDate = DateTime.fromISO(tracking.start).toISODate();
      return dateRange.includes(trackingDate) && tracking.end;
    });

    const totalMinutes = filteredTrackings.reduce((total, tracking) => {
      const start = DateTime.fromISO(tracking.start);
      const end = DateTime.fromISO(tracking.end!);
      return total + end.diff(start, 'minutes').minutes;
    }, 0);

    return totalMinutes / 60; // Convert to hours
  };

  const totalHours = calculateTotalHours();
  const dateRange = getDateRange();
  const displayedTimeTrackings = timeTrackings.filter(tracking => {
    const trackingDate = DateTime.fromISO(tracking.start).toISODate();
    return dateRange.includes(trackingDate);
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Clock className="h-8 w-8 text-primary-500 dark:text-primary-400" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(DateTime.now().toISODate() ?? '')}
            className="px-3 py-1.5 text-sm font-medium text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
          >
            Today
          </button>
          <DatePicker
            value={DateTime.fromISO(selectedDate).toJSDate()}
            onChange={(date) => {
              if (date) {
                setSelectedDate(DateTime.fromJSDate(date).toISODate() ?? '');
              }
            }}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stopwatch and Booking Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stopwatch - Always visible */}
          <Stopwatch />
          
          {/* Booking Summary - Always visible */}
          <BookingActions
            trackings={displayedTimeTrackings}
            date={selectedDate!}
            onBookingComplete={() => {
              // Refresh the data after booking
              window.location.reload();
            }}
          />
        </div>

        {/* Right Column - Tab Navigation and Time Entries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <TabContainer>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {['day', 'week', 'month'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors tab ${
                      activeTab === tab
                        ? 'text-primary-500 dark:text-primary-400 border-b-2 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 tab-active'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Date Navigation */}
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getDateTitle()}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {totalHours.toFixed(1)} hours • {displayedTimeTrackings.length} entries
                  </p>
                </div>

                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </TabContainer>

          {/* Time Entries List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <TimeTrackedList
              trackings={displayedTimeTrackings}
              groupByDay={activeTab !== 'day'}
            />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="text-gray-900 dark:text-white">Loading time trackings...</span>
          </div>
        </div>
      )}
    </div>
  );
};