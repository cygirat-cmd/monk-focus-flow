import { useCallback } from 'react';
import { ProgressData } from '@/utils/storageClient';
import { revealRadius, Fog } from '@/features/fog/useFog';

export const useMonkMovement = () => {
  return useCallback(
    (
      progress: ProgressData,
      fog: Fog,
      targetTx: number,
      targetTy: number,
      steps: number
    ) => {
      const journey =
        progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };

      // Calculate movement direction for sprite facing
      const deltaX = targetTx - journey.tx;
      const deltaY = targetTy - journey.ty;

      // Move monk to target position
      journey.tx = targetTx;
      journey.ty = targetTy;
      journey.step += steps;

      // Set facing direction
      if (deltaX > 0) journey.facing = 'right';
      else if (deltaX < 0) journey.facing = 'left';
      // Keep current facing if moving vertically

      // Reveal fog around new position
      revealRadius(journey.tx, journey.ty, 3, fog);

      // Update progress
      progress.journey = journey;
      progress.fog = {
        cols: fog.cols,
        rows: fog.rows,
        revealed: Array.from(fog.revealed),
      };
      progress.pendingSteps = Math.max(
        0,
        (progress.pendingSteps || 0) - steps
      );
    },
    []
  );
};
