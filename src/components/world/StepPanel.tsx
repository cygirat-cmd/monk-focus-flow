import { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Event-driven updates instead of polling
  const handleStorageChange = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    // Listen to storage events (for cross-tab updates)
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('progressUpdated', handleStorageChange);
    
    // Update only every 10 seconds instead of every second for better performance
    const interval = setInterval(handleStorageChange, 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('progressUpdated', handleStorageChange);
    };
  }, [handleStorageChange]);

  const executeStep = useCallback(() => {
    // Dev mode: always allow step execution for testing
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (!isDevMode && (progress.pendingSteps || 0) <= 0) return;
    
    // Open movement modal to choose where to move
    onOpenMovementModal?.();
  }, [progress.pendingSteps, onOpenMovementModal]);

  const watchAd = useCallback(() => {
    const updatedProgress = { ...progress };
    stepMonk(updatedProgress, 0, { extraStep: true });
    saveProgress(updatedProgress);
    setProgress(updatedProgress);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new Event('progressUpdated'));
  }, [progress, stepMonk]);

  // Memoize expensive calculations
  const { avg, journey } = useMemo(() => {
    const today = new Date().toDateString();
    const sessionsToday = (progress.sessionHistory || []).filter(
      s => new Date(s.date).toDateString() === today
    );
    const avgMinutes = sessionsToday.length
      ? Math.round(
          sessionsToday.reduce((a, s) => a + s.seconds, 0) /
            sessionsToday.length /
            60
        )
      : 0;
    const journeyData = progress.journey || { tx: 0, ty: 0, pathId: 'default', step: 0 };
    
    return { avg: avgMinutes, journey: journeyData };
  }, [progress.sessionHistory, progress.journey]);

  return (
    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-foreground p-2 rounded-lg border space-y-1 text-xs shadow-md">
      <div>Steps today: {progress.stepsToday ?? 0}/9</div>
      <div>Sparks: {progress.sparks ?? 0}/3</div>
      <div>Avg mins today: {avg}</div>
      <div>Monk position: ({journey.tx}, {journey.ty})</div>
      
      <Button
        onClick={executeStep}
        disabled={process.env.NODE_ENV !== 'development' && (progress.pendingSteps || 0) <= 0}
        size="sm"
        variant="default"
        className="mt-2 w-full text-xs"
      >
        {process.env.NODE_ENV === 'development' ? 'Dev Step' : `Execute Step (${progress.pendingSteps || 0})`}
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
