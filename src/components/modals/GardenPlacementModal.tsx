import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { loadProgress, saveProgress, GardenStep } from '@/utils/storageClient';
import { placeGardenItem } from '@/utils/gardenHelpers';
import { isTileLocked } from '@/utils/gardenMap';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

interface GardenPlacementModalProps {
  open: boolean;
  onClose: () => void;
  token?: GardenStep; // optional explicit token (e.g., from Inventory or WindDown)
  onPlaced?: () => void; // callback after successful placement
}

export default function GardenPlacementModal({ open, onClose, token, onPlaced }: GardenPlacementModalProps) {
  const [progress, setProgress] = useState(loadProgress());
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);

  useEffect(() => {
    if (open) {
      const p = loadProgress();
      setProgress(p);
      setSelected(null);
      setRotation(0);
    }
  }, [open]);

  const garden = progress.garden || { cols: 12, rows: 8, placed: [], bg: 'gravel_light.png' };
  const targetToken: GardenStep | undefined = token || progress.pendingToken || progress.pendingTokens?.[0];

  const isFull = useMemo(() => (garden.placed?.length || 0) >= garden.cols * garden.rows, [garden]);

  const isOccupied = (x: number, y: number) => garden.placed?.some((it) => it.x === x && it.y === y);

  const handleCellClick = (i: number) => {
    if (!targetToken) return;
    const x = i % garden.cols;
    const y = Math.floor(i / garden.cols);
    if (isTileLocked(x, y)) {
      toast.error('Temple area is sacred — items cannot be placed here');
      return;
    }
    if (isOccupied(x, y)) {
      toast.error('That spot is taken');
      return;
    }
    setSelected({ x, y });
  };

  const confirmPlacement = () => {
    if (!targetToken || !selected) return;
    const res = placeGardenItem(targetToken, selected.x, selected.y, rotation);
    if (!(res as any).ok) {
      toast.error((res as any).reason === 'occupied' ? 'That spot is taken' : 'Could not place item');
      return;
    }
    setProgress(loadProgress());
    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch {}
    }
    toast.success('Placed in your garden');
    onPlaced?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[560px]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Place on Garden Map</h2>
            <p className="text-sm text-muted-foreground">Tap an empty cell to choose where to place your item.</p>
          </div>

          {!targetToken && (
            <div className="text-sm text-muted-foreground">No items to place right now.</div>
          )}

          {isFull && (
            <div className="rounded-lg border bg-card p-3 text-sm">Garden is full. Manage items to free space.</div>
          )}

          {/* 12x8 grid */}
          <div className="relative">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${garden.cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: garden.cols * garden.rows }).map((_, i) => {
                const x = i % garden.cols;
                const y = Math.floor(i / garden.cols);
                const locked = isTileLocked(x, y);
                const occupied = isOccupied(x, y);
                const isSel = selected?.x === x && selected?.y === y;
                const imgAtCell = garden.placed?.find((it) => it.x === x && it.y === y)?.img;
                return (
                  <button
                    key={i}
                    className={`relative aspect-square rounded-md border transition-all ${
                      locked
                        ? 'bg-muted/40 cursor-not-allowed'
                        : occupied
                        ? 'bg-card'
                        : 'bg-background hover:bg-accent'
                    } ${isSel ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleCellClick(i)}
                    disabled={!targetToken || occupied || isFull || locked}
                    aria-label={`Cell ${x + 1}, ${y + 1}`}
                  >
                    {imgAtCell ? (
                      <img src={imgAtCell} alt="Placed item" className="absolute inset-0 m-auto w-8 h-8 object-contain" />
                    ) : locked ? (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">Temple</div>
                    ) : targetToken ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Empty</div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rotate / preview */}
          {!!targetToken && (
            <div className="flex items-center justify-between rounded-lg border bg-card p-2">
              <div className="flex items-center gap-2">
                <img src={targetToken.img} alt={targetToken.label} className="w-8 h-8 object-contain" />
                <span className="text-sm">{targetToken.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={() => setRotation((r) => ((r + 90) % 360) as any)}>Rotate 90°</button>
                <span className="text-xs text-muted-foreground">{rotation}°</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 rounded-md bg-accent text-accent-foreground"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
              disabled={!targetToken || selected == null}
              onClick={confirmPlacement}
            >
              Confirm placement
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
