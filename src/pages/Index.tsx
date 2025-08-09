import { useEffect, useMemo, useRef, useState } from 'react';
import { CircularProgress } from '@/components/timer/CircularProgress';
import BottomNav from '@/components/layout/BottomNav';
import { useNavigate } from 'react-router-dom';
import { analytics } from '@/utils/analytics';
import { showLocalNotification } from '@/utils/notifications';
import { loadSettings } from '@/utils/storage';
import { Play, Square } from 'lucide-react';

// SEO
const TITLE = 'Monk: ADHD Pomodoro Timer';
const DESC = 'ADHD-friendly Pomodoro + Flowtime with zen UI.';

const presets = [15, 25, 45] as const;

type Mode = 'fixed' | 'flow';

const Index = () => {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>('fixed');
  const [minutes, setMinutes] = useState<number>(loadSettings().defaultMinutes);
  const [remaining, setRemaining] = useState<number>(minutes * 60_000);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    document.title = TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', DESC);
  }, []);

  useEffect(() => {
    setRemaining(minutes * 60_000);
  }, [minutes]);

  useEffect(() => {
    const w = new Worker(new URL('../workers/timerWorker.ts', import.meta.url), { type: 'module' } as any);
    workerRef.current = w;
    w.onmessage = (e) => {
      const { type, remaining } = e.data || {};
      if (type === 'tick') setRemaining(remaining);
      if (type === 'done') {
        setRunning(false);
        showLocalNotification('Session complete', 'Breathe. Take a short break.');
        analytics.track({ type: 'session_stop', completed: true });
        nav('/wind-down');
      }
    };
    return () => w.terminate();
  }, [nav]);

  const start = () => {
    if (!workerRef.current) return;
    setRunning(true);
    analytics.track({ type: 'session_start', minutes, mode });
    showLocalNotification('Session started', 'Focus mode engaged.');
    workerRef.current.postMessage({
      type: 'start',
      payload: { durationMs: mode === 'flow' ? null : minutes * 60_000 },
    });
  };

  const stop = () => {
    if (!workerRef.current) return;
    setRunning(false);
    analytics.track({ type: 'session_stop', completed: false });
    workerRef.current.postMessage({ type: 'stop' });
    showLocalNotification('Session stopped');
  };

  const total = mode === 'flow' ? Math.max(remaining, minutes * 60_000) : minutes * 60_000;
  const progress = mode === 'flow' ? 1 - Math.exp(-remaining / 1) : 1 - remaining / total; // flow shows full ring

  const mm = Math.floor(remaining / 60_000).toString().padStart(2, '0');
  const ss = Math.floor((remaining % 60_000) / 1000).toString().padStart(2, '0');

  const ritualTip = useMemo(() => {
    const tips = [
      'Close your tabs. Breathe.',
      'Put your phone away.',
      'Pick one task. Commit.',
      'Gentle focus. Small steps.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Monk</h1>
          <p className="text-sm text-muted-foreground">ADHD Pomodoro Timer</p>
        </header>

        <section className="flex flex-col items-center gap-6">
          <CircularProgress progress={mode === 'flow' ? 0.999 : Math.max(0, Math.min(1, 1 - remaining / total))} />
          <div className="text-6xl font-semibold tabular-nums leading-none" aria-live="polite">
            {mm}:{ss}
          </div>
          {!running && <p className="text-sm text-muted-foreground animate-fade-in">{ritualTip}</p>}

          <div className="grid grid-cols-4 gap-2 w-full">
            {presets.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode('fixed');
                  setMinutes(m);
                }}
                className={`py-2 rounded-md border transition-colors ${
                  minutes === m && mode === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
                }`}
                aria-pressed={minutes === m && mode === 'fixed'}
              >
                {m}m
              </button>
            ))}
            <button
              onClick={() => setMode('flow')}
              className={`py-2 rounded-md border transition-colors ${
                mode === 'flow' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
              }`}
              aria-pressed={mode === 'flow'}
            >
              Flow
            </button>
          </div>

          <div className="flex gap-3 w-full">
            {!running ? (
              <button onClick={start} className="flex-1 py-4 rounded-lg bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
                <div className="flex items-center justify-center gap-2 font-semibold"><Play size={20}/> Start</div>
              </button>
            ) : (
              <button onClick={stop} className="flex-1 py-4 rounded-lg bg-accent text-foreground shadow-md hover:opacity-90 transition-opacity">
                <div className="flex items-center justify-center gap-2 font-semibold"><Square size={20}/> Stop</div>
              </button>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
