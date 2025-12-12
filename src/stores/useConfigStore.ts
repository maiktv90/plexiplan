import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { IUser } from '@/types';

export interface ToolState {
    isLoading: boolean;
    hasError: boolean;
    error?: string;
    user: IUser;
}

export interface ToolStateParams {
    clientRegistrationId: string;
    isLoading: boolean;
    hasError: boolean;
    error?: string;
    user: IUser;
}

interface ConfigState {
    isLoading: boolean;
    toolStates: Record<string, ToolState>;

    // Actions
    setLoading: (isLoading: boolean) => void;
    setToolState: (params: ToolStateParams) => void;
}

export const useConfigStore = create<ConfigState>()(
    devtools(
        (set) => ({
            isLoading: false,
            toolStates: {},

            setLoading: (isLoading) => set({ isLoading }),

            setToolState: (params) =>
                set((state) => ({
                    toolStates: {
                        ...state.toolStates,
                        [params.clientRegistrationId]: {
                            isLoading: params.isLoading,
                            hasError: params.hasError,
                            error: params.error,
                            user: params.user,
                        },
                    },
                })),
        }),
        { name: 'config-store' }
    )
);
