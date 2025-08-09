import { useTheme } from 'next-themes';
import { Settings } from '@/utils/storage';
import { Moon, Sun, Monitor } from 'lucide-react';

interface ThemeSelectorProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function ThemeSelector({ settings, onSettingsChange }: ThemeSelectorProps) {
  const { setTheme } = useTheme();

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    const newSettings = { ...settings, theme };
    onSettingsChange(newSettings);

    try {
      (window as any).__monkSetTheme?.(theme);
      localStorage.setItem('monk.ui.theme', theme);
    } catch {}

    setTheme(theme === 'auto' ? 'system' : theme);
  };

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'auto' as const, label: 'Auto', icon: Monitor },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => handleThemeChange(value)}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
            settings.theme === value 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'bg-card text-card-foreground border-border hover:bg-accent'
          }`}
        >
          <Icon size={20} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}