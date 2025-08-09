import { useEffect, useMemo, useRef, useState } from 'react';
import { CircularProgress } from '@/components/timer/CircularProgress';
import BottomNav from '@/components/layout/BottomNav';
import WindDownModal from '@/components/modals/WindDownModal';
import { analytics } from '@/utils/analytics';
import { showLocalNotification } from '@/utils/notifications';
import { loadSettings, loadProgress, saveProgress, GardenStep, Relic } from '@/utils/storage';
import { getRandomGardenStep, getRandomRelic, getRandomZenQuote } from '@/utils/zenData';
import { Play, Square } from 'lucide-react';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

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
      handleSessionComplete();
    }
  };
  return () => w.terminate();
}, []);

const handleSessionComplete = () => {
  const progress = loadProgress();
  progress.completedSessions++;

  let newStep: GardenStep | undefined;
  let newRelicUnlocked: Relic | undefined;
  let quote = '';

  // Add garden step or unlock relic
   if (progress.currentPath.length + 1 < progress.pathLength) {
     newStep = getRandomGardenStep();
     progress.currentPath.push(newStep);
     // Queue for Garden Map placement
     // @ts-ignore - fallback for older stored progress without field
     (progress as any).pendingTokens = [...((progress as any).pendingTokens || []), newStep];
   } else {
     newRelicUnlocked = getRandomRelic();
     progress.relics.push(newRelicUnlocked);
     progress.currentPath = [];
     quote = getRandomZenQuote();
   }

  saveProgress(progress);
  analytics.track({ type: 'session_complete' });

  setNewGardenStep(newStep);
  setNewRelic(newRelicUnlocked);
  setZenQuote(quote);
  setWindDownMode('SessionComplete');
  setWindOpen(true);
};

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
    workerRef.current.postMessage({ type: 'stop' });
    
    if (mode === 'flow') {
      // Flow mode triggers wind-down on stop
      analytics.track({ type: 'session_stop', completed: true });
      showLocalNotification('Flow session complete', 'Well done. Take a mindful break.');
      handleSessionComplete();
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
            <img
              src={logo}
              alt="Monk logo"
              className="w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image fails
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('h1');
                fallback.textContent = 'Monk';
                fallback.className = 'text-2xl font-semibold tracking-tight';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
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
