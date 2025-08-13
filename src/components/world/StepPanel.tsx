import { useState } from 'react';
import { loadProgress, saveProgress, ProgressData } from '@/utils/storageClient';
import { useMonkStepOnSession } from '@/hooks/useMonkStepOnSession';

export default function StepPanel() {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const stepMonk = useMonkStepOnSession();

  const setDir = (dir: 'up' | 'down' | 'left' | 'right') => {
    const updatedProgress = { ...progress, nextDir: dir };
    saveProgress(updatedProgress);
    setProgress(updatedProgress);
  };

  const watchAd = () => {
    const updatedProgress = { ...progress };
    stepMonk(updatedProgress, 0, { extraStep: true });
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
  const revealed = progress.fog
    ? progress.fog.revealed.filter(r => r === 1).length
    : 0;

  return (
    <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded space-y-1 text-xs">
      <div>Steps today: {progress.stepsToday ?? 0}/9</div>
      <div>Sparks: {progress.sparks ?? 0}/3</div>
      <div>Avg mins today: {avg}</div>
      <div>Revealed tiles: {revealed}</div>
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
