import { useEffect, useMemo, useRef, useState } from 'react';
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
  // Check bounds first
  if (tx < 0 || ty < 0 || tx >= GARDEN_COLS || ty >= GARDEN_ROWS) return false;
  
  // For obstacle-aware pathfinding, consider revealed areas as walkable
  // Unrevealed areas (fog) are treated as obstacles unless specifically allowed
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
  const [keyboardSelection, setKeyboardSelection] = useState<{ tx: number; ty: number }>(currentPosition);

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
    }
  }, [isOpen, currentPosition, availableSteps, camera.zoom, grid]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (selectedTile) {
          handleConfirm();
        } else if (highlightedTiles.some(t => t.tx === keyboardSelection.tx && t.ty === keyboardSelection.ty)) {
          setSelectedTile(keyboardSelection);
          setMovePath(computePath(currentPosition, keyboardSelection));
        }
        return;
      }

      // Arrow key navigation
      let newSelection = { ...keyboardSelection };
      switch (e.key) {
        case 'ArrowUp':
          newSelection.ty = Math.max(0, keyboardSelection.ty - 1);
          break;
        case 'ArrowDown':
          newSelection.ty = Math.min(GARDEN_ROWS - 1, keyboardSelection.ty + 1);
          break;
        case 'ArrowLeft':
          newSelection.tx = Math.max(0, keyboardSelection.tx - 1);
          break;
        case 'ArrowRight':
          newSelection.tx = Math.min(GARDEN_COLS - 1, keyboardSelection.tx + 1);
          break;
        default:
          return;
      }

      e.preventDefault();
      if (highlightedTiles.some(t => t.tx === newSelection.tx && t.ty === newSelection.ty)) {
        setKeyboardSelection(newSelection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, keyboardSelection, highlightedTiles, selectedTile, currentPosition]);

  // A* pathfinding algorithm for obstacle-aware movement
  const computePath = (
    start: { tx: number; ty: number },
    end: { tx: number; ty: number }
  ): Array<{ tx: number; ty: number }> => {
    if (start.tx === end.tx && start.ty === end.ty) return [start];
    
    const heuristic = (a: { tx: number; ty: number }, b: { tx: number; ty: number }) =>
      Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
    
    const openSet = [{ ...start, f: 0, g: 0, h: heuristic(start, end) }];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, { tx: number; ty: number }>();
    
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.tx},${current.ty}`;
      
      if (current.tx === end.tx && current.ty === end.ty) {
        // Reconstruct path
        const path = [];
        let node: { tx: number; ty: number } | undefined = current;
        while (node) {
          path.unshift(node);
          node = cameFrom.get(`${node.tx},${node.ty}`);
        }
        return path;
      }
      
      closedSet.add(currentKey);
      
      const neighbors = getAdjacentTiles(current.tx, current.ty, fog);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.tx},${neighbor.ty}`;
        
        if (closedSet.has(neighborKey)) continue;
        
        const tentativeG = current.g + 1;
        const existingInOpen = openSet.find(n => n.tx === neighbor.tx && n.ty === neighbor.ty);
        
        if (!existingInOpen) {
          const h = heuristic(neighbor, end);
          openSet.push({
            tx: neighbor.tx,
            ty: neighbor.ty,
            g: tentativeG,
            h,
            f: tentativeG + h
          });
          cameFrom.set(neighborKey, current);
        } else if (tentativeG < existingInOpen.g) {
          existingInOpen.g = tentativeG;
          existingInOpen.f = tentativeG + existingInOpen.h;
          cameFrom.set(neighborKey, current);
        }
      }
    }
    
    // No path found, return direct path for fallback
    return [start, end];
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
    ctx.fillStyle = 'rgba(0,0,0,0.95)';
    ctx.fillRect(0, 0, clientWidth, clientHeight);
    
    // Apply blur to the fog
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, clientWidth, clientHeight);
    ctx.filter = 'none';
    
    // Completely clear revealed areas (no darkening)
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

    // Draw highlighted tiles using design system colors
    highlightedTiles.forEach(tile => {
      const pos = tileToWorld(tile.tx, tile.ty, grid, camera);
      ctx.strokeStyle = 'hsl(142 76% 36%)'; // emerald-600 equivalent for accessibility
      ctx.fillStyle = 'hsla(142 76% 36% / 0.3)';
      ctx.lineWidth = 3;
      ctx.fillRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
      ctx.strokeRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
    });

    // Draw selected tile using accent colors
    if (selectedTile) {
      const pos = tileToWorld(selectedTile.tx, selectedTile.ty, grid, camera);
      ctx.strokeStyle = 'hsl(38 92% 50%)'; // amber-500 equivalent
      ctx.fillStyle = 'hsla(38 92% 50% / 0.5)';
      ctx.lineWidth = 4;
      ctx.fillRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
      ctx.strokeRect(pos.x, pos.y, TILE_PX * camera.zoom, TILE_PX * camera.zoom);
    }

    // Draw keyboard selection indicator
    if (keyboardSelection && highlightedTiles.some(t => t.tx === keyboardSelection.tx && t.ty === keyboardSelection.ty)) {
      const pos = tileToWorld(keyboardSelection.tx, keyboardSelection.ty, grid, camera);
      ctx.strokeStyle = 'hsl(0 0% 100%)'; // white border for keyboard focus
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(pos.x + 2, pos.y + 2, TILE_PX * camera.zoom - 4, TILE_PX * camera.zoom - 4);
      ctx.setLineDash([]);
    }

    // Draw movement path using primary color
    if (movePath.length > 1) {
      ctx.strokeStyle = 'hsl(217 91% 60%)'; // blue-500 equivalent for path visibility
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
  }, [camera, fog, grid, highlightedTiles, selectedTile, movePath, keyboardSelection]);

  const onClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = { x: (x - camera.x) / camera.zoom, y: (y - camera.y) / camera.zoom };
    const tilePos = { tx: Math.floor(worldPos.x / grid.tileW), ty: Math.floor(worldPos.y / grid.tileH) };
    
    const isHighlighted = highlightedTiles.some(t => t.tx === tilePos.tx && t.ty === tilePos.ty);
    if (isHighlighted) {
      setSelectedTile(tilePos);
      setMovePath(computePath(currentPosition, tilePos));
    }
  };

  const handleConfirm = () => {
    if (selectedTile) {
      onMoveToTile(selectedTile.tx, selectedTile.ty, movePath.length - 1);
      setSelectedTile(null);
      setMovePath([]);
    }
  };

    const monkPos = tileCenterToWorld(currentPosition.tx, currentPosition.ty, grid, camera);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Choose Your Path</h2>
            <p className="text-sm text-muted-foreground">
              You have {availableSteps} step{availableSteps !== 1 ? 's' : ''} available. Select where to move.
            </p>
          </div>
          
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden cursor-pointer"
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-label="Map navigation - Use arrow keys to select tile, Enter or Space to confirm"
          >
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