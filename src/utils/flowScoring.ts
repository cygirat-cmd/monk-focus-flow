// FlowSession type definition
type FlowSession = {
  seconds: number;
  flowScore: number;
  timestamp: string;
};

export const calculateFlowScore = (seconds: number): number => {
  // Flow score based on session length with exponential curve
  const minutes = seconds / 60;
  
  // No rewards under 10 minutes
  if (minutes < 10) return 0;
  
  // Exponential curve: longer sessions = exponentially better rewards
  // Score of 1-100, with diminishing returns after 60 minutes
  const score = Math.min(100, Math.pow(minutes / 10, 1.5) * 10);
  return Math.round(score);
};

export const getRarityFromFlowScore = (score: number): 'common' | 'rare' | 'epic' | 'legendary' => {
  if (score >= 80) return 'legendary';
  if (score >= 60) return 'epic';
  if (score >= 30) return 'rare';
  return 'common';
};

export const getRewardMultiplierFromFlowScore = (score: number): number => {
  const rarity = getRarityFromFlowScore(score);
  switch (rarity) {
    case 'legendary': return 3;
    case 'epic': return 2;
    case 'rare': return 1.5;
    case 'common': return 1;
  }
};

export const formatFlowSession = (session: FlowSession): string => {
  const hours = Math.floor(session.seconds / 3600);
  const minutes = Math.floor((session.seconds % 3600) / 60);
  const rarity = getRarityFromFlowScore(session.flowScore);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m (${rarity})`;
  }
  return `${minutes}m (${rarity})`;
};