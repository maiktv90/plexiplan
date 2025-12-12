// Clean Architecture - Simplified App Component
import { useEffect } from 'react';
import { AppRouter } from '@/router/AppRouter';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTimeTrackingSSE } from '@/hooks/useTimeTrackingSSE';
import { ToastContainer } from '@/components/ui/Toast';
import { TrelloCallbackPage } from '@/pages';

// Check if current URL is Trello OAuth callback
// Trello redirects to /auth/trello/callback#token=xxx
const isTrelloCallback = window.location.pathname === '/auth/trello/callback';

function App() {
  const { setIsPopup } = useUIStore();
  const { isLoading, isAuthenticated } = useAuthStore();

  // Connect to SSE for real-time time tracking updates (only when authenticated)
  // Uses token in query param for auth since EventSource doesn't support headers
  useTimeTrackingSSE({ enabled: isAuthenticated });

  // Handle Trello OAuth callback - render callback page directly
  // This bypasses the hash router since Trello uses fragment callback
  if (isTrelloCallback) {
    return (
      <>
        <TrelloCallbackPage />
        <ToastContainer />
      </>
    );
  }

  // Check if running in popup mode based on window size
  useEffect(() => {
    const checkIfPopup = () => {
      const popupWidth = 400;
      const popupHeight = 600;
      setIsPopup(window.innerWidth <= popupWidth && window.innerHeight <= popupHeight);
    };

    checkIfPopup();
    window.addEventListener('resize', checkIfPopup);

    return () => {
      window.removeEventListener('resize', checkIfPopup);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: setIsPopup is intentionally omitted to prevent infinite re-renders

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading application...</div>
      </div>
    );
  }

  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

export default App;