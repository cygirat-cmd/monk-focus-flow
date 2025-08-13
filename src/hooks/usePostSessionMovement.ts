import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePostSessionMovement = (pendingSteps: number) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (pendingSteps > 0) {
      // Navigate to world map to show movement modal
      navigate('/world');
    }
  }, [pendingSteps, navigate]);
};