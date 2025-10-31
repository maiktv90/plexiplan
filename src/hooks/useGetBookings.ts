import type { IBooking } from '../components/TimeTracking/types';
import { localBookingDb } from '../components/TimeTracking/pouchdb';

export const useGetBookings = async () => {
  return await localBookingDb
    .allDocs<IBooking>({ include_docs: true })
    .then((result) => result.rows.map((row) => row.doc));
};
