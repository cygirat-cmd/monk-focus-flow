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

export type GardenGrid = (GardenStep | null)[];

// New garden types
export type GardenPlacedItem = {
  id: string; // unique instance id
  type: 'step';
  tokenId: string; // original token id
  img: string;
  label?: string;
  x: number; // 0-based column
  y: number; // 0-based row
  rotation: 0 | 90 | 180 | 270;
  placedAt: string;
};

export type GardenState = {
  cols: number;
  rows: number;
  placed: GardenPlacedItem[];
  bg: string; // background image path or token
};

export type ProgressData = {
  completedSessions: number;
  pathLength: number;
  currentPath: GardenStep[];
  relics: Relic[];
  // Legacy
  gardenGrid: GardenGrid; // 6x4 grid (24 cells)
  pendingTokens: GardenStep[]; // items awaiting placement (legacy queue)
  // New Garden system
  garden?: GardenState;
  pendingToken?: GardenStep | null;
  inventory?: GardenStep[]; // removed items stored here
  focusPoints: number;
  // Flow stats
  flowScore?: number;
  bestFlowSession?: { seconds: number; flowScore: number; timestamp: string } | null;
  // Rules & counters
  rules: { minSecondsPomodoro: number; minSecondsFlow: number; dailyMaxPlacements: number; cooldownSeconds: number };
  counters: { placementsToday: number; lastSessionEndedAt: number; consecutiveDays?: number; itemsReceivedToday?: number; itemsDate?: string; lastRewardAt?: number };
  streak: { days: number; lastDate: string };
  // NPC & season
  npc?: { x: number; y: number; message?: string; messageExpiry?: number };
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  // Trials & flags
  trials?: any[];
  // Decay system
  lastActive?: string; // last session completed timestamp
  lastOpenedAt?: number; // last time app opened
  decayStage?: 0 | 1 | 2; // 0 normal, 1 thirsty, 2 withered
  isWithered?: boolean; // legacy flag
  reviveProgress?: number; // sessions after wither
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
      gardenGrid: Array(24).fill(null),
      pendingTokens: [],
      garden: { cols: 12, rows: 8, placed: [], bg: '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png' },
      pendingToken: null,
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
      gardenGrid: parsed.gardenGrid ?? defaults.gardenGrid,
      pendingTokens: parsed.pendingTokens ?? defaults.pendingTokens,
      garden: parsed.garden ?? defaults.garden,
      pendingToken: parsed.pendingToken ?? (parsed.pendingTokens?.length ? parsed.pendingTokens[0] : null),
      inventory: parsed.inventory ?? [],
      flowScore: parsed.flowScore ?? defaults.flowScore,
      bestFlowSession: parsed.bestFlowSession ?? defaults.bestFlowSession,
      counters: { ...defaults.counters, ...(parsed.counters || {}) },
      npc: parsed.npc ?? defaults.npc,
      lastActive: parsed.lastActive || defaults.lastActive,
      lastOpenedAt: parsed.lastOpenedAt || defaults.lastOpenedAt,
      decayStage: parsed.decayStage ?? decayStage,
      reviveProgress: parsed.reviveProgress ?? 0,
    } as ProgressData;

    return migrated;
  } catch {
    return {
      completedSessions: 0,
      pathLength: 8,
      currentPath: [],
      relics: [],
      gardenGrid: Array(24).fill(null),
      pendingTokens: [],
      garden: { cols: 12, rows: 8, placed: [], bg: '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png' },
      pendingToken: null,
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
    };
  }
};

export const saveProgress = (progress: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  try {
    window.dispatchEvent(new CustomEvent('monk:progress-updated', { detail: { progress } }));
  } catch {}
};

