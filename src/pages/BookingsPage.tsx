import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { useBookingsQuery } from '@/api/hooks/useBookings';
import { BookingList, BookingFilters } from '@/components/features/booking';
import type { BookingQueryParams } from '@/types/booking.types';

export const BookingsPage: React.FC = () => {
  const [filters, setFilters] = useState<BookingQueryParams>({});
  const { data, isLoading, error } = useBookingsQuery(filters);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary-500 dark:text-primary-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Leistungsnachweise
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your time bookings and create invoices
            </p>
          </div>
        </div>
        <Link
          to="/bookings/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus size={20} />
          New Booking
        </Link>
      </div>

      {/* Filters */}
      <BookingFilters filters={filters} onFiltersChange={setFilters} />

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-red-500 dark:text-red-400 mb-4">
            Failed to load bookings
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-500 hover:text-primary-600"
          >
            Try again
          </button>
        </div>
      ) : data?.bookings.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.status ? 'No bookings match your filters' : 'No bookings yet'}
          </p>
          <Link
            to="/bookings/new"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600"
          >
            <Plus size={18} />
            Create your first booking
          </Link>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {data?.totalCount} {data?.totalCount === 1 ? 'booking' : 'bookings'}
          </div>
          <BookingList bookings={data?.bookings ?? []} />
        </>
      )}
    </div>
  );
};
