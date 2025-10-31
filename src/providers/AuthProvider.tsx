// Clean Architecture - Auth Provider with Business Logic
import React, { type ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { useAuthQuery } from '@/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setLoading, loginSuccess, loginFailure, isAuthenticated } = useAuthStore();
  const isLoginPage = window.location.hash.includes('#/login');

  const { data: user, isSuccess, isError, error, isLoading } = useAuthQuery();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (isSuccess && user) {
      loginSuccess(user);
    } else if (isError && isAuthenticated) {
      console.log(error)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      loginFailure(errorMessage);
    }
  }, [isSuccess, isError, user, error, loginSuccess, loginFailure, isLoginPage, isAuthenticated]);

  return <>{children}</>;
};