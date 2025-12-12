import React from 'react';
import { DollarSign } from 'lucide-react';
import type { BookingEntry } from '@/types/booking.types';

interface Props {
  entries: BookingEntry[];
  readonly?: boolean;
}

export const BookingEntryTable: React.FC<Props> = ({ entries, readonly: _readonly = true }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:mm from HH:mm:ss
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No entries
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Time</th>
            <th className="pb-2 font-medium text-center">Duration</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium text-center">Billable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {entries.map((entry) => (
            <tr key={entry.id} className="text-sm">
              <td className="py-3 text-gray-600 dark:text-gray-300">
                {entry.date}
              </td>
              <td className="py-3 font-mono text-gray-600 dark:text-gray-300">
                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
              </td>
              <td className="py-3 text-center">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-white font-medium">
                  {formatDuration(entry.durationSeconds)}
                </span>
              </td>
              <td className="py-3 text-gray-700 dark:text-gray-300">
                {entry.description || '-'}
              </td>
              <td className="py-3 text-center">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                    entry.isBillable
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  <DollarSign size={14} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
