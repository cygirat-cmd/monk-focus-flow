import { GardenStep, Relic, Season } from './storage';

// Base garden items
export const GARDEN_POOL: GardenStep[] = [
  { id: 'stone-1', img: '/assets/garden/stone_1.png', label: 'Stone Step' },
  { id: 'stone-2', img: '/assets/garden/stone_2.png', label: 'Stone Path' },
  { id: 'lantern-1', img: '/assets/garden/lantern_1.png', label: 'Zen Lantern' },
  { id: 'bonsai-1', img: '/assets/garden/bonsai_1.png', label: 'Bonsai Tree' },
];

// Seasonal garden items
export const SEASONAL_GARDEN_POOLS: Record<Season, GardenStep[]> = {
  spring: [
    { id: 'cherry-blossom', img: '/assets/garden/cherry_blossom.png', label: 'Cherry Blossom' },
    { id: 'spring-flower', img: '/assets/garden/spring_flower.png', label: 'Spring Flower' },
    { id: 'bamboo-shoot', img: '/assets/garden/bamboo_shoot.png', label: 'Bamboo Shoot' },
  ],
  summer: [
    { id: 'lotus-pond', img: '/assets/garden/lotus_pond.png', label: 'Lotus Pond' },
    { id: 'zen-fan', img: '/assets/garden/zen_fan.png', label: 'Cooling Fan' },
    { id: 'water-basin', img: '/assets/garden/water_basin.png', label: 'Water Basin' },
  ],
  autumn: [
    { id: 'maple-tree', img: '/assets/garden/maple_tree.png', label: 'Maple Tree' },
    { id: 'fallen-leaves', img: '/assets/garden/fallen_leaves.png', label: 'Fallen Leaves' },
    { id: 'harvest-moon', img: '/assets/garden/harvest_moon.png', label: 'Harvest Moon' },
  ],
  winter: [
    { id: 'snow-stone', img: '/assets/garden/snow_stone.png', label: 'Snow Stone' },
    { id: 'ice-lantern', img: '/assets/garden/ice_lantern.png', label: 'Ice Lantern' },
    { id: 'evergreen', img: '/assets/garden/evergreen.png', label: 'Evergreen' },
  ],
};

// Special collectibles with garden bonuses
export const BONUS_GARDEN_ITEMS: GardenStep[] = [
  { id: 'flow-crystal', img: '/assets/garden/flow_crystal.png', label: 'Flow Crystal' }, // +10% rare drops
  { id: 'time-shrine', img: '/assets/garden/time_shrine.png', label: 'Time Shrine' }, // -5s cooldown
  { id: 'focus-statue', img: '/assets/garden/focus_statue.png', label: 'Focus Statue' }, // +20% flow score
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

export const NPC_MESSAGES = {
  motivational: [
    "Focus like water - flowing yet unstoppable.",
    "Every breath is a new beginning.",
    "Small steps build great mountains.",
    "Your presence is your present.",
  ],
  tips: [
    "Try flow mode for deep work sessions.",
    "Place items near the temple for bonus energy.",
    "Check your garden - seasons change the available items!",
    "Longer streaks unlock better rewards.",
  ],
  jokes: [
    "Why did the monk refuse Novocain? He wanted to transcend dental medication!",
    "What do you call a meditation expert who's always cold? Chill-anten!",
    "Why don't monks use social media? They prefer inner-net!",
  ],
};

export const SEASONAL_BACKGROUNDS: Record<Season, string> = {
  spring: 'garden_spring.png',
  summer: 'garden_summer.png',
  autumn: 'garden_autumn.png',
  winter: 'garden_winter.png',
};

export const getRandomGardenStep = (season: Season, rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common'): GardenStep => {
  let pool = [...GARDEN_POOL];
  
  // Add seasonal items
  pool = [...pool, ...SEASONAL_GARDEN_POOLS[season]];
  
  // Add special bonus items for higher rarities
  if (rarity === 'epic' || rarity === 'legendary') {
    pool = [...pool, ...BONUS_GARDEN_ITEMS];
  }
  
  const randomIndex = Math.floor(Math.random() * pool.length);
  return { ...pool[randomIndex] };
};

export const getRandomRelic = (): Relic => {
  const randomIndex = Math.floor(Math.random() * RELICS_POOL.length);
  return { ...RELICS_POOL[randomIndex], unlockedAt: new Date().toISOString() };
};

export const getRandomZenQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * ZEN_QUOTES.length);
  return ZEN_QUOTES[randomIndex];
};

export const getRandomNPCMessage = (): { message: string; type: 'motivational' | 'tips' | 'jokes' } => {
  const types = ['motivational', 'tips', 'jokes'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const messages = NPC_MESSAGES[type];
  const message = messages[Math.floor(Math.random() * messages.length)];
  return { message, type };
};

export const moveNPC = (currentX: number, currentY: number): { x: number; y: number } => {
  // Move NPC to a random position, avoiding center temple area (5-7, 3-5)
  let x, y;
  do {
    x = Math.floor(Math.random() * 12);
    y = Math.floor(Math.random() * 8);
  } while (x >= 5 && x <= 7 && y >= 3 && y <= 5);
  
  return { x, y };
};