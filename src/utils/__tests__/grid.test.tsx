import { describe, it, expect } from 'vitest';
import { 
  worldToTile, 
  tileToWorld, 
  tileCenterToWorld, 
  getVisibleTileRect,
  type Grid,
  type Camera 
} from '../grid';

describe('Grid utility functions', () => {
  const grid: Grid = { tileW: 64, tileH: 64, cols: 32, rows: 32 };
  const camera: Camera = { x: 0, y: 0, zoom: 1 };

  describe('worldToTile', () => {
    it('converts world coordinates to tile coordinates', () => {
      const result = worldToTile(128, 192, grid, camera);
      expect(result).toEqual({ tx: 2, ty: 3 });
    });

    it('handles camera offset', () => {
      const offsetCamera: Camera = { x: -64, y: -64, zoom: 1 };
      const result = worldToTile(128, 192, grid, offsetCamera);
      expect(result).toEqual({ tx: 3, ty: 4 });
    });

    it('handles zoom', () => {
      const zoomedCamera: Camera = { x: 0, y: 0, zoom: 2 };
      const result = worldToTile(256, 384, grid, zoomedCamera);
      expect(result).toEqual({ tx: 2, ty: 3 });
    });
  });

  describe('tileToWorld', () => {
    it('converts tile coordinates to world coordinates', () => {
      const result = tileToWorld(2, 3, grid, camera);
      expect(result).toEqual({ x: 128, y: 192 });
    });

    it('handles camera offset', () => {
      const offsetCamera: Camera = { x: 100, y: 50, zoom: 1 };
      const result = tileToWorld(2, 3, grid, offsetCamera);
      expect(result).toEqual({ x: 228, y: 242 });
    });

    it('handles zoom', () => {
      const zoomedCamera: Camera = { x: 0, y: 0, zoom: 2 };
      const result = tileToWorld(2, 3, grid, zoomedCamera);
      expect(result).toEqual({ x: 256, y: 384 });
    });
  });

  describe('tileCenterToWorld', () => {
    it('converts tile coordinates to world center coordinates', () => {
      const result = tileCenterToWorld(2, 3, grid, camera);
      expect(result).toEqual({ x: 160, y: 224 });
    });

    it('accounts for tile size in calculations', () => {
      const result = tileCenterToWorld(0, 0, grid, camera);
      expect(result).toEqual({ x: 32, y: 32 }); // Half of 64x64 tile
    });
  });

  describe('getVisibleTileRect', () => {
    it('calculates visible tiles for viewport', () => {
      const result = getVisibleTileRect(800, 600, grid, camera);
      expect(result.x0).toBe(0);
      expect(result.y0).toBe(0);
      expect(result.x1).toBeLessThanOrEqual(grid.cols - 1);
      expect(result.y1).toBeLessThanOrEqual(grid.rows - 1);
    });

    it('handles camera offset correctly', () => {
      const offsetCamera: Camera = { x: -200, y: -150, zoom: 1 };
      const result = getVisibleTileRect(800, 600, grid, offsetCamera);
      expect(result.x0).toBeGreaterThan(0);
      expect(result.y0).toBeGreaterThan(0);
    });

    it('respects grid boundaries', () => {
      const result = getVisibleTileRect(5000, 5000, grid, camera);
      expect(result.x0).toBeGreaterThanOrEqual(0);
      expect(result.y0).toBeGreaterThanOrEqual(0);
      expect(result.x1).toBeLessThanOrEqual(grid.cols - 1);
      expect(result.y1).toBeLessThanOrEqual(grid.rows - 1);
    });

    it('handles zoom levels', () => {
      const zoomedCamera: Camera = { x: 0, y: 0, zoom: 0.5 };
      const result = getVisibleTileRect(800, 600, grid, zoomedCamera);
      // At 0.5 zoom, more tiles should be visible
      expect(result.x1 - result.x0).toBeGreaterThan(10);
      expect(result.y1 - result.y0).toBeGreaterThan(8);
    });
  });

  describe('Camera bounds enforcement', () => {
    it('should prevent camera from going outside map bounds', () => {
      const mapWidth = grid.cols * grid.tileW;
      const mapHeight = grid.rows * grid.tileH;
      const viewportWidth = 800;
      const viewportHeight = 600;
      
      // Test camera at extreme positions
      const extremeCamera: Camera = { x: 1000, y: 1000, zoom: 1 };
      const result = getVisibleTileRect(viewportWidth, viewportHeight, grid, extremeCamera);
      
      // Should still return valid tile coordinates within bounds
      expect(result.x0).toBeGreaterThanOrEqual(0);
      expect(result.y0).toBeGreaterThanOrEqual(0);
      expect(result.x1).toBeLessThanOrEqual(grid.cols - 1);
      expect(result.y1).toBeLessThanOrEqual(grid.rows - 1);
    });
  });
});