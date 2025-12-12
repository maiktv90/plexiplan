import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DateTime } from 'luxon';
import type { TimeTrackingDto } from '@/api/services/TimeTrackingService';
import type { CreateBookingRequest, CreateBookingEntryRequest } from '@/types/booking.types';

interface BookingFormEntry extends CreateBookingEntryRequest {
  taskName: string;
}

interface BookingFormState {
  periodStart: string;
  periodEnd: string;
  projectName: string;
  clientName: string;
  hourlyRate: string;
  currency: string;
  description: string;
  notes: string;
  entries: BookingFormEntry[];
}

interface BookingStore {
  // Form state
  form: BookingFormState | null;

  // Actions
  initializeForm: (
    timeTrackings: TimeTrackingDto[],
    periodStart: string,
    periodEnd: string
  ) => void;

  updateFormField: <K extends keyof Omit<BookingFormState, 'entries'>>(
    field: K,
    value: BookingFormState[K]
  ) => void;

  toggleEntryBillable: (uuid: string) => void;
  updateEntryDescription: (uuid: string, description: string) => void;
  removeEntry: (uuid: string) => void;

  resetForm: () => void;

  // Computed
  getFormTotals: () => {
    totalSeconds: number;
    billableSeconds: number;
    totalAmount: number | null;
  };

  getCreateRequest: () => CreateBookingRequest | null;
}

export const useBookingStore = create<BookingStore>()(
  devtools(
    (set, get) => ({
      form: null,

      initializeForm: (timeTrackings, periodStart, periodEnd) => {
        const entries: BookingFormEntry[] = timeTrackings
          .filter((t) => t.end) // Only completed entries
          .map((t) => {
            const start = DateTime.fromISO(t.start);
            const end = DateTime.fromISO(t.end!);
            const durationSeconds = Math.round(end.diff(start, 'seconds').seconds);

            return {
              timeTrackingUuid: t.uuid,
              date: start.toISODate()!,
              startTime: start.toFormat('HH:mm:ss'),
              endTime: end.toFormat('HH:mm:ss'),
              durationSeconds,
              isBillable: true,
              description: t.task?.name || '',
              taskName: t.task?.name || '',
            };
          });

        set({
          form: {
            periodStart,
            periodEnd,
            projectName: '',
            clientName: '',
            hourlyRate: '',
            currency: 'EUR',
            description: '',
            notes: '',
            entries,
          },
        });
      },

      updateFormField: (field, value) => {
        set((state) => ({
          form: state.form ? { ...state.form, [field]: value } : null,
        }));
      },

      toggleEntryBillable: (uuid) => {
        set((state) => ({
          form: state.form
            ? {
                ...state.form,
                entries: state.form.entries.map((e) =>
                  e.timeTrackingUuid === uuid ? { ...e, isBillable: !e.isBillable } : e
                ),
              }
            : null,
        }));
      },

      updateEntryDescription: (uuid, description) => {
        set((state) => ({
          form: state.form
            ? {
                ...state.form,
                entries: state.form.entries.map((e) =>
                  e.timeTrackingUuid === uuid ? { ...e, description } : e
                ),
              }
            : null,
        }));
      },

      removeEntry: (uuid) => {
        set((state) => ({
          form: state.form
            ? {
                ...state.form,
                entries: state.form.entries.filter((e) => e.timeTrackingUuid !== uuid),
              }
            : null,
        }));
      },

      resetForm: () => set({ form: null }),

      getFormTotals: () => {
        const { form } = get();
        if (!form) return { totalSeconds: 0, billableSeconds: 0, totalAmount: null };

        const totalSeconds = form.entries.reduce((sum, e) => sum + e.durationSeconds, 0);
        const billableSeconds = form.entries
          .filter((e) => e.isBillable)
          .reduce((sum, e) => sum + e.durationSeconds, 0);

        const rate = parseFloat(form.hourlyRate);
        const totalAmount =
          !isNaN(rate) && rate > 0 ? (billableSeconds / 3600) * rate : null;

        return { totalSeconds, billableSeconds, totalAmount };
      },

      getCreateRequest: () => {
        const { form } = get();
        if (!form || form.entries.length === 0) return null;

        const rate = parseFloat(form.hourlyRate);

        return {
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          projectName: form.projectName || undefined,
          clientName: form.clientName || undefined,
          hourlyRate: !isNaN(rate) && rate > 0 ? rate : undefined,
          currency: form.currency,
          description: form.description || undefined,
          notes: form.notes || undefined,
          entries: form.entries.map(({ taskName, ...entry }) => entry),
        };
      },
    }),
    { name: 'booking-store' }
  )
);
