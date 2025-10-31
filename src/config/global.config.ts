// Use relative URLs in development, absolute URLs in production (Chrome extension)
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

// In development, use relative URLs that will go through the Vite proxy
// In production (Chrome extension), use absolute URLs
// Note: Backend runs on port 7777, Keycloak on 8080
export const backendBaseUrl = isDevelopment
  ? 'http://localhost:7777'
  : 'http://localhost:7777';

// Dynamic extension URL - get the current extension ID if running in extension context
export const popupUrl = (() => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    return chrome.runtime.getURL('popup.html');
  }
  return '/'; // Fallback for web context
})();

export const apiConfigBaseUrl = `${backendBaseUrl}/api/v1/config`;