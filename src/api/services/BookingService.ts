import { timeTrackingApiClient } from '../client/instances';
import type {
  BookingDetail,
  BookingListResponse,
  BookingQueryParams,
  CreateBookingRequest,
  UpdateBookingRequest,
} from '@/types/booking.types';

export const BookingService = {
  async getBookings(params?: BookingQueryParams): Promise<BookingListResponse> {
    const response = await timeTrackingApiClient.get<BookingListResponse>('/bookings', { params });
    return response.data;
  },

  async getBooking(id: number): Promise<BookingDetail> {
    const response = await timeTrackingApiClient.get<BookingDetail>(`/bookings/${id}`);
    return response.data;
  },

  async createBooking(request: CreateBookingRequest): Promise<BookingDetail> {
    const response = await timeTrackingApiClient.post<BookingDetail>('/bookings', request);
    return response.data;
  },

  async updateBooking(id: number, request: UpdateBookingRequest): Promise<BookingDetail> {
    const response = await timeTrackingApiClient.put<BookingDetail>(`/bookings/${id}`, request);
    return response.data;
  },

  async deleteBooking(id: number): Promise<void> {
    await timeTrackingApiClient.delete(`/bookings/${id}`);
  },

  async finalizeBooking(id: number): Promise<BookingDetail> {
    const response = await timeTrackingApiClient.post<BookingDetail>(`/bookings/${id}/finalize`);
    return response.data;
  },

  async getBookedUuids(uuids: string[]): Promise<string[]> {
    const response = await timeTrackingApiClient.post<string[]>('/bookings/booked-uuids', uuids);
    return response.data;
  },
};
