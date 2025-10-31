import React, { useReducer, type ReactNode } from 'react';
import type { AppState } from './types';
import { authReducer, authInitialState } from './slices/authSlice';
import { uiReducer, uiInitialState } from './slices/uiSlice';
import { timeTrackingReducer, timeTrackingInitialState } from './slices/timeTrackingSlice';
import { configReducer, configInitialState } from './slices/configSlice';
import { AppStoreContext, type AppAction } from './context';

// Root reducer combining all slices
const appReducer = (state: AppState, action: AppAction): AppState => ({
  auth: authReducer(state.auth, action),
  ui: uiReducer(state.ui, action),
  timeTracking: timeTrackingReducer(state.timeTracking, action),
  config: configReducer(state.config, action),
});

// Initial app state
const initialState: AppState = {
  auth: authInitialState,
  ui: uiInitialState,
  timeTracking: timeTrackingInitialState,
  config: configInitialState,
};

// Provider component
interface AppStoreProviderProps {
  children: ReactNode;
}

export const AppStoreProvider: React.FC<AppStoreProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStoreContext.Provider>
  );
};