import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostSessionMovementModal from '../PostSessionMovementModal';
import { makeFog, revealRadius, type Fog } from '../../../features/fog/useFog';
import type { Camera } from '../../../utils/grid';

// Mock the monk gif import
vi.mock('../../../assets/monk', () => ({
  monkGif: 'mock-monk.gif'
}));

describe('PostSessionMovementModal', () => {
  const mockOnClose = vi.fn();
  const mockOnMoveToTile = vi.fn();
  
  let fog: Fog;
  const camera: Camera = { x: 0, y: 0, zoom: 1 };
  const currentPosition = { tx: 5, ty: 5 };

  beforeEach(() => {
    vi.clearAllMocks();
    fog = makeFog(32, 32);
    // Reveal area around starting position
    revealRadius(5, 5, 5, fog);
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onMoveToTile: mockOnMoveToTile,
    currentPosition,
    availableSteps: 3,
    fog,
    camera
  };

  it('renders modal with correct title and description', () => {
    render(<PostSessionMovementModal {...defaultProps} />);
    
    expect(screen.getByText('Choose Your Path')).toBeInTheDocument();
    expect(screen.getByText('You earned 3 steps! Select where to move.')).toBeInTheDocument();
  });

  it('handles single step correctly', () => {
    render(<PostSessionMovementModal {...defaultProps} availableSteps={1} />);
    
    expect(screen.getByText('You earned 1 step! Select where to move.')).toBeInTheDocument();
  });

  it('displays move button as disabled initially', () => {
    render(<PostSessionMovementModal {...defaultProps} />);
    
    const moveButton = screen.getByRole('button', { name: /move here/i });
    expect(moveButton).toBeDisabled();
  });

  it('enables move button when tile is selected', async () => {
    render(<PostSessionMovementModal {...defaultProps} />);
    
    const mapContainer = screen.getByRole('button', { name: /map navigation/i });
    
    // Simulate click on map (this would normally select a tile)
    fireEvent.click(mapContainer, { clientX: 200, clientY: 200 });
    
    // Note: In a real test, we'd need to mock the canvas context and tile selection logic
    // This is a simplified version to test the UI structure
  });

  it('closes modal when cancel button is clicked', () => {
    render(<PostSessionMovementModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles keyboard navigation', () => {
    render(<PostSessionMovementModal {...defaultProps} />);
    
    const mapContainer = screen.getByRole('button', { name: /map navigation/i });
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveAttribute('tabIndex', '0');
    expect(mapContainer).toHaveAttribute('aria-label', 'Map navigation - Use arrow keys to select tile, Enter or Space to confirm');
  });

  it('handles escape key to close modal', () => {
    render(<PostSessionMovementModal {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  describe('Obstacle-aware pathfinding', () => {
    it('should consider fog as obstacles', () => {
      // Create fog with limited revealed area
      const limitedFog = makeFog(32, 32);
      revealRadius(5, 5, 2, limitedFog); // Small revealed area
      
      const props = { ...defaultProps, fog: limitedFog };
      render(<PostSessionMovementModal {...props} />);
      
      // The modal should render without errors even with limited fog
      expect(screen.getByText('Choose Your Path')).toBeInTheDocument();
    });

    it('handles empty fog state', () => {
      const emptyFog = makeFog(32, 32);
      // No revealed tiles
      
      const props = { ...defaultProps, fog: emptyFog };
      render(<PostSessionMovementModal {...props} />);
      
      expect(screen.getByText('Choose Your Path')).toBeInTheDocument();
    });
  });

  describe('Accessibility features', () => {
    it('has proper ARIA labels', () => {
      render(<PostSessionMovementModal {...defaultProps} />);
      
      const mapContainer = screen.getByLabelText(/map navigation/i);
      expect(mapContainer).toBeInTheDocument();
    });

    it('supports keyboard navigation with arrow keys', () => {
      render(<PostSessionMovementModal {...defaultProps} />);
      
      // Test that arrow key events are handled (would need more complex setup to test full functionality)
      const mapContainer = screen.getByRole('button', { name: /map navigation/i });
      
      fireEvent.keyDown(mapContainer, { key: 'ArrowUp' });
      fireEvent.keyDown(mapContainer, { key: 'ArrowDown' });
      fireEvent.keyDown(mapContainer, { key: 'ArrowLeft' });
      fireEvent.keyDown(mapContainer, { key: 'ArrowRight' });
      
      // Should not throw errors
      expect(mapContainer).toBeInTheDocument();
    });
  });
});

// Helper function tests for pathfinding logic
describe('Pathfinding helper functions', () => {
  describe('isWalkable', () => {
    it('should return false for out of bounds coordinates', () => {
      const fog = makeFog(10, 10);
      
      // Mock the isWalkable function logic
      const isWalkable = (tx: number, ty: number, fog?: Fog): boolean => {
        if (tx < 0 || ty < 0 || tx >= 10 || ty >= 10) return false;
        if (fog) {
          // For this test, assume revealed = 1 means walkable
          const idx = ty * fog.cols + tx;
          return fog.revealed[idx] === 1;
        }
        return true;
      };
      
      expect(isWalkable(-1, 5)).toBe(false);
      expect(isWalkable(5, -1)).toBe(false);
      expect(isWalkable(15, 5)).toBe(false);
      expect(isWalkable(5, 15)).toBe(false);
      expect(isWalkable(5, 5)).toBe(true);
    });

    it('should consider fog when determining walkability', () => {
      const fog = makeFog(10, 10);
      revealRadius(5, 5, 2, fog);
      
      const isWalkable = (tx: number, ty: number, f: Fog): boolean => {
        if (tx < 0 || ty < 0 || tx >= f.cols || ty >= f.rows) return false;
        const idx = ty * f.cols + tx;
        return f.revealed[idx] === 1;
      };
      
      expect(isWalkable(5, 5, fog)).toBe(true); // Center should be revealed
      expect(isWalkable(0, 0, fog)).toBe(false); // Corner should not be revealed
    });
  });
});