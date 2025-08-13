import { useCallback } from 'react';
import path from '@/data/paths/default.json';
import { loadProgress, saveProgress } from '@/utils/storageClient';
import { revealRadius, makeFog } from '@/features/fog/useFog';
import { GARDEN_COLS, GARDEN_ROWS } from '@/utils/gardenMap';

export const useMonkStepOnSession = () => {
  return useCallback(() => {
    const progress = loadProgress();
    const journey = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };
    const route = path as [number, number][];
    const next = route[journey.step + 1];
    if (next) {
      journey.step += 1;
      journey.tx = next[0];
      journey.ty = next[1];
      const fog = progress.fog
        ? { cols: progress.fog.cols, rows: progress.fog.rows, revealed: Uint8Array.from(progress.fog.revealed) }
        : makeFog(GARDEN_COLS, GARDEN_ROWS);
      revealRadius(journey.tx, journey.ty, 3, fog);
      progress.fog = { cols: fog.cols, rows: fog.rows, revealed: Array.from(fog.revealed) };
      progress.journey = journey;
      saveProgress(progress);
    }
  }, []);
};
