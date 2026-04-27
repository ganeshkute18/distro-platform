 'use client';

 import React from 'react';
 import { Moon, Sun } from 'lucide-react';
 import { useTheme } from './theme';

 export function ThemeToggle() {
   const { theme, toggle } = useTheme();
   const isDark = theme === 'dark';

   return (
     <button
       type="button"
       onClick={toggle}
       className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
       aria-label="Toggle dark mode"
       title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
     >
       {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
       <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
     </button>
   );
 }

