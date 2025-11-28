import React from 'react';
import { Filter } from 'lucide-react';
import type { BookingQueryParams, BookingStatus } from '@/types/booking.types';

interface Props {
  filters: BookingQueryParams;
  onFiltersChange: (filters: BookingQueryParams) => void;
}

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'PAID', label: 'Paid' },
];

export const BookingFilters: React.FC<Props> = ({ filters, onFiltersChange }) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as BookingStatus | '';
    onFiltersChange({
      ...filters,
      status: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = filters.status || filters.from || filters.to;

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Filter size={18} />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <select
        value={filters.status || ''}
        onChange={handleStatusChange}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};
