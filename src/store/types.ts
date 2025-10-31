// Clean Architecture - Domain Types
import type { IUser } from '@/types';
import type { IBooking, CouchDb, ITracking } from '@/components/TimeTracking/types';

// Action types
export const TimeTrackingActionType = {
  SET_BOOKING: 'timeTracking/setBooking',
  SET_BOOKING_LIST: 'timeTracking/setBookingList',
  SET_SELECTED_BOOKING: 'timeTracking/setSelectedBooking',
  SET_BOOKING_DB_CONF: 'timeTracking/setBookingDbConf',
  SET_DB_TOKEN_INVALID: 'timeTracking/setDbTokenInvalid',
} as const

// Core Domain State
export interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// UI/Presentation Layer State  
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  currentTheme: 'light' | 'dark';
  isPopup: boolean;
  isLoading: boolean;
  hasError: boolean;
  listView: boolean;
  expanded: Record<string, boolean>;
}

// Time Tracking Domain State
export interface TimeTrackingState {
  booking: IBooking;
  bookingList: IBooking[];
  selectedBooking: number;
  bookingDbConf: CouchDb;
  isDbTokenInvalid: boolean;
  activeTracking: ITracking | null;
  isTimeTrackingActive: boolean;
  computedBooking: (IBooking & { bookableHours: string }) | null;
}

// Configuration/Tools Domain State
export interface ConfigState {
  isLoading: boolean;
  toolStates: Record<string, {
    isLoading: boolean;
    hasError: boolean;
    error?: string;
    user: IUser;
  }>;
}

// Root Application State
export interface AppState {
  auth: AuthState;
  ui: UIState;
  timeTracking: TimeTrackingState;
  config: ConfigState;
}