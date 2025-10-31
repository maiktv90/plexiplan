// Clean Architecture - Auth Guard Feature Component
import React, { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { isExtensionContext } from '@/api';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isExtensionContext()) {
      window.location.hash = `#${redirectTo}`;
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isExtensionContext()) {
      return null; // The useEffect will handle the redirect
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};