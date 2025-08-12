import React, { memo } from 'react';
import { GARDEN_COLS, GARDEN_ROWS, TILE_PX, isTileLocked, defaultGardenBg } from '@/utils/gardenMap';
import type { GardenPlacedItem } from '@/utils/storageClient';

export type GardenCanvasMode = 'view' | 'place';

interface GardenCanvasProps {
  mode?: GardenCanvasMode;
  placed?: GardenPlacedItem[];
  showGrid?: boolean;
  showLockedOverlay?: boolean;
  widthPx?: number;
  heightPx?: number;
  selected?: { x: number; y: number } | null;
  onCellClick?: (x: number, y: number) => void;
  onItemPointerDown?: (e: React.PointerEvent, item: GardenPlacedItem) => void;
  npc?: { x: number; y: number; message?: string } | null;
  className?: string;
}

const WIDTH = GARDEN_COLS * TILE_PX;
const HEIGHT = GARDEN_ROWS * TILE_PX;

export function GardenCanvas({
  mode = 'view',
  placed = [],
  showGrid = true,
  showLockedOverlay = false,
  widthPx = WIDTH,
  heightPx = HEIGHT,
  selected = null,
  onCellClick,
  onItemPointerDown,
  npc,
  className = '',
}: GardenCanvasProps) {
  const w = widthPx;
  const h = heightPx;

  const cells = Array.from({ length: GARDEN_COLS * GARDEN_ROWS });

  const handleCell = (x: number, y: number) => {
    if (!onCellClick) return;
    onCellClick(x, y);
  };

  return (
    <div
      className={`relative overflow-hidden garden-shadow ${className}`}
      style={{ width: w, height: h }}
    >
      <img
        src={defaultGardenBg}
        alt="Zen garden map background"
        width={w}
        height={h}
        className="pixelated"
        style={{
          width: w,
          height: h,
          display: 'block',
        }}
      />

      {/* Grid overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 grid pointer-events-none"
          style={{
            gridTemplateColumns: `repeat(${GARDEN_COLS}, ${TILE_PX}px)`,
            gridTemplateRows: `repeat(${GARDEN_ROWS}, ${TILE_PX}px)`,
          }}
        >
          {cells.map((_, i) => {
            const x = i % GARDEN_COLS;
            const y = Math.floor(i / GARDEN_COLS);
            const locked = isTileLocked(x, y);
            const isSel = selected?.x === x && selected?.y === y;
            return (
              <div
                key={i}
                className="relative"
                style={{ width: TILE_PX, height: TILE_PX, outline: '1px dashed hsl(var(--border) / 0.15)' }}
              >
                {showLockedOverlay && locked && (
                  <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--destructive) / 0.15)' }} />
                )}
                {isSel && (
                  <div className="absolute inset-0 ring-2 ring-primary" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Click layer for placement */}
      {onCellClick && (
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${GARDEN_COLS}, ${TILE_PX}px)`,
            gridTemplateRows: `repeat(${GARDEN_ROWS}, ${TILE_PX}px)`,
          }}
        >
          {cells.map((_, i) => {
            const x = i % GARDEN_COLS;
            const y = Math.floor(i / GARDEN_COLS);
            const locked = isTileLocked(x, y);
            return (
              <button
                key={`btn-${i}`}
                type="button"
                onClick={() => handleCell(x, y)}
                disabled={locked}
                aria-label={`Cell ${x + 1}, ${y + 1}`}
                className={`relative outline-none ${!locked ? 'hover:bg-accent/10 focus-visible:ring-1 focus-visible:ring-accent/40 transition-colors' : ''}`}
                style={{ width: TILE_PX, height: TILE_PX, cursor: locked ? 'not-allowed' : 'pointer', background: 'transparent' }}
              />
            );
          })}
        </div>
      )}

      {/* Placed items */}
      {placed.map((it) => (
        <div
          key={it.id}
          id={`garden-item-${it.id}`}
          className="absolute"
          style={{
            left: it.x * TILE_PX,
            top: it.y * TILE_PX,
            width: (it.w || 1) * TILE_PX,
            height: (it.h || 1) * TILE_PX,
          }}
          onPointerDown={(e) => onItemPointerDown?.(e, it)}
        >
          <img
            src={it.img}
            alt={it.label || 'Garden item'}
            width={(it.w || 1) * TILE_PX}
            height={(it.h || 1) * TILE_PX}
            style={{
              width: (it.w || 1) * TILE_PX,
              height: (it.h || 1) * TILE_PX,
              objectFit: 'contain',
              imageRendering: 'pixelated' as any,
            }}
          />
        </div>
      ))}

      {/* NPC (Cat) */}
      {npc && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: npc.x * TILE_PX, top: npc.y * TILE_PX, width: TILE_PX, height: TILE_PX }}
        >
          <img
            src="/lovable-uploads/cbffb95e-4299-4f2f-8bb8-8738acdacad8.png"
            alt={npc.message || 'Garden cat'}
            width={TILE_PX}
            height={TILE_PX}
            className="pixelated"
            style={{ width: TILE_PX, height: TILE_PX, objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}

export default GardenCanvas;
