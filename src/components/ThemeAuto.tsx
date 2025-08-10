import { useEffect } from 'react';

export default function ThemeAuto() {
  useEffect(() => {
    const mode = (localStorage.getItem('monk.ui.theme') || 'auto') as 'light' | 'dark' | 'auto';
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
