import { useState } from 'react';
import { loadProgress, saveProgress, ProgressData } from '@/utils/storageClient';
import { useMonkStepOnSession } from '@/hooks/useMonkStepOnSession';
import { useMonkMovement } from '@/hooks/useMonkMovement';
import { makeFog, fromSavedFog } from '@/features/fog/useFog';
import { GARDEN_COLS, GARDEN_ROWS } from '@/utils/gardenMap';

export default function StepPanel() {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const stepMonk = useMonkStepOnSession();
  const moveMonk = useMonkMovement();

  const watchAd = () => {
    stepMonk(progress, 0, { extraStep: true });
    saveProgress(progress);
    setProgress({ ...progress });
  };

  const executeOneStep = () => {
    if ((progress.pendingSteps || 0) > 0) {
      const journey = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };
      
      // Move in the current facing direction or default to right
      let newTx = journey.tx;
      let newTy = journey.ty;
      const facing = journey.facing || 'right';
      
      switch (facing) {
        case 'left':
          newTx = Math.max(0, journey.tx - 1);
          break;
        case 'right':
        default:
          newTx = Math.min(GARDEN_COLS - 1, journey.tx + 1);
          break;
      }

      const fog = progress.fog ? fromSavedFog(progress.fog) : makeFog(GARDEN_COLS, GARDEN_ROWS);
      
      const updatedProgress = { ...progress };
      moveMonk(updatedProgress, fog, newTx, newTy, 1);
      
      saveProgress(updatedProgress);
      setProgress(updatedProgress);
      
      window.location.reload();
    }
  };

  const today = new Date().toDateString();
  const sessionsToday = (progress.sessionHistory || []).filter(
    s => new Date(s.date).toDateString() === today
  );
  const avg = sessionsToday.length
    ? Math.round(
        sessionsToday.reduce((a, s) => a + s.seconds, 0) /
          sessionsToday.length /
          60
      )
    : 0;

  const journey = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };

  return (
    <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded space-y-1 text-xs">
      <div>Steps today: {progress.stepsToday ?? 0}/9</div>
      <div>Sparks: {progress.sparks ?? 0}/3</div>
      <div>Avg mins today: {avg}</div>
      <div>Monk position: ({journey.tx}, {journey.ty})</div>
      
      <button
        onClick={executeOneStep}
        disabled={(progress.pendingSteps || 0) === 0}
        className="mt-1 px-2 py-1 border rounded disabled:opacity-50 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 w-full"
      >
        Execute Step - {progress.pendingSteps || 0} available
      </button>
      
      <button
        onClick={watchAd}
        disabled={progress.adStepUsed || (progress.stepsToday ?? 0) >= 9}
        className="mt-1 px-1 py-0.5 border rounded disabled:opacity-50 w-full"
      >
        Watch Ad +1 step
      </button>
    </div>
  );
}
