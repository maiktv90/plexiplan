import { useQuery } from '@tanstack/react-query';
import { pmApiUrl, taskApiPath } from '../config/pm.config';
import type { Task, TaskList } from '../utils/types/pm.types';

interface TaskParams {
  taskId: string;
  clientRegistrationId: string;
}

// Fetch functions
const fetchTaskList = () => fetch(`${pmApiUrl}/${taskApiPath}`).then(res => res.json());

const fetchTask = ({ taskId, clientRegistrationId }: TaskParams) =>
  fetch(`${pmApiUrl}/${taskApiPath}/${clientRegistrationId}/${taskId}`).then(res => res.json());

const fetchTaskDetails = ({ taskId, clientRegistrationId }: TaskParams) =>
  fetch(`${pmApiUrl}/${taskApiPath}/${clientRegistrationId}/${taskId}/details`).then(res => res.json());

const fetchIssueStatuses = (clientRegistrationId: string) =>
  fetch(`${pmApiUrl}/${taskApiPath}/statuses/${clientRegistrationId}`).then(res => res.json());

// React Query hooks
export const useGetTaskListQuery = () => useQuery<TaskList[]>({
  queryKey: ['taskList'],
  queryFn: fetchTaskList
});

export const useGetTaskQuery = (params: TaskParams, enabled = true) =>
  useQuery<Task>({
    queryKey: ['task', params.clientRegistrationId, params.taskId],
    queryFn: () => fetchTask(params),
    enabled
  });

export const useGetTaskDetailsQuery = (params: TaskParams, enabled = true) =>
  useQuery({
    queryKey: ['taskDetails', params.clientRegistrationId, params.taskId],
    queryFn: () => fetchTaskDetails(params),
    enabled
  });

export const useGetIssueStatusesQuery = (clientRegistrationId: string, enabled = true) =>
  useQuery({
    queryKey: ['issueStatuses', clientRegistrationId],
    queryFn: () => fetchIssueStatuses(clientRegistrationId),
    enabled
  });

export const invalidateTaskApiCache = () => {
  console.warn('invalidateTaskApiCache needs to be called within a React component with useQueryClient');
};
