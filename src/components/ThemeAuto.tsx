import { useEffect } from 'react';

export default function ThemeAuto() {
  useEffect(() => {
    // Force light theme only
    const apply = () => {
      const el = document.documentElement;
      el.classList.remove('dark');
    };

    // Expose an imperative setter (but always force light)
    (window as any).__monkSetTheme = () => {
      try {
        localStorage.setItem('monk.ui.theme', 'light');
        apply();
      } catch {}
    };

    apply();
  }, []);

  return null;
}
