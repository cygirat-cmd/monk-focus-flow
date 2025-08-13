import { render, waitFor } from '@testing-library/react';
import WorldMap from './WorldMap';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/layout/BottomNav', () => ({ default: () => <div data-testid="bottom-nav" /> }));
vi.mock('@/components/world/StepPanel', () => ({ default: () => <div data-testid="step-panel" /> }));
vi.mock('@/components/modals/PostSessionMovementModal', () => ({ default: () => <div data-testid="movement-modal" /> }));
vi.mock('@/assets/monk', () => ({ monkGif: 'monk.gif' }));
vi.mock('@/utils/storageClient', () => ({
  loadProgress: () => ({ journey: { tx: 0, ty: 0, pathId: 'default', step: 0 }, pendingSteps: 0 }),
  saveProgress: vi.fn(),
}));
import { saveProgress } from '@/utils/storageClient';

// stub getContext to avoid warnings
HTMLCanvasElement.prototype.getContext = vi.fn();

describe('WorldMap', () => {
  it('renders and saves progress', async () => {
    render(<WorldMap />);
    await waitFor(() => expect(saveProgress).toHaveBeenCalled());
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
