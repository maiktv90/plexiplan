import { createContext } from 'react';
import type { IUser } from '../utils/types/common.types';

interface UserState {
  user: IUser;
  isAuth: boolean;
  isLoading: boolean;
}

export interface UserContextType extends UserState {
  setUser: (user: IUser) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);