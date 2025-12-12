import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Briefcase,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DateTime } from 'luxon';
import {
  useBookingQuery,
  useFinalizeBookingMutation,
  useDeleteBookingMutation,
} from '@/api/hooks/useBookings';
import { BookingStatusBadge } from '@/components/features/booking';
import type { BookingDetail } from '@/types/booking.types';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bookingId = parseInt(id ?? '0', 10);

  const { data: booking, isLoading, error } = useBookingQuery(bookingId);
  const finalizeMutation = useFinalizeBookingMutation();
  const deleteMutation = useDeleteBookingMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFinalize = async () => {
    if (!booking) return;
    try {
      await finalizeMutation.mutateAsync(booking.id);
    } catch (err) {
      console.error('Failed to finalize booking:', err);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    try {
      await deleteMutation.mutateAsync(booking.id);
      navigate('/bookings');
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  };

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

  const formatPeriod = (booking: BookingDetail) => {
    const start = DateTime.fromISO(booking.periodStart);
    const end = DateTime.fromISO(booking.periodEnd);
    return `${start.toFormat('MMM dd')} - ${end.toFormat('MMM dd, yyyy')}`;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:mm from HH:mm:ss
  };

  const formatDate = (dateStr: string) => {
    return DateTime.fromISO(dateStr).toFormat('MMM dd, yyyy');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error ? 'Failed to load booking' : 'Booking not found'}
          </p>
          <Link
            to="/bookings"
            className="text-primary-500 hover:text-primary-600"
          >
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = booking.status === 'DRAFT';
  const canDelete = booking.status === 'DRAFT';
  const canFinalize = booking.status === 'DRAFT';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bookings')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Leistungsnachweis #{booking.id}
              </h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
              <Calendar size={16} />
              <span>{formatPeriod(booking)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              to={`/bookings/${booking.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </Link>
          )}
          {canFinalize && (
            <button
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {finalizeMutation.isPending ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle size={16} />
              )}
              Finalize
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

          {/* Hourly Rate */}
          <div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <span className="text-sm">Hourly Rate</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {booking.hourlyRate
                ? `${booking.hourlyRate} ${booking.currency}/h`
                : '-'}
            </div>
          </div>

          {/* Total Amount */}
          <div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <span className="text-sm">Amount</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(booking.totalAmount, booking.currency)}
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

      {/* Description */}
      {(booking.description || booking.notes) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Description
          </h2>
          {booking.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {booking.description}
            </p>
          )}
          {booking.notes && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {booking.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Time Entries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Time Entries
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {booking.entries.length}{' '}
            {booking.entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {booking.entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No entries</p>
          </div>
        ) : (
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
                {booking.entries.map((entry) => (
                  <tr key={entry.id} className="text-sm">
                    <td className="py-3 text-gray-600 dark:text-gray-300">
                      {formatDate(entry.date)}
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
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
        <span>Created: {formatDate(booking.createdAt)}</span>
        {booking.bookedAt && (
          <span>Finalized: {formatDate(booking.bookedAt)}</span>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Booking?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. The time entries will be released
              and can be used in other bookings.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
