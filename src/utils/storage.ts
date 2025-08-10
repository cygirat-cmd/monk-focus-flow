export type Task = { id: string; title: string; notes?: string };
export type ColumnKey = 'now' | 'next' | 'later';
export type TasksState = Record<ColumnKey, Task[]>;

export type Settings = {
  defaultMinutes: number;
  sound: boolean;
  vibration: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
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

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type NPC = {
  x: number;
  y: number;
  outfit: string;
  message?: string;
  messageExpiry?: number;
};

export type ZenTrial = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  expiresAt: string;
  completed: boolean;
  reward?: GardenStep;
};

export type FlowSession = {
  seconds: number;
  flowScore: number;
  timestamp: string;
};

export type ProgressData = {
  completedSessions: number;
  pathLength: number;
  currentPath: GardenStep[];
  relics: Relic[];
  gardenGrid: GardenGrid; // 6x4 grid (24 cells)
  pendingTokens: GardenStep[]; // items awaiting placement
  focusPoints: number;
  flowScore: number;
  bestFlowSession: FlowSession | null;
  rules: { minSecondsPomodoro: number; minSecondsFlow: number; dailyMaxPlacements: number; cooldownSeconds: number };
  counters: { placementsToday: number; lastSessionEndedAt: number; consecutiveDays: number };
  streak: { days: number; lastDate: string };
  npc: NPC;
  season: Season;
  lastActive: string;
  isWithered: boolean;
  trials: ZenTrial[];
  offlineMode: boolean;
  gardenBonuses: Record<string, { type: string; value: number }>; // item ID -> bonus
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
      return { defaultMinutes: 25, sound: true, vibration: true, notifications: true, theme: 'auto' };
    return JSON.parse(raw);
  } catch {
    return { defaultMinutes: 25, sound: true, vibration: true, notifications: true, theme: 'auto' };
  }
};

const getCurrentSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

export const loadProgress = (): ProgressData => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const defaults: ProgressData = {
      completedSessions: 0,
      pathLength: 8,
      currentPath: [],
      relics: [],
      gardenGrid: Array(24).fill(null),
      pendingTokens: [],
      focusPoints: 0,
      flowScore: 0,
      bestFlowSession: null,
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0, consecutiveDays: 0 },
      streak: { days: 0, lastDate: '' },
      npc: { x: 6, y: 4, outfit: 'default' },
      season: getCurrentSeason(),
      lastActive: new Date().toISOString(),
      isWithered: false,
      trials: [],
      offlineMode: false,
      gardenBonuses: {},
    };
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    
    // Check for decay (7+ days inactive)
    const lastActive = new Date(parsed.lastActive || new Date().toISOString());
    const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000));
    
    return {
      ...defaults,
      ...parsed,
      gardenGrid: parsed.gardenGrid ?? defaults.gardenGrid,
      pendingTokens: parsed.pendingTokens ?? defaults.pendingTokens,
      season: getCurrentSeason(),
      isWithered: daysSinceActive >= 7,
      lastActive: parsed.lastActive || defaults.lastActive,
    } as ProgressData;
  } catch {
    return {
      completedSessions: 0,
      pathLength: 8,
      currentPath: [],
      relics: [],
      gardenGrid: Array(24).fill(null),
      pendingTokens: [],
      focusPoints: 0,
      flowScore: 0,
      bestFlowSession: null,
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0, consecutiveDays: 0 },
      streak: { days: 0, lastDate: '' },
      npc: { x: 6, y: 4, outfit: 'default' },
      season: getCurrentSeason(),
      lastActive: new Date().toISOString(),
      isWithered: false,
      trials: [],
      offlineMode: false,
      gardenBonuses: {},
    };
  }
};

export const saveProgress = (progress: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
