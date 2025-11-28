import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { DateTime } from 'luxon';
import { useBackendTimeTrackingStore } from '@/stores/useBackendTimeTrackingStore';
import { useBookingStore } from '@/stores/useBookingStore';
import { useCreateBookingMutation, useFinalizeBookingMutation } from '@/api/hooks/useBookings';
import { BookingForm } from '@/components/features/booking/BookingForm';

export const CreateBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { timeTrackings } = useBackendTimeTrackingStore();
  const { form, initializeForm, resetForm, getCreateRequest } = useBookingStore();
  const createMutation = useCreateBookingMutation();
  const finalizeMutation = useFinalizeBookingMutation();

  // Initialize form from URL params or defaults
  useEffect(() => {
    const from = searchParams.get('from') || DateTime.now().startOf('week').toISODate()!;
    const to = searchParams.get('to') || DateTime.now().endOf('week').toISODate()!;

    // Filter time trackings within the period
    const periodTrackings = timeTrackings.filter((t) => {
      const date = DateTime.fromISO(t.start).toISODate();
      return date && date >= from && date <= to && t.end;
    });

    initializeForm(periodTrackings, from, to);

    return () => resetForm();
  }, [searchParams, timeTrackings, initializeForm, resetForm]);

  const handleSaveDraft = async () => {
    const request = getCreateRequest();
    if (!request) return;

    try {
      const booking = await createMutation.mutateAsync(request);
      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handleCreateAndFinalize = async () => {
    const request = getCreateRequest();
    if (!request) return;

    try {
      const booking = await createMutation.mutateAsync(request);
      // Finalize immediately after creation
      await finalizeMutation.mutateAsync(booking.id);
      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  const formatPeriod = () => {
    if (!form) return '';
    const start = DateTime.fromISO(form.periodStart);
    const end = DateTime.fromISO(form.periodEnd);
    return `${start.toFormat('MMM dd')} - ${end.toFormat('MMM dd, yyyy')}`;
  };

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/bookings')}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Leistungsnachweis
          </h1>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
            <Calendar size={16} />
            <span>{formatPeriod()}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <BookingForm
        onSaveDraft={handleSaveDraft}
        onSubmit={handleCreateAndFinalize}
        isSubmitting={createMutation.isPending || finalizeMutation.isPending}
      />
    </div>
  );
};
