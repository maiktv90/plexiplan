import { useUIStore } from '@/stores/useUIStore';

export const usePopup = () => {
  const { isPopup, setIsPopup, isLoading, hasError, setError, setLoading } = useUIStore();

  return {
    isPopup,
    isLoading,
    hasError,
    setIsPopup,
    setLoading,
    setHasError: setError,
  };
};