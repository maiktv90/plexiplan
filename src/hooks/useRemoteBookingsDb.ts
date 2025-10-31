import axios from 'axios';
import { authUrl } from '../config/auth.config';
import type { CouchDb } from '../components/TimeTracking/types';

export const useRemoteBookingsDb = async (): Promise<CouchDb> => {
  return await axios
    .get(`${authUrl}/bookings/token`)
    .then((res) => {
      return res.data;
    })
    .catch(() => null);
};
