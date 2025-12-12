// Use relative URLs in development, absolute URLs in production (Chrome extension)
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

// Check if we're in extension context (needs absolute URLs) or web context (can use proxy)
const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// Backend URLs
const AUTH_BACKEND = 'http://localhost:7777';
const PLANNER_BACKEND = 'http://localhost:8081';

// In development, use relative URLs that will go through the Vite proxy
// In production (Chrome extension), use absolute URLs
// Note: Auth backend runs on port 7777, Planner backend on 8081
export const backendBaseUrl = isDevelopment
  ? AUTH_BACKEND
  : AUTH_BACKEND;

// Planner backend URL (for OAuth and tool integrations)
// OAuth endpoints are on the planner backend, not the auth backend
export const plannerBackendBaseUrl = isExtensionContext
  ? PLANNER_BACKEND
  : PLANNER_BACKEND;

// Dynamic extension URL - get the current extension ID if running in extension context
export const popupUrl = (() => {
  if (isExtensionContext) {
    return chrome.runtime.getURL('popup.html');
  }
  return '/'; // Fallback for web context
})();

export const apiConfigBaseUrl = `${backendBaseUrl}/api/v1/config`;