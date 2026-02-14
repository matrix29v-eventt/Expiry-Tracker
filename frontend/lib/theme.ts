// Advanced Theme Management System
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  theme: Theme;
  systemPreference: 'light' | 'dark';
  transition: boolean;
}

export function useTheme(): {
  theme: 'light' | 'dark';
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
} {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    theme: 'auto',
    systemPreference: 'light',
    transition: false
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemPrefersDark = mediaQuery.matches;
    const systemPref = systemPrefersDark ? 'dark' : 'light';

    const savedTheme = localStorage.getItem('theme') as Theme;
    const currentTheme = savedTheme || 'auto';

    const applyTheme = (theme: Theme) => {
      setThemeConfig(prev => ({ ...prev, transition: true }));
      
      document.documentElement.style.transition = 'background-color 0.4s ease, color 0.4s ease';
      
      setTimeout(() => {
        if (theme === 'dark' || (theme === 'auto' && systemPrefersDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        document.documentElement.style.transition = '';
        setThemeConfig(prev => ({ ...prev, theme, systemPreference: systemPref, transition: false }));
      }, 50);
    };

    applyTheme(currentTheme);

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemPrefersDark = e.matches ? 'dark' : 'light';
      setThemeConfig(prev => ({ ...prev, systemPreference: newSystemPrefersDark }));
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setThemeConfig(prev => ({ ...prev, transition: true }));
    
    setTimeout(() => {
      if (newTheme === 'dark' || (newTheme === 'auto' && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setThemeConfig(prev => ({ ...prev, theme: newTheme, transition: false }));
    }, 50);
  };

  const toggleTheme = () => {
    const currentTheme = themeConfig.theme;
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (themeConfig.theme === 'dark') return 'dark';
    if (themeConfig.theme === 'light') return 'light';
    return themeConfig.systemPreference;
  };

  return {
    theme: getEffectiveTheme(),
    themeConfig,
    setTheme,
    toggleTheme,
    isTransitioning: themeConfig.transition
  };
}

// Theme utility functions
export const themeUtils = {
  // Check if theme is dark
  isDark: () => document.documentElement.classList.contains('dark'),
  
  // Get theme colors based on current theme
  getColors: () => ({
    primary: 'rgb(59 130 246)',
    primaryHover: 'rgb(37 99 235)',
    background: 'rgb(249 250 251)',
    surface: 'rgb(255, 255, 255)',
    text: 'rgb(31 41 55)',
    textSecondary: 'rgb(107 114 128)',
    border: 'rgb(229 231 235)',
    success: 'rgb(34 197 94)',
    warning: 'rgb(251 191 36)',
    error: 'rgb(239 68 68)',
    focus: 'rgb(59 130 246)'
  }),
  
  getDarkColors: () => ({
    primary: 'rgb(96 165 250)',
    primaryHover: 'rgb(59 130 246)',
    background: 'rgb(30 41 59)',
    surface: 'rgb(31 41 55)',
    text: 'rgb(243 244 246)',
    textSecondary: 'rgb(148 163 184)',
    border: 'rgb(75 85 99)',
    success: 'rgb(74 222 128)',
    warning: 'rgb(251 146 60)',
    error: 'rgb(220 38 38)',
    focus: 'rgb(96 165 250)'
  }),
  
  // Apply theme to element
  applyThemeToElement: (element: HTMLElement, isDark: boolean) => {
    const colors = isDark ? themeUtils.getDarkColors() : themeUtils.getColors();
    
    // Apply colors to CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      element.style.setProperty(`--color-${key}`, value);
    });
  },
  
  // Add theme transition class
  addTransition: () => {
    document.documentElement.classList.add('theme-transitioning');
  },
  
  // Remove theme transition class
  removeTransition: () => {
    document.documentElement.classList.remove('theme-transitioning');
  }
};

export default useTheme;