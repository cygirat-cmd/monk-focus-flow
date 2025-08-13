import { useEffect, useRef, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { loadProgress, saveProgress } from '@/utils/storageClient';
import { monkGif } from '@/assets/monk';
import { Camera, Grid, tileToWorld, getVisibleTileRect } from '@/utils/grid';
import { GARDEN_COLS, GARDEN_ROWS, TILE_PX } from '@/utils/gardenMap';
import { makeFog, isRevealed, revealRadius } from '@/features/fog/useFog';
import StepPanel from '@/components/world/StepPanel';

type Props = { onDone?: () => void };

export default function WorldMap({ onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(loadProgress());
  const grid: Grid = { tileW: TILE_PX, tileH: TILE_PX, cols: GARDEN_COLS, rows: GARDEN_ROWS };
  const [camera, setCamera] = useState<Camera>(progress.camera || { x: 0, y: 0, zoom: 1 });
  const journey = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };
  const fog = useRef(
    progress.fog
      ? { cols: progress.fog.cols, rows: progress.fog.rows, revealed: Uint8Array.from(progress.fog.revealed) }
      : makeFog(grid.cols, grid.rows)
  ).current;

  useEffect(() => {
    progress.camera = camera;
    progress.fog = { cols: fog.cols, rows: fog.rows, revealed: Array.from(fog.revealed) };
    saveProgress(progress);
    setProgress({ ...progress });
  }, [camera]);

  useEffect(() => {
    const handler = (e: any) => {
      setProgress({ ...(e.detail?.progress || loadProgress()) });
    };
    window.addEventListener('monk:progress-updated', handler as any);
    return () => window.removeEventListener('monk:progress-updated', handler as any);
  }, []);

  useEffect(() => {
    if (!progress.fog?.revealed.length) {
      revealRadius(journey.tx, journey.ty, 3, fog);
      progress.fog = { cols: fog.cols, rows: fog.rows, revealed: Array.from(fog.revealed) };
      progress.journey = journey;
      saveProgress(progress);
      setProgress({ ...progress });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    ctx.clearRect(0,0,clientWidth,clientHeight);
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,clientWidth,clientHeight);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    const rect = getVisibleTileRect(clientWidth, clientHeight, grid, camera);
    for (let ty = rect.y0; ty <= rect.y1; ty++) {
      for (let tx = rect.x0; tx <= rect.x1; tx++) {
        if (!isRevealed(tx, ty, fog)) continue;
        const pos = tileToWorld(tx, ty, grid, camera);
        ctx.beginPath();
        ctx.arc(pos.x + TILE_PX * camera.zoom / 2, pos.y + TILE_PX * camera.zoom / 2, TILE_PX * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [camera, progress]);

  const monkPos = tileToWorld(journey.tx, journey.ty, grid, camera);
  const flip = journey.facing === 'left' ? -1 : 1;

  const moves = progress.pendingSteps > 0
    ? [
        { tx: journey.tx + 1, ty: journey.ty, dir: 'right' as const },
        { tx: journey.tx - 1, ty: journey.ty, dir: 'left' as const },
        { tx: journey.tx, ty: journey.ty - 1, dir: 'up' as const },
        { tx: journey.tx, ty: journey.ty + 1, dir: 'down' as const },
      ].filter(m => m.tx >= 0 && m.ty >= 0 && m.tx < grid.cols && m.ty < grid.rows)
    : [];

  const moveTo = (m: { tx: number; ty: number; dir: 'left' | 'right' | 'up' | 'down' }) => {
    journey.tx = m.tx;
    journey.ty = m.ty;
    journey.step += 1;
    journey.facing = m.dir === 'left' ? 'left' : 'right';
    revealRadius(journey.tx, journey.ty, 3, fog);
    progress.journey = journey;
    progress.fog = { cols: fog.cols, rows: fog.rows, revealed: Array.from(fog.revealed) };
    progress.pendingSteps = (progress.pendingSteps || 0) - 1;
    saveProgress(progress);
    setProgress({ ...progress });
    if ((progress.pendingSteps || 0) <= 0) onDone?.();
  };

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
      {moves.map(m => {
        const pos = tileToWorld(m.tx, m.ty, grid, camera);
        return (
          <button key={`${m.tx},${m.ty}`}
            onClick={() => moveTo(m)}
            className="absolute bg-yellow-300/50 border-2 border-yellow-500"
            style={{
              width: TILE_PX * camera.zoom,
              height: TILE_PX * camera.zoom,
              left: pos.x + TILE_PX * camera.zoom / 2,
              top: pos.y + TILE_PX * camera.zoom / 2,
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      })}
      <canvas ref={fogRef} className="absolute inset-0 pointer-events-none" />
      <StepPanel />
      <BottomNav />
    </div>
  );
}
