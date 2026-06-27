'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('rk-theme') as Theme | null;
    const t = stored === 'light' ? 'light' : 'dark';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('rk-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Prevent flash — render children only after mount
  if (!mounted) return React.createElement(React.Fragment, null, children);
  return React.createElement(ThemeContext.Provider, { value: { theme, toggle } }, children);
}

export function useTheme() { return useContext(ThemeContext); }
