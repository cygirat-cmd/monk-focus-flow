import { loadProgress, saveProgress, GardenStep } from './storageClient';
import { isTileLocked } from './gardenMap';

const LARGE_ITEMS = new Set([
  'torii-gate',
  'cherry-blossom-tree',
  'eternal-bloom-sakura',
  'bamboo-pavilion',
  'maple-tree',
  'zen-arch-gate',
  'spirit-wind-chimes',
  'fox-spirit-shrine',
  'dragon-fountain',
  'eternal-sand-garden',
  'phoenix-perch',
  'lazy-panda-hammock',
  'wooden-bench',
  'gravel-patch',
  'small-pond',
  'bamboo-fence',
  'moss-rock',
  'lotus-pond',
  'spring-waterfall',
  'ice-bridge',
  'lucky-carp',
  'golden-koi-pond',
  'mini-mt-fuji',
  'sun-spirit-fountain',
  'golden-leaf-whirlpool',
  'northern-light-lantern',
]);

export const getItemFootprint = (tokenId: string) =>
  LARGE_ITEMS.has(tokenId) ? { w: 2, h: 2 } : { w: 1, h: 1 };

export const placeGardenItem = (token: GardenStep, x: number, y: number, rotation: 0|90|180|270 = 0) => {
  const p = loadProgress();
  const garden = p.garden!;
  const { w, h } = getItemFootprint(token.id);
  // Check bounds
  if (x < 0 || y < 0 || x + w > garden.cols || y + h > garden.rows) return { ok: false, reason: 'out_of_bounds' } as const;
  // Locked tiles (temple)
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      if (isTileLocked(x + dx, y + dy)) return { ok: false, reason: 'locked' } as const;
    }
  }
  // Check occupancy
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      if (garden.placed.some(it => {
        const iw = it.w || 1; const ih = it.h || 1;
        return x + dx < it.x + iw && x + dx >= it.x && y + dy < it.y + ih && y + dy >= it.y;
      })) return { ok: false, reason: 'occupied' } as const;
    }
  }

  // Ensure the user actually owns an unplaced instance of this token
  let consumedSource: 'pendingToken' | 'pendingTokens' | 'inventory' | null = null;
  if (p.pendingToken && p.pendingToken.id === token.id) consumedSource = 'pendingToken';
  else if (p.pendingTokens && p.pendingTokens.find(t => t.id === token.id)) consumedSource = 'pendingTokens';
  else if (p.inventory && p.inventory.find(t => t.id === token.id)) consumedSource = 'inventory';

  if (!consumedSource) {
    return { ok: false, reason: 'not_owned' } as const;
  }

  const id = `${token.id}-${Date.now()}`;
  garden.placed.push({ id, type: 'step', tokenId: token.id, img: token.img, label: token.label, x, y, rotation, placedAt: new Date().toISOString(), w, h });

  // Consume exactly one from the appropriate source
  if (p.pendingToken && p.pendingToken.id === token.id) {
    p.pendingToken = null;
  }
  if ((consumedSource === 'pendingToken' || consumedSource === 'pendingTokens') && p.pendingTokens) {
    const idx = p.pendingTokens.findIndex(t => t.id === token.id);
    if (idx !== -1) p.pendingTokens.splice(idx, 1);
  }
  if (consumedSource === 'inventory' && p.inventory) {
    const idx = p.inventory.findIndex(t => t.id === token.id);
    if (idx !== -1) p.inventory.splice(idx, 1);
  }

  saveProgress(p);
  return { ok: true, id } as const;
};

export const moveGardenItem = (id: string, x: number, y: number) => {
  const p = loadProgress();
  const garden = p.garden!;
  const item = garden.placed.find(it => it.id === id);
  if (!item) return { ok: false, reason: 'not_found' } as const;
  const w = item.w || 1;
  const h = item.h || 1;
  if (x < 0 || y < 0 || x + w > garden.cols || y + h > garden.rows) return { ok: false, reason: 'out_of_bounds' } as const;
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      if (isTileLocked(x + dx, y + dy)) return { ok: false, reason: 'locked' } as const;
    }
  }
  const overlap = garden.placed.some(it => {
    if (it.id === id) return false;
    const iw = it.w || 1; const ih = it.h || 1;
    return x < it.x + iw && x + w > it.x && y < it.y + ih && y + h > it.y;
  });
  if (overlap) return { ok: false, reason: 'occupied' } as const;
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

// Choose a random empty tile in the garden (not locked, not occupied)
export const randomEmptyGardenTile = (): { x: number; y: number } | null => {
  const p = loadProgress();
  const g = p.garden;
  if (!g) return null;
  const occupied = new Set<string>();
  g.placed.forEach(it => {
    const w = it.w || 1; const h = it.h || 1;
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        occupied.add(`${it.x + dx},${it.y + dy}`);
      }
    }
  });
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      if (!isTileLocked(x, y) && !occupied.has(`${x},${y}`)) candidates.push({ x, y });
    }
  }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};