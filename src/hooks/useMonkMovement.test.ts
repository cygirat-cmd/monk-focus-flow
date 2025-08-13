import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMonkMovement } from './useMonkMovement';
import { makeFog, isRevealed } from '@/features/fog/useFog';
import { ProgressData } from '@/utils/storageClient';

describe('useMonkMovement', () => {
  it('updates position, fog, and steps', () => {
    const fog = makeFog(4, 4);
    const progress: ProgressData = {
      journey: { tx: 0, ty: 0, pathId: 'default', step: 0 },
      pendingSteps: 3,
      fog: { cols: 4, rows: 4, revealed: Array(16).fill(0) }
    };
    const { result } = renderHook(() => useMonkMovement());
    result.current(progress, fog, 2, 0, 2);
    expect(progress.journey.tx).toBe(2);
    expect(progress.journey.step).toBe(2);
    expect(progress.pendingSteps).toBe(1);
    expect(isRevealed(2, 0, fog)).toBe(true);
  });
});
