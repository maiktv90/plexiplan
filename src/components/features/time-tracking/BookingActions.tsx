import React, { useState } from 'react';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { DateTime } from 'luxon';
import { BookingButton, TrackingCard } from './styles.tracking';
import { TimeTrackingService, type TimeTrackingDto, type BookingDto } from '@/api/services/TimeTrackingService';

interface BookingActionsProps {
  trackings: TimeTrackingDto[];
  date: string;
  onBookingComplete?: () => void;
}

export const BookingActions: React.FC<BookingActionsProps> = ({ 
  trackings, 
  date, 
  onBookingComplete 
}) => {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<string | null>(null);

  const calculateTotalTime = () => {
    let totalSeconds = 0;
    trackings.forEach(tracking => {
      if (tracking.start && tracking.end) {
        const start = DateTime.fromISO(tracking.start);
        const end = DateTime.fromISO(tracking.end);
        totalSeconds += end.diff(start, 'seconds').seconds;
      }
    });
    return totalSeconds;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDurationDecimal = (seconds: number) => {
    const hours = seconds / 3600;
    return hours.toFixed(2);
  };

  const hasRunningTimer = trackings.some(tracking => tracking.isActive);
  const totalSeconds = calculateTotalTime();
  const hasTimeToBook = totalSeconds > 0;

  const handleBookTime = async () => {
    if (!hasTimeToBook || hasRunningTimer) return;

    setIsBooking(true);
    setBookingResult(null);

    try {
      const booking: BookingDto = {
        totalWorkTime: formatDurationDecimal(totalSeconds),
        billableWorkTime: formatDurationDecimal(totalSeconds), // Assume all time is billable for now
        breakTime: '0' // No break time calculation for now
      };

      const request = {
        date,
        timeTrackings: trackings,
        booking
      };

      const response = await TimeTrackingService.bookTime(request);
      if (response.success) {
        setBookingResult('Time successfully booked!');
        onBookingComplete?.();
      } else {
        setBookingResult('Failed to book time. Please try again.');
      }
    } catch (error) {
      console.error('Failed to book time:', error);
      setBookingResult('Failed to book time. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const getBookingButtonText = () => {
    if (isBooking) return 'Booking...';
    if (hasRunningTimer) return 'Stop timer to book';
    if (!hasTimeToBook) return 'No time to book';
    return `Book ${formatDuration(totalSeconds)}`;
  };

  return (
    <TrackingCard>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Booking Summary
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '0.5rem',
              color: '#6b7280'
            }}>
              <Clock size={18} />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>Total</span>
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600,
              color: '#1f2937',
              fontFamily: 'Inria Sans, monospace'
            }}>
              {formatDuration(totalSeconds)}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '0.5rem',
              color: '#6b7280'
            }}>
              <DollarSign size={18} />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>Billable</span>
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600,
              color: '#059669',
              fontFamily: 'Inria Sans, monospace'
            }}>
              {formatDurationDecimal(totalSeconds)}h
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '0.5rem',
              color: '#6b7280'
            }}>
              <Calendar size={18} />
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>Entries</span>
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600,
              color: '#1f2937'
            }}>
              {trackings.length}
            </div>
          </div>
        </div>

        <BookingButton
          onClick={handleBookTime}
          disabled={isBooking || hasRunningTimer || !hasTimeToBook}
        >
          {getBookingButtonText()}
        </BookingButton>

        {bookingResult && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: bookingResult.includes('success') ? '#dcfce7' : '#fee2e2',
            color: bookingResult.includes('success') ? '#166534' : '#dc2626',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {bookingResult}
          </div>
        )}

        {hasRunningTimer && (
          <div style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: '#ef4444',
            fontStyle: 'italic'
          }}>
            Please stop your active timer before booking time
          </div>
        )}
      </div>
    </TrackingCard>
  );
};