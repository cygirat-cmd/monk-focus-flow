import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/layout/BottomNav', () => ({ default: () => null }));
vi.mock('@/components/world/StepPanel', () => ({ default: () => null }));
vi.mock('@/assets/monk', () => ({ monkGif: '' }));

vi.mock('@/utils/storageClient', () => ({
  loadProgress: () => ({
    journey: { tx: 0, ty: 0, pathId: 'default', step: 0 },
    fog: { cols: 4, rows: 4, revealed: Array(16).fill(0) },
    pendingSteps: 1,
    camera: { x: 0, y: 0, zoom: 1 }
  }),
  saveProgress: vi.fn()
}));

vi.mock('@/components/modals/PostSessionMovementModal', () => ({
  default: ({ isOpen, onMoveToTile }: { isOpen: boolean; onMoveToTile: (tx: number, ty: number) => void }) => {
    if (isOpen) {
      onMoveToTile(1, 1);
    }
    return null;
  }
}));

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  globalCompositeOperation: '',
  fillRect: vi.fn(),
}));

import WorldMap from './WorldMap';
import { saveProgress } from '@/utils/storageClient';

describe('WorldMap integration', () => {
  it('moves monk and updates progress', () => {
    render(<WorldMap />);
    expect(saveProgress).toHaveBeenCalled();
    const updated = (saveProgress as any).mock.calls.at(-1)[0];
    expect(updated.journey.tx).toBe(1);
    expect(updated.journey.ty).toBe(1);
    expect(updated.pendingSteps).toBe(0);
    expect(updated.fog.revealed[1 + 1 * updated.fog.cols]).toBe(1);
  });
});
