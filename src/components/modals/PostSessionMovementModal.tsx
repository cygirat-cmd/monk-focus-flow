import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Grid, tileToWorld, getVisibleTileRect, tileCenterToWorld } from '@/utils/grid';
import { GARDEN_COLS, GARDEN_ROWS, TILE_PX } from '@/utils/gardenMap';
import { Fog, isRevealed } from '@/features/fog/useFog';
import { monkGif } from '@/assets/monk';

interface PostSessionMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveToTile: (tx: number, ty: number, steps: number) => void;
  currentPosition: { tx: number; ty: number };
  availableSteps: number;
  fog: Fog;
  camera: Camera;
}

const isWalkable = (tx: number, ty: number, fog?: Fog): boolean => {
  // Check if tile is within bounds
  if (tx < 0 || ty < 0 || tx >= GARDEN_COLS || ty >= GARDEN_ROWS) {
    return false;
  }
  
  // All revealed tiles are walkable (no temple collisions as requested)
  // Only check if tile is revealed if fog is provided
  if (fog && !isRevealed(tx, ty, fog)) {
    return false;
  }
  
  return true;
};

const getAdjacentTiles = (tx: number, ty: number, fog?: Fog): Array<{ tx: number; ty: number }> => {
  return [
    { tx: tx + 1, ty }, // right
    { tx: tx - 1, ty }, // left
    { tx, ty: ty + 1 }, // down
    { tx, ty: ty - 1 }, // up
  ].filter(pos => isWalkable(pos.tx, pos.ty, fog));
};

