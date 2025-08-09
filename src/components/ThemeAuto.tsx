import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeAuto() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const mode = (localStorage.getItem('monk.ui.theme') || 'auto') as 'light' | 'dark' | 'auto';
    if (mode !== 'auto') return; // respect explicit user choice; only auto follows system/night

    const compute = () => {
      const hour = new Date().getHours();
      const night = hour >= 19 || hour < 7; // 19:00–07:00
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = prefersDark || night;
      setTheme(dark ? 'dark' : 'light');
    };
    compute();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', compute);
    const iv = setInterval(compute, 60_000);
    return () => {
      mql.removeEventListener('change', compute);
      clearInterval(iv);
    };
  }, [setTheme]);

  return null;
}
