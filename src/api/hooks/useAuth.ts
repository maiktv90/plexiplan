// Clean Architecture - Auth Hooks with Service Layer
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService, type LoginCredentials, type RegisterCredentials } from '../services/AuthService';
import { useAuthStore } from '@/stores/useAuthStore';

const authService = AuthService;

export const useAuthQuery = () => {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get current user');
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const { loginFailure, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      setLoading(true);
      const response = await authService.login(credentials);
      console.log({ response })
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Login failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
    },
    onError: (error: Error) => {
      loginFailure(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const { loginSuccess, loginFailure, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      setLoading(true);
      const response = await authService.register(credentials);

      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Registration failed');
    },
    onSuccess: (data) => {
      if (data?.user) {
        console.log("auth done ", data.user);
        loginSuccess(data.user);
        queryClient.setQueryData(['auth', 'currentUser'], data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error: Error) => {
      loginFailure(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      queryClient.removeQueries({ queryKey: ['auth', 'currentUser'] });
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      logout();
      queryClient.removeQueries({ queryKey: ['auth', 'currentUser'] });
    },
  });
};

export const useValidateTokenQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['auth', 'validateToken'],
    queryFn: async () => {
      const response = await authService.validateToken();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Token validation failed');
    },
    enabled: enabled && authService.isAuthenticated(),
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};