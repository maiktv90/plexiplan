import type { AppAction } from '../actions';
import type { UIState } from '../types';

// Initial state
export const uiInitialState: UIState = {
  theme: 'system',
  currentTheme: 'light',
  isPopup: false,
  isLoading: true,
  hasError: false,
  listView: false,
  expanded: {},
};

// Action types
export const UIActionType = {
  SET_THEME: 'ui/setTheme',
  SET_CURRENT_THEME: 'ui/setCurrentTheme',
  SET_IS_POPUP: 'ui/setIsPopup',
  SET_LOADING: 'ui/setLoading',
  SET_ERROR: 'ui/setError',
  SET_LIST_VIEW: 'ui/setListView',
  SET_EXPANDED: 'ui/setExpanded',
} as const

// Action creators
export const uiActions = {
  setTheme: (theme: 'light' | 'dark' | 'system') => ({
    type: UIActionType.SET_THEME,
    payload: theme,
  }),
  setCurrentTheme: (currentTheme: 'light' | 'dark') => ({
    type: UIActionType.SET_CURRENT_THEME,
    payload: currentTheme,
  }),
  setIsPopup: (isPopup: boolean) => ({
    type: UIActionType.SET_IS_POPUP,
    payload: isPopup,
  }),
  setLoading: (isLoading: boolean) => ({
    type: UIActionType.SET_LOADING,
    payload: isLoading,
  }),
  setError: (hasError: boolean) => ({
    type: UIActionType.SET_ERROR,
    payload: hasError,
  }),
  setListView: (listView: boolean) => ({
    type: UIActionType.SET_LIST_VIEW,
    payload: listView,
  }),
  setExpanded: (toolKey: string, expanded: boolean) => ({
    type: UIActionType.SET_EXPANDED,
    payload: { toolKey, expanded },
  }),
};

// Action type
export type UIAction = ReturnType<typeof uiActions[keyof typeof uiActions]>;

// Reducer
export const uiReducer = (state: UIState, action: AppAction): UIState => {
  switch (action.type) {
    case UIActionType.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };
    case UIActionType.SET_CURRENT_THEME:
      return {
        ...state,
        currentTheme: action.payload,
      };
    case UIActionType.SET_IS_POPUP:
      return {
        ...state,
        isPopup: action.payload,
      };
    case UIActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case UIActionType.SET_ERROR:
      return {
        ...state,
        hasError: action.payload,
      };
    case UIActionType.SET_LIST_VIEW:
      return {
        ...state,
        listView: action.payload,
      };
    case UIActionType.SET_EXPANDED:
      return {
        ...state,
        expanded: {
          ...state.expanded,
          [action.payload.toolKey]: action.payload.expanded,
        },
      };
    default:
      return state;
  }
};