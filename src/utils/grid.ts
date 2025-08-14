export type Grid = { tileW: number; tileH: number; cols: number; rows: number };
export type Camera = { x: number; y: number; zoom: number };

// Constants for visibility and performance optimization
const BUFFER_SIZE_DIVISOR = 64;
const MIN_BUFFER_SIZE = 1;
const VERY_LOW_ZOOM_THRESHOLD = 4;
const LOW_ZOOM_THRESHOLD = 16;
const LOD_STEP_DIVISOR = 8;

export function worldToTile(px: number, py: number, grid: Grid, camera: Camera) {
  const x = (px - camera.x) / camera.zoom;
  const y = (py - camera.y) / camera.zoom;
  return { tx: Math.floor(x / grid.tileW), ty: Math.floor(y / grid.tileH) };
}

export function tileToWorld(tx: number, ty: number, grid: Grid, camera: Camera) {
  return {
    x: tx * grid.tileW * camera.zoom + camera.x,
    y: ty * grid.tileH * camera.zoom + camera.y,
  };
}

export function tileCenterToWorld(tx: number, ty: number, grid: Grid, camera: Camera) {
  const tileWidth = grid.tileW * camera.zoom;
  const tileHeight = grid.tileH * camera.zoom;
  return {
    x: tx * tileWidth + tileWidth / 2 + camera.x,
    y: ty * tileHeight + tileHeight / 2 + camera.y,
  };
}

export function getVisibleTileRect(viewportW: number, viewportH: number, grid: Grid, camera: Camera) {
  const tileSize = grid.tileW * camera.zoom;
  
  // Add buffer to prevent pop-in at edges
  const buffer = Math.max(MIN_BUFFER_SIZE, Math.ceil(BUFFER_SIZE_DIVISOR / tileSize));
  
  const left = Math.floor(-camera.x / tileSize) - buffer;
  const top = Math.floor(-camera.y / tileSize) - buffer;
  const right = Math.ceil((viewportW - camera.x) / tileSize) + buffer;
  const bottom = Math.ceil((viewportH - camera.y) / tileSize) + buffer;
  
  return {
    x0: Math.max(0, left),
    y0: Math.max(0, top),
    x1: Math.min(grid.cols - 1, right),
    y1: Math.min(grid.rows - 1, bottom),
  };
}

// Enhanced culling function with distance-based LOD
export function getVisibleTileRectWithLOD(viewportW: number, viewportH: number, grid: Grid, camera: Camera) {
  const baseRect = getVisibleTileRect(viewportW, viewportH, grid, camera);
  const tileSize = grid.tileW * camera.zoom;
  
  // Different detail levels based on zoom
  if (tileSize < VERY_LOW_ZOOM_THRESHOLD) {
    // Very far zoom - aggressive culling, larger tile groups
    const step = Math.max(2, Math.floor(LOD_STEP_DIVISOR / tileSize));
    return {
      ...baseRect,
      step, // Process every 'step' tiles for performance
      lod: 'low'
    };
  } else if (tileSize < LOW_ZOOM_THRESHOLD) {
    // Medium zoom - moderate culling
    return {
      ...baseRect,
      step: 1,
      lod: 'medium'
    };
  } else {
    // Close zoom - full detail
    return {
      ...baseRect,
      step: 1,
      lod: 'high'
    };
  }
}
