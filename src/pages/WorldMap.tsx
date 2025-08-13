import { useEffect, useMemo, useRef, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { loadProgress, saveProgress } from '@/utils/storageClient';
import { monkGif } from '@/assets/monk';
import { Camera, Grid, tileToWorld, getVisibleTileRect, tileCenterToWorld } from '@/utils/grid';
import { GARDEN_COLS, GARDEN_ROWS, TILE_PX } from '@/utils/gardenMap';
import { makeFog, fromSavedFog, isRevealed, initializeFogAroundMonk } from '@/features/fog/useFog';
import StepPanel from '@/components/world/StepPanel';
import PostSessionMovementModal from '@/components/modals/PostSessionMovementModal';
import { useMonkMovement } from '@/hooks/useMonkMovement';

export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(loadProgress());
  const [showMovementModal, setShowMovementModal] = useState(false);
  const grid = useMemo<Grid>(() => ({ tileW: TILE_PX, tileH: TILE_PX, cols: GARDEN_COLS, rows: GARDEN_ROWS }), []);
  const [camera, setCamera] = useState<Camera>(progress.camera || { x: 0, y: 0, zoom: 0.8 });
  const journey = progress.journey || { tx: 0, ty: 15, pathId: 'default', step: 0 };
  const moveMonk = useMonkMovement();
  
  const fog = useRef(
    progress.fog ? fromSavedFog(progress.fog) : makeFog(grid.cols, grid.rows)
  ).current;

  useEffect(() => {
    setProgress(prev => {
      const updated = {
        ...prev,
        camera,
        fog: { cols: fog.cols, rows: fog.rows, revealed: Array.from(fog.revealed) },
      };
      saveProgress(updated);
      return updated;
    });
  }, [camera, fog]);

  useEffect(() => {
    if (!progress.fog?.revealed.length || progress.fog.revealed.every(v => v === 0)) {
      initializeFogAroundMonk(journey.tx, journey.ty, fog);
      progress.fog = { cols: fog.cols, rows: fog.rows, revealed: Array.from(fog.revealed) };
      progress.journey = journey;
      saveProgress(progress);
      setProgress({ ...progress });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for pending steps and show movement modal
  useEffect(() => {
    if ((progress.pendingSteps || 0) > 0 && !showMovementModal) {
      setShowMovementModal(true);
    }
  }, [progress.pendingSteps, showMovementModal]);

  const drag = useRef<{x:number;y:number;cx:number;cy:number;id:number|null}>({x:0,y:0,cx:0,cy:0,id:null});
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, cx: camera.x, cy: camera.y, id: e.pointerId };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current.id === e.pointerId) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      setCamera(c => ({ ...c, x: drag.current.cx + dx, y: drag.current.cy + dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current.id === e.pointerId) drag.current.id = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const scale = Math.exp(-e.deltaY * 0.001);
    setCamera(c => {
      const zoom = Math.min(2.5, Math.max(0.6, c.zoom * scale));
      const wx = (px - c.x) / c.zoom;
      const wy = (py - c.y) / c.zoom;
      return { x: px - wx * zoom, y: py - wy * zoom, zoom };
    });
  };

  // Draw fog each frame when camera changes
  useEffect(() => {
    const canvas = fogRef.current;
    const ctx = canvas?.getContext('2d');
    const el = containerRef.current;
    if (!canvas || !ctx || !el) return;
    
    const { clientWidth, clientHeight } = el;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    
    // Fill with dark fog
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, clientWidth, clientHeight);
    
    // Clear revealed areas with circular blur
    ctx.globalCompositeOperation = 'destination-out';
    const rect = getVisibleTileRect(clientWidth, clientHeight, grid, camera);
    
    for (let ty = rect.y0; ty <= rect.y1; ty++) {
      for (let tx = rect.x0; tx <= rect.x1; tx++) {
        if (!isRevealed(tx, ty, fog)) continue;
        
        const pos = tileToWorld(tx, ty, grid, camera);
        const tileSize = TILE_PX * camera.zoom;
        
        ctx.beginPath();
        ctx.arc(
          pos.x + tileSize / 2, 
          pos.y + tileSize / 2, 
          tileSize / 2, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [camera, fog, progress, grid]);

  const handleMoveToTile = (tx: number, ty: number, steps: number) => {
    const updatedProgress = { ...progress };
    moveMonk(updatedProgress, fog, tx, ty, steps);
    saveProgress(updatedProgress);
    setProgress(updatedProgress);
    setShowMovementModal(false);
  };

  const monkPos = tileCenterToWorld(journey.tx, journey.ty, grid, camera);
  const flip = journey.facing === 'left' ? -1 : 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900" ref={containerRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onWheel={onWheel} style={{ touchAction: 'none' }}>
      <div
        className="absolute inset-0"
        style={{
          width: grid.cols * TILE_PX,
          height: grid.rows * TILE_PX,
          backgroundImage: `url('/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minWidth: '100vw',
          minHeight: '100vh',
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0'
        }}
      />
      <img src={monkGif} alt="Monk" className="absolute" style={{
        width: TILE_PX * camera.zoom,
        height: TILE_PX * camera.zoom,
        left: monkPos.x,
        top: monkPos.y,
        transform: `translate(-50%, -50%) scaleX(${flip})`
      }} />
      <canvas ref={fogRef} className="absolute inset-0 pointer-events-none" />
      <StepPanel />
      <BottomNav />
      
      <PostSessionMovementModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        onMoveToTile={handleMoveToTile}
        currentPosition={{ tx: journey.tx, ty: journey.ty }}
        availableSteps={progress.pendingSteps || 0}
        fog={fog}
        camera={camera}
      />
    </div>
  );
}
