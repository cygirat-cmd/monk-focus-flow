import BottomNav from '@/components/layout/BottomNav';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadProgress, saveProgress, GardenPlacedItem, GardenStep } from '@/utils/storageClient';
import { placeGardenItem, moveGardenItem, rotateGardenItem, removeGardenItem } from '@/utils/gardenHelpers';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import GardenPlacementModal from '@/components/modals/GardenPlacementModal';
import { RotateCw, Trash2, Check, Sprout } from 'lucide-react';
import { isTileLocked } from '@/utils/gardenMap';
import GardenCanvas from '@/components/garden/GardenCanvas';
export default function Garden() {
  const [progress, setProgress] = useState(loadProgress());
  const [manage, setManage] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placeToken, setPlaceToken] = useState<GardenStep | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    document.title = 'Garden – Monk';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Arrange your Zen Garden. Place, move, and rotate items.');
  }, []);

  useEffect(() => {
    setProgress(loadProgress());
  }, [placeOpen]);

  // Subscribe to global progress updates to keep garden live
  useEffect(() => {
    const handler = () => setProgress(loadProgress());
    window.addEventListener('monk:progress-updated', handler as any);
    return () => window.removeEventListener('monk:progress-updated', handler as any);
  }, []);

  // Auto-scale stage to fit viewport without scroll
  useEffect(() => {
    const calc = () => {
      if (!wrapperRef.current) return;
      const ww = wrapperRef.current.clientWidth;
      const rect = wrapperRef.current.getBoundingClientRect();
      const availH = window.innerHeight - rect.top - 140; // leave space for header/nav
      const s = Math.min(1, ww / 768, availH / 512);
      setScale(Math.max(0.5, s));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const garden = progress.garden || { cols: 12, rows: 8, placed: [], bg: '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png' };
  const cellW = 64; // TILE_PX
  const cellH = 64; // TILE_PX
  
  // NPC state
  const npc: { x: number; y: number; message?: string } = (progress as any).npc || { x: 6, y: 4 };

  const onRotate = (id: string) => {
    rotateGardenItem(id, 90);
    setProgress(loadProgress());
  };

  const onRemove = (id: string) => {
    if (!confirm('Remove this item from your garden?')) return;
    removeGardenItem(id);
    setSelectedId(null);
    setProgress(loadProgress());
  };

  const beginDrag = (e: React.PointerEvent, item: GardenPlacedItem) => {
    if (!manage) return;
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, originX: item.x, originY: item.y };
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!manage) return;
    if (!dragRef.current || !stageRef.current) return;
    e.preventDefault();
    const stageRect = stageRef.current.getBoundingClientRect();
    const relX = Math.min(Math.max(e.clientX - stageRect.left, 0), stageRect.width);
    const relY = Math.min(Math.max(e.clientY - stageRect.top, 0), stageRect.height);
    const gx = Math.floor(relX / (cellW * scale));
    const gy = Math.floor(relY / (cellH * scale));

    // Visual feedback by setting inline style
    const ghost = document.getElementById(`garden-item-${dragRef.current.id}`);
    if (ghost) {
      (ghost as HTMLElement).style.transform = `rotate(0deg)`;
      (ghost as HTMLElement).style.left = `${gx * cellW}px`;
      (ghost as HTMLElement).style.top = `${gy * cellH}px`;
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!manage) return;
    if (!dragRef.current || !stageRef.current) return;
    const { id } = dragRef.current;
    dragRef.current = null;
    const stageRect = stageRef.current.getBoundingClientRect();
    const relX = Math.min(Math.max(e.clientX - stageRect.left, 0), stageRect.width);
    const relY = Math.min(Math.max(e.clientY - stageRect.top, 0), stageRect.height);
    const gx = Math.floor(relX / (cellW * scale));
    const gy = Math.floor(relY / (cellH * scale));

    // Check vacancy
    const occupied = garden.placed.some(it => it.x === gx && it.y === gy && it.id !== id);
    if (occupied) {
      alert('That spot is taken.');
      setProgress(loadProgress());
      return;
    }
    moveGardenItem(id, gx, gy);
    setProgress(loadProgress());
  };

  const openPlaceFor = (token?: GardenStep) => {
    setPlaceToken(token || null);
    setPlaceOpen(true);
  };

  const onPlaced = () => {
    setPlaceOpen(false);
    setPlaceToken(null);
    setProgress(loadProgress());
  };

  const bgStyle = useMemo(() => {
    const url = garden.bg ? (garden.bg.startsWith('http') || garden.bg.startsWith('/')) ? garden.bg : `/assets/garden/${garden.bg}` : '';
    return url ? { backgroundImage: `url(${url})` } : {};
  }, [garden.bg]);
  
  // Locked temple area helper
  const isTempleArea = (x: number, y: number) => isTileLocked(x, y);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-semibold">Garden</h1>
            <p className="text-sm text-muted-foreground">Arrange your zen space</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setInventoryOpen(true)} className="px-3 py-1.5 rounded-md border bg-card text-sm flex items-center gap-1">
              <Sprout size={16}/> Inventory
            </button>
            <button onClick={() => setManage(m => !m)} className={`px-3 py-1.5 rounded-md text-sm ${manage ? 'bg-primary text-primary-foreground' : 'border bg-card'}`}>{manage ? 'Done' : 'Manage'}</button>
          </div>
        </header>

        <section className="garden-wrap">
          <div 
            ref={wrapperRef}
            className="relative rounded-xl overflow-hidden border bg-muted/30 flex items-center justify-center"
            style={{ padding: 8, height: 512 * scale + 16 }}
            onPointerMove={onDragMove} onPointerUp={endDrag}
          >
            {/* Pixel-perfect canvas at 768x512 scaled to fit */}
            <div ref={stageRef} className="relative" style={{ width: 768, height: 512, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {/* Shared renderer (background + grid) */}
              {/* ... keep existing code (renderer import and usage) */}
              {/* We render items and NPC on top to keep manage UX intact */}
              {/* Grid/background */}
              {/* Using the shared GardenCanvas to ensure perfect alignment */}
              <GardenCanvas 
                placed={[]} 
                showGrid 
                showLockedOverlay={false}
                className="absolute inset-0"
              />

              {/* NPC Monk */}
              <div
                className="absolute z-20 pointer-events-none"
                style={{ 
                  left: `${npc.x * cellW}px`, 
                  top: `${npc.y * cellH}px`, 
                  width: `${cellW}px`, 
                  height: `${cellH}px`,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm border" />
                </div>
              </div>

              {/* items */}
              {garden.placed.map((it) => (
                <div
                  key={it.id}
                  id={`garden-item-${it.id}`}
                  className={`garden-item absolute ${manage ? 'cursor-grab touch-none' : ''}`}
                  style={{ left: `${it.x * cellW}px`, top: `${it.y * cellH}px`, width: `${cellW}px`, height: `${cellH}px`, transform: `rotate(${it.rotation}deg)` }}
                  onPointerDown={(e) => beginDrag(e, it)}
                  onClick={() => manage ? setSelectedId(it.id) : null}
                >
                  <img src={it.img} alt={it.label || 'Garden item'} style={{ width: `${cellW}px`, height: `${cellH}px`, imageRendering: 'pixelated', objectFit: 'contain' as const }} />
                </div>
              ))}

              {/* floating item menu */}
              {manage && selectedId && (() => {
                const it = garden.placed.find(p => p.id === selectedId);
                if (!it) return null;
                return (
                  <div className="garden-toolbar absolute z-10" style={{ left: `${(it.x + 0.5) * cellW}px`, top: `${(it.y + 0.5) * cellH}px`, transform: 'translate(-50%, -100%)' }}>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-card border shadow-sm">
                      <button className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs flex items-center gap-1" onClick={() => setSelectedId(null)}><Check size={14}/> Done</button>
                      <button className="px-2 py-1 rounded-md border text-xs flex items-center gap-1" onClick={() => onRotate(it.id)}><RotateCw size={14}/> Rotate</button>
                      <button className="px-2 py-1 rounded-md border text-destructive text-xs flex items-center gap-1" onClick={() => onRemove(it.id)}><Trash2 size={14}/> Remove</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Placement hint */}
        {progress.pendingTokens && progress.pendingTokens.length > 0 && (
          <div className="mt-4 p-3 rounded-lg border bg-card text-sm flex items-center justify-between">
            <div className="flex items-center gap-2"><img src={progress.pendingTokens[0].img} alt={progress.pendingTokens[0].label} className="w-8 h-8 object-contain"/><span>{progress.pendingTokens[0].label}</span></div>
            <button className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm" onClick={() => openPlaceFor(progress.pendingTokens[0])}>Place</button>
          </div>
        )}
      </main>

      {/* Inventory Drawer */}
      <Drawer open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader>
            <DrawerTitle>Inventory</DrawerTitle>
            <DrawerDescription>Items you can place in your garden.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3">
            {(!progress.pendingTokens || progress.pendingTokens.length === 0) && (
              <div className="text-sm text-muted-foreground">You have no items to place.</div>
            )}
            {progress.pendingTokens && progress.pendingTokens.map((token, i) => (
              <div key={`${token.id}-${i}`} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2"><img src={token.img} alt={token.label} className="w-8 h-8 object-contain"/><div><div className="text-sm font-medium">{token.label}</div><div className="text-xs text-muted-foreground">Pending</div></div></div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm" onClick={() => openPlaceFor(token)}>Place</button>
                </div>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Placement modal */}
      <GardenPlacementModal open={placeOpen} onClose={() => setPlaceOpen(false)} token={placeToken || undefined} onPlaced={onPlaced} />

      <BottomNav />
    </div>
  );
}
