export type Task = { id: string; title: string; notes?: string };
export type ColumnKey = 'now' | 'next' | 'later';
export type TasksState = Record<ColumnKey, Task[]>;

export type Settings = {
  defaultMinutes: number;
  sound: boolean;
  vibration: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  reminderHour?: number;
  reminderMinute?: number;
};

export type GardenStep = {
  id: string;
  img: string;
  label: string;
};

export type Relic = {
  id: string;
  img: string;
  title: string;
  unlockedAt: string;
};

export type Journey = {
  tx: number;
  ty: number;
  pathId: string;
  step: number;
};

export type ProgressData = {
  completedSessions: number;
  pathLength: number;
  currentPath: GardenStep[];
  relics: Relic[];
  inventory?: GardenStep[];
  focusPoints: number;
  flowScore?: number;
  bestFlowSession?: { seconds: number; flowScore: number; timestamp: string } | null;
  rules: { minSecondsPomodoro: number; minSecondsFlow: number; dailyMaxPlacements: number; cooldownSeconds: number };
  counters: { placementsToday: number; lastSessionEndedAt: number; consecutiveDays?: number; itemsReceivedToday?: number; itemsDate?: string; lastRewardAt?: number };
  streak: { days: number; lastDate: string };
  npc?: { x: number; y: number; message?: string; messageExpiry?: number };
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  trials?: any[];
  lastActive?: string;
  lastOpenedAt?: number;
  decayStage?: 0 | 1 | 2;
  reviveProgress?: number;
  journey?: Journey;
  fog?: { cols: number; rows: number; revealed: number[] };
  camera?: { x: number; y: number; zoom: number };
};

const TASKS_KEY = 'monk_tasks_v1';
const SETTINGS_KEY = 'monk_settings_v1';
const PROGRESS_KEY = 'monk.progress';

export const loadTasks = (): TasksState => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return { now: [], next: [], later: [] };
    return JSON.parse(raw);
  } catch {
    return { now: [], next: [], later: [] };
  }
};

export const saveTasks = (state: TasksState) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(state));
};

export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw)
      return { defaultMinutes: 25, sound: true, vibration: true, notifications: true, theme: 'auto', reminderHour: 9, reminderMinute: 0 };
    const parsed = JSON.parse(raw);
    return { reminderHour: 9, reminderMinute: 0, ...parsed };
  } catch {
    return { defaultMinutes: 25, sound: true, vibration: true, notifications: true, theme: 'auto', reminderHour: 9, reminderMinute: 0 };
  }
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadProgress = (): ProgressData => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const nowIso = new Date().toISOString();
    const defaults: ProgressData = {
      completedSessions: 0,
      pathLength: 8,
      currentPath: [],
      relics: [],
      inventory: [],
      focusPoints: 0,
      flowScore: 0,
      bestFlowSession: null,
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0, consecutiveDays: 0, itemsReceivedToday: 0, itemsDate: new Date().toDateString(), lastRewardAt: 0 },
      streak: { days: 0, lastDate: '' },
      npc: { x: 6, y: 4 },
      season: undefined,
      lastActive: nowIso,
      lastOpenedAt: Date.now(),
      decayStage: 0,
      reviveProgress: 0,
      journey: { tx: 0, ty: 0, pathId: 'default', step: 0 },
      fog: { cols: 12, rows: 8, revealed: [] },
      camera: { x: 0, y: 0, zoom: 1 },
    };
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);

    // Derive decay stage from lastOpenedAt / lastActive
    const lastOpenedAt = parsed.lastOpenedAt || Date.now();
    const daysSinceOpen = Math.floor((Date.now() - lastOpenedAt) / (24 * 60 * 60 * 1000));
    let decayStage: 0 | 1 | 2 = 0;
    if (daysSinceOpen >= 14) decayStage = 2; else if (daysSinceOpen >= 7) decayStage = 1;

    // Migrations for legacy structure
    const migrated: ProgressData = {
      ...defaults,
      ...parsed,
      inventory: parsed.inventory ?? defaults.inventory,
      flowScore: parsed.flowScore ?? defaults.flowScore,
      bestFlowSession: parsed.bestFlowSession ?? defaults.bestFlowSession,
      counters: { ...defaults.counters, ...(parsed.counters || {}) },
      npc: parsed.npc ?? defaults.npc,
      lastActive: parsed.lastActive || defaults.lastActive,
      lastOpenedAt: parsed.lastOpenedAt || defaults.lastOpenedAt,
      decayStage: parsed.decayStage ?? decayStage,
      reviveProgress: parsed.reviveProgress ?? defaults.reviveProgress,
      journey: parsed.journey ?? defaults.journey,
      fog: parsed.fog ?? defaults.fog,
      camera: parsed.camera ?? defaults.camera,
    } as ProgressData;

    return migrated;
  } catch {
    return {
      completedSessions: 0,
      pathLength: 8,
      currentPath: [],
      relics: [],
      inventory: [],
      focusPoints: 0,
      flowScore: 0,
      bestFlowSession: null,
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0, consecutiveDays: 0, itemsReceivedToday: 0, itemsDate: new Date().toDateString(), lastRewardAt: 0 },
      streak: { days: 0, lastDate: '' },
      npc: { x: 6, y: 4 },
      season: undefined,
      lastActive: new Date().toISOString(),
      lastOpenedAt: Date.now(),
      decayStage: 0,
      reviveProgress: 0,
      journey: { tx: 0, ty: 0, pathId: 'default', step: 0 },
      fog: { cols: 12, rows: 8, revealed: [] },
      camera: { x: 0, y: 0, zoom: 1 },
    };
  }
};

export const saveProgress = (progress: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  try {
    window.dispatchEvent(new CustomEvent('monk:progress-updated', { detail: { progress } }));
  } catch {}
};

