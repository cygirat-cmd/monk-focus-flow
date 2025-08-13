import { describe, expect, it } from 'vitest';
import { fromSavedFog, makeFog, revealRadius, isRevealed } from './useFog';


describe('useFog', () => {
  it('restores fog from saved data', () => {
    const saved = { cols: 2, rows: 2, revealed: [1, 0, 1, 0] };
    const fog = fromSavedFog(saved);
    expect(fog.cols).toBe(2);
    expect(fog.rows).toBe(2);
    expect(Array.from(fog.revealed)).toEqual([1, 0, 1, 0]);
  });

  it('truncates extra revealed values', () => {
    const saved = { cols: 2, rows: 2, revealed: [1, 0, 1, 0, 1, 1] };
    const fog = fromSavedFog(saved);
    expect(Array.from(fog.revealed)).toEqual([1, 0, 1, 0]);
  });

  it('reveals cells within radius', () => {
    const fog = makeFog(5, 5);
    revealRadius(2, 2, 1, fog);
    expect(isRevealed(2, 2, fog)).toBe(true);
    expect(isRevealed(3, 2, fog)).toBe(true);
    expect(isRevealed(0, 0, fog)).toBe(false);
  });
});
