export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAuthenticated: boolean;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  username: string;
  isAuthenticated: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface PullRequest {
  id: string;
  title: string;
  repository: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  createdAt: Date;
  url: string;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  isRunning: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSync: boolean;
  githubToken?: string;
  defaultTimerDuration: number;
}

export interface AppState {
  isExtension: boolean;
  isExpanded: boolean;
  currentView: 'dashboard' | 'tasks' | 'pull-requests' | 'time-tracking' | 'settings';
}

// Re-export booking types
export * from './booking.types';

// Re-export tool types
export * from './tool.types';