import { describe, it, expect } from 'vitest';
import { makeFog, isRevealed, revealRadius, initializeFogAroundMonk, fromSavedFog, SavedFog } from './useFog';

describe('useFog utilities', () => {
  it('fromSavedFog restores Uint8Array', () => {
    const saved: SavedFog = { cols: 2, rows: 2, revealed: [1, 0, 0, 1] };
    const fog = fromSavedFog(saved);
    expect(fog.cols).toBe(2);
    expect(fog.rows).toBe(2);
    expect(fog.revealed).toBeInstanceOf(Uint8Array);
    expect(Array.from(fog.revealed)).toEqual(saved.revealed);
  });

  it('revealRadius marks tiles within radius', () => {
    const fog = makeFog(5, 5);
    revealRadius(2, 2, 1, fog);
    expect(isRevealed(2, 2, fog)).toBe(true);
    expect(isRevealed(1, 2, fog)).toBe(true);
    expect(isRevealed(0, 0, fog)).toBe(false);
  });

  it('initializeFogAroundMonk reveals around initial position', () => {
    const fog = makeFog(10, 10);
    initializeFogAroundMonk(5, 5, fog);
    expect(isRevealed(5, 5, fog)).toBe(true);
    expect(isRevealed(5, 9, fog)).toBe(false);
  });
});
