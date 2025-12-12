import React from 'react';
import type { BookingStatus } from '@/types/booking.types';

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  BOOKED: { label: 'Booked', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INVOICED: { label: 'Invoiced', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PAID: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

interface Props {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export const BookingStatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`font-medium rounded-full ${sizeClasses} ${config.className}`}>
      {config.label}
    </span>
  );
};
