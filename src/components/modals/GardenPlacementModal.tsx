import { Dialog, DialogContent } from '@/components/ui/dialog';
import { loadProgress, GardenStep } from '@/utils/storage';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface GardenPlacementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GardenPlacementModal({ open, onClose }: GardenPlacementModalProps) {
  const [progress, setProgress] = useState(loadProgress());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setProgress(loadProgress());
      setSelectedIndex(null);
    }
  }, [open]);

  const pending = progress.pendingTokens?.[0] as GardenStep | undefined;
  const isFull = useMemo(() => progress.gardenGrid.every((c) => c !== null), [progress.gardenGrid]);

  const handleCellClick = (i: number) => {
    if (!pending) return;
    if (progress.gardenGrid[i]) {
      toast.error('That spot is taken');
      return;
    }
    setSelectedIndex(i);
  };

  const confirmPlacement = () => {
    if (selectedIndex == null || !pending) return;
    const next = loadProgress(); // re-read latest
    if (next.gardenGrid[selectedIndex]) {
      toast.error('That spot is taken');
      return;
    }
    next.gardenGrid[selectedIndex] = pending;
    next.pendingTokens = next.pendingTokens.slice(1);
    localStorage.setItem('monk.progress', JSON.stringify(next));
    setProgress(next);

    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch {}
    }

    toast.success('Placed on your garden');
    if (!next.pendingTokens.length) {
      onClose();
    } else {
      setSelectedIndex(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Place on Garden Map</h2>
            <p className="text-sm text-muted-foreground">Tap an empty cell to place your new item.</p>
          </div>

          {!pending && (
            <div className="text-sm text-muted-foreground">No items to place right now.</div>
          )}

          {isFull && (
            <div className="rounded-lg border bg-card p-3 text-sm">Garden is full. Manage items to free space.</div>
          )}

          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }).map((_, i) => {
              const cell = progress.gardenGrid[i];
              const isSelected = selectedIndex === i;
              return (
                <button
                  key={i}
                  className={`relative aspect-square rounded-md border transition-all ${
                    cell
                      ? 'bg-card'
                      : 'bg-background hover:bg-accent'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCellClick(i)}
                  disabled={!pending || !!cell || isFull}
                >
                  {cell ? (
                    <img src={cell.img} alt={cell.label} className="absolute inset-0 m-auto w-10 h-10 object-contain" />
                  ) : pending ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Empty</div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 rounded-md bg-accent text-accent-foreground"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
              disabled={selectedIndex == null || !pending}
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
