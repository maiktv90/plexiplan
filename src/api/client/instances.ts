// Clean Architecture - API Client Instances
import { ApiClient } from '@/api';

// Check if we're in extension context (needs absolute URLs) or web context (can use proxy)
const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Backend URLs
const AUTH_BACKEND = 'http://localhost:7777';
const PLANNER_BACKEND = 'http://localhost:8081';

// Main API client for backend services (auth backend)
const mainApiBaseUrl = isExtensionContext ? AUTH_BACKEND : AUTH_BACKEND;

export const mainApiClient = new ApiClient({
  baseURL: mainApiBaseUrl,
  timeout: 10000,
});

// Auth API client (main auth service on port 7777)
const authApiBaseUrl = isExtensionContext ? `${AUTH_BACKEND}/auth` : '/auth';

export const authApiClient = new ApiClient({
  baseURL: authApiBaseUrl,
  timeout: 5000,
});

// Task management API client (planner backend on port 8081)
const taskApiBaseUrl = isExtensionContext ? `${PLANNER_BACKEND}/planner/api/v1/task` : '/planner/api/v1/task';

export const taskApiClient = new ApiClient({
  baseURL: taskApiBaseUrl,
  timeout: 8000,
});

// Time tracking API client - backend on port 8081
const timeTrackingApiBaseUrl = isExtensionContext ? `${PLANNER_BACKEND}/planner/api/v1` : '/planner/api/v1';

export const timeTrackingApiClient = new ApiClient({
  baseURL: timeTrackingApiBaseUrl,
  timeout: 30000, // 30 seconds - Bitbucket repos can take longer to load
});

// Configuration API client (planner backend on port 8081)
const configApiBaseUrl = isExtensionContext ? `${PLANNER_BACKEND}/config` : '/config';

export const configApiClient = new ApiClient({
  baseURL: configApiBaseUrl,
  timeout: 5000,
});

// Tool integrations API client (planner backend on port 8081)
const toolsApiBaseUrl = isExtensionContext ? `${PLANNER_BACKEND}/planner/api/v1/tools` : '/planner/api/v1/tools';

export const toolsApiClient = new ApiClient({
  baseURL: toolsApiBaseUrl,
  timeout: 5000,
});

// General planner API client (planner backend on port 8081, base path /api/v1)
// Use for tool-specific endpoints like /trello, /jira, /github
const plannerApiBaseUrl = isExtensionContext ? `${PLANNER_BACKEND}/planner/api/v1` : '/planner/api/v1';

export const plannerApiClient = new ApiClient({
  baseURL: plannerApiBaseUrl,
  timeout: 10000,
});