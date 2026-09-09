import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light';

const THEME_STORAGE_KEY = 'monitor_bot_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'system';
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyThemeToDOM(mode: ThemeMode): boolean {
  if (typeof document === 'undefined') return true;
  const isDark = mode === 'dark' || (mode === 'system' && getSystemPrefersDark());
  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  return isDark;
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => {
    const initialMode = getStoredTheme();
    return initialMode === 'dark' || (initialMode === 'system' && getSystemPrefersDark());
  });

  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
    const resolvedDark = applyThemeToDOM(newMode);
    setIsDark(resolvedDark);
  }, []);

  const toggleTheme = useCallback(() => {
    if (mode === 'system') {
      setTheme('light');
    } else if (mode === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  }, [mode, setTheme]);

  // Sync when system theme changes and mode is 'system'
  useEffect(() => {
    applyThemeToDOM(mode);
    setIsDark(mode === 'dark' || (mode === 'system' && getSystemPrefersDark()));

    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        const dark = applyThemeToDOM('system');
        setIsDark(dark);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [mode]);

  return {
    mode,
    isDark,
    setTheme,
    toggleTheme,
  };
}
