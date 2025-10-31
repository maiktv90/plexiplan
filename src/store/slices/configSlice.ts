// Clean Architecture - Configuration Domain Slice
import type { ConfigState } from '../types';
import type { IUser } from '@/types';
import type { AppAction } from '../actions';

// Initial state
export const configInitialState: ConfigState = {
  isLoading: false,
  toolStates: {},
};

// Action types
export const ConfigActionType = {
  SET_LOADING: 'config/setLoading',
  SET_TOOL_STATE: 'config/setToolState',
} as const

// Tool state interface
export interface ToolStateParams {
  clientRegistrationId: string;
  isLoading: boolean;
  hasError: boolean;
  error?: string;
  user: IUser;
}

// Action creators
export const configActions = {
  setLoading: (isLoading: boolean) => ({
    type: ConfigActionType.SET_LOADING,
    payload: isLoading,
  }),
  setToolState: (params: ToolStateParams) => ({
    type: ConfigActionType.SET_TOOL_STATE,
    payload: params,
  }),
};

export type ConfigAction = ReturnType<typeof configActions[keyof typeof configActions]>;

// Reducer
export const configReducer = (state: ConfigState, action: AppAction): ConfigState => {
  switch (action.type) {
    case ConfigActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case ConfigActionType.SET_TOOL_STATE:
      return {
        ...state,
        toolStates: {
          ...state.toolStates,
          [action.payload.clientRegistrationId]: {
            isLoading: action.payload.isLoading,
            hasError: action.payload.hasError,
            error: action.payload.error,
            user: action.payload.user,
          },
        },
      };
    default:
      return state;
  }
};