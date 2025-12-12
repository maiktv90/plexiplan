interface TaskList {
  toolKey: string;
  toolLabel: string;
  tasks: Task[];
  size: number;
}

interface Task {
  id: string;
  title: string;
  dueDateTime: string;
  priority: number;
  percentComplete: number;
  hasDescription: boolean;
  activeChecklistItemCount: number;
  url: string;
}

export type { Task, TaskList };

export interface TaskOverviewResponse {
  taskLists: TaskList[];
  hasConnectedTools: boolean;
  needsToolConfiguration: boolean;
}
