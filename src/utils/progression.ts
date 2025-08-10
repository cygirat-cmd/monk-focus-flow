export function isSameDay(a: number | string, b: number | string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
}

export function midnightReset(progress: any) {
  const now = Date.now();
  const last = progress.streak?.lastDate ? new Date(progress.streak.lastDate).getTime() : 0;
  if (!isSameDay(now, last)) {
    progress.counters = {
      ...(progress.counters || {}),
      placementsToday: 0,
      itemsReceivedToday: 0,
      itemsDate: new Date().toDateString(),
      lastSessionEndedAt: progress.counters?.lastSessionEndedAt || 0,
    };
  }
}

export function validateSession(payload: { mode: 'flow' | 'pomodoro'; seconds: number }, progress: any) {
  progress.rules = progress.rules || { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 };
  progress.counters = progress.counters || { placementsToday: 0, lastSessionEndedAt: 0 };
  progress.streak = progress.streak || { days: 0, lastDate: '' };

  midnightReset(progress);

  const min = payload.mode === 'flow' ? progress.rules.minSecondsFlow : progress.rules.minSecondsPomodoro;
  if (payload.seconds < min) return { ok: false, reason: 'too_short' } as const;
  if (Date.now() - (progress.counters.lastSessionEndedAt || 0) < progress.rules.cooldownSeconds * 1000)
    return { ok: false, reason: 'cooldown' } as const;
  if ((progress.counters.placementsToday || 0) >= progress.rules.dailyMaxPlacements)
    return { ok: false, reason: 'daily_cap' } as const;
  return { ok: true } as const;
}

export function addFocusPoints(progress: any, seconds: number) {
  const minutes = seconds / 60;
  const mult = 1 + 0.1 * Math.min(progress.streak?.days || 0, 5); // cap +50%
  progress.focusPoints = Math.floor((progress.focusPoints || 0) + minutes * mult);
}

export function updateStreak(progress: any) {
  const today = new Date().toDateString();
  if (progress.streak?.lastDate === today) return;

  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toDateString();

  if (progress.streak?.lastDate && progress.streak.lastDate === yestStr) {
    progress.streak.days = (progress.streak.days || 0) + 1;
  } else {
    progress.streak = { days: 1, lastDate: today };
  }
  progress.streak.lastDate = today;
}