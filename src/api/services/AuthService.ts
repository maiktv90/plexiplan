// Clean Architecture - Auth Service Layer
import { authApiClient } from '@/api';
import type { IUser }    from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user?: IUser;  // Optional since login might not return user details
  token: string;
  refreshToken?: string;
  email?: string;
  expiresIn?: number;
}

interface StoredTokenData {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  expiresAt?: number;
}

// Helper to check if we're in extension context
export const isExtensionContext = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// Store tokens in appropriate storage
const storeTokens = async (authResponse: AuthResponse) => {
  console.log("Start storing token")
  const tokenData = {
    accessToken: authResponse.token,
    refreshToken: authResponse.refreshToken,
    email: authResponse.email,
    expiresAt: authResponse.expiresIn ? Date.now() + (authResponse.expiresIn * 1000) : undefined
  };

  if (isExtensionContext()) {
    await chrome.storage.local.set({ 'auth_tokens': tokenData });
  } else {
    await localStorage.setItem('auth_tokens', JSON.stringify(tokenData));
    // Also store access token for backward compatibility
    await localStorage.setItem('auth_token', authResponse.token);
  }
};

// Get stored tokens
const getStoredTokens = async (): Promise<StoredTokenData | null> => {
  if (isExtensionContext()) {
    const result = await chrome.storage.local.get(['auth_tokens']);
    return result.auth_tokens || null;
  } else {
    const tokens = localStorage.getItem('auth_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }
};

// Remove tokens from appropriate storage
const removeStoredTokens = async () => {
  console.log('Clearing stored tokens...');
  if (isExtensionContext()) {
    await chrome.storage.local.remove(['auth_tokens', 'auth_token']);
    console.log('Cleared tokens from chrome.storage');
  } else {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    console.log('Cleared tokens from localStorage and sessionStorage');
  }
};

export class AuthService {
  static async login(credentials: LoginCredentials) {
    const response = await authApiClient.post<AuthResponse>('/login', credentials);

    if (response.success && response.data.token) {
      // Store both access and refresh tokens
      console.log("storing token ", )
      await storeTokens(response.data);
    }
    
    return response;
  }

  static async register(credentials: RegisterCredentials) {
    const response = await authApiClient.post<AuthResponse>('/register', credentials);
    
    if (response.success && response.data.token) {
      // Store the tokens
      await storeTokens(response.data);
    }
    
    return response;
  }

  static async logout() {
    try {
      await authApiClient.post('/logout');
    } catch (error) {
      // Log error but don't throw - we want to clear local state regardless
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens
      await removeStoredTokens();
    }
  }

  static async getCurrentUser() {
    return await authApiClient.get<IUser>('/me');
  }

  static async refreshToken() {
    const response = await authApiClient.post<{ token: string }>('/refresh');
    
    if (response.success && response.data.token) {
      await storeTokens(response.data);
    }
    
    return response;
  }

  static async validateToken() {
    return await authApiClient.get<{ valid: boolean }>('/validate');
  }

  static isAuthenticated(): boolean {
    // For synchronous check in extension context
    if (isExtensionContext()) {
      // Cannot access chrome.storage synchronously, assume not authenticated
      // Real auth status will be determined by getCurrentUser
      return false;
    } else {
      // Check both new and legacy token storage
      return !!localStorage.getItem('auth_tokens') || !!localStorage.getItem('auth_token');
    }
  }

  static getToken(): string | null {
    // Synchronous method for compatibility - only for non-extension context
    if (isExtensionContext()) {
      // Cannot access chrome.storage synchronously
      return null;
    } else {
      // Try new token storage first, fall back to legacy
      const tokens = localStorage.getItem('auth_tokens');
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          return parsed.accessToken;
        } catch {
          return localStorage.getItem('auth_token');
        }
      }
      return localStorage.getItem('auth_token');
    }
  }

  // Async method to get access token that works in extension context
  static async getAccessToken(): Promise<string | null> {
    if (isExtensionContext()) {
      const tokens = await getStoredTokens();
      return tokens?.accessToken || null;
    } else {
      return this.getToken();
    }
  }

  // Get refresh token
  static async getRefreshToken(): Promise<string | null> {
    const tokens = await getStoredTokens();
    return tokens?.refreshToken || null;
  }
}