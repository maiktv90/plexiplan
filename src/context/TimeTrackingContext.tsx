import React, { useState } from 'react';
import { DateTime } from 'luxon';
import type { IBooking, CouchDb, ITracking } from '../components/TimeTracking/types';
import { TimeTrackingContext } from './timeTrackingContextDef';

// Helper functions for computed values
const getActiveTracking = (booking: IBooking) => {
  return booking?.trackings?.find(
    (tracking) => tracking.id === booking.activeTracking,
  );
};

const getIsTimeTrackingActive = (activeTracking: ITracking | undefined) => {
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

interface TimeTrackingProviderProps {
  children: React.ReactNode;
}

export const TimeTrackingProvider: React.FC<TimeTrackingProviderProps> = ({ children }) => {
  const [booking, setBooking] = useState<IBooking>({} as IBooking);
  const [bookingList, setBookingList] = useState<IBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<number>(0);
  const [bookingDbConf, setBookingDbConf] = useState<CouchDb>({} as CouchDb);
  const [isDbTokenInvalid, setIsDbTokenInvalid] = useState<boolean>(false);

  // Computed values
  const activeTracking = getActiveTracking(booking);
  const isTimeTrackingActive = getIsTimeTrackingActive(activeTracking);
  const computedBooking = getComputedBooking(booking);

  return (
    <TimeTrackingContext.Provider
      value={{
        booking,
        bookingList,
        selectedBooking,
        bookingDbConf,
        isDbTokenInvalid,
        setBooking,
        setBookingList,
        setSelectedBooking,
        setBookingDbConf,
        setIsDbTokenInvalid,
        activeTracking,
        isTimeTrackingActive,
        computedBooking,
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};