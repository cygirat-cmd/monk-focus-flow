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
    
    const handleProgressUpdate = (event: CustomEvent) => {
      if (event.detail?.progress) {
        setProgress(event.detail.progress);
      }
    };
    
    // Use custom events for real-time updates and reduce polling to 10 seconds for cross-tab sync only
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('monk:progress-updated', handleProgressUpdate as EventListener);
    const interval = setInterval(handleStorageChange, 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('monk:progress-updated', handleProgressUpdate as EventListener);
    };
  }, []);

  const executeStep = () => {
    // Guarantee one step execution: always add exactly 1 step and allow immediate execution
    const currentSteps = progress.pendingSteps || 0;
    
    // Add exactly 1 step if none available
    if (currentSteps <= 0) {
      const updated = { ...progress, pendingSteps: 1 };
      setProgress(updated);
      saveProgress(updated);
    }
    
    // Open movement modal immediately to execute the guaranteed step
    onOpenMovementModal?.();
  };

  const watchAd = () => {
    const updatedProgress = { ...progress };
    const awarded = stepMonk(updatedProgress, 0, { extraStep: true });
    saveProgress(updatedProgress);
    setProgress(updatedProgress);
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
        title="Guarantees one step - adds step if none available and allows immediate movement"
      >
        Execute Step ({progress.pendingSteps || 0})
      </Button>
      
      <Button
        onClick={watchAd}
        disabled={progress.adStepUsed || (progress.stepsToday ?? 0) >= 9}
        variant="outline"
        size="sm"
        className="mt-1 w-full text-xs"
      >
        Watch Ad +1 step
      </Button>
    </div>
  );
}
