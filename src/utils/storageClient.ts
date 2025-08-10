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
  // New
  garden?: GardenState;
  pendingToken?: GardenStep | null;
  inventory?: GardenStep[]; // removed items stored here
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

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
      garden: { cols: 12, rows: 8, placed: [], bg: '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png' },
      pendingToken: null,
      inventory: [],
      focusPoints: 0,
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0 },
      streak: { days: 0, lastDate: '' },
    };
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);

    // Migrations for legacy structure
    const migrated: ProgressData = {
      ...defaults,
      ...parsed,
      gardenGrid: parsed.gardenGrid ?? defaults.gardenGrid,
      pendingTokens: parsed.pendingTokens ?? defaults.pendingTokens,
      garden: parsed.garden ?? defaults.garden,
      pendingToken: parsed.pendingToken ?? (parsed.pendingTokens?.length ? parsed.pendingTokens[0] : null),
      inventory: parsed.inventory ?? [],
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
      rules: { minSecondsPomodoro: 180, minSecondsFlow: 180, dailyMaxPlacements: 6, cooldownSeconds: 30 },
      counters: { placementsToday: 0, lastSessionEndedAt: 0 },
      streak: { days: 0, lastDate: '' },
    };
  }
};

export const saveProgress = (progress: ProgressData) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// Helpers for Garden operations
export const placeGardenItem = (token: GardenStep, x: number, y: number, rotation: 0|90|180|270 = 0) => {
  const p = loadProgress();
  const garden = p.garden!;
  // Check bounds
  if (x < 0 || y < 0 || x >= garden.cols || y >= garden.rows) return { ok: false, reason: 'out_of_bounds' } as const;
  // Check occupancy
  if (garden.placed.some(it => it.x === x && it.y === y)) return { ok: false, reason: 'occupied' } as const;

  const id = `${token.id}-${Date.now()}`;
  garden.placed.push({ id, type: 'step', tokenId: token.id, img: token.img, label: token.label, x, y, rotation, placedAt: new Date().toISOString() });

  // Clear pendingToken/queue if matches
  if (p.pendingToken && p.pendingToken.id === token.id) p.pendingToken = null;
  if (p.pendingTokens && p.pendingTokens.length && p.pendingTokens[0].id === token.id) {
    p.pendingTokens = p.pendingTokens.slice(1);
  }
  // Remove from inventory if exists
  if (p.inventory && p.inventory.length) {
    p.inventory = p.inventory.filter(t => !(t.id === token.id && t.img === token.img));
  }

  saveProgress(p);
  return { ok: true, id } as const;
};

export const moveGardenItem = (id: string, x: number, y: number) => {
  const p = loadProgress();
  const garden = p.garden!;
  if (garden.placed.some(it => it.id !== id && it.x === x && it.y === y)) return { ok: false, reason: 'occupied' } as const;
  const item = garden.placed.find(it => it.id === id);
  if (!item) return { ok: false, reason: 'not_found' } as const;
  item.x = x; item.y = y;
  saveProgress(p);
  return { ok: true } as const;
};

export const rotateGardenItem = (id: string, deg: number) => {
  const p = loadProgress();
  const item = p.garden!.placed.find(it => it.id === id);
  if (!item) return { ok: false, reason: 'not_found' } as const;
  const steps = [0, 90, 180, 270] as const;
  const next = (((item.rotation + deg) % 360) + 360) % 360;
  const snapped = steps.reduce((prev, cur) => Math.abs(cur - next) < Math.abs(prev - next) ? cur : prev, 0 as 0);
  item.rotation = snapped;
  saveProgress(p);
  return { ok: true } as const;
};

export const removeGardenItem = (id: string) => {
  const p = loadProgress();
  const idx = p.garden!.placed.findIndex(it => it.id === id);
  if (idx === -1) return { ok: false, reason: 'not_found' } as const;
  const [removed] = p.garden!.placed.splice(idx, 1);
  p.inventory = p.inventory || [];
  // Return original token back to inventory
  p.inventory.push({ id: removed.tokenId, img: removed.img, label: removed.label || 'Garden Item' });
  saveProgress(p);
  return { ok: true } as const;
};
