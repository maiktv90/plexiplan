import axios from 'axios';
import { authUrl } from '../config/auth.config';
import type { IUser } from '../utils/types/common.types';

/**
 * This GET still has to remain a customHook (rather than using a RTK Query userApi-Config)
 * since there is an open Bug with disabling Caching for lazyQueries (finer grained fetch/cache-control)
 * (https://github.com/reduxjs/redux-toolkit/issues/3711).
 * This leads to unwanted side effects such as Users being re-set from Cache after logout.
 * Until the Bug is fixed, this has to bypass the standard approach for data-fetching (where caching is generally
 * desired) via RTK Query for the use-case of explicitly not wanting to retrieve cached data independent
 * of component-re-mount or hook argument change.
 * */
const doUseUser = async (clientRegistrationId: string) => {
  return await axios
    .get(`${authUrl}/${clientRegistrationId}/user`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      if (error.response!.status === 401) {
        return undefined;
      } else if (error.request) {
        throw Error('The requested service is unavailable.');
      } else {
        throw Error('An unexpected error occured.');
      }
    });
};

export const useUser = async (
  clientRegistrationId: string,
  setUserCallback: (user: IUser) => void,
  onErrorCallback: (error: unknown) => void,
  onFinallyCallback: () => void,
) => {
  doUseUser(clientRegistrationId)
    .then((user) => {
      setUserCallback(user);
    })
    .catch((error) => {
      onErrorCallback(error);
    })
    .finally(() => {
      onFinallyCallback();
    });
};
