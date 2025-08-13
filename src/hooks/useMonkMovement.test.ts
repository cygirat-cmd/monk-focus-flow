import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMonkMovement } from './useMonkMovement';
import { isRevealed, Fog } from '@/features/fog/useFog';
import { GARDEN_COLS, GARDEN_ROWS } from '@/utils/gardenMap';

describe('useMonkMovement', () => {
  it('updates progress and reveals fog', () => {
    const progress = {
      journey: { tx: 0, ty: 0, pathId: 'default', step: 0 },
      fog: { cols: GARDEN_COLS, rows: GARDEN_ROWS, revealed: Array(GARDEN_COLS * GARDEN_ROWS).fill(0) },
      pendingSteps: 1,
    };
    const { result } = renderHook(() => useMonkMovement());
    result.current(progress as any, 1, 0);
    expect(progress.journey.tx).toBe(1);
    expect(progress.journey.facing).toBe('right');
    const fog: Fog = { cols: progress.fog.cols, rows: progress.fog.rows, revealed: Uint8Array.from(progress.fog.revealed) };
    expect(isRevealed(1, 0, fog)).toBe(true);
    expect(progress.pendingSteps).toBe(0);
  });
});
