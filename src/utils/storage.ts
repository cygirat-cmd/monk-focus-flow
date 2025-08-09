export type Task = { id: string; title: string; notes?: string };
export type ColumnKey = 'now' | 'next' | 'later';
export type TasksState = Record<ColumnKey, Task[]>;

export type Settings = {
  defaultMinutes: number;
  sound: boolean;
  vibration: boolean;
  notifications: boolean;
};

const TASKS_KEY = 'monk_tasks_v1';
const SETTINGS_KEY = 'monk_settings_v1';

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
      return { defaultMinutes: 25, sound: true, vibration: true, notifications: true };
    return JSON.parse(raw);
  } catch {
    return { defaultMinutes: 25, sound: true, vibration: true, notifications: true };
  }
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
