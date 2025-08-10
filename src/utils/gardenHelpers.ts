import { loadProgress, saveProgress, GardenStep } from './storageClient';
import { isTileLocked } from './gardenMap';

export const placeGardenItem = (token: GardenStep, x: number, y: number, rotation: 0|90|180|270 = 0) => {
  const p = loadProgress();
  const garden = p.garden!;
  // Check bounds
  if (x < 0 || y < 0 || x >= garden.cols || y >= garden.rows) return { ok: false, reason: 'out_of_bounds' } as const;
  // Locked tiles (temple)
  if (isTileLocked(x, y)) return { ok: false, reason: 'locked' } as const;
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
  if (isTileLocked(x, y)) return { ok: false, reason: 'locked' } as const;
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