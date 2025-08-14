import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StepPanel from '../StepPanel';
import * as storageClient from '../../../utils/storageClient';
import * as useMonkStepOnSession from '../../../hooks/useMonkStepOnSession';
import * as useMonkMovement from '../../../hooks/useMonkMovement';

// Mock dependencies
vi.mock('../../../utils/storageClient');
vi.mock('../../../hooks/useMonkStepOnSession');
vi.mock('../../../hooks/useMonkMovement');

const mockLoadProgress = vi.mocked(storageClient.loadProgress);
const mockSaveProgress = vi.mocked(storageClient.saveProgress);
const mockUseMonkStepOnSession = vi.mocked(useMonkStepOnSession.useMonkStepOnSession);
const mockUseMonkMovement = vi.mocked(useMonkMovement.useMonkMovement);

describe('StepPanel', () => {
  const mockOnOpenMovementModal = vi.fn();
  const mockStepMonk = vi.fn();
  const mockMoveMonk = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMonkStepOnSession.mockReturnValue(mockStepMonk);
    mockUseMonkMovement.mockReturnValue(mockMoveMonk);
    mockLoadProgress.mockReturnValue({
      stepsToday: 3,
      sparks: 2,
      pendingSteps: 1,
      adStepUsed: false,
      sessionHistory: [],
      journey: { tx: 5, ty: 5, pathId: 'default', step: 0 }
    });
  });

  it('renders step statistics correctly', () => {
    render(<StepPanel onOpenMovementModal={mockOnOpenMovementModal} />);
    
    expect(screen.getByText('Steps today: 3/9')).toBeInTheDocument();
    expect(screen.getByText('Sparks: 2/3')).toBeInTheDocument();
    expect(screen.getByText('Monk position: (5, 5)')).toBeInTheDocument();
  });

  it('execute step button works as dev tool (always enabled)', () => {
    // Test with no pending steps
    mockLoadProgress.mockReturnValue({
      stepsToday: 3,
      sparks: 2,
      pendingSteps: 0,
      adStepUsed: false,
      sessionHistory: [],
      journey: { tx: 5, ty: 5, pathId: 'default', step: 0 }
    });

    render(<StepPanel onOpenMovementModal={mockOnOpenMovementModal} />);
    
    const executeButton = screen.getByRole('button', { name: /execute step/i });
    expect(executeButton).not.toBeDisabled();
    
    fireEvent.click(executeButton);
    expect(mockOnOpenMovementModal).toHaveBeenCalled();
  });

  it('adds step when none available for dev mode', () => {
    mockLoadProgress.mockReturnValue({
      stepsToday: 3,
      sparks: 2,
      pendingSteps: 0,
      adStepUsed: false,
      sessionHistory: [],
      journey: { tx: 5, ty: 5, pathId: 'default', step: 0 }
    });

    render(<StepPanel onOpenMovementModal={mockOnOpenMovementModal} />);
    
    const executeButton = screen.getByRole('button', { name: /execute step/i });
    fireEvent.click(executeButton);
    
    expect(mockSaveProgress).toHaveBeenCalledWith(
      expect.objectContaining({ pendingSteps: 1 })
    );
  });

  it('calculates average session time correctly', () => {
    const today = new Date().toDateString();
    mockLoadProgress.mockReturnValue({
      stepsToday: 3,
      sparks: 2,
      pendingSteps: 1,
      adStepUsed: false,
      sessionHistory: [
        { date: today, seconds: 1200 }, // 20 minutes
        { date: today, seconds: 600 },  // 10 minutes
        { date: '2023-01-01', seconds: 3000 } // Different day, should be ignored
      ],
      journey: { tx: 5, ty: 5, pathId: 'default', step: 0 }
    });

    render(<StepPanel onOpenMovementModal={mockOnOpenMovementModal} />);
    
    // Average should be (20 + 10) / 2 = 15 minutes
    expect(screen.getByText('Avg mins today: 15')).toBeInTheDocument();
  });

  it('updates with reduced polling frequency', async () => {
    vi.useFakeTimers();
    render(<StepPanel onOpenMovementModal={mockOnOpenMovementModal} />);
    
    // Initial load
    expect(mockLoadProgress).toHaveBeenCalledTimes(1);
    
    // Fast forward 4 seconds (should not trigger update)
    vi.advanceTimersByTime(4000);
    expect(mockLoadProgress).toHaveBeenCalledTimes(1);
    
    // Fast forward to 5 seconds (should trigger update)
    vi.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(mockLoadProgress).toHaveBeenCalledTimes(2);
    });
    
    vi.useRealTimers();
  });
});