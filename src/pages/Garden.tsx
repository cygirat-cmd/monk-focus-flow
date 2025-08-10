import BottomNav from '@/components/layout/BottomNav';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadProgress, saveProgress, GardenPlacedItem, GardenStep, placeGardenItem, moveGardenItem, rotateGardenItem, removeGardenItem } from '@/utils/storageClient';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import GardenPlacementModal from '@/components/modals/GardenPlacementModal';
import { RotateCw, Trash2, Check, Sprout } from 'lucide-react';

export default function Garden() {
  const [progress, setProgress] = useState(loadProgress());
  const [manage, setManage] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placeToken, setPlaceToken] = useState<GardenStep | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    document.title = 'Garden – Monk';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Arrange your Zen Garden. Place, move, and rotate items.');
  }, []);

  useEffect(() => {
    setProgress(loadProgress());
  }, [placeOpen]);

  const garden = progress.garden || { cols: 12, rows: 8, placed: [], bg: 'gravel_light.png' };
  const cellW = 100 / garden.cols;
  const cellH = 100 / garden.rows;
  
  // Simplified NPC and features for now - using defaults
  const npc = { x: 6, y: 4, message: null, messageExpiry: null };
  const showNPCMessage = false;

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
    const gx = Math.floor((relX / stageRect.width) * garden.cols);
    const gy = Math.floor((relY / stageRect.height) * garden.rows);

    // Visual feedback by setting CSS variable
    const ghost = document.getElementById(`garden-item-${dragRef.current.id}`);
    if (ghost) {
      (ghost as HTMLElement).style.transform = `translate(${gx * cellW}%, ${gy * cellH}%) rotate(0deg)`;
      (ghost as HTMLElement).style.left = `${gx * cellW}%`;
      (ghost as HTMLElement).style.top = `${gy * cellH}%`;
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
    const gx = Math.floor((relX / stageRect.width) * garden.cols);
    const gy = Math.floor((relY / stageRect.height) * garden.rows);

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
  
  // Check for temple area (center 5-7, 3-5)
  const isTempleArea = (x: number, y: number) => x >= 5 && x <= 7 && y >= 3 && y <= 5;

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
          <div ref={stageRef} className="garden-stage relative w-full aspect-[12/8] rounded-xl overflow-hidden border bg-muted/30" style={bgStyle}
            onPointerMove={onDragMove} onPointerUp={endDrag}>
            {/* grid */}
            <div className="garden-grid pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${garden.cols}, 1fr)`, gridTemplateRows: `repeat(${garden.rows}, 1fr)` }}>
              {Array.from({ length: garden.cols * garden.rows }).map((_, i) => {
                const x = i % garden.cols;
                const y = Math.floor(i / garden.cols);
                const isTemple = isTempleArea(x, y);
                return (
                  <div 
                    key={i} 
                    className="garden-cell border-dashed" 
                    style={{ 
                      outline: '1px dashed hsl(var(--border) / 0.15)',
                      backgroundColor: isTemple ? 'hsl(var(--muted) / 0.3)' : 'transparent',
                    }} 
                  />
                );
              })}
            </div>
            
            {/* NPC Monk */}
            <div
              className="absolute z-20 pointer-events-none"
              style={{ 
                left: `${npc.x * cellW}%`, 
                top: `${npc.y * cellH}%`, 
                width: `${cellW}%`, 
                height: `${cellH}%`,
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 bg-orange-400 rounded-full border-2 border-orange-600 flex items-center justify-center text-xs">
                  🧘
                </div>
              </div>
            </div>

            {/* items */}
            {garden.placed.map((it) => (
              <div
                key={it.id}
                id={`garden-item-${it.id}`}
                className={`garden-item absolute ${manage ? 'cursor-grab touch-none' : ''}`}
                style={{ left: `${it.x * cellW}%`, top: `${it.y * cellH}%`, width: `${cellW}%`, height: `${cellH}%`, transform: `rotate(${it.rotation}deg)` }}
                onPointerDown={(e) => beginDrag(e, it)}
                onClick={() => manage ? setSelectedId(it.id) : null}
              >
                <img src={it.img} alt={it.label || 'Garden item'} className="w-full h-full object-contain" />
              </div>
            ))}

            {/* floating item menu */}
            {manage && selectedId && (() => {
              const it = garden.placed.find(p => p.id === selectedId);
              if (!it) return null;
              return (
                <div className="garden-toolbar absolute z-10" style={{ left: `${(it.x + 0.5) * cellW}%`, top: `${(it.y + 0.5) * cellH}%`, transform: 'translate(-50%, -100%)' }}>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border shadow-sm">
                    <button className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs flex items-center gap-1" onClick={() => setSelectedId(null)}><Check size={14}/> Done</button>
                    <button className="px-2 py-1 rounded-md border text-xs flex items-center gap-1" onClick={() => onRotate(it.id)}><RotateCw size={14}/> Rotate</button>
                    <button className="px-2 py-1 rounded-md border text-destructive text-xs flex items-center gap-1" onClick={() => onRemove(it.id)}><Trash2 size={14}/> Remove</button>
                  </div>
                </div>
              );
            })()}
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
