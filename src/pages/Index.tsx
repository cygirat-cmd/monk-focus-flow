import { useEffect, useMemo, useRef, useState } from 'react';
import { CircularProgress } from '@/components/timer/CircularProgress';
import BottomNav from '@/components/layout/BottomNav';
import WindDownModal from '@/components/modals/WindDownModal';
import { analytics } from '@/utils/analytics';
import { showLocalNotification } from '@/utils/notifications';
import { loadSettings, saveSettings, loadProgress, saveProgress, GardenStep, Relic } from '@/utils/storage';
import { getRandomGardenStep, getRandomRelic, getRandomZenQuote, moveNPC, getRandomNPCMessage } from '@/utils/zenData';
import { calculateFlowScore, getRarityFromFlowScore } from '@/utils/flowScoring';
import { Play, Square } from 'lucide-react';
import { useTheme } from 'next-themes';
import { validateSession, addFocusPoints, updateStreak } from '@/utils/progression';
import { updateTrialProgress, checkForNewTrials } from '@/utils/zenTrials';

// SEO
const TITLE = 'Monk Flow Timer • Zen Pomodoro';
const DESC = 'Flow Timer and Pomodoro with a minimalist zen UI. Longer flow = rarer gifts.';

const WORK_PRESETS = [25, 45, 60] as const;
const BREAK_PRESETS = [5, 10] as const;

type Mode = 'fixed' | 'flow';

const Index = () => {
  const [mode, setMode] = useState<Mode>('flow');
  const [minutes, setMinutes] = useState<number>(WORK_PRESETS[0]); // work session length
  const [breakMinutes, setBreakMinutes] = useState<number>(BREAK_PRESETS[0]);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState<number>(minutes * 60_000);
  const [elapsedMs, setElapsedMs] = useState<number>(0); // for flow mode
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
  const [pendingStartBreak, setPendingStartBreak] = useState(false);

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
    if (running) return;
    if (mode === 'fixed') {
      setRemaining((phase === 'work' ? minutes : breakMinutes) * 60_000);
    } else {
      setRemaining(0);
    }
  }, [minutes, breakMinutes, mode, phase, running]);

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
    if (type === 'tick') {
      if (mode === 'fixed') setRemaining(remaining);
      if (mode === 'flow' && startAtRef.current != null) {
        setElapsedMs(performance.now() - startAtRef.current);
      }
    }
    if (type === 'done') {
      if (mode === 'fixed') {
        setRunning(false);
        if (phase === 'work') {
          const seconds = Math.max(1, Math.round((minutes * 60_000) / 1000));
          startAtRef.current = null;
          analytics.track({ type: 'session_stop', completed: true });
          showLocalNotification('Session complete', 'Breathe. Break starts.');
          handleSessionComplete({ mode: 'pomodoro', seconds });
          setWindDownMode('SessionComplete');
          setWindOpen(true);
          // Auto-start break immediately
          setPhase('break');
          setTimeout(() => start(), 0);
        } else {
          // Break finished -> auto start next work
          setPhase('work');
          setTimeout(() => start(), 0);
        }
      }
    }
  };
  return () => w.terminate();
}, [mode, phase, minutes]);

const handleSessionComplete = (payload: { mode: 'flow' | 'pomodoro'; seconds: number }) => {
  const progress = loadProgress();
  const v = validateSession(payload, progress as any);
  if (!(v as any).ok) {
    saveProgress(progress);
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

  // Calculate flow score for flow sessions
  let flowScore = 0;
  let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
  
  if (payload.mode === 'flow') {
    flowScore = calculateFlowScore(payload.seconds);
    rarity = getRarityFromFlowScore(flowScore);
    
    // Update flow score and best session
    progress.flowScore += flowScore;
    if (!progress.bestFlowSession || flowScore > progress.bestFlowSession.flowScore) {
      progress.bestFlowSession = {
        seconds: payload.seconds,
        flowScore,
        timestamp: new Date().toISOString(),
      };
    }
  }

  if (progress.currentPath.length + 1 < progress.pathLength) {
    newStep = getRandomGardenStep(progress.season, rarity);
    progress.currentPath.push(newStep);
    progress.pendingTokens = [...(progress.pendingTokens || []), newStep];
    analytics.track({ type: 'garden_step_added' });
  } else {
    newRelicUnlocked = getRandomRelic();
    progress.relics.push(newRelicUnlocked);
    progress.currentPath = [];
    quote = getRandomZenQuote();
    analytics.track({ type: 'relic_unlocked' });
  }

  // Move NPC after each session and occasionally show message
  const newPos = moveNPC(progress.npc.x, progress.npc.y);
  progress.npc.x = newPos.x;
  progress.npc.y = newPos.y;
  
  // 30% chance to show NPC message for 30 seconds
  if (Math.random() < 0.3) {
    const npcMsg = getRandomNPCMessage();
    progress.npc.message = npcMsg.message;
    progress.npc.messageExpiry = Date.now() + 30000;
  }

  progress.counters = {
    ...progress.counters,
    lastSessionEndedAt: Date.now(),
    placementsToday: (progress.counters?.placementsToday || 0) + 1,
    consecutiveDays: progress.counters?.consecutiveDays || 0,
  };

  addFocusPoints(progress as any, payload.seconds);
  updateStreak(progress as any);
  
  // Update trials and check for new ones
  progress.trials = updateTrialProgress(progress.trials, payload, progress);
  progress.trials = checkForNewTrials(progress);
  
  // Check for completed trials and award rewards
  const completedTrials = progress.trials.filter(t => t.completed && t.reward);
  completedTrials.forEach(trial => {
    if (trial.reward) {
      progress.pendingTokens = [...(progress.pendingTokens || []), trial.reward];
    }
  });
  
  // Update last active timestamp and check for rebirth
  progress.lastActive = new Date().toISOString();
  if (progress.isWithered && progress.streak.days >= 3) {
    progress.isWithered = false;
    // Grant special rebirth collectible
    const rebirthStep = { id: 'rebirth-lotus', img: '/assets/garden/rebirth_lotus.png', label: 'Rebirth Lotus' };
    progress.pendingTokens = [...(progress.pendingTokens || []), rebirthStep];
  }

  saveProgress(progress);
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

    if (mode === 'flow') {
      setElapsedMs(0);
      analytics.track({ type: 'session_start', mode: 'flow' });
      showLocalNotification('Flow started', 'Find your rhythm.');
      workerRef.current.postMessage({
        type: 'start',
        payload: { durationMs: null },
      });
    } else {
      const durMin = phase === 'break' ? breakMinutes : minutes;
      const durationMs = durMin * 60_000;
      if (phase === 'break') setWindDownMode('BreakStart');
      analytics.track({ type: phase === 'break' ? 'break_start' : 'session_start', minutes: durMin, mode: 'fixed' });
      showLocalNotification(phase === 'break' ? 'Break started' : 'Focus started');
      workerRef.current.postMessage({ type: 'start', payload: { durationMs } });
    }
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

  const elapsed = Math.max(0, elapsedMs);
  const eh = Math.floor(elapsed / 3_600_000);
  const em = Math.floor((elapsed % 3_600_000) / 60_000).toString().padStart(2, '0');
  const es = Math.floor((elapsed % 60_000) / 1000).toString().padStart(2, '0');
  const flowDisplay = eh > 0 ? `${eh}:${em}:${es}` : `${em}:${es}`;

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

        <section className="flex flex-col items-stretch gap-6">
          {/* Flow Timer */}
          <article className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="text-xl font-semibold">Flow Timer</h2>
            <p className="text-sm text-muted-foreground">The longer the flow, the rarer the gift.</p>
            {!running && (
              <button
                onClick={() => { setMode('flow'); setPhase('work'); setElapsedMs(0); start(); }}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Start Flow
              </button>
            )}
          </article>

          {/* Pomodoro Timer */}
          <article className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
              <p className="text-sm text-muted-foreground">Choose a session and break. Sessions auto-cycle.</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Focus</div>
              <div className="grid grid-cols-3 gap-2">
                {WORK_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode('fixed'); setPhase('work'); setMinutes(m); setRemaining(m * 60_000); }}
                    className={`py-2 rounded-md border transition-colors ${minutes === m && mode === 'fixed' && phase==='work' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                    aria-pressed={minutes === m && mode === 'fixed' && phase==='work'}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Break</div>
              <div className="grid grid-cols-2 gap-2">
                {BREAK_PRESETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBreakMinutes(b)}
                    className={`py-2 rounded-md border transition-colors ${breakMinutes === b ? 'bg-secondary text-secondary-foreground' : 'bg-background'}`}
                    aria-pressed={breakMinutes === b}
                  >
                    {b}m
                  </button>
                ))}
              </div>
            </div>
            {!running && (
              <button
                onClick={() => { setMode('fixed'); setPhase('work'); setRemaining(minutes * 60_000); start(); }}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Start Pomodoro
              </button>
            )}
          </article>
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
