import { describe, expect, it } from 'vitest';
import { tileCenterToWorld, Grid, Camera } from './grid';

describe('tileCenterToWorld', () => {
  const grid: Grid = { tileW: 64, tileH: 64, cols: 12, rows: 8 };
  const camera: Camera = { x: 0, y: 0, zoom: 1 };

  it('returns center of tile in world coordinates', () => {
    expect(tileCenterToWorld(0, 0, grid, camera)).toEqual({ x: 32, y: 32 });
    expect(tileCenterToWorld(1, 1, grid, camera)).toEqual({ x: 96, y: 96 });
  });
});
