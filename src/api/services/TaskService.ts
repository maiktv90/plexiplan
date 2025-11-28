// Clean Architecture - Task Service Layer
import { taskApiClient } from '../client/instances';
import type { Task, TaskOverviewResponse } from '@/utils/types/pm.types';

export interface TaskParams {
  taskId: string;
  clientRegistrationId: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  clientRegistrationId: string;
}

export interface UpdateTaskParams extends TaskParams {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: string;
}

export class TaskService {
  static async getTaskList() {
    return await taskApiClient.get<TaskOverviewResponse>('/overview');
  }

  static async getTask(params: TaskParams) {
    const { taskId, clientRegistrationId } = params;
    return await taskApiClient.get<Task>(`/${clientRegistrationId}/${taskId}`);
  }

  static async getTaskDetails(params: TaskParams) {
    const { taskId, clientRegistrationId } = params;
    return await taskApiClient.get(`/${clientRegistrationId}/${taskId}/details`);
  }

  static async getIssueStatuses(clientRegistrationId: string) {
    return await taskApiClient.get(`/statuses/${clientRegistrationId}`);
  }

  static async createTask(params: CreateTaskParams) {
    const { clientRegistrationId, ...taskData } = params;
    return await taskApiClient.post<Task>(`/${clientRegistrationId}`, taskData);
  }

  static async updateTask(params: UpdateTaskParams) {
    const { taskId, clientRegistrationId, ...updateData } = params;
    return await taskApiClient.put<Task>(`/${clientRegistrationId}/${taskId}`, updateData);
  }

  static async deleteTask(params: TaskParams) {
    const { taskId, clientRegistrationId } = params;
    return await taskApiClient.delete(`/${clientRegistrationId}/${taskId}`);
  }

  static async assignTask(params: TaskParams & { assigneeId: string }) {
    const { taskId, clientRegistrationId, assigneeId } = params;
    return await taskApiClient.patch(`/${clientRegistrationId}/${taskId}/assign`, { assigneeId });
  }

  static async updateTaskStatus(params: TaskParams & { status: string }) {
    const { taskId, clientRegistrationId, status } = params;
    return await taskApiClient.patch(`/${clientRegistrationId}/${taskId}/status`, { status });
  }
}