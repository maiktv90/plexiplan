import { createContext } from 'react';
import type { IBooking, CouchDb } from '../components/TimeTracking/types';

interface TimeTrackingState {
  booking: IBooking;
  bookingList: IBooking[];
  selectedBooking: number;
  bookingDbConf: CouchDb;
  isDbTokenInvalid: boolean;
}

export interface TimeTrackingContextType extends TimeTrackingState {
  setBooking: (booking: IBooking) => void;
  setBookingList: (bookingList: IBooking[]) => void;
  setSelectedBooking: (selectedBooking: number) => void;
  setBookingDbConf: (dbConf: CouchDb) => void;
  setIsDbTokenInvalid: (isInvalid: boolean) => void;
  // Computed values
  activeTracking: unknown;
  isTimeTrackingActive: boolean;
  computedBooking: unknown;
}

export const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);