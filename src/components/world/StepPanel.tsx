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
    
    // Use custom event for efficient same-tab updates instead of polling
    const handleProgressUpdate = (e: CustomEvent) => {
      if (e.detail?.progress) {
        setProgress(e.detail.progress);
      } else {
        setProgress(loadProgress());
      }
    };
    
    // Listen to storage events (for cross-tab updates)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen to custom progress update events for same-tab efficiency
    window.addEventListener('progressUpdate', handleProgressUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('progressUpdate', handleProgressUpdate as EventListener);
    };
  }, []);

  const executeStep = () => {
    const currentSteps = progress.pendingSteps ?? 0;
    
    // If user already has steps, open modal immediately
    if (currentSteps > 0) {
      onOpenMovementModal?.();
      return;
    }
    
    // If no steps available, add exactly 1 step and then open modal
    const updated = { ...progress, pendingSteps: 1 };
    setProgress(updated);
    saveProgress(updated);
    
    // Emit custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('progressUpdate', { detail: { progress: updated } }));
    
    // Open movement modal after adding the step
    setTimeout(() => {
      onOpenMovementModal?.();
    }, 50); // Small delay to ensure state updates first
  };

  const watchAd = () => {
    // Create a copy to avoid mutating the original state
    const progressCopy = { ...progress };
    const awardedSteps = stepMonk(progressCopy, 0, { extraStep: true });
    
    // stepMonk mutates progressCopy and returns the number of awarded steps
    // Save and update with the mutated progressCopy (now updatedProgress)
    saveProgress(progressCopy);
    setProgress(progressCopy);
    
    // Emit custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('progressUpdate', { detail: { progress: progressCopy } }));
    
    // If steps were awarded, automatically open the movement modal
    if (awardedSteps > 0) {
      setTimeout(() => {
        onOpenMovementModal?.();
      }, 100); // Small delay to ensure state updates first
    }
  };

  const today = new Date().toDateString();
  const sessionsToday = (progress.sessionHistory ?? []).filter(
    s => new Date(s.date).toDateString() === today
  );
  const avg = sessionsToday.length
    ? Math.round(
        sessionsToday.reduce((a, s) => a + s.seconds, 0) /
          sessionsToday.length /
          60
      )
    : 0;
  const journey = progress.journey ?? { tx: 0, ty: 0, pathId: 'default', step: 0 };

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
        aria-label={`Execute step - ${progress.pendingSteps ?? 0} steps available`}
        title="Guarantees one step - adds step if none available and allows immediate movement"
      >
        Execute Step ({progress.pendingSteps ?? 0})
      </Button>
      
      <Button
        onClick={watchAd}
        disabled={progress.adStepUsed === true || (progress.stepsToday ?? 0) >= 9}
        variant="outline"
        size="sm"
        className="mt-1 w-full text-xs"
        aria-label={`Watch advertisement to earn one step - ${progress.adStepUsed === true ? 'already used today' : 'available'}`}
        title={progress.adStepUsed === true ? 'Ad step already used today' : 'Watch an ad to earn an extra step'}
      >
        Watch Ad +1 step
      </Button>
    </div>
  );
}
