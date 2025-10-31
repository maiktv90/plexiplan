import axios, { type AxiosResponse } from 'axios';

import { csrfTokenUrl } from '../config/auth.config';
import type { CsrfTokenResponse, IUser } from '../utils/types/common.types';

export const useAuth = async (clientAuthUrl: string) => {
  return await axios
    .get(clientAuthUrl)
    .then((res: AxiosResponse<IUser>) => {
      return !!(res.data && res.data.username);
    })
    .catch((error) => {
      console.log(error);
      return undefined;
    });
};

export const useCsrfToken = async () => {
  // In development mode, return a mock CSRF token
  if (process.env.NODE_ENV === 'development') {
    return 'mock-csrf-token-12345';
  }
  
  return await axios
    .get(csrfTokenUrl)
    .then((res: AxiosResponse<CsrfTokenResponse>) => {
      return res.data.csrf;
    })
    .catch((error) => {
      console.log(error);
      return undefined;
    });
};
