// Clean Architecture - Task Hooks with Service Layer
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TaskService, 
  type TaskParams, 
  type CreateTaskParams, 
  type UpdateTaskParams 
} from '../services/TaskService';

export const useTaskListQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['tasks', 'list'],
    queryFn: async () => {
      const response = await TaskService.getTaskList();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch task list');
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTaskQuery = (params: TaskParams, enabled = true) => {
  return useQuery({
    queryKey: ['tasks', 'detail', params.clientRegistrationId, params.taskId],
    queryFn: async () => {
      const response = await TaskService.getTask(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch task');
    },
    enabled: enabled && !!params.taskId && !!params.clientRegistrationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTaskDetailsQuery = (params: TaskParams, enabled = true) => {
  return useQuery({
    queryKey: ['tasks', 'details', params.clientRegistrationId, params.taskId],
    queryFn: async () => {
      const response = await TaskService.getTaskDetails(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch task details');
    },
    enabled: enabled && !!params.taskId && !!params.clientRegistrationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useIssueStatusesQuery = (clientRegistrationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['tasks', 'statuses', clientRegistrationId],
    queryFn: async () => {
      const response = await TaskService.getIssueStatuses(clientRegistrationId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch issue statuses');
    },
    enabled: enabled && !!clientRegistrationId,
    staleTime: 10 * 60 * 1000, // 10 minutes (statuses change rarely)
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      const response = await TaskService.createTask(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to create task');
    },
    onSuccess: (_, variables) => {
      // Invalidate task list and specific client tasks
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', 'detail', variables.clientRegistrationId] 
      });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateTaskParams) => {
      const response = await TaskService.updateTask(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to update task');
    },
    onSuccess: (data, variables) => {
      // Update specific task in cache
      queryClient.setQueryData(
        ['tasks', 'detail', variables.clientRegistrationId, variables.taskId],
        data
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', 'details', variables.clientRegistrationId, variables.taskId] 
      });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TaskParams) => {
      const response = await TaskService.deleteTask(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to delete task');
    },
    onSuccess: (_, variables) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ 
        queryKey: ['tasks', 'detail', variables.clientRegistrationId, variables.taskId] 
      });
      queryClient.removeQueries({ 
        queryKey: ['tasks', 'details', variables.clientRegistrationId, variables.taskId] 
      });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
    },
  });
};

export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TaskParams & { status: string }) => {
      const response = await TaskService.updateTaskStatus(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to update task status');
    },
    onSuccess: (data, variables) => {
      // Update task in cache
      queryClient.setQueryData(
        ['tasks', 'detail', variables.clientRegistrationId, variables.taskId],
        data
      );
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
    },
  });
};