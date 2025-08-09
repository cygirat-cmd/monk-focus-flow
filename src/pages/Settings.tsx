import { useEffect, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Settings as SettingsType, loadSettings, saveSettings } from '@/utils/storageClient';
import ThemeSelector from '@/components/ThemeSelector';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>(loadSettings());

  useEffect(() => { document.title = 'Settings – Monk'; }, []);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const triggerA2HS = async () => {
    const api = (window as any).monkA2HS;
    if (api?.prompt) {
      await api.prompt();
    } else {
      alert('Install prompt is not available yet. Try visiting on mobile.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6 space-y-6">
        <h1 className="text-xl font-semibold">Settings</h1>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Appearance</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-3 block">Theme</label>
              <ThemeSelector settings={settings} onSettingsChange={setSettings} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Timer Defaults</h2>
          <label className="flex items-center justify-between py-2">
            <span className="text-sm">Default minutes</span>
            <input
              type="number"
              min={5}
              max={90}
              value={settings.defaultMinutes}
              onChange={(e) => setSettings({ ...settings, defaultMinutes: Number(e.target.value) })}
              className="w-20 px-2 py-1 rounded border bg-background"
            />
          </label>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-3">Preferences</h2>
          {[
            { key: 'sound', label: 'Sound' },
            { key: 'vibration', label: 'Vibration' },
            { key: 'notifications', label: 'Notifications' },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center justify-between py-2">
              <span className="text-sm">{opt.label}</span>
              <input
                type="checkbox"
                checked={(settings as any)[opt.key]}
                onChange={(e) => setSettings({ ...settings, [opt.key]: e.target.checked } as any)}
              />
            </label>
          ))}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-2">Install</h2>
          <p className="text-sm text-muted-foreground mb-3">Add to Home Screen for a native-like experience.</p>
          <button onClick={triggerA2HS} className="w-full py-3 rounded-lg bg-primary text-primary-foreground">Add to Home Screen</button>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-2">Legal</h2>
          <div className="flex gap-4 text-sm">
            <a href="#" className="underline">Privacy</a>
            <a href="#" className="underline">Terms</a>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
