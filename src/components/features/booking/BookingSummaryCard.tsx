import React from 'react';
import { Clock, DollarSign, Calendar, User, Briefcase } from 'lucide-react';
import { DateTime } from 'luxon';
import type { BookingDetail } from '@/types/booking.types';

interface Props {
  booking: BookingDetail;
}

export const BookingSummaryCard: React.FC<Props> = ({ booking }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPeriod = () => {
    const start = DateTime.fromISO(booking.periodStart);
    const end = DateTime.fromISO(booking.periodEnd);
    return `${start.toFormat('MMM dd')} - ${end.toFormat('MMM dd, yyyy')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Period */}
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar size={16} />
            <span className="text-sm">Period</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPeriod()}
          </div>
        </div>

        {/* Total Time */}
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Clock size={16} />
            <span className="text-sm">Total Time</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDuration(booking.totalSeconds)}
          </div>
        </div>

        {/* Billable Time */}
        <div>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <DollarSign size={16} />
            <span className="text-sm">Billable</span>
          </div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatDuration(booking.billableSeconds)}
          </div>
        </div>

        {/* Total Amount */}
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-sm">Amount</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(booking.totalAmount, booking.currency)}
            {booking.hourlyRate && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                @ {booking.hourlyRate} {booking.currency}/h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Client & Project */}
      {(booking.clientName || booking.projectName) && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-6">
          {booking.clientName && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <User size={16} />
                <span className="text-sm">Client</span>
              </div>
              <div className="text-gray-900 dark:text-white font-medium">
                {booking.clientName}
              </div>
            </div>
          )}
          {booking.projectName && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Briefcase size={16} />
                <span className="text-sm">Project</span>
              </div>
              <div className="text-gray-900 dark:text-white font-medium">
                {booking.projectName}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
