import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingService } from '../services/BookingService';
import type {
  BookingQueryParams,
  CreateBookingRequest,
  UpdateBookingRequest,
} from '@/types/booking.types';

const BOOKING_KEYS = {
  all: ['bookings'] as const,
  lists: () => [...BOOKING_KEYS.all, 'list'] as const,
  list: (params?: BookingQueryParams) => [...BOOKING_KEYS.lists(), params] as const,
  details: () => [...BOOKING_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...BOOKING_KEYS.details(), id] as const,
  bookedUuids: (uuids: string[]) => [...BOOKING_KEYS.all, 'booked-uuids', uuids] as const,
};

export const useBookingsQuery = (params?: BookingQueryParams, enabled = true) => {
  return useQuery({
    queryKey: BOOKING_KEYS.list(params),
    queryFn: () => BookingService.getBookings(params),
    staleTime: 30_000,
    enabled,
  });
};

export const useBookingQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: BOOKING_KEYS.detail(id),
    queryFn: () => BookingService.getBooking(id),
    enabled: enabled && id > 0,
  });
};

export const useBookedUuidsQuery = (uuids: string[], enabled = true) => {
  return useQuery({
    queryKey: BOOKING_KEYS.bookedUuids(uuids),
    queryFn: () => BookingService.getBookedUuids(uuids),
    enabled: enabled && uuids.length > 0,
    staleTime: 60_000,
  });
};

export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateBookingRequest) => BookingService.createBooking(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.lists() });
    },
  });
};

export const useUpdateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateBookingRequest }) =>
      BookingService.updateBooking(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.detail(id) });
    },
  });
};

export const useFinalizeBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => BookingService.finalizeBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.detail(id) });
    },
  });
};

export const useDeleteBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => BookingService.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.lists() });
    },
  });
};
