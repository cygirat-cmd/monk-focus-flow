import { ZenTrial, ProgressData } from './storage';
import { getRandomGardenStep } from './zenData';

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
    target: 1800, // 30 minutes in seconds
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
    target: 2700, // 45 minutes in seconds
  },
];

export const generateNewTrial = (): ZenTrial => {
  const template = TRIAL_TEMPLATES[Math.floor(Math.random() * TRIAL_TEMPLATES.length)];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3); // 3 days to complete
  
  return {
    id: `trial_${Date.now()}`,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    expiresAt: expiresAt.toISOString(),
    completed: false,
    reward: getRandomGardenStep('spring', 'epic'), // Always epic rarity for trials
  };
};

export const updateTrialProgress = (
  trials: ZenTrial[],
  sessionData: { mode: 'flow' | 'pomodoro'; seconds: number },
  progressData: ProgressData
): ZenTrial[] => {
  const now = new Date().toISOString();
  
  return trials.map(trial => {
    if (trial.completed || new Date(trial.expiresAt) < new Date()) {
      return trial;
    }

    let newProgress = trial.progress;
    
    switch (trial.title) {
      case 'Focus Marathon':
        // Track consecutive sessions (implementation would need session tracking)
        newProgress = Math.min(trial.target, progressData.streak.days);
        break;
        
      case 'Flow Master':
        if (sessionData.mode === 'flow' && sessionData.seconds >= trial.target) {
          newProgress = trial.target;
        }
        break;
        
      case 'Daily Warrior':
        // Would need to track sessions per day
        newProgress = Math.min(trial.target, progressData.counters.placementsToday);
        break;
        
      case 'Streak Builder':
        newProgress = Math.min(trial.target, progressData.streak.days);
        break;
        
      case 'Deep Focus':
        if (sessionData.mode === 'pomodoro' && sessionData.seconds >= trial.target) {
          newProgress = trial.target;
        }
        break;
    }

    const completed = newProgress >= trial.target;
    
    return {
      ...trial,
      progress: newProgress,
      completed,
    };
  });
};

export const checkForNewTrials = (progress: ProgressData): ZenTrial[] => {
  const now = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  // Check if we need a new trial (every 3 days)
  const lastTrialDate = progress.trials.length > 0 
    ? new Date(Math.max(...progress.trials.map(t => new Date(t.expiresAt).getTime() - 3 * 24 * 60 * 60 * 1000)))
    : threeDaysAgo;
    
  if (now.getTime() - lastTrialDate.getTime() >= 3 * 24 * 60 * 60 * 1000) {
    return [...progress.trials, generateNewTrial()];
  }
  
  return progress.trials;
};

export const getActiveTrials = (trials: ZenTrial[]): ZenTrial[] => {
  const now = new Date();
  return trials.filter(trial => 
    !trial.completed && 
    new Date(trial.expiresAt) > now
  );
};

export const getCompletedTrials = (trials: ZenTrial[]): ZenTrial[] => {
  return trials.filter(trial => trial.completed);
};