import React, { useState, type ReactNode } from 'react';
import { TaskListContext, type SetExpandedAction } from './taskListContextDef';

interface TaskListProviderProps {
  children: ReactNode;
}

export const TaskListProvider: React.FC<TaskListProviderProps> = ({ children }) => {
  const [listView, setListView] = useState<boolean>(false);
  const [expanded, setExpandedState] = useState<Record<string, boolean>>({});

  const setExpanded = (action: SetExpandedAction) => {
    setExpandedState(prev => ({
      ...prev,
      [action.toolKey]: action.expanded
    }));
  };

  return (
    <TaskListContext.Provider
      value={{
        listView,
        expanded,
        setListView,
        setExpanded,
      }}
    >
      {children}
    </TaskListContext.Provider>
  );
};