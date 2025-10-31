import React, { type ReactNode } from 'react';
import { UserProvider } from './UserContext';
import { PopupProvider } from './PopupContext';
import { ConfigProvider } from './ConfigContext';
import { TaskListProvider } from './TaskListContext';
import { TimeTrackingProvider } from './TimeTrackingContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <PopupProvider>
        <ConfigProvider>
          <TaskListProvider>
            <TimeTrackingProvider>
              {children}
            </TimeTrackingProvider>
          </TaskListProvider>
        </ConfigProvider>
      </PopupProvider>
    </UserProvider>
  );
};