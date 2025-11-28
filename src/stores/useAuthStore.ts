import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/types';
import {
    loginWithCredentials,
    registerWithCredentials,
    getAuthenticatedUser,
    logoutUser,
    setupAxiosInterceptors
} from '@/api/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    clearError: () => void;
    setLoading: (isLoading: boolean) => void;
    loginSuccess: (user: User) => void;
    loginFailure: (error: string) => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                isAuthenticated: false,
                isLoading: true,
                error: null,

                setLoading: (isLoading) => set({ isLoading }),
                loginSuccess: (user) => set({ user, isAuthenticated: true, isLoading: false, error: null }),
                loginFailure: (error) => set({ user: null, isAuthenticated: false, isLoading: false, error }),

                login: async (email, password) => {
                    set({ isLoading: true, error: null });
                    try {
                        const result = await loginWithCredentials(email, password);
                        if (result.success && result.user) {
                            set({
                                user: result.user,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null
                            });
                            return { success: true };
                        } else {
                            set({
                                isLoading: false,
                                error: result.error || 'Login failed'
                            });
                            return { success: false, error: result.error || 'Login failed' };
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Login failed';
                        set({
                            isLoading: false,
                            error: errorMessage
                        });
                        return { success: false, error: errorMessage };
                    }
                },

                register: async (firstName, lastName, email, password) => {
                    set({ isLoading: true, error: null });
                    try {
                        const result = await registerWithCredentials(firstName, lastName, email, password);
                        if (result.success && result.user) {
                            set({
                                user: result.user,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null
                            });
                            return { success: true };
                        } else {
                            set({
                                isLoading: false,
                                error: result.error || 'Registration failed'
                            });
                            return { success: false, error: result.error || 'Registration failed' };
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
                        set({
                            isLoading: false,
                            error: errorMessage
                        });
                        return { success: false, error: errorMessage };
                    }
                },

                logout: async () => {
                    try {
                        await logoutUser();
                    } catch (error) {
                        console.error('Logout error:', error);
                    } finally {
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: null
                        });
                    }
                },

                checkAuthStatus: async () => {
                    set({ isLoading: true });
                    try {
                        // Setup axios interceptors first
                        setupAxiosInterceptors();

                        const user = await getAuthenticatedUser();
                        if (user) {
                            set({
                                user,
                                isAuthenticated: true,
                                isLoading: false,
                                error: null
                            });
                        } else {
                            set({
                                user: null,
                                isAuthenticated: false,
                                isLoading: false,
                                error: null
                            });
                        }
                    } catch (error) {
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: 'Failed to check authentication status'
                        });
                    }
                },

                clearError: () => set({ error: null }),
            }),
            {
                name: 'auth-storage',
                partialize: (state) => ({
                    user: state.user,
                    isAuthenticated: state.isAuthenticated
                }),
            }
        )
    )
);
