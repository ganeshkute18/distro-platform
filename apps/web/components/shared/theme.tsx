 'use client';

 import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

 type Theme = 'light' | 'dark';
 type ThemeContextValue = {
   theme: Theme;
   setTheme: (t: Theme) => void;
   toggle: () => void;
 };

 const ThemeContext = createContext<ThemeContextValue | null>(null);

 function applyThemeClass(theme: Theme) {
   if (typeof document === 'undefined') return;
   const root = document.documentElement;
   root.classList.toggle('dark', theme === 'dark');
 }

 export function ThemeProvider({ children }: { children: React.ReactNode }) {
   const [theme, setThemeState] = useState<Theme>('light');

   useEffect(() => {
     const stored = (typeof window !== 'undefined' && window.localStorage.getItem('theme')) as Theme | null;
     const initial: Theme = stored === 'dark' ? 'dark' : 'light';
     setThemeState(initial);
     applyThemeClass(initial);
   }, []);

   const value = useMemo<ThemeContextValue>(() => {
     function setTheme(t: Theme) {
       setThemeState(t);
       if (typeof window !== 'undefined') window.localStorage.setItem('theme', t);
       applyThemeClass(t);
     }
     return {
       theme,
       setTheme,
       toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
     };
   }, [theme]);

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
 }

 export function useTheme() {
   const ctx = useContext(ThemeContext);
   if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
   return ctx;
 }

