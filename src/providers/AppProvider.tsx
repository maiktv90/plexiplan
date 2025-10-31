// Clean Architecture - Single Application Provider
import React, { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppStoreProvider } from '@/store';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { setupAxiosInterceptors } from '@/api/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  useEffect(() => {
    // Only setup axios interceptors in production
    if (process.env.NODE_ENV !== 'development') {
      setupAxiosInterceptors();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </AppStoreProvider>
    </QueryClientProvider>
  );
};