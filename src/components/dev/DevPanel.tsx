import { useEffect, useMemo, useRef, useState } from 'react';
import { loadProgress } from '@/utils/storageClient';
import { GARDEN_POOL } from '@/utils/zenData';

// Feature flag
export const isDevEnabled = () =>
  typeof window !== 'undefined' && (window.location.search.includes('dev=1') || localStorage.getItem('monk.dev') === '1');

export default function DevPanel() {
  const [enabled, setEnabled] = useState(isDevEnabled());
  const [show, setShow] = useState(false);
  const [p, setP] = useState(() => loadProgress());
  const clicksRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setEnabled(isDevEnabled());
  }, []);

  // Triple tap on header logo
  useEffect(() => {
    if (!enabled) return;
    const el = document.querySelector('.app-header__brand');
    if (!el) return;
    const onClick = () => {
      clicksRef.current++;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (clicksRef.current >= 3) setShow((s) => !s);
        clicksRef.current = 0;
      }, 1500);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [enabled]);

  const saveRules = (partial: Partial<typeof p.rules>) => {
    const prog = loadProgress();
    (prog as any).rules = { ...(prog as any).rules, ...partial };
    localStorage.setItem('monk.progress', JSON.stringify(prog));
    setP(prog);
  };

  if (!enabled || !show) return null;

  const openWindDown = (valid: boolean) => {
    if (valid) {
      const seconds = Number(prompt('Seconds (valid)', '300')) || 300;
      window.dispatchEvent(new CustomEvent('monk:sessionComplete', { detail: { mode: 'pomodoro', seconds } }));
    } else {
      const seconds = 1; // too short
      window.dispatchEvent(new CustomEvent('monk:sessionComplete', { detail: { mode: 'pomodoro', seconds } }));
    }
  };

  const grantSession = (mode: 'pomodoro' | 'flow') => {
    const seconds = Number(prompt('Seconds', '300')) || 300;
    window.dispatchEvent(new CustomEvent('monk:sessionComplete', { detail: { mode, seconds } }));
  };

  const giveToken = () => {
    const prog = loadProgress();
    const pick = GARDEN_POOL[Math.floor(Math.random() * GARDEN_POOL.length)];
    (prog as any).pendingTokens = [ ...(prog as any).pendingTokens || [], pick ];
    localStorage.setItem('monk.progress', JSON.stringify(prog));
    setP(prog);
    alert('Garden token queued. Open WindDown or Garden to place.');
  };

  const addFP = () => {
    const prog = loadProgress();
    (prog as any).focusPoints = ((prog as any).focusPoints || 0) + 10;
    localStorage.setItem('monk.progress', JSON.stringify(prog));
    setP(prog);
  };

  const resetDaily = () => {
    const prog = loadProgress();
    (prog as any).counters = { ...(prog as any).counters, placementsToday: 0 };
    localStorage.setItem('monk.today', new Date().toDateString());
    localStorage.setItem('monk.progress', JSON.stringify(prog));
    setP(prog);
  };

  const advanceDay = () => {
    const prog = loadProgress();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    (prog as any).streak = { ...(prog as any).streak, lastDate: d.toISOString() };
    localStorage.setItem('monk.progress', JSON.stringify(prog));
    setP(prog);
  };

  const hardReset = () => {
    if (!confirm('Hard reset progress?')) return;
    localStorage.removeItem('monk.progress');
    location.reload();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-xl border-t bg-background/90 backdrop-blur p-3 shadow-2xl">
      <div className="mx-auto max-w-md text-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Developer Panel</h3>
          <button className="text-xs text-muted-foreground" onClick={() => setShow(false)}>Hide</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs">minSecondsPomodoro</span>
            <input type="number" className="w-20 rounded-md border bg-card px-2 py-1"
              value={(p as any).rules?.minSecondsPomodoro || 0}
              onChange={(e) => saveRules({ minSecondsPomodoro: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs">minSecondsFlow</span>
            <input type="number" className="w-20 rounded-md border bg-card px-2 py-1"
              value={(p as any).rules?.minSecondsFlow || 0}
              onChange={(e) => saveRules({ minSecondsFlow: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs">cooldownSeconds</span>
            <input type="number" className="w-20 rounded-md border bg-card px-2 py-1"
              value={(p as any).rules?.cooldownSeconds || 0}
              onChange={(e) => saveRules({ cooldownSeconds: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs">dailyMaxPlacements</span>
            <input type="number" className="w-20 rounded-md border bg-card px-2 py-1"
              value={(p as any).rules?.dailyMaxPlacements || 0}
              onChange={(e) => saveRules({ dailyMaxPlacements: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="px-2 py-1 rounded-md bg-primary text-primary-foreground" onClick={() => grantSession('pomodoro')}>Grant Pomodoro</button>
          <button className="px-2 py-1 rounded-md bg-primary text-primary-foreground" onClick={() => grantSession('flow')}>Grant Flow</button>
          <button className="px-2 py-1 rounded-md bg-secondary" onClick={() => openWindDown(true)}>Open WindDown (valid)</button>
          <button className="px-2 py-1 rounded-md bg-secondary" onClick={() => openWindDown(false)}>Open WindDown (invalid)</button>
          <button className="px-2 py-1 rounded-md bg-accent" onClick={addFP}>+10 FP</button>
          <button className="px-2 py-1 rounded-md bg-accent" onClick={giveToken}>Give Garden Token</button>
          <button className="px-2 py-1 rounded-md bg-accent" onClick={resetDaily}>Reset Daily</button>
          <button className="px-2 py-1 rounded-md bg-accent" onClick={advanceDay}>Advance Day +1</button>
          <button className="px-2 py-1 rounded-md bg-destructive text-destructive-foreground" onClick={hardReset}>HARD RESET</button>
        </div>
      </div>
    </div>
  );
}
