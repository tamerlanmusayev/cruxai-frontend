'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'cruxai_theme';

const ThemeCtx = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'dark', toggle: () => {} });

function apply(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Pick up the theme the no-flash script already applied.
  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || 'dark';
    setTheme(stored);
    apply(stored);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, next);
      apply(next);
      return next;
    });
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/** Inline script that applies the stored theme before paint (no flash). */
export const themeNoFlashScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`;
