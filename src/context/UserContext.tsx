import React, { useState, type ReactNode } from 'react';
import type { IUser } from '../utils/types/common.types';
import { UserContext } from './userContextDef';

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<IUser>({} as IUser);
  const [isLoading, setIsLoading] = useState(false);
  
  const isAuth = user?.username !== undefined;

  const setUser = (newUser: IUser) => {
    setUserState(newUser);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuth,
        isLoading,
        setUser,
        setIsLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};