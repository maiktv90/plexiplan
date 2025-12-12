import React from 'react';
import { Trash2, DollarSign } from 'lucide-react';

interface BookingFormEntry {
  timeTrackingUuid: string;
  date: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  isBillable: boolean;
  description?: string;
  taskName: string;
}

interface Props {
  entry: BookingFormEntry;
  onToggleBillable: (uuid: string) => void;
  onUpdateDescription: (uuid: string, description: string) => void;
  onRemove: (uuid: string) => void;
  readonly?: boolean;
}

export const BookingEntryRow: React.FC<Props> = ({
  entry,
  onToggleBillable,
  onUpdateDescription,
  onRemove,
  readonly = false,
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:mm from HH:mm:ss
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      {/* Billable Toggle */}
      {!readonly && (
        <button
          type="button"
          onClick={() => onToggleBillable(entry.timeTrackingUuid)}
          className={`p-1.5 rounded transition-colors ${
            entry.isBillable
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
          }`}
          title={entry.isBillable ? 'Billable' : 'Non-billable'}
        >
          <DollarSign size={16} />
        </button>
      )}

      {/* Date */}
      <span className="text-sm text-gray-500 dark:text-gray-400 w-24">
        {entry.date}
      </span>

      {/* Time Range */}
      <span className="text-sm font-mono text-gray-600 dark:text-gray-300 w-28">
        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
      </span>

      {/* Duration */}
      <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-center bg-white dark:bg-gray-700 px-2 py-1 rounded">
        {formatDuration(entry.durationSeconds)}
      </span>

      {/* Description */}
      {readonly ? (
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
          {entry.description || entry.taskName || 'No description'}
        </span>
      ) : (
        <input
          type="text"
          value={entry.description ?? ''}
          onChange={(e) => onUpdateDescription(entry.timeTrackingUuid, e.target.value)}
          placeholder={entry.taskName || 'Description'}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      )}

      {/* Remove Button */}
      {!readonly && (
        <button
          type="button"
          onClick={() => onRemove(entry.timeTrackingUuid)}
          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};
