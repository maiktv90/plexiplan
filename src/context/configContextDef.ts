import { createContext } from 'react';
import type { IUser } from '../utils/types/common.types';

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

export interface ConfigState {
  isLoading: boolean;
  toolStates: Record<string, ToolState>;
}

export interface ConfigContextType extends ConfigState {
  setIsLoading: (isLoading: boolean) => void;
  setToolState: (params: ToolStateParams) => void;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);