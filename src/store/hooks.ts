import { useContext, useCallback } from 'react';
import { AppStoreContext } from './context';
import type { IUser } from '@/types';
import { authActions } from './slices/authSlice';
import { uiActions } from './slices/uiSlice';
import { timeTrackingActions } from './slices/timeTrackingSlice';
import { configActions, type ToolStateParams } from './slices/configSlice';
import type { IBooking, CouchDb } from '@/components/TimeTracking/types';

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};

// Custom hook with business logic
export const useAuthStore = () => {
  const { state, dispatch } = useAppStore();

  const setLoading = useCallback((isLoading: boolean) => dispatch(authActions.setLoading(isLoading)), [dispatch]);
  const loginSuccess = useCallback((user: IUser) => dispatch(authActions.loginSuccess(user)), [dispatch]);
  const loginFailure = useCallback((error: string) => dispatch(authActions.loginFailure(error)), [dispatch]);
  const logout = useCallback(() => dispatch(authActions.logout()), [dispatch]);
  const setError = useCallback((error: string) => dispatch(authActions.setError(error)), [dispatch]);
  const clearError = useCallback(() => dispatch(authActions.clearError()), [dispatch]);

  return {
    // State
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
    isLoading: state.auth.isLoading,
    error: state.auth.error,
    
    // Actions
    setLoading,
    loginSuccess,
    loginFailure,
    logout,
    setError,
    clearError,
  };
};

// Custom hook with UI logic
export const useUIStore = () => {
  const { state, dispatch } = useAppStore();
  
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => dispatch(uiActions.setTheme(theme)), [dispatch]);
  const setCurrentTheme = useCallback((currentTheme: 'light' | 'dark') => dispatch(uiActions.setCurrentTheme(currentTheme)), [dispatch]);
  const setIsPopup = useCallback((isPopup: boolean) => dispatch(uiActions.setIsPopup(isPopup)), [dispatch]);
  const setLoading = useCallback((isLoading: boolean) => dispatch(uiActions.setLoading(isLoading)), [dispatch]);
  const setError = useCallback((hasError: boolean) => dispatch(uiActions.setError(hasError)), [dispatch]);
  const setListView = useCallback((listView: boolean) => dispatch(uiActions.setListView(listView)), [dispatch]);
  const setExpanded = useCallback((toolKey: string, expanded: boolean) => dispatch(uiActions.setExpanded(toolKey, expanded)), [dispatch]);

  return {
    // State
    ...state.ui,
    
    // Actions
    setTheme,
    setCurrentTheme,
    setIsPopup,
    setLoading,
    setError,
    setListView,
    setExpanded,
  };
};

// Custom hook with domain logic
export const useTimeTrackingStore = () => {
  const { state, dispatch } = useAppStore();

  const setBooking = useCallback((booking: IBooking) => dispatch(timeTrackingActions.setBooking(booking)), [dispatch]);
  const setBookingList = useCallback((bookingList: IBooking[]) => dispatch(timeTrackingActions.setBookingList(bookingList)), [dispatch]);
  const setSelectedBooking = useCallback((selectedBooking: number) => dispatch(timeTrackingActions.setSelectedBooking(selectedBooking)), [dispatch]);
  const setBookingDbConf = useCallback((dbConf: CouchDb) => dispatch(timeTrackingActions.setBookingDbConf(dbConf)), [dispatch]);
  const setDbTokenInvalid = useCallback((isInvalid: boolean) => dispatch(timeTrackingActions.setDbTokenInvalid(isInvalid)), [dispatch]);

  return {
    // State
    ...state.timeTracking,
    
    // Actions
    setBooking,
    setBookingList,
    setSelectedBooking,
    setBookingDbConf,
    setDbTokenInvalid,
  };
};

// Custom hook with configuration logic
export const useConfigStore = () => {
  const { state, dispatch } = useAppStore();

  const setLoading = useCallback((isLoading: boolean) => dispatch(configActions.setLoading(isLoading)), [dispatch]);
  const setToolState = useCallback((params: ToolStateParams) => dispatch(configActions.setToolState(params)), [dispatch]);

  return {
    // State
    ...state.config,
    
    // Actions
    setLoading,
    setToolState,
  };
};