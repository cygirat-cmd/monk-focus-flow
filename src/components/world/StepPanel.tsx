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
  
  const executeOneStep = () => {
    const fog = progress.fog ? fromSavedFog(progress.fog) : makeFog(GARDEN_COLS, GARDEN_ROWS);
    const journey = progress.journey || { tx: 0, ty: 15, pathId: 'default', step: 0 };
    
    // Move one step in the current direction
    let newTx = journey.tx;
    let newTy = journey.ty;
    
    switch (progress.nextDir) {
      case 'up': newTy = Math.max(0, newTy - 1); break;
      case 'down': newTy = Math.min(GARDEN_ROWS - 1, newTy + 1); break;
      case 'left': newTx = Math.max(0, newTx - 1); break;
      case 'right': newTx = Math.min(GARDEN_COLS - 1, newTx + 1); break;
      default: newTx = Math.min(GARDEN_COLS - 1, newTx + 1); // default right
    }
    
    const updatedProgress = { ...progress };
    moveMonk(updatedProgress, fog, newTx, newTy, 1);
    saveProgress(updatedProgress);
    setProgress(updatedProgress);
    
    window.location.reload(); // Refresh to update coordinates display
  };

  const setDir = (dir: 'up' | 'down' | 'left' | 'right') => {
    progress.nextDir = dir;
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
  const monkCoords = progress.journey ? `(${progress.journey.tx}, ${progress.journey.ty})` : '(0, 15)';

  return (
    <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded space-y-1 text-xs">
      <div>Steps today: {progress.stepsToday ?? 0}/9</div>
      <div>Sparks: {progress.sparks ?? 0}/3</div>
      <div>Avg mins today: {avg}</div>
      <div className="flex items-center space-x-1">
        <span>Monk coordinates: {monkCoords}</span>
        <button
          onClick={executeOneStep}
          className="px-1 py-0.5 text-xs border rounded bg-blue-600 text-white hover:bg-blue-700"
          title="Execute one movement step"
        >
          ▶
        </button>
      </div>
      <div className="flex space-x-1 mt-1">
        {(['up', 'down', 'left', 'right'] as const).map(dir => (
          <button
            key={dir}
            onClick={() => setDir(dir)}
            className={`px-1 py-0.5 border rounded ${progress.nextDir === dir ? 'bg-white text-black' : ''}`}
          >
            {dir[0].toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={watchAd}
        disabled={progress.adStepUsed || (progress.stepsToday ?? 0) >= 9}
        className="mt-1 px-1 py-0.5 border rounded disabled:opacity-50"
      >
        Watch Ad +1 step
      </button>
    </div>
  );
}