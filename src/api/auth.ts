import axios from 'axios';
import { 
  deletePATUrl, 
  logoutUrl, 
  registerPATUrl, 
  loginUrl,
  keycloakClientRegistrationId,
  authUrl 
} from '../config/auth.config';
import { getCsrfToken, checkAuthStatus } from '../utils/auth.utils';
import type { User } from '../types';

// Helper function to check if we're running in extension context
const isExtensionContext = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

export interface IUser {
  id: string;
  email: string;
  name: string;
  username: string;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  email: string;
  expiresIn: number;
}

export interface TokenStorage {
  accessToken: string;
  refreshToken?: string;
  email: string;
  expiresAt: number;
}

// Token storage utilities for extension - use same key as AuthService
const TOKEN_STORAGE_KEY = 'auth_tokens';

export const storeTokens = async (authResponse: AuthResponse): Promise<void> => {
  const tokenData: TokenStorage = {
    accessToken: authResponse.token,
    refreshToken: authResponse.refreshToken,
    email: authResponse.email,
    expiresAt: Date.now() + (authResponse.expiresIn * 1000)
  };

  if (isExtensionContext()) {
    await chrome.storage.local.set({ 
      [TOKEN_STORAGE_KEY]: tokenData,
      'auth_token': authResponse.token // Legacy compatibility
    });
  } else {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    localStorage.setItem('auth_token', authResponse.token); // Legacy compatibility
  }
};

export const getStoredTokens = async (): Promise<TokenStorage | null> => {
  try {
    if (isExtensionContext()) {
      const result = await chrome.storage.local.get([TOKEN_STORAGE_KEY]);
      return result[TOKEN_STORAGE_KEY] || null;
    } else {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    }
  } catch (error) {
    console.error('Failed to get stored tokens:', error);
    return null;
  }
};

export const clearStoredTokens = async (): Promise<void> => {
  if (isExtensionContext()) {
    await chrome.storage.local.remove([TOKEN_STORAGE_KEY, 'auth_token']);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
};

export const isTokenValid = (tokenData: TokenStorage): boolean => {
  return Date.now() < tokenData.expiresAt;
};

// New JWT-based authentication functions
export const loginWithCredentials = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    // Use relative URL to work with Vite proxy in development
    const loginEndpoint = isExtensionContext() ? `${authUrl}/login` : '/auth/login';
    const response = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      return { success: false, error: errorData.message || 'Login failed' };
    }

    const authResponse: AuthResponse = await response.json();
    await storeTokens(authResponse);

    // Create user object from response
    const user: User = {
      id: authResponse.email,
      email: authResponse.email,
      name: authResponse.email, // Backend doesn't return name in login response
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authResponse.email}`,
      isAuthenticated: true,
    };

    return { success: true, user };
  } catch (error: unknown) {
    console.error('Login failed:', error);
    const errorMessage = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message || 
                         (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error || 
                         'Login failed';
    return { success: false, error: errorMessage };
  }
};

export const registerWithCredentials = async (firstName: string, lastName: string, email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    // Use fetch instead of axios for Chrome extension to bypass CORS
    const response = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
      return { success: false, error: errorData.message || 'Registration failed' };
    }

    const authResponse: AuthResponse = await response.json();
    await storeTokens(authResponse);

    // Create user object from response
    const user: User = {
      id: authResponse.email,
      email: authResponse.email,
      name: `${firstName} ${lastName}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authResponse.email}`,
      isAuthenticated: true,
    };

    return { success: true, user };
  } catch (error: unknown) {
    console.error('Registration failed:', error);
    const errorMessage = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message || 
                         (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error || 
                         'Registration failed';
    return { success: false, error: errorMessage };
  }
};

export const refreshToken = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const tokenData = await getStoredTokens();
    if (!tokenData?.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    // Use fetch instead of axios for Chrome extension to bypass CORS
    const response = await fetch(`${authUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: tokenData.refreshToken
      })
    });

    if (!response.ok) {
      await clearStoredTokens();
      return { success: false, error: 'Token refresh failed' };
    }

    const authResponse: AuthResponse = await response.json();
    await storeTokens(authResponse);

    return { success: true };
  } catch (error: unknown) {
    console.error('Token refresh failed:', error);
    await clearStoredTokens();
    return { success: false, error: 'Token refresh failed' };
  }
};

