import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, DollarSign, FileText, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';
import { BookingStatusBadge } from './BookingStatusBadge';
import type { BookingSummary } from '@/types/booking.types';

interface Props {
  booking: BookingSummary;
}

export const BookingCard: React.FC<Props> = ({ booking }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPeriod = () => {
    const start = DateTime.fromISO(booking.periodStart);
    const end = DateTime.fromISO(booking.periodEnd);

    if (start.hasSame(end, 'day')) {
      return start.toFormat('MMM dd, yyyy');
    }
    if (start.hasSame(end, 'month')) {
      return `${start.toFormat('MMM dd')} - ${end.toFormat('dd, yyyy')}`;
    }
    return `${start.toFormat('MMM dd')} - ${end.toFormat('MMM dd, yyyy')}`;
  };

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <BookingStatusBadge status={booking.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              #{booking.id}
            </span>
          </div>

          {/* Period */}
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {formatPeriod()}
            </span>
          </div>

          {/* Client / Project */}
          {(booking.clientName || booking.projectName) && (
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {booking.clientName}
                {booking.clientName && booking.projectName && ' • '}
                {booking.projectName}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Clock size={14} />
              <span>{formatDuration(booking.totalSeconds)}</span>
            </div>
            {booking.billableSeconds > 0 && (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <DollarSign size={14} />
                <span>{formatDuration(booking.billableSeconds)} billable</span>
              </div>
            )}
            {booking.totalAmount && (
              <div className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={20} className="text-gray-400 mt-1" />
      </div>

      {/* Entry count */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {booking.entryCount} {booking.entryCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    </Link>
  );
};
