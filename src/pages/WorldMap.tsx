import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { loadProgress, saveProgress } from '@/utils/storageClient';
import { monkGif } from '@/assets/monk';
import { Camera, Grid, tileToWorld, getVisibleTileRect, getVisibleTileRectWithLOD, tileCenterToWorld } from '@/utils/grid';
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
    if (drag.current.id === e.pointerId && containerRef.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      setCamera(c => {
        const newX = drag.current.cx + dx;
        const newY = drag.current.cy + dy;
        
        // Apply bounds to prevent camera from going outside map
        const mapWidth = grid.cols * TILE_PX * c.zoom;
        const mapHeight = grid.rows * TILE_PX * c.zoom;
        const { clientWidth, clientHeight } = containerRef.current!;
        
        const boundedX = Math.min(0, Math.max(clientWidth - mapWidth, newX));
        const boundedY = Math.min(0, Math.max(clientHeight - mapHeight, newY));
        
        return { ...c, x: boundedX, y: boundedY };
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current.id === e.pointerId) drag.current.id = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const scale = Math.exp(-e.deltaY * 0.001);
    setCamera(c => {
      // Limit zoom range to prevent seeing outside map
      const zoom = Math.min(2.0, Math.max(0.5, c.zoom * scale));
      const wx = (px - c.x) / c.zoom;
      const wy = (py - c.y) / c.zoom;
      
      // Calculate new camera position
      const newX = px - wx * zoom;
      const newY = py - wy * zoom;
      
      // Apply bounds to prevent camera from going outside map
      const mapWidth = grid.cols * TILE_PX * zoom;
      const mapHeight = grid.rows * TILE_PX * zoom;
      const { clientWidth, clientHeight } = containerRef.current!;
      
      const boundedX = Math.min(0, Math.max(clientWidth - mapWidth, newX));
      const boundedY = Math.min(0, Math.max(clientHeight - mapHeight, newY));
      
      return { x: boundedX, y: boundedY, zoom };
    });
  };

  // Memoized fog rendering with enhanced culling and fixed darkening
  const renderFog = useCallback(() => {
    const canvas = fogRef.current;
    const ctx = canvas?.getContext('2d');
    const el = containerRef.current;
    if (!canvas || !ctx || !el) return;
    
    const { clientWidth, clientHeight } = el;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    
    // Get enhanced culling rect with LOD
    const cullInfo = getVisibleTileRectWithLOD(clientWidth, clientHeight, grid, camera);
    const tileSize = TILE_PX * camera.zoom;
    
    // Performance optimization: skip rendering tiles that are too small to see
    if (tileSize < 1) {
      return;
    }
    
    // Only render fog on unrevealed areas - don't darken revealed areas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    
    // Use different rendering strategies based on LOD
    if (cullInfo.lod === 'low') {
      // For very zoomed out view, render fog in larger blocks for performance
      const step = cullInfo.step || 2;
      for (let ty = cullInfo.y0; ty <= cullInfo.y1; ty += step) {
        for (let tx = cullInfo.x0; tx <= cullInfo.x1; tx += step) {
          // Check if any tile in this block is unrevealed
          let hasUnrevealedTile = false;
          for (let sy = 0; sy < step && ty + sy <= cullInfo.y1; sy++) {
            for (let sx = 0; sx < step && tx + sx <= cullInfo.x1; sx++) {
              if (!isRevealed(tx + sx, ty + sy, fog)) {
                hasUnrevealedTile = true;
                break;
              }
            }
            if (hasUnrevealedTile) break;
          }
          
          if (hasUnrevealedTile) {
            const pos = tileToWorld(tx, ty, grid, camera);
            ctx.fillRect(
              Math.floor(pos.x), 
              Math.floor(pos.y), 
              Math.ceil(tileSize * step), 
              Math.ceil(tileSize * step)
            );
          }
        }
      }
    } else {
      // For normal/high LOD, render individual tiles
      for (let ty = cullInfo.y0; ty <= cullInfo.y1; ty++) {
        for (let tx = cullInfo.x0; tx <= cullInfo.x1; tx++) {
          // Only render fog on unrevealed tiles
          if (!isRevealed(tx, ty, fog)) {
            const pos = tileToWorld(tx, ty, grid, camera);
            
            if (tileSize < 4) {
              // Batch small tiles for performance
              ctx.fillRect(
                Math.floor(pos.x), 
                Math.floor(pos.y), 
                Math.ceil(tileSize), 
                Math.ceil(tileSize)
              );
            } else {
              // Normal tile rendering
              ctx.fillRect(
                pos.x, 
                pos.y, 
                tileSize, 
                tileSize
              );
            }
          }
        }
      }
    }
  }, [camera, fog, grid]);

  // Draw fog each frame when camera changes
  useEffect(() => {
    renderFog();
  }, [renderFog]);

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
    <div className="relative w-screen h-screen overflow-hidden bg-black" ref={containerRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onWheel={onWheel} style={{ touchAction: 'pan-x pan-y' }}>
      {/* Background with grid overlay */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: grid.cols * TILE_PX,
          height: grid.rows * TILE_PX,
          backgroundImage: `url('/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png'), 
                           repeating-linear-gradient(0deg, transparent, transparent ${TILE_PX - 1}px, rgba(255,255,255,0.1) ${TILE_PX - 1}px, rgba(255,255,255,0.1) ${TILE_PX}px),
                           repeating-linear-gradient(90deg, transparent, transparent ${TILE_PX - 1}px, rgba(255,255,255,0.1) ${TILE_PX - 1}px, rgba(255,255,255,0.1) ${TILE_PX}px)`,
          backgroundSize: 'cover, 64px 64px, 64px 64px',
          backgroundRepeat: 'no-repeat, repeat, repeat',
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
      <StepPanel onOpenMovementModal={() => setShowMovementModal(true)} />
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
