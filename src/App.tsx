// Clean Architecture - Simplified App Component
import { useEffect } from 'react';
import { AppRouter } from '@/router/AppRouter';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store';

function App() {
  const { setIsPopup } = useUIStore();
  const { isLoading } = useAuthStore();

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

  return <AppRouter />;
}

export default App;