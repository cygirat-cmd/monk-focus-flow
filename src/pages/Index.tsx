import { useEffect, useMemo, useRef, useState } from 'react';
import { CircularProgress } from '@/components/timer/CircularProgress';
import BottomNav from '@/components/layout/BottomNav';
import WindDownModal from '@/components/modals/WindDownModal';
import { analytics } from '@/utils/analytics';
import { showLocalNotification } from '@/utils/notifications';
import { loadSettings, loadProgress, GardenStep, Relic } from '@/utils/storage';
import { getRandomGardenStep, getRandomRelic, getRandomZenQuote } from '@/utils/zenData';
import { Play, Square } from 'lucide-react';
import { useTheme } from 'next-themes';
import { validateSession, addFocusPoints, updateStreak } from '@/utils/progression';

// SEO
const TITLE = 'Monk: ADHD Pomodoro Timer';
const DESC = 'ADHD-friendly Pomodoro + Flowtime with zen UI.';

const presets = [15, 25, 45] as const;

type Mode = 'fixed' | 'flow';

const Index = () => {
  const [mode, setMode] = useState<Mode>('fixed');
  const [minutes, setMinutes] = useState<number>(loadSettings().defaultMinutes);
  const [remaining, setRemaining] = useState<number>(minutes * 60_000);
  const [running, setRunning] = useState(false);
  const [windOpen, setWindOpen] = useState(false);
  const [windDownMode, setWindDownMode] = useState<'SessionComplete' | 'BreakStart'>('SessionComplete');
  const [newGardenStep, setNewGardenStep] = useState<GardenStep | undefined>();
  const [newRelic, setNewRelic] = useState<Relic | undefined>();
  const [zenQuote, setZenQuote] = useState<string>('');
  const workerRef = useRef<Worker | null>(null);
  const startAtRef = useRef<number | null>(null);
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    document.title = TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', DESC);
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkTheme = document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkTheme);
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    setRemaining(minutes * 60_000);
  }, [minutes]);

  // Dev tools: allow granting sessions via window event
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detail = e.detail as { mode: 'flow' | 'pomodoro'; seconds: number };
        if (!detail) return;
        handleSessionComplete(detail);
      } catch {}
    };
    window.addEventListener('monk:sessionComplete', handler as any);
    return () => window.removeEventListener('monk:sessionComplete', handler as any);
  }, []);

useEffect(() => {
  const w = new Worker(new URL('../workers/timerWorker.ts', import.meta.url), { type: 'module' } as any);
  workerRef.current = w;
  w.onmessage = (e) => {
    const { type, remaining } = e.data || {};
    if (type === 'tick') setRemaining(remaining);
    if (type === 'done') {
      setRunning(false);
      const seconds = startAtRef.current ? Math.max(1, Math.round((performance.now() - startAtRef.current) / 1000)) : minutes * 60;
      startAtRef.current = null;
      showLocalNotification('Session complete', 'Breathe. Take a short break.');
      analytics.track({ type: 'session_stop', completed: true });
      handleSessionComplete({ mode: 'pomodoro', seconds });
    }
  };
  return () => w.terminate();
}, []);

const handleSessionComplete = (payload: { mode: 'flow' | 'pomodoro'; seconds: number }) => {
  const progress = loadProgress();
  const v = validateSession(payload, progress as any);
  if (!(v as any).ok) {
    localStorage.setItem('monk.progress', JSON.stringify(progress));
    setNewGardenStep(undefined);
    setNewRelic(undefined);
    setZenQuote('');
    setWindDownMode('SessionComplete');
    setWindOpen(true);
    return;
  }

  progress.completedSessions++;

  let newStep: GardenStep | undefined;
  let newRelicUnlocked: Relic | undefined;
  let quote = '';

  if (progress.currentPath.length + 1 < progress.pathLength) {
    newStep = getRandomGardenStep();
    progress.currentPath.push(newStep);
    (progress as any).pendingTokens = [...((progress as any).pendingTokens || []), newStep];
    analytics.track({ type: 'garden_step_added' });
  } else {
    newRelicUnlocked = getRandomRelic();
    progress.relics.push(newRelicUnlocked);
    progress.currentPath = [];
    quote = getRandomZenQuote();
    analytics.track({ type: 'relic_unlocked' });
  }

  (progress as any).counters = {
    ...(progress as any).counters,
    lastSessionEndedAt: Date.now(),
    placementsToday: ((progress as any).counters?.placementsToday || 0) + 1,
  };

  addFocusPoints(progress as any, payload.seconds);
  updateStreak(progress as any);

  localStorage.setItem('monk.progress', JSON.stringify(progress));
  analytics.track({ type: 'session_complete' });

  setNewGardenStep(newStep);
  setNewRelic(newRelicUnlocked);
  setWindDownMode('SessionComplete');
  setWindOpen(true);
};

  const switchMode = (next: Mode, nextMinutes?: number) => {
    if (workerRef.current) {
      try { workerRef.current.postMessage({ type: 'stop' }); } catch {}
    }
    setRunning(false);
    startAtRef.current = null;
    if (nextMinutes != null) {
      setMinutes(nextMinutes);
      setRemaining(nextMinutes * 60_000);
    } else if (next === 'fixed') {
      setRemaining(minutes * 60_000);
    } else {
      setRemaining(0);
    }
    setMode(next);
  };

  const start = () => {
    if (!workerRef.current) return;
    setRunning(true);
    startAtRef.current = performance.now();
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
    workerRef.current.postMessage({ type: 'stop' });
    
    if (mode === 'flow') {
      const seconds = startAtRef.current ? Math.max(1, Math.round((performance.now() - startAtRef.current) / 1000)) : 0;
      startAtRef.current = null;
      analytics.track({ type: 'session_stop', completed: true });
      showLocalNotification('Flow session complete', 'Well done. Take a mindful break.');
      handleSessionComplete({ mode: 'flow', seconds });
    } else {
      analytics.track({ type: 'session_stop', completed: false });
      showLocalNotification('Session stopped');
    }
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

  const logo = isDark
    ? '/lovable-uploads/0832e63d-9a3b-4522-9c16-56d6b4cd8fc3.png'
    : '/lovable-uploads/20a958db-a342-42f8-a711-30e17af81a0e.png';

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-6">
          <div className="app-header__brand">
            {logoError ? (
              <h1 className="text-2xl font-semibold tracking-tight">Monk</h1>
            ) : (
              <img
                src={logo}
                alt="Monk logo"
                className="h-6 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
        </header>

        <section className="flex flex-col items-center gap-6">
          {mode === 'flow' ? (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Flow Mode</h2>
              <p className="text-muted-foreground max-w-xs">
                Start and stop when you feel the best — no fixed timer.
              </p>
            </div>
          ) : (
            <>
              <CircularProgress progress={Math.max(0, Math.min(1, 1 - remaining / total))} />
              <div className="text-6xl font-semibold tabular-nums leading-none" aria-live="polite">
                {mm}:{ss}
              </div>
            </>
          )}
          {!running && mode !== 'flow' && <p className="text-sm text-muted-foreground animate-fade-in">{ritualTip}</p>}

          <div className="grid grid-cols-4 gap-2 w-full">
            {presets.map((m) => (
              <button
                key={m}
                onClick={() => switchMode('fixed', m)}
                className={`py-2 rounded-md border transition-colors ${
                  minutes === m && mode === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
                }`}
                aria-pressed={minutes === m && mode === 'fixed'}
              >
                {m}m
              </button>
            ))}
            <button
              onClick={() => switchMode('flow')}
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
      <WindDownModal 
        open={windOpen} 
        onClose={() => {
          setWindOpen(false);
          setNewGardenStep(undefined);
          setNewRelic(undefined);
          setZenQuote('');
        }}
        mode={windDownMode}
        newGardenStep={newGardenStep}
        newRelic={newRelic}
        zenQuote={zenQuote}
      />
      <BottomNav />
    </div>
  );
};

export default Index;
