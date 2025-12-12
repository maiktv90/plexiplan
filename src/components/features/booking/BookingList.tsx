import React from 'react';
import { BookingCard } from './BookingCard';
import type { BookingSummary } from '@/types/booking.types';

interface Props {
  bookings: BookingSummary[];
}

export const BookingList: React.FC<Props> = ({ bookings }) => {
  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
};
