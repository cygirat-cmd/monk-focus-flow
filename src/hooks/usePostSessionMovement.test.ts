import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePostSessionMovement } from './usePostSessionMovement';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

describe('usePostSessionMovement', () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it('navigates to world when pending steps are greater than zero', async () => {
    renderHook(() => usePostSessionMovement(1));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/world');
    });
  });

  it('does not navigate when there are no pending steps', async () => {
    renderHook(() => usePostSessionMovement(0));
    await waitFor(() => {
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
