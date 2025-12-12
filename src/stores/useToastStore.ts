import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'reconnect';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  provider?: string;  // For reconnect toasts
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>()(
  devtools(
    (set) => ({
      toasts: [],

      addToast: (toast) => {
        const id = `toast-${++toastId}`;
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration ?? 5000,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, newToast.duration);
        }
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),
    }),
    { name: 'toast-store' }
  )
);

// Convenience functions
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  /**
   * Show a reconnect toast with an action button to go to settings
   */
  reconnect: (provider: string, onReconnect?: () => void) =>
    useToastStore.getState().addToast({
      type: 'reconnect',
      title: `${provider} connection expired`,
      message: 'Your session has expired. Please reconnect to continue.',
      duration: 0, // Don't auto-dismiss
      provider,
      action: onReconnect ? {
        label: 'Reconnect',
        onClick: onReconnect,
      } : undefined,
    }),
};
