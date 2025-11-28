import React from 'react';
import { useTimeTrackingStore } from '@/stores/useTimeTrackingStore';
import { DateTime } from 'luxon';
import { Clock } from 'lucide-react';

export const BookingList: React.FC = () => {
    const { bookingList } = useTimeTrackingStore();

    const formatDuration = (hoursStr: string) => {
        if (!hoursStr) return '0h 0m';
        const [hours, minutes] = hoursStr.split(':').map(Number);
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (dateStr: string) => {
        return DateTime.fromISO(dateStr).toLocaleString(DateTime.DATE_MED);
    };

    // Filter out empty bookings or bookings with no duration if desired, 
    // but for now let's show all closed or non-empty ones.
    const sortedBookings = [...bookingList].sort((a, b) =>
        DateTime.fromISO(b.createdAt).toMillis() - DateTime.fromISO(a.createdAt).toMillis()
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h2>
                <Clock className="h-5 w-5 text-gray-400" />
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                {sortedBookings.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No bookings yet
                    </div>
                ) : (
                    sortedBookings.map((booking) => (
                        <div
                            key={booking._id}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDate(booking.createdAt)}
                                </span>
                                <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                                    {formatDuration(booking.bookableHours)}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {booking.trackings?.map((tracking) => (
                                    <div key={tracking.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                                        <span className="truncate flex-1 mr-2">{tracking.task?.label || 'No description'}</span>
                                        {tracking.start && tracking.stop && (
                                            <span className="text-gray-400 shrink-0">
                                                {DateTime.fromISO(tracking.start).toFormat('HH:mm')} - {DateTime.fromISO(tracking.stop).toFormat('HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
