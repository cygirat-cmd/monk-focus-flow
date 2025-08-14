import { useState, useEffect } from 'react';
import { loadProgress, saveProgress, ProgressData } from '@/utils/storageClient';
import { useMonkStepOnSession } from '@/hooks/useMonkStepOnSession';
import { useMonkMovement } from '@/hooks/useMonkMovement';
import { makeFog, fromSavedFog, revealRadius } from '@/features/fog/useFog';
import { GARDEN_COLS, GARDEN_ROWS } from '@/utils/gardenMap';
import { Button } from '@/components/ui/button';

interface StepPanelProps {
  onOpenMovementModal?: () => void;
}

export default function StepPanel({ onOpenMovementModal }: StepPanelProps) {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const stepMonk = useMonkStepOnSession();
  const moveMonk = useMonkMovement();
  
  // Update progress state when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setProgress(loadProgress());
    };
    
    // Update every second to keep statistics fresh
    const interval = setInterval(handleStorageChange, 1000);
    
    // Listen to storage events (for same-tab updates)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const executeStep = () => {
    if ((progress.pendingSteps || 0) <= 0) return;
    
    // Open movement modal to choose where to move
    onOpenMovementModal?.();
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
