import { useCallback } from 'react';
import { ProgressData } from '@/utils/storageClient';

export const useMonkStepOnSession = () => {
  return useCallback(
    (progress: ProgressData, seconds: number, opts?: { extraStep?: boolean }) => {
      const today = new Date().toISOString().slice(0, 10);
      if (progress.lastStepDate !== today) {
        progress.lastStepDate = today;
        progress.stepsToday = 0;
        progress.sparks = 0;
        progress.bonus45Used = false;
        progress.bonus60Used = false;
        progress.adStepUsed = false;
      }

      let steps = 0;
      if (opts?.extraStep) {
        if (progress.adStepUsed || (progress.stepsToday ?? 0) >= 9) return 0;
        progress.adStepUsed = true;
        steps = 1;
      } else {
        if (seconds >= 1500) {
          steps += 1;
        } else if (seconds >= 300) {
          progress.sparks = (progress.sparks || 0) + 1;
          if (progress.sparks >= 3) {
            progress.sparks -= 3;
            steps += 1;
          }
        }
        if (seconds >= 2700 && seconds < 3600 && !progress.bonus45Used) {
          progress.bonus45Used = true;
          steps += 1;
        }
        if (seconds >= 3600 && !progress.bonus60Used) {
          progress.bonus60Used = true;
          steps += 2;
        }
      }

      const softCap = 6;
      const hardCap = 9;
      let awarded = 0;
      while (steps > 0 && (progress.stepsToday || 0) < hardCap) {
        if ((progress.stepsToday || 0) >= softCap) {
          if ((progress.stepsToday || 0) < softCap + 2) {
            if (opts?.extraStep || seconds >= 2100) {
              progress.stepsToday = (progress.stepsToday || 0) + 1;
              steps--;
              awarded++;
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          progress.stepsToday = (progress.stepsToday || 0) + 1;
          steps--;
          awarded++;
        }
      }

      if (!opts?.extraStep) {
        progress.sessionHistory = [
          ...(progress.sessionHistory || []),
          { date: new Date().toISOString(), seconds, steps: awarded },
        ];
      }

      if (awarded > 0) {
        progress.pendingSteps = (progress.pendingSteps || 0) + awarded;
      }
      return awarded;
    },
    []
  );
};
