import React, { type ReactNode, useState, useEffect } from 'react';
import type { AuthState } from '@/types';
import { 
  loginWithCredentials, 
  registerWithCredentials, 
  getAuthenticatedUser, 
  logoutUser,
  setupAxiosInterceptors 
} from '@/api/auth';
import { AuthContext } from './authContextDef';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Setup axios interceptors
    setupAxiosInterceptors();
    
    // Check if user is already authenticated
    void checkAuthStatusInternal();
  }, []);

  const checkAuthStatusInternal = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Check with backend using stored JWT token
      const user = await getAuthenticatedUser();
      
      if (user) {
        setAuthState({
          user,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      setAuthState({
        user: null,
        isLoading: false,
        error: 'Failed to check authentication status',
      });
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Use JWT-based login with credentials
      const result = await loginWithCredentials(email, password);
      
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isLoading: false,
          error: null,
        });
        return { success: true };
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          error: result.error || 'Login failed',
        });
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Use JWT-based registration with credentials
      const result = await registerWithCredentials(firstName, lastName, email, password);
      
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isLoading: false,
          error: null,
        });
        return { success: true };
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          error: result.error || 'Registration failed',
        });
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState({
        user: null,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const authValue = {
    ...authState,
    login,
    logout,
    register,
    checkAuthStatus: checkAuthStatusInternal,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};