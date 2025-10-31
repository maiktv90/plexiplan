// Clean Architecture - Theme Hook using Store
import { useUIStore } from '@/store';

export const useTheme = () => {
  const { theme, currentTheme, setTheme } = useUIStore();
  
  return {
    theme,
    currentTheme,
    setTheme,
  };
};