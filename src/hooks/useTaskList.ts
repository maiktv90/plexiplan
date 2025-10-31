import { useContext } from 'react';
import { TaskListContext } from '../context/taskListContextDef';

export const useTaskList = () => {
  const context = useContext(TaskListContext);
  if (!context) {
    throw new Error('useTaskList must be used within a TaskListProvider');
  }
  return context;
};