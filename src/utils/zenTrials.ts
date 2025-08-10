// Trials utilities (loose typing to avoid cross-file type coupling)
import { getRandomGardenStep } from './zenData';

export type ZenTrial = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  expiresAt: string;
  completed: boolean;
  // reward is a garden step-like object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reward?: any;
};

const TRIAL_TEMPLATES = [
  {
    title: 'Focus Marathon',
    description: 'Complete 4 sessions without interruptions',
    type: 'consecutive_sessions',
    target: 4,
  },
  {
    title: 'Flow Master',
    description: 'Complete a 30-minute flow session',
    type: 'flow_duration',
    target: 1800,
  },
  {
    title: 'Daily Warrior',
    description: 'Complete 3 sessions in one day',
    type: 'daily_sessions',
    target: 3,
  },
  {
    title: 'Streak Builder',
    description: 'Maintain a 5-day streak',
    type: 'streak',
    target: 5,
  },
  {
    title: 'Deep Focus',
    description: 'Complete a 45-minute pomodoro session',
    type: 'pomodoro_duration',
    target: 2700,
  },
] as const;

export const generateNewTrial = (): ZenTrial => {
  const template = TRIAL_TEMPLATES[Math.floor(Math.random() * TRIAL_TEMPLATES.length)];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);
  return {
    id: `trial_${Date.now()}`,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    expiresAt: expiresAt.toISOString(),
    completed: false,
    reward: getRandomGardenStep('spring', 'epic'),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateTrialProgress = (trials: any[] = [], sessionData: { mode: 'flow' | 'pomodoro'; seconds: number }, /* progressData */ _progressData: any): any[] => {
  return (trials || []).map((trial: ZenTrial) => {
    if (trial.completed || new Date(trial.expiresAt) < new Date()) return trial;
    let newProgress = trial.progress || 0;
    switch (trial.title) {
      case 'Flow Master':
        if (sessionData.mode === 'flow' && sessionData.seconds >= 1800) newProgress = trial.target;
        break;
      case 'Deep Focus':
        if (sessionData.mode === 'pomodoro' && sessionData.seconds >= 2700) newProgress = trial.target;
        break;
      default:
        break;
    }
    const completed = newProgress >= trial.target;
    return { ...trial, progress: newProgress, completed };
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkForNewTrials = (progress: any): any[] => {
  const trials: ZenTrial[] = progress?.trials || [];
  // naive: ensure at least one active trial exists
  const hasActive = trials.some(t => !t.completed && new Date(t.expiresAt) > new Date());
  return hasActive ? trials : [...trials, generateNewTrial()];
};

export const getActiveTrials = (trials: ZenTrial[] = []): ZenTrial[] => {
  const now = new Date();
  return (trials || []).filter(trial => !trial.completed && new Date(trial.expiresAt) > now);
};

export const getCompletedTrials = (trials: ZenTrial[] = []): ZenTrial[] => {
  return (trials || []).filter(trial => trial.completed);
};
