import PouchDB                                from 'pouchdb';
import { couchdbBaseUrl }                     from '@/config/pouchdb.config.ts';
import type { CouchDb, PouchError, IBooking } from './types';

export const localBookingDb = new PouchDB<IBooking>('bookings');

export const remoteBookingDb = async (conf: CouchDb) => {
  if (conf) {
    return new PouchDB<IBooking>(`${couchdbBaseUrl}/${conf.dbName}`, {
      fetch: function (url, opts) {
        if (!opts) {
          return PouchDB.fetch(url, opts);
        }
        const reqHeaders = new Headers(opts.headers);
        reqHeaders.set('Authorization', `Bearer ${conf.token}`);
        opts.headers = reqHeaders;
        return PouchDB.fetch(url, opts);
      },
    });
  } else {
    console.log(
      'Failed to sync booking data. No authentication present, please login.',
    );
    return null;
  }
};

export const syncBookingChanges = (
  remoteDb: PouchDB.Database<IBooking>,
  onErrorCallback: (error: PouchError) => void,
  onCompleteCallback: () => void,
): PouchDB.Replication.Sync<IBooking> | null => {
  if (remoteDb) {
    return PouchDB.sync(localBookingDb, remoteDb, {
      live: true,
      retry: true,
    })
      .on('change', (info) => {
        console.log(info);
      })
      .on('active', () => {
        console.log('is active');
      })
      .on('error', (err) => {
        onErrorCallback(err as PouchError);
      })
      .on('complete', () => {
        onCompleteCallback();
      });
  } else {
    return null;
  }
};
