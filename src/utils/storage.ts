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

export type ProgressData = {
  completedSessions: number;
  pathLength: number;
  currentPath: GardenStep[];
  relics: Relic[];
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
    if (!raw)
      return { completedSessions: 0, pathLength: 8, currentPath: [], relics: [] };
    return JSON.parse(raw);
  } catch {
    return { completedSessions: 0, pathLength: 8, currentPath: [], relics: [] };
  }
};

export const saveProgress = (progress: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
