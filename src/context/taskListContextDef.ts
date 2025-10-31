import { createContext } from 'react';

interface TaskListState {
  listView: boolean;
  expanded: Record<string, boolean>;
}

export interface SetExpandedAction {
  toolKey: string;
  expanded: boolean;
}

interface TaskListContextType extends TaskListState {
  setListView: (listView: boolean) => void;
  setExpanded: (action: SetExpandedAction) => void;
}

export const TaskListContext = createContext<TaskListContextType | undefined>(undefined);