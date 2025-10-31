// Clean Architecture - API Client Instances
import { ApiClient } from '@/api';

// Main API client for backend services
export const mainApiClient = new ApiClient({
  baseURL: 'http://localhost:7777',
  timeout: 10000,
});

// Auth API client
export const authApiClient = new ApiClient({
  baseURL: 'http://localhost:7777/auth',
  timeout: 5000,
});

// Task management API client
export const taskApiClient = new ApiClient({
  baseURL: 'http://localhost:8081/tasks',
  timeout: 8000,
});

// Configuration API client
export const configApiClient = new ApiClient({
  baseURL: 'http://localhost:8081/config',
  timeout: 5000,
});