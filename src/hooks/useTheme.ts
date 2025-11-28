// Clean Architecture - Theme Hook using Store
import { useUIStore } from '@/stores/useUIStore';

export const useTheme = () => {
  const { theme, currentTheme, setTheme } = useUIStore();

  return {
    theme,
    currentTheme,
    setTheme,
  };
};