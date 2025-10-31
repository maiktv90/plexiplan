import type { AuthAction } from './slices/authSlice';
import type { UIAction } from './slices/uiSlice';
import type { TimeTrackingAction } from './slices/timeTrackingSlice';
import type { ConfigAction } from './slices/configSlice';

export type AppAction = AuthAction | UIAction | TimeTrackingAction | ConfigAction;