export const getAuthenticatedUser = async (): Promise<User | null> => {
  try {
    const tokenData = await getStoredTokens();
    if (!tokenData) {
      return null;
    }

    // Check if token is expired
    if (!isTokenValid(tokenData)) {
      // Try to refresh token
      const refreshResult = await refreshToken();
      if (!refreshResult.success) {
        return null;
      }
      // Get updated token data
      const updatedTokenData = await getStoredTokens();
      if (!updatedTokenData) {
        return null;
      }
    }

    // Return user info from stored token data
    return {
      id: tokenData.email,
      email: tokenData.email,
      name: tokenData.email, // We don't store name in token data currently
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tokenData.email}`,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    // Call backend logout endpoint
    const tokenData = await getStoredTokens();
    if (tokenData) {
      try {
        await axios.post(`${authUrl}/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${tokenData.accessToken}`
          }
        });
      } catch (error) {
        console.error('Backend logout failed:', error);
      }
    }
  } finally {
    // Always clear stored tokens
    await clearStoredTokens();
    clearLocalStorage();
  }
};

// Setup axios interceptor to automatically include JWT token
export const setupAxiosInterceptors = () => {
  // Request interceptor to add auth header
  axios.interceptors.request.use(async (config) => {
    const tokenData = await getStoredTokens();
    if (tokenData && isTokenValid(tokenData)) {
      config.headers.Authorization = `Bearer ${tokenData.accessToken}`;
    }
    return config;
  });

  // Response interceptor to handle token expiration
  axios.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        if (axiosError.response?.status === 401) {
          // Token expired, try to refresh
          const refreshResult = await refreshToken();
          if (refreshResult.success) {
            // Retry the original request with new token
            const tokenData = await getStoredTokens();
            if (tokenData && axiosError.config) {
              axiosError.config.headers.Authorization = `Bearer ${tokenData.accessToken}`;
              return axios.request(axiosError.config);
            }
          } else {
            // Refresh failed, logout user
            await clearStoredTokens();
          }
        }
      }
      return Promise.reject(error);
    }
  );
};

export const openLoginPage = async (loginPageUrl: string): Promise<void> => {
  if (isExtensionContext()) {
    // For extension context, open login in new tab and start polling for auth status
    const tab = await chrome.tabs.create({ url: loginPageUrl });
    
    // Start polling for authentication status
    return new Promise((resolve, reject) => {
      let pollCount = 0;
      const maxPolls = 150; // 5 minutes with 2-second intervals
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          
          // Check if tab still exists
          if (tab.id) {
            try {
              await chrome.tabs.get(tab.id);
            } catch {
              // Tab was closed by user, stop polling
              clearInterval(pollInterval);
              resolve();
              return;
            }
          }
          
          const user = await refreshAuthState();
          if (user) {
            // User is authenticated, close the login tab and resolve
            if (tab.id) {
              try {
                await chrome.tabs.remove(tab.id);
              } catch (error) {
                console.log('Could not close login tab:', error);
              }
            }
            clearInterval(pollInterval);
            resolve();
            return;
          }
          
          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            if (tab.id) {
              try {
                await chrome.tabs.remove(tab.id);
              } catch (error) {
                console.log('Could not close login tab:', error);
              }
            }
            reject(new Error('Authentication timeout'));
          }
        } catch (error) {
          console.log('Polling for auth status:', error);
          pollCount++;
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            reject(error);
          }
        }
      }, 2000); // Poll every 2 seconds
    });
  } else {
    window.location.assign(loginPageUrl);
  }
};

export const openKeycloakLogin = async () => {
  return openLoginPage(loginUrl);
};

export const logout = async (
  clientKey: string,
  _userUrl: string,
  userLoggedOutCallback: () => unknown,
) => {
  const csrf = await getCsrfToken();
  if (csrf) {
    axios
      .post(
        logoutUrl,
        { withCredentials: true },
        {
          headers: {
            'X-XSRF-TOKEN': csrf,
          },
          params: {
            client: clientKey,
          },
        },
      )
      .then(() => {
        assertUserIsLoggedOut();
        clearLocalStorage();
        userLoggedOutCallback();
      })
      .catch((error) => {
        console.log(error);
      });
  }
};

/**
 * Clear localStorage data on logout to prevent data conflicts between users
 */
const clearLocalStorage = () => {
  // Clear specific plexify data
  localStorage.removeItem('plexify_user');
  localStorage.removeItem('plexify_time_entries');
  localStorage.removeItem('plexify_tasks');
  localStorage.removeItem('plexify_settings');
};

const assertUserIsLoggedOut = async () => {
  const result = await checkAuthStatus(keycloakClientRegistrationId);
  assert(result == null, 'Logout failed!');
};

function assert(condition: boolean, msg?: string): asserts condition {
  if (condition === false) throw new Error(msg);
}

export const deletePersonalAccessToken = async (
  client: string,
  tokenRemovedCallback: () => void,
) => {
  const csrf = await getCsrfToken();
  return axios
    .delete(`${deletePATUrl}/${client}`, {
      withCredentials: true,
      headers: {
        'X-XSRF-TOKEN': csrf,
      },
    })
    .then(() => {
      tokenRemovedCallback();
    })
    .catch((error) => {
      console.log(error);
    });
};

async function savePATWithData(
  data: Record<string, unknown>,
  csrf: string,
  successCallback: (user: IUser) => void,
  handleErrorCallback: () => void,
) {
  const res = await axios
    .post(registerPATUrl, data, {
      withCredentials: true,
      headers: {
        'X-XSRF-TOKEN': csrf,
      },
    })
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.log(error);
      handleErrorCallback();
      return undefined;
    });
  if (res) {
    successCallback(res);
  }
}

export const savePersonalAccessToken = async (
  client: string,
  token: string,
  successCallback: (user: IUser) => void,
  handleErrorCallback: () => void,
) => {
  const csrf = await getCsrfToken();
  return savePATWithData(
    { client, token },
    csrf ?? '',
    successCallback,
    handleErrorCallback,
  );
};

export const registerCustomServerConnection = async (
  client: string,
  domain: string,
  token: string,
  successCallback: (user: IUser) => void,
  handleErrorCallback: () => void,
) => {
  const csrf = await getCsrfToken();
  return savePATWithData(
    { client, token, domain },
    csrf ?? '',
    successCallback,
    handleErrorCallback,
  );
};

// Enhanced auth status check with retry logic
export const checkUserAuthStatus = async (): Promise<User | null> => {
  try {
    return await checkAuthStatus(keycloakClientRegistrationId);
  } catch (error) {
    console.error('Auth status check failed:', error);
    return null;
  }
};

// Utility function to refresh auth state
export const refreshAuthState = async (): Promise<User | null> => {
  try {
    const user = await checkUserAuthStatus();
    if (user) {
      // Store user info in localStorage for persistence
      localStorage.setItem('plexify_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('plexify_user');
    }
    return user;
  } catch (error) {
    console.error('Auth refresh failed:', error);
    return null;
  }
};