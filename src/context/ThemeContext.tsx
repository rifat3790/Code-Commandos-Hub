'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type ThemeColor = 'green' | 'blue' | 'purple' | 'orange';

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  isUpdatingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  themeColor: 'green',
  setThemeColor: () => {},
  isUpdatingTheme: false,
});

const THEMES = {
  green: {
    base: '#00C950',
    hover: '#00B046',
    glow: 'rgba(0, 201, 80, 0.2)',
  },
  blue: {
    base: '#3B82F6',
    hover: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  purple: {
    base: '#8B5CF6',
    hover: '#7C3AED',
    glow: 'rgba(139, 92, 246, 0.2)',
  },
  orange: {
    base: '#F97316',
    hover: '#EA580C',
    glow: 'rgba(249, 115, 22, 0.2)',
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [themeColor, setThemeColorState] = useState<ThemeColor>('green');
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  // Fetch initial theme from DB
  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/users/me?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user?.themeColor) {
            setThemeColorState(data.user.themeColor as ThemeColor);
          }
        })
        .catch(err => console.error('Failed to load theme:', err));
    }
  }, [user]);

  // Apply CSS Variables
  useEffect(() => {
    const theme = THEMES[themeColor] || THEMES.green;
    const root = document.documentElement;
    root.style.setProperty('--color-brand-green', theme.base);
    root.style.setProperty('--color-brand-green-hover', theme.hover);
    root.style.setProperty('--color-brand-glow', theme.glow);
  }, [themeColor]);

  const setThemeColor = async (color: ThemeColor) => {
    setThemeColorState(color); // Optimistic UI update
    
    if (user?.uid) {
      setIsUpdatingTheme(true);
      try {
        await fetch(`/api/users/me?uid=${user.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeColor: color }),
        });
      } catch (err) {
        console.error('Failed to save theme:', err);
      } finally {
        setIsUpdatingTheme(false);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, isUpdatingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
