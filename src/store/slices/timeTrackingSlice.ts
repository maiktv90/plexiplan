import { TimeTrackingActionType, type TimeTrackingState } from '../types';
import type { IBooking, CouchDb, ITracking }                             from '@/components/TimeTracking/types';
import { DateTime } from 'luxon';
import type { AppAction } from '../actions';

// Initial state
export const timeTrackingInitialState: TimeTrackingState = {
  booking: {} as IBooking,
  bookingList: [],
  selectedBooking: 0,
  bookingDbConf: {} as CouchDb,
  isDbTokenInvalid: false,
  activeTracking: null,
  isTimeTrackingActive: false,
  computedBooking: null,
};

// Action creators
export const timeTrackingActions = {
  setBooking: (booking: IBooking) => ({
    type: TimeTrackingActionType.SET_BOOKING,
    payload: booking,
  }),
  setBookingList: (bookingList: IBooking[]) => ({
    type: TimeTrackingActionType.SET_BOOKING_LIST,
    payload: bookingList,
  }),
  setSelectedBooking: (selectedBooking: number) => ({
    type: TimeTrackingActionType.SET_SELECTED_BOOKING,
    payload: selectedBooking,
  }),
  setBookingDbConf: (dbConf: CouchDb) => ({
    type: TimeTrackingActionType.SET_BOOKING_DB_CONF,
    payload: dbConf,
  }),
  setDbTokenInvalid: (isInvalid: boolean) => ({
    type: TimeTrackingActionType.SET_DB_TOKEN_INVALID,
    payload: isInvalid,
  }),
};

export type TimeTrackingAction = ReturnType<typeof timeTrackingActions[keyof typeof timeTrackingActions]>;

// Domain logic helpers
const getActiveTracking = (booking: IBooking) => {
  return booking?.trackings?.find(
    (tracking) => tracking.id === booking.activeTracking,
  );
};

const getIsTimeTrackingActive = (activeTracking: ITracking | null | undefined) => {
  return !!activeTracking;
};

const addTimeDiff = (time: ITracking, dateTime: DateTime<true> | DateTime<false>) => {
  const val = DateTime.fromISO(time.stop as string)
    .diff(DateTime.fromISO(time.start as string), ['hours', 'minutes'])
    .toObject();
  return dateTime.plus({
    hour: val.hours,
    minute: val.minutes,
  });
};

const getComputedBooking = (booking: IBooking) => {
  if (booking?.createdAt) {
    let dateTime = DateTime.fromObject({
      day: DateTime.fromISO(booking.createdAt).day,
      hour: 0,
      minute: 0,
      second: 0,
    });
    booking?.trackings?.forEach((time) => {
      dateTime = addTimeDiff(time, dateTime);
    });
    return {
      ...booking,
      bookableHours: dateTime.toFormat('HH:mm'),
    };
  } else {
    return null;
  }
};

// Reducer
export const timeTrackingReducer = (state: TimeTrackingState, action: AppAction): TimeTrackingState => {
  switch (action.type) {
    case TimeTrackingActionType.SET_BOOKING: {
      const booking = action.payload;
      const activeTracking = getActiveTracking(booking) || null;
      const isTimeTrackingActive = getIsTimeTrackingActive(activeTracking);
      const computedBooking = getComputedBooking(booking);
      
      return {
        ...state,
        booking,
        activeTracking,
        isTimeTrackingActive,
        computedBooking,
      };
    }
    case TimeTrackingActionType.SET_BOOKING_LIST:
      return {
        ...state,
        bookingList: action.payload,
      };
    case TimeTrackingActionType.SET_SELECTED_BOOKING:
      return {
        ...state,
        selectedBooking: action.payload,
      };
    case TimeTrackingActionType.SET_BOOKING_DB_CONF:
      return {
        ...state,
        bookingDbConf: action.payload,
      };
    case TimeTrackingActionType.SET_DB_TOKEN_INVALID:
      return {
        ...state,
        isDbTokenInvalid: action.payload,
      };
    default:
      return state;
  }
};