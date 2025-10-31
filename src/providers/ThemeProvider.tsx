// Clean Architecture - Theme Provider with Store Integration
import React, { type ReactNode, useEffect } from 'react';
import { useUIStore } from '@/store';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, setTheme, setCurrentTheme } = useUIStore();

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setTheme(savedTheme as 'light' | 'dark' | 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, [setTheme]);

  // Apply theme to document and save preference
  useEffect(() => {
    const applyTheme = () => {
      let effectiveTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = theme;
      }
      
      setCurrentTheme(effectiveTheme);
      
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, setCurrentTheme]);

  return <>{children}</>;
};