import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { csrfTokenUrl, baseuserUrl } from '../config/auth.config';
import type { User }                 from '@/types';

// Helper function to check if we're running in extension context
const isExtensionContext = () => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

export interface HeadersConfig {
  withCredentials: boolean;
  headers: {
    'Content-Type': string;
    Cookie?: string;
  }
}

export interface CsrfTokenResponse {
  csrf: string;
}

export interface KeycloakUser {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, unknown>;
}

export const checkAuthStatus = async (clientRegistrationId: string): Promise<User | null> => {
  try {
    // Configure axios to include cookies for extension context
    const config: AxiosRequestConfig = {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // If running in extension context, try to get cookies manually
    if (isExtensionContext()) {
      try {
        const cookies = await chrome.cookies.getAll({
          url: 'http://localhost:8080'
        });
        
        // Add cookies to request headers
        const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        if (cookieHeader && config.headers) {
          config.headers['Cookie'] = cookieHeader;
        }
      } catch (cookieError) {
        console.warn('Failed to get cookies from extension:', cookieError);
      }
    }

    const response: AxiosResponse<KeycloakUser> = await axios.get(
      `${baseuserUrl.replace('baseuser', clientRegistrationId)}`,
      config
    );
    
    if (response.data && response.data.username) {
      return {
        id: response.data.username,
        email: response.data.email || response.data.username,
        name: response.data.firstName && response.data.lastName 
          ? `${response.data.firstName} ${response.data.lastName}`
          : response.data.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.data.username}`,
        isAuthenticated: true,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Auth check failed:', error);
    
    // If in extension context and not authenticated, provide login guidance
    if (isExtensionContext()) {
      console.log('Extension auth tip: Please log in to the web app first at http://localhost:8080');
    }
    
    return null;
  }
};

export const getCsrfToken = async (): Promise<string | null> => {
  // In development mode, return a mock CSRF token
  if (process.env.NODE_ENV === 'development') {
    return 'mock-csrf-token-12345';
  }
  
  try {
    // Use direct axios call without interceptors to avoid circular dependency
    const response: AxiosResponse<CsrfTokenResponse> = await axios.get(csrfTokenUrl, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data.csrf;
  } catch (error) {
    console.error('CSRF token fetch failed:', error);
    return null;
  }
};

export const redirectToLogin = (loginUrl: string) => {
  if (isExtensionContext()) {
    // In extension context, open login in a new tab
    chrome.tabs.create({ url: loginUrl });
  } else {
    window.location.href = loginUrl;
  }
};

export const handleLogout = async (logoutUrl: string) => {
  const isExtensionContext = () => {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  };

  const redirectToHome = () => {
    if (isExtensionContext()) {
      // In extension context, create a new tab with the extension's popup URL
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    } else {
      window.location.href = '/';
    }
  };

  try {
    await axios.post(logoutUrl);
    redirectToHome();
  } catch (error) {
    console.error('Logout failed:', error);
    redirectToHome();
  }
};