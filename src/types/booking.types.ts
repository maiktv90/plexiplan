export type BookingStatus = 'DRAFT' | 'BOOKED' | 'INVOICED' | 'PAID';

export interface BookingSummary {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: BookingStatus;
  totalSeconds: number;
  billableSeconds: number;
  hourlyRate: number | null;
  totalAmount: number | null;
  currency: string;
  projectName: string | null;
  clientName: string | null;
  entryCount: number;
  createdAt: string;
  bookedAt: string | null;
}

export interface BookingDetail extends BookingSummary {
  breakSeconds: number;
  description: string | null;
  notes: string | null;
  entries: BookingEntry[];
  updatedAt: string | null;
}

export interface BookingEntry {
  id: number;
  timeTrackingUuid: string;
  date: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  isBillable: boolean;
  description: string | null;
}

export interface BookingListResponse {
  bookings: BookingSummary[];
  totalCount: number;
}

export interface CreateBookingRequest {
  periodStart: string;
  periodEnd: string;
  projectName?: string;
  clientName?: string;
  hourlyRate?: number;
  currency?: string;
  description?: string;
  notes?: string;
  entries: CreateBookingEntryRequest[];
}

export interface CreateBookingEntryRequest {
  timeTrackingUuid: string;
  date: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  isBillable: boolean;
  description?: string;
}

export interface UpdateBookingRequest {
  projectName?: string;
  clientName?: string;
  hourlyRate?: number;
  currency?: string;
  description?: string;
  notes?: string;
  entries?: CreateBookingEntryRequest[];
}

export interface BookingQueryParams {
  status?: BookingStatus;
  from?: string;
  to?: string;
}
