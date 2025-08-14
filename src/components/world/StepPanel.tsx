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
    
    // Reduce polling frequency to 5 seconds to improve performance
    const interval = setInterval(handleStorageChange, 5000);
    
    // Listen to storage events (for same-tab updates) - provides real-time updates when needed
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const executeStep = () => {
    // Dev button: always allow movement regardless of pending steps
    // If no pending steps, add a temporary step for dev purposes
    if ((progress.pendingSteps || 0) <= 0) {
      setProgress(prev => {
        const updated = { ...prev, pendingSteps: 1 };
        saveProgress(updated);
        return updated;
      });
    }
    
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
    <div className="absolute top-2 left-2 bg-background/90 text-foreground border border-border p-2 rounded-lg space-y-1 text-xs backdrop-blur-sm">
      <div>Steps today: {progress.stepsToday ?? 0}/9</div>
      <div>Sparks: {progress.sparks ?? 0}/3</div>
      <div>Avg mins today: {avg}</div>
      <div>Monk position: ({journey.tx}, {journey.ty})</div>
      
      <Button
        onClick={executeStep}
        size="sm"
        className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
        title="Dev button: Click to move freely (always enabled)"
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
