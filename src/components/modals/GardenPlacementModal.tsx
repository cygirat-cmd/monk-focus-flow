import { useEffect, useRef, useState } from 'react';
import { loadProgress, GardenStep } from '@/utils/storageClient';
import { placeGardenItem, getItemFootprint } from '@/utils/gardenHelpers';
import { isTileLocked } from '@/utils/gardenMap';
import GardenCanvas from '@/components/garden/GardenCanvas';
import { toast } from '@/components/ui/sonner';

interface GardenPlacementModalProps {
  open: boolean;
  onClose: () => void;
  token?: GardenStep; // optional explicit token (e.g., from Inventory or WindDown)
  onPlaced?: () => void; // callback after successful placement
}

export default function GardenPlacementModal({ open, onClose, token, onPlaced }: GardenPlacementModalProps) {
  const [progress, setProgress] = useState(loadProgress());
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [placing, setPlacing] = useState(false);

  // Scale to fit small screens
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => {
      if (!wrapRef.current) return;
      const ww = wrapRef.current.clientWidth;
      const s = Math.min(1, ww / 768);
      setScale(Math.max(0.3, s));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  useEffect(() => {
    if (open) {
      const p = loadProgress();
      setProgress(p);
      setSelected(null);
    }
  }, [open]);

  // Live subscribe to progress changes while open
  useEffect(() => {
    if (!open) return;
    const handler = () => {
      try {
        const p = loadProgress();
        setProgress(p);
      } catch {}
    };
    window.addEventListener('monk:progress-updated', handler as any);
    return () => window.removeEventListener('monk:progress-updated', handler as any);
  }, [open]);

  if (!open) return null;

  const garden = progress.garden || { cols: 12, rows: 8, placed: [], bg: 'gravel_light.png' };
  const targetToken: GardenStep | undefined = token || progress.pendingToken || (progress.pendingTokens?.find(t => !!t) || undefined);
  const previewItem = targetToken ? { img: targetToken.img, label: targetToken.label, ...getItemFootprint(targetToken.id) } : null;

  const totalOccupied = garden.placed.reduce((s, it) => s + (it.w || 1) * (it.h || 1), 0);
  const isFull = totalOccupied >= garden.cols * garden.rows;
  const isOccupied = (x: number, y: number, w = 1, h = 1) =>
    garden.placed?.some(it => {
      const iw = it.w || 1; const ih = it.h || 1;
      return x < it.x + iw && x + w > it.x && y < it.y + ih && y + h > it.y;
    });

  const handleCellClick = (x: number, y: number) => {
    if (!targetToken) return;
    const { w, h } = getItemFootprint(targetToken.id);
    if (x + w > garden.cols || y + h > garden.rows) {
      toast('Too close to the edge');
      return;
    }
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        if (isTileLocked(x + dx, y + dy)) return;
      }
    }
    if (isOccupied(x, y, w, h)) {
      toast('That spot is taken');
      return;
    }
    setSelected({ x, y });
  };

  const confirmPlacement = () => {
    try {
      if (!targetToken || !selected || placing) return;
      setPlacing(true);
      const res = placeGardenItem(targetToken, selected.x, selected.y);
      const r = res as any;
      if (!r.ok) {
        setPlacing(false);
        if (r.reason === 'occupied') toast('That spot is taken');
        else if (r.reason === 'locked') toast('You cannot place on temple tiles');
        else if (r.reason === 'out_of_bounds') toast('Too close to the edge');
        else if (r.reason === 'not_owned') toast('This item has already been placed');
        else toast('Could not place item');
        return;
      }
      const newProg = loadProgress();
      setProgress(newProg);
      try { navigator.vibrate?.(10); } catch {}
      toast('Placed in your garden');
      const hasMore = !token && (newProg.pendingToken || (newProg.pendingTokens?.length ?? 0) > 0);
      if (hasMore) {
        setSelected(null);
        setPlacing(false);
      } else {
        setPlacing(false);
        onPlaced?.();
        onClose();
      }
    } catch (err) {
      console.error('Garden placement failed:', err);
      toast('Something went wrong placing the item');
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[560px] rounded-lg border border-border/40 bg-background/70 backdrop-blur p-4 shadow-lg">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Place on Garden Map</h2>
            <p className="text-sm text-muted-foreground">Tap an empty cell to choose where to place your item.</p>
          </div>

          {!targetToken && (
            <div className="text-sm text-muted-foreground">No items to place right now.</div>
          )}

          {isFull && (
            <div className="rounded-lg border border-border/40 bg-background/60 backdrop-blur p-3 text-sm">Garden is full. Manage items to free space.</div>
          )}

          {/* Shared Garden renderer at 768x512 for perfect alignment, scaled to fit */}
          <div ref={wrapRef} className="relative mx-auto w-full" style={{ height: 512 * scale }}>
            <div className="absolute top-0 left-0" style={{ width: 768, height: 512, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <GardenCanvas
                placed={garden.placed}
                showGrid
                showLockedOverlay
                selected={selected}
                previewItem={previewItem}
                onCellClick={handleCellClick}
                className="select-none"
                npc={null}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-md bg-accent text-accent-foreground" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50" disabled={!targetToken || selected == null} onClick={confirmPlacement}>Confirm placement</button>
          </div>
        </div>
      </div>
    </div>
  );
}
