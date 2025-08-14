import { useState } from 'react';
import { loadProgress, saveProgress, ProgressData } from '@/utils/storageClient';
import { useMonkStepOnSession } from '@/hooks/useMonkStepOnSession';
import { useMonkMovement } from '@/hooks/useMonkMovement';
import { makeFog, fromSavedFog, revealRadius } from '@/features/fog/useFog';
import { GARDEN_COLS, GARDEN_ROWS } from '@/utils/gardenMap';
import { Button } from '@/components/ui/button';

export default function StepPanel() {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const stepMonk = useMonkStepOnSession();
  const moveMonk = useMonkMovement();

  const executeStep = () => {
    if ((progress.pendingSteps || 0) <= 0) return;
    
    const journey = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0, facing: 'right' };
    const currentDir = journey.facing || 'right';
    
    // Calculate target position based on monk's facing direction
    let targetTx = journey.tx;
    let targetTy = journey.ty;
    
    switch (currentDir) {
      case 'up':
        targetTy = Math.max(0, journey.ty - 1);
        break;
      case 'down':
        targetTy = Math.min(GARDEN_ROWS - 1, journey.ty + 1);
        break;
      case 'left':
        targetTx = Math.max(0, journey.tx - 1);
        break;
      case 'right':
        targetTx = Math.min(GARDEN_COLS - 1, journey.tx + 1);
        break;
    }
    
    // Create fog instance for movement
    const fog = progress.fog ? fromSavedFog(progress.fog) : makeFog(GARDEN_COLS, GARDEN_ROWS);
    
    // Move monk
    moveMonk(progress, fog, targetTx, targetTy, 1);
    
    // Update progress
    saveProgress(progress);
    setProgress({ ...progress });
  };

  const watchAd = () => {
    stepMonk(progress, 0, { extraStep: true });
    saveProgress(progress);
    setProgress({ ...progress });
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
      
      <Button
        onClick={executeStep}
        disabled={(progress.pendingSteps || 0) <= 0}
        size="sm"
        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
      >
        Execute Step ({progress.pendingSteps || 0})
      </Button>
      
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
