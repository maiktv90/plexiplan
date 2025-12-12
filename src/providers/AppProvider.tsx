// Clean Architecture - Single Application Provider
import React, { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupAxiosInterceptors } from '@/api/auth';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { initializeToolProviders } from '@/providers/tools';

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
  const initTheme = useUIStore((state) => state.initTheme);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    // Initialize theme
    initTheme();

    // Check auth status
    checkAuthStatus();

    // Initialize tool providers (Trello, Jira, GitHub, etc.)
    initializeToolProviders();

    // Only setup axios interceptors in production
    if (process.env.NODE_ENV !== 'development') {
      setupAxiosInterceptors();
    }
  }, [initTheme, checkAuthStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};