import { useEffect } from 'react';

export default function ThemeAuto() {
  useEffect(() => {
    let mode = (localStorage.getItem('monk.ui.theme') || 'auto') as 'light' | 'dark' | 'auto';
    const apply = (dark: boolean) => {
      const el = document.documentElement;
      el.classList.toggle('dark', dark);
    };

    const compute = () => {
      if (mode !== 'auto') {
        apply(mode === 'dark');
        return;
      }
      const hour = new Date().getHours();
      const night = hour >= 19 || hour < 7;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = prefersDark || night;
      apply(dark);
    };

    // Expose an imperative setter for instant theme switching
    (window as any).__monkSetTheme = (next: 'light' | 'dark' | 'auto') => {
      try {
        mode = next;
        localStorage.setItem('monk.ui.theme', next);
        if (next === 'auto') compute(); else apply(next === 'dark');
      } catch {}
    };

    compute();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', compute);
    const iv = setInterval(compute, 60_000);
    return () => {
      mql.removeEventListener('change', compute);
      clearInterval(iv);
    };
  }, []);

  return null;
}
