// Clean Architecture - Standardized API Client
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { getCsrfToken }                                                           from '@/utils/auth.utils';

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiConfig) {
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      withCredentials: true,  // Required for cookies to be sent/received
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth and CSRF
    this.client.interceptors.request.use(
      async (config) => {
        // Add JWT token if available
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('ApiClient: No token available for request');
        }

        // Add CSRF token for non-GET requests (except login endpoint)
        if (config.method !== 'get' && !config.url?.includes('/login') && !config.url?.includes('/logout')) {
          try {
            const csrfToken = await getCsrfToken();
            if (csrfToken) {
              config.headers['X-XSRF-TOKEN'] = csrfToken;
            }
          } catch (error) {
            console.warn('Failed to get CSRF token:', error);
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        // Log the error for debugging
        console.error('API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data
        });
        
        // Handle common HTTP errors
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Use existing Keycloak token for all authenticated requests
      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        // Try new token storage first
        const result = await chrome.storage.local.get(['auth_tokens']);
        if (result.auth_tokens?.accessToken) {
          return result.auth_tokens.accessToken;
        }
        // Fall back to legacy storage
        const legacyResult = await chrome.storage.local.get(['auth_token']);
        return legacyResult.auth_token || null;
      } else {
        // Try new token storage first
        const tokens = localStorage.getItem('auth_tokens');
        if (tokens) {
          try {
            const parsed = JSON.parse(tokens);
            if (parsed.accessToken) return parsed.accessToken;
          } catch (e) {
            console.error('ApiClient: Error parsing auth_tokens:', e);
            // Suppress JSON parsing errors
          }
        } else {
          console.log('ApiClient: No auth_tokens in localStorage');
        }
        // Fall back to legacy storage
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      }
    } catch (error) {
      console.error('ApiClient: Error getting auth token:', error);
      return null;
    }
  }

  private async handleUnauthorized() {
    // Clear tokens but DON'T redirect automatically
    // Let the AuthProvider handle the redirect logic
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      await chrome.storage.local.remove(['auth_tokens', 'auth_token']);
    } else {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }

    // Don't redirect here - causes infinite loops
    // The AuthProvider will handle routing based on auth state
  }

  private normalizeError(error: unknown): ApiResponse {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        let errorMessage = error.response.data?.message || error.response.statusText || 'An error occurred';
        
        // Handle specific status codes
        if (status === 404) {
          errorMessage = `404: ${errorMessage}`;
        } else if (status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        }
        
        return {
          data: null,
          success: false,
          error: errorMessage,
          message: error.response.data?.message,
        };
      } else if (error.request) {
        return {
          data: null,
          success: false,
          error: 'Network error - please check your connection',
        };
      }
    }
    if (error instanceof Error) {
      return {
        data: null,
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
    return {
      data: null,
      success: false,
      error: 'An unexpected error occurred',
    };
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      // If the interceptor already normalized the error, return it
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ApiResponse<T>;
      }
      // Otherwise normalize it
      return this.normalizeError(error) as ApiResponse<T>;
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ApiResponse<T>;
      }
      return this.normalizeError(error) as ApiResponse<T>;
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ApiResponse<T>;
      }
      return this.normalizeError(error) as ApiResponse<T>;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ApiResponse<T>;
      }
      return this.normalizeError(error) as ApiResponse<T>;
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'success' in error) {
        return error as ApiResponse<T>;
      }
      return this.normalizeError(error) as ApiResponse<T>;
    }
  }

  // Raw axios instance for advanced use cases
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}