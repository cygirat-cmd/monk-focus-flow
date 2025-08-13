export type Grid = { tileW: number; tileH: number; cols: number; rows: number };
export type Camera = { x: number; y: number; zoom: number };

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

export function getVisibleTileRect(viewportW: number, viewportH: number, grid: Grid, camera: Camera) {
  const left = Math.floor(-camera.x / (grid.tileW * camera.zoom));
  const top = Math.floor(-camera.y / (grid.tileH * camera.zoom));
  const right = Math.ceil((viewportW - camera.x) / (grid.tileW * camera.zoom));
  const bottom = Math.ceil((viewportH - camera.y) / (grid.tileH * camera.zoom));
  return {
    x0: Math.max(0, left),
    y0: Math.max(0, top),
    x1: Math.min(grid.cols - 1, right),
    y1: Math.min(grid.rows - 1, bottom),
  };
}
