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

  const executeImmediateMove = () => {
    try {
      const fog = progress.fog ? fromSavedFog(progress.fog) : makeFog(GARDEN_COLS, GARDEN_ROWS);
      const currentJourney = progress.journey || { tx: 0, ty: 15, pathId: 'default', step: 0 };
      const currentDir = progress.nextDir || 'right';
      
      // Calculate next position based on direction
      let newTx = currentJourney.tx;
      let newTy = currentJourney.ty;
      
      switch(currentDir) {
        case 'up':
          newTy = Math.max(0, newTy - 1);
          break;
        case 'down':
          newTy = Math.min(GARDEN_ROWS - 1, newTy + 1);
          break;
        case 'left':
          newTx = Math.max(0, newTx - 1);
          break;
        case 'right':
          newTx = Math.min(GARDEN_COLS - 1, newTx + 1);
          break;
      }
      
      // Move monk and update progress
      const updatedProgress = { ...progress };
      moveMonk(updatedProgress, fog, newTx, newTy, 1);
      saveProgress(updatedProgress);
      setProgress(updatedProgress);
      
      // Force reload the page to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error('Error executing immediate move:', error);
      alert('Error executing movement. Please try again.');
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
  const currentJourney = progress.journey || { tx: 0, ty: 15, pathId: 'default', step: 0 };
  const monkCoords = `(${currentJourney.tx}, ${currentJourney.ty})`;

  return (
    <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded space-y-1 text-xs">
      <div>Steps today: {progress.stepsToday ?? 0}/9</div>
      <div>Sparks: {progress.sparks ?? 0}/3</div>
      <div>Avg mins today: {avg}</div>
      <div className="flex items-center space-x-2">
        <span>Monk coordinates: {monkCoords}</span>
        <button
          onClick={executeImmediateMove}
          className="px-1 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
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