export default function PostSessionMovementModal({
  isOpen,
  onClose,
  onMoveToTile,
  currentPosition,
  availableSteps,
  fog,
  camera: initialCamera
}: PostSessionMovementModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [highlightedTiles, setHighlightedTiles] = useState<Array<{ tx: number; ty: number }>>([]);
  const [selectedTile, setSelectedTile] = useState<{ tx: number; ty: number } | null>(null);
  const [movePath, setMovePath] = useState<Array<{ tx: number; ty: number }>>([]);
  const [focusedTileIndex, setFocusedTileIndex] = useState<number>(0);

  const grid = useMemo<Grid>(() => ({ tileW: TILE_PX, tileH: TILE_PX, cols: GARDEN_COLS, rows: GARDEN_ROWS }), []);

  useEffect(() => {
    if (isOpen && availableSteps > 0) {
      // Center camera on monk
        const monkWorldPos = tileCenterToWorld(currentPosition.tx, currentPosition.ty, grid, { x: 0, y: 0, zoom: camera.zoom });
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 600;
      
      setCamera({
          x: containerWidth / 2 - monkWorldPos.x,
          y: containerHeight / 2 - monkWorldPos.y,
          zoom: camera.zoom
        });

      // Calculate highlighted tiles based on available steps
      let reachableTiles: Array<{ tx: number; ty: number }> = [];
      let currentTiles = [currentPosition];

      for (let step = 0; step < availableSteps; step++) {
        const nextTiles: Array<{ tx: number; ty: number }> = [];
        currentTiles.forEach(tile => {
          const adjacent = getAdjacentTiles(tile.tx, tile.ty, fog);
          adjacent.forEach(adjTile => {
            if (!reachableTiles.some(t => t.tx === adjTile.tx && t.ty === adjTile.ty) &&
                !nextTiles.some(t => t.tx === adjTile.tx && t.ty === adjTile.ty) &&
                !(adjTile.tx === currentPosition.tx && adjTile.ty === currentPosition.ty)) {
              nextTiles.push(adjTile);
            }
          });
        });
        reachableTiles = [...reachableTiles, ...nextTiles];
        currentTiles = nextTiles;
      }

      setHighlightedTiles(reachableTiles);
      setFocusedTileIndex(0);
      setSelectedTile(null);
      setMovePath([]);
    }
  }, [isOpen, currentPosition, availableSteps, camera.zoom, grid]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          setFocusedTileIndex(prev => {
            const newIndex = e.key === 'ArrowUp' ? Math.max(0, prev - 1)
              : e.key === 'ArrowDown' ? Math.min(highlightedTiles.length - 1, prev + 1)
              : e.key === 'ArrowLeft' ? Math.max(0, prev - 1)
              : Math.min(highlightedTiles.length - 1, prev + 1);
            
            if (highlightedTiles[newIndex]) {
              setSelectedTile(highlightedTiles[newIndex]);
              setMovePath(computePath(currentPosition, highlightedTiles[newIndex]));
            }
            return newIndex;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedTile) {
            handleConfirm();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedTiles, currentPosition, selectedTile, onClose]);

  // A* pathfinding algorithm for obstacle-aware movement
  const computePath = (
    start: { tx: number; ty: number },
    end: { tx: number; ty: number }
  ): Array<{ tx: number; ty: number }> => {
    const openSet = [start];
    const cameFrom = new Map<string, { tx: number; ty: number }>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    const getKey = (pos: { tx: number; ty: number }) => `${pos.tx},${pos.ty}`;
    const heuristic = (a: { tx: number; ty: number }, b: { tx: number; ty: number }) => 
      Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
    
    gScore.set(getKey(start), 0);
    fScore.set(getKey(start), heuristic(start, end));
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        const currentKey = getKey(openSet[i]);
        const bestKey = getKey(current);
        if ((fScore.get(currentKey) || Infinity) < (fScore.get(bestKey) || Infinity)) {
          current = openSet[i];
          currentIndex = i;
        }
      }
      
      if (current.tx === end.tx && current.ty === end.ty) {
        // Reconstruct path
        const path = [current];
        let curr = current;
        while (cameFrom.has(getKey(curr))) {
          curr = cameFrom.get(getKey(curr))!;
          path.unshift(curr);
        }
        return path;
      }
      
      openSet.splice(currentIndex, 1);
      
      const neighbors = getAdjacentTiles(current.tx, current.ty, fog);
      for (const neighbor of neighbors) {
        const tentativeGScore = (gScore.get(getKey(current)) || 0) + 1;
        const neighborKey = getKey(neighbor);
        
        if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
          
          if (!openSet.some(pos => pos.tx === neighbor.tx && pos.ty === neighbor.ty)) {
            openSet.push(neighbor);
          }
        }
      }
    }
    
    // Fallback to direct path if no path found
    const path = [{ ...start }];
    let tx = start.tx;
    let ty = start.ty;
    while (tx !== end.tx) {
      tx += Math.sign(end.tx - tx);
      path.push({ tx, ty });
    }
    while (ty !== end.ty) {
      ty += Math.sign(end.ty - ty);
      path.push({ tx, ty });
    }
    return path;
  };

  // Draw fog and highlights
  useEffect(() => {
    const canvas = fogRef.current;
    const ctx = canvas?.getContext('2d');
    const el = containerRef.current;
    if (!canvas || !ctx || !el) return;

    const { clientWidth, clientHeight } = el;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    ctx.clearRect(0, 0, clientWidth, clientHeight);

    // Draw fog with blur
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, clientWidth, clientHeight);
    
    // Apply blur to the fog
    ctx.filter = 'blur(2px)';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, clientWidth, clientHeight);
    ctx.filter = 'none';
    
    ctx.globalCompositeOperation = 'destination-out';

    const rect = getVisibleTileRect(clientWidth, clientHeight, grid, camera);
    const tileSize = TILE_PX * camera.zoom;
    
    for (let ty = rect.y0; ty <= rect.y1; ty++) {
      for (let tx = rect.x0; tx <= rect.x1; tx++) {
        if (!isRevealed(tx, ty, fog)) continue;
        const pos = tileToWorld(tx, ty, grid, camera);
        
        // Use lower resolution for very small tiles to improve performance
        if (tileSize < 8) {
          ctx.fillRect(
            Math.floor(pos.x), 
            Math.floor(pos.y), 
            Math.ceil(tileSize), 
            Math.ceil(tileSize)
          );
        } else {
          ctx.fillRect(
            pos.x, 
            pos.y, 
            tileSize, 
            tileSize
          );
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';

    // Draw highlighted tiles using theme colors
    highlightedTiles.forEach(tile => {
      const pos = tileToWorld(tile.tx, tile.ty, grid, camera);
      ctx.strokeStyle = 'hsl(142, 71%, 45%)';
      ctx.fillStyle = 'hsla(142, 71%, 45%, 0.3)';
      ctx.lineWidth = 3;
      ctx.fillRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
      ctx.strokeRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
    });

    // Draw selected tile using theme colors
    if (selectedTile) {
      const pos = tileToWorld(selectedTile.tx, selectedTile.ty, grid, camera);
      ctx.strokeStyle = 'hsl(38, 92%, 50%)';
      ctx.fillStyle = 'hsla(38, 92%, 50%, 0.5)';
      ctx.lineWidth = 4;
      ctx.fillRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
      ctx.strokeRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
    }

    // Draw movement path using theme colors
    if (movePath.length > 1) {
      ctx.strokeStyle = 'hsl(217, 91%, 60%)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      const startPos = tileToWorld(movePath[0].tx, movePath[0].ty, grid, camera);
      ctx.moveTo(startPos.x + TILE_PX * camera.zoom / 2, startPos.y + TILE_PX * camera.zoom / 2);
      
      for (let i = 1; i < movePath.length; i++) {
        const pos = tileToWorld(movePath[i].tx, movePath[i].ty, grid, camera);
        ctx.lineTo(pos.x + TILE_PX * camera.zoom / 2, pos.y + TILE_PX * camera.zoom / 2);
      }
      ctx.stroke();
    }
  }, [camera, fog, grid, highlightedTiles, selectedTile, movePath]);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = { x: (x - camera.x) / camera.zoom, y: (y - camera.y) / camera.zoom };
    const tilePos = { tx: Math.floor(worldPos.x / grid.tileW), ty: Math.floor(worldPos.y / grid.tileH) };
    
    const tileIndex = highlightedTiles.findIndex(t => t.tx === tilePos.tx && t.ty === tilePos.ty);
    if (tileIndex >= 0) {
      setFocusedTileIndex(tileIndex);
      setSelectedTile(tilePos);
      setMovePath(computePath(currentPosition, tilePos));
    }
  }, [containerRef, camera, grid, highlightedTiles, currentPosition]);

  const handleConfirm = useCallback(() => {
    if (selectedTile) {
      onMoveToTile(selectedTile.tx, selectedTile.ty, movePath.length - 1);
      setSelectedTile(null);
      setMovePath([]);
      setFocusedTileIndex(0);
    }
  }, [selectedTile, movePath, onMoveToTile]);

    const monkPos = tileCenterToWorld(currentPosition.tx, currentPosition.ty, grid, camera);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Choose Your Path</h2>
            <p className="text-sm text-muted-foreground">
              You earned {availableSteps} step{availableSteps !== 1 ? 's' : ''}! Select where to move.
              <br />
              <span className="text-xs">Use arrow keys to navigate, Enter to confirm, Escape to cancel</span>
            </p>
          </div>
          
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onClick}
            tabIndex={0}
            role="grid"
            aria-label="Movement grid - use arrow keys to navigate, Enter to select, Escape to close"
          >
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
            
            <img 
              src={monkGif} 
              alt="Monk" 
              className="absolute pointer-events-none"
              style={{
                width: TILE_PX * camera.zoom,
                height: TILE_PX * camera.zoom,
                left: monkPos.x,
                top: monkPos.y,
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            <canvas ref={fogRef} className="absolute inset-0 pointer-events-none" />
          </div>
          
          <div className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedTile}
              className="px-6"
            >
              Move Here
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}