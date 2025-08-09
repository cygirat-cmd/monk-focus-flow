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

export type ProgressData = {
  completedSessions: number;
  pathLength: number;
  currentPath: GardenStep[];
  relics: Relic[];
  gardenGrid: GardenGrid; // 6x4 grid (24 cells)
  pendingTokens: GardenStep[]; // items awaiting placement
  focusPoints: number;
  rules: { minSecondsPomodoro: number; minSecondsFlow: number; dailyMaxPlacements: number; cooldownSeconds: number };
  counters: { placementsToday: number; lastSessionEndedAt: number };
  streak: { days: number; lastDate: string };
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
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0 },
      streak: { days: 0, lastDate: '' },
    };
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      gardenGrid: parsed.gardenGrid ?? defaults.gardenGrid,
      pendingTokens: parsed.pendingTokens ?? defaults.pendingTokens,
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
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0 },
      streak: { days: 0, lastDate: '' },
    };
  }
};

export const saveProgress = (progress: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
