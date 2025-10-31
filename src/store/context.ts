import { createContext, type Dispatch } from 'react';
import type { AppState } from './types';
import type { AppAction } from './actions';

export type { AppAction };

export const AppStoreContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
} | undefined>(undefined);

export const AppStore = AppStoreContext;