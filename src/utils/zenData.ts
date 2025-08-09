import { GardenStep, Relic } from './storage';

export const GARDEN_POOL: GardenStep[] = [
  { id: 'stone-1', img: '/assets/garden/stone_1.png', label: 'Stone Step' },
  { id: 'stone-2', img: '/assets/garden/stone_2.png', label: 'Stone Path' },
  { id: 'lantern-1', img: '/assets/garden/lantern_1.png', label: 'Zen Lantern' },
  { id: 'bonsai-1', img: '/assets/garden/bonsai_1.png', label: 'Bonsai Tree' },
];

export const RELICS_POOL: Relic[] = [
  { id: 'tea-bowl', img: '/assets/relics/tea_bowl.png', title: 'Tea Bowl', unlockedAt: '' },
  { id: 'fan', img: '/assets/relics/fan.png', title: 'Zen Fan', unlockedAt: '' },
  { id: 'koan-scroll', img: '/assets/relics/koan_scroll.png', title: 'Koan Scroll', unlockedAt: '' },
  { id: 'hand-bell', img: '/assets/relics/hand_bell.png', title: 'Hand Bell', unlockedAt: '' },
];

export const ZEN_QUOTES = [
  "The mind is everything. What you think you become.",
  "In the beginner's mind there are many possibilities.",
  "The way is not in the sky. The way is in the heart.",
  "Let go or be dragged.",
  "You are perfect as you are, and you could use a little improvement.",
];

export const getRandomGardenStep = (): GardenStep => {
  const randomIndex = Math.floor(Math.random() * GARDEN_POOL.length);
  return { ...GARDEN_POOL[randomIndex] };
};

export const getRandomRelic = (): Relic => {
  const randomIndex = Math.floor(Math.random() * RELICS_POOL.length);
  return { ...RELICS_POOL[randomIndex], unlockedAt: new Date().toISOString() };
};

export const getRandomZenQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * ZEN_QUOTES.length);
  return ZEN_QUOTES[randomIndex];
};