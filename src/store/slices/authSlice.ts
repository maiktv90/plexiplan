import type { AppAction } from '../actions';
import type { AuthState } from '../types';
import type { IUser } from '@/types';

// Initial state
export const authInitialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
export const AuthActionType = {
  SET_LOADING: 'auth/setLoading',
  LOGIN_SUCCESS: 'auth/loginSuccess',
  LOGIN_FAILURE: 'auth/loginFailure',
  LOGOUT: 'auth/logout',
  SET_ERROR: 'auth/setError',
  CLEAR_ERROR: 'auth/clearError',
} as const

// Action creators
export const authActions = {
  setLoading: (isLoading: boolean) => ({
    type: AuthActionType.SET_LOADING,
    payload: isLoading,
  }),
  loginSuccess: (user: IUser) => ({
    type: AuthActionType.LOGIN_SUCCESS,
    payload: user,
  }),
  loginFailure: (error: string) => ({
    type: AuthActionType.LOGIN_FAILURE,
    payload: error,
  }),
  logout: () => ({
    type: AuthActionType.LOGOUT,
  }),
  setError: (error: string) => ({
    type: AuthActionType.SET_ERROR,
    payload: error,
  }),
  clearError: () => ({
    type: AuthActionType.CLEAR_ERROR,
  }),
};

// Action type
export type AuthAction = ReturnType<typeof authActions[keyof typeof authActions]>;

// Reducer
export const authReducer = (state: AuthState, action: AppAction): AuthState => {
  switch (action.type) {
    case AuthActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AuthActionType.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AuthActionType.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case AuthActionType.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AuthActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    case AuthActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};