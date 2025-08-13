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
  const [camera, setCamera] = useState<Camera>(progress.camera || { x: 0, y: 0, zoom: 1 });
  const journey = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };
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
      setCamera(c => {
        const newX = drag.current.cx + dx;
        const newY = drag.current.cy + dy;
        
        // Get container dimensions
        const container = containerRef.current;
        if (!container) return { ...c, x: newX, y: newY };
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const mapWidth = grid.cols * TILE_PX * c.zoom;
        const mapHeight = grid.rows * TILE_PX * c.zoom;
        
        // Calculate bounds - prevent camera from going outside map
        const minX = Math.min(0, containerWidth - mapWidth);
        const maxX = 0;
        const minY = Math.min(0, containerHeight - mapHeight);
        const maxY = 0;
        
        return {
          ...c,
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY))
        };
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current.id === e.pointerId) drag.current.id = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const scale = Math.exp(-e.deltaY * 0.001);
    setCamera(c => {
      const zoom = Math.min(1.5, Math.max(0.5, c.zoom * scale));
      const wx = (px - c.x) / c.zoom;
      const wy = (py - c.y) / c.zoom;
      
      const newX = px - wx * zoom;
      const newY = py - wy * zoom;
      
      // Apply bounds after zoom
      const container = containerRef.current;
      if (!container) return { x: newX, y: newY, zoom };
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const mapWidth = grid.cols * TILE_PX * zoom;
      const mapHeight = grid.rows * TILE_PX * zoom;
      
      const minX = Math.min(0, containerWidth - mapWidth);
      const maxX = 0;
      const minY = Math.min(0, containerHeight - mapHeight);
      const maxY = 0;
      
      return {
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
        zoom
      };
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
    
    const rect = getVisibleTileRect(clientWidth, clientHeight, grid, camera);
    
    // Draw blurred tiles for unrevealed areas
    for (let ty = rect.y0; ty <= rect.y1; ty++) {
      for (let tx = rect.x0; tx <= rect.x1; tx++) {
        if (isRevealed(tx, ty, fog)) continue;
        
        const pos = tileToWorld(tx, ty, grid, camera);
        const tileSize = TILE_PX * camera.zoom;
        
        ctx.filter = 'blur(8px)';
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(
          pos.x, 
          pos.y, 
          tileSize, 
          tileSize
        );
      }
    }
    ctx.filter = 'none';
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
    <div className="relative w-screen h-screen overflow-hidden" ref={containerRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onWheel={onWheel} style={{ touchAction: 'none' }}>
      <div
        className="absolute top-0 left-0"
        style={{
          width: grid.cols * TILE_PX,
          height: grid.rows * TILE_PX,
          backgroundImage: `url('/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png')`,
          backgroundSize: 'cover',
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
