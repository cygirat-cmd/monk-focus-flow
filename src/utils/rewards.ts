import { GardenStep, Relic, ProgressData } from './storageClient';


export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RewardItem = (
  | ({ kind: 'garden' } & GardenStep)
  | ({ kind: 'relic' } & Relic)
) & { rarity: Rarity; description?: string; bonus?: string };

// Minimal art mapping: use existing assets when available, otherwise placeholder
const P = '/placeholder.svg';

// Build item pools from the provided table (subset images mapped to placeholders as needed)
const COMMON: RewardItem[] = [
  { kind: 'garden', id: 'stone-1', img: '/assets/garden/stone_1.png', label: 'Stone Step', rarity: 'common' },
  { kind: 'garden', id: 'stone-2', img: '/assets/garden/stone_2.png', label: 'Stone Path', rarity: 'common' },
  { kind: 'garden', id: 'lantern-1', img: '/assets/garden/lantern_1.png', label: 'Zen Lantern', rarity: 'common' },
  { kind: 'garden', id: 'bonsai-1', img: '/assets/garden/bonsai_1.png', label: 'Bonsai Tree', rarity: 'common' },
  { kind: 'garden', id: 'wooden-bench', img: P, label: 'Wooden Bench', rarity: 'common' },
  { kind: 'garden', id: 'gravel-patch', img: P, label: 'Gravel Patch', rarity: 'common' },
  { kind: 'garden', id: 'small-pond', img: P, label: 'Small Pond', rarity: 'common' },
  { kind: 'garden', id: 'wooden-bridge', img: P, label: 'Wooden Bridge', rarity: 'common' },
  { kind: 'garden', id: 'bamboo-fence', img: P, label: 'Bamboo Fence', rarity: 'common' },
  { kind: 'garden', id: 'moss-rock', img: P, label: 'Moss Rock Cluster', rarity: 'common' },
  { kind: 'garden', id: 'torii-gate', img: P, label: 'Garden Gate (Torii)', rarity: 'common' },
  { kind: 'garden', id: 'low-shrub', img: P, label: 'Low Shrub', rarity: 'common' },
  { kind: 'garden', id: 'lamp-post', img: P, label: 'Paper Lamp Post', rarity: 'common' },
  { kind: 'garden', id: 'water-ladle', img: P, label: 'Water Ladle Stand', rarity: 'common' },
  { kind: 'garden', id: 'cherry-blossom-tree', img: P, label: 'Cherry Blossom Tree', rarity: 'common' },
  { kind: 'garden', id: 'lotus-pond', img: '/lovable-uploads/b82ce638-3ac2-42a1-a65f-8d3e8a479d37.png', label: 'Lotus Pond', rarity: 'common' },
  { kind: 'garden', id: 'maple-tree', img: P, label: 'Maple Tree', rarity: 'common' },
  { kind: 'garden', id: 'snow-stone', img: P, label: 'Snow Stone', rarity: 'common' },
];

const RARE: RewardItem[] = [
  { kind: 'garden', id: 'spring-waterfall', img: P, label: 'Spring Waterfall', rarity: 'rare' },
  { kind: 'garden', id: 'bamboo-pavilion', img: P, label: 'Bamboo Pavilion', rarity: 'rare' },
  { kind: 'garden', id: 'harvest-rice-stack', img: P, label: 'Harvest Rice Stack', rarity: 'rare' },
  { kind: 'garden', id: 'ice-bridge', img: P, label: 'Ice Bridge', rarity: 'rare' },
  { kind: 'garden', id: 'meditation-mat', img: P, label: 'Meditation Mat', rarity: 'rare' },
  { kind: 'garden', id: 'stone-pagoda', img: P, label: 'Stone Pagoda', rarity: 'rare' },
  { kind: 'garden', id: 'bamboo-water-spout', img: P, label: 'Bamboo Water Spout', rarity: 'rare' },
  { kind: 'garden', id: 'zen-arch-gate', img: P, label: 'Zen Arch Gate', rarity: 'rare' },
];

const EPIC: RewardItem[] = [
  { kind: 'garden', id: 'lucky-carp', img: P, label: 'Giant Lucky Carp Statue', rarity: 'epic' },
  { kind: 'garden', id: 'lazy-panda-hammock', img: P, label: 'Lazy Panda Hammock', rarity: 'epic' },
  { kind: 'garden', id: 'fox-spirit-shrine', img: P, label: 'Fox Spirit Shrine', rarity: 'epic' },
  { kind: 'garden', id: 'snowman-monk', img: P, label: 'Snowman Monk', rarity: 'epic' },
  { kind: 'garden', id: 'spirit-wind-chimes', img: P, label: 'Spirit Wind Chimes', rarity: 'epic' },
  { kind: 'garden', id: 'golden-koi-pond', img: P, label: 'Golden Koi Pond', rarity: 'epic' },
  { kind: 'garden', id: 'mini-mt-fuji', img: P, label: 'Miniature Mount Fuji', rarity: 'epic' },
];

const LEGENDARY_NON_RELIC: RewardItem[] = [
  { kind: 'garden', id: 'eternal-bloom-sakura', img: P, label: 'Eternal Bloom Sakura', rarity: 'legendary' },
  { kind: 'garden', id: 'sun-spirit-fountain', img: P, label: 'Sun Spirit Fountain', rarity: 'legendary' },
  { kind: 'garden', id: 'golden-leaf-whirlpool', img: P, label: 'Golden Leaf Whirlpool', rarity: 'legendary' },
  { kind: 'garden', id: 'northern-light-lantern', img: P, label: 'Northern Light Lantern', rarity: 'legendary' },
  { kind: 'garden', id: 'dragon-fountain', img: P, label: 'Dragon Fountain', rarity: 'legendary' },
  { kind: 'garden', id: 'eternal-sand-garden', img: P, label: 'Eternal Sand Garden', rarity: 'legendary' },
  { kind: 'garden', id: 'phoenix-perch', img: P, label: 'Phoenix Perch', rarity: 'legendary' },
];

const LEGENDARY_RELICS: RewardItem[] = [
  { kind: 'relic', id: 'tea-bowl', img: '/assets/relics/tea_bowl.png', title: 'Ancient Tea Bowl', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'fan', img: '/assets/relics/fan.png', title: 'Zen Fan', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'koan-scroll', img: '/assets/relics/koan_scroll.png', title: 'Koan Scroll', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'hand-bell', img: '/assets/relics/hand_bell.png', title: 'Hand Bell', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'wooden-fish-drum', img: '/placeholder.svg', title: "Monk’s Wooden Fish Drum", unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'jade-beads', img: '/placeholder.svg', title: 'Jade Meditation Beads', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'celestial-compass', img: '/placeholder.svg', title: 'Celestial Compass', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'crane-feather-amulet', img: '/placeholder.svg', title: 'Crane Feather Amulet', unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'timekeepers-sandglass', img: '/placeholder.svg', title: "Timekeeper’s Sandglass", unlockedAt: '', rarity: 'legendary' },
  { kind: 'relic', id: 'zenmodoro-shukan', img: '/placeholder.svg', title: 'Zenmodoro Shukan', unlockedAt: '', rarity: 'legendary' },
];

export function getAllowedRarity(seconds: number): Array<{ rarity: Rarity; weight: number }> {
  const minutes = seconds / 60;
  if (minutes < 10) return [];
  if (minutes < 30) return [ { rarity: 'common', weight: 100 } ];
  if (minutes < 45) return [ { rarity: 'common', weight: 60 }, { rarity: 'rare', weight: 40 } ];
  if (minutes < 60) return [ { rarity: 'common', weight: 30 }, { rarity: 'rare', weight: 50 }, { rarity: 'epic', weight: 20 } ];
  return [ { rarity: 'rare', weight: 40 }, { rarity: 'epic', weight: 40 }, { rarity: 'legendary', weight: 20 } ];
}

function weightedPick<T extends { weight?: number }>(arr: Array<T & { weight: number }>): T {
  const total = arr.reduce((s, a) => s + a.weight, 0);
  let roll = Math.random() * total;
  for (const it of arr) {
    if (roll < it.weight) return it;
    roll -= it.weight;
  }
  return arr[arr.length - 1];
}

export function drawReward(seconds: number): RewardItem | null {
  const rarityDist = getAllowedRarity(seconds);
  if (rarityDist.length === 0) return null;
  const pickR = weightedPick(rarityDist).rarity;
  let pool: RewardItem[] = [];
  if (pickR === 'common') pool = COMMON;
  else if (pickR === 'rare') pool = RARE;
  else if (pickR === 'epic') pool = EPIC;
  else {
    // Lower weight for relics within legendary rarity
    const pickRelic = Math.random() < 0.25; // 25% relics, 75% non-relic legendaries
    pool = pickRelic ? LEGENDARY_RELICS : LEGENDARY_NON_RELIC;
  }
  // Seasonal gating
  const month = new Date().getMonth();
  const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';
  const seasonalIds: Record<string, 'spring'|'summer'|'autumn'|'winter'> = {
    'cherry-blossom-tree': 'spring', 'spring-waterfall': 'spring', 'lucky-carp': 'spring', 'eternal-bloom-sakura': 'spring',
    'lotus-pond': 'summer', 'bamboo-pavilion': 'summer', 'lazy-panda-hammock': 'summer', 'sun-spirit-fountain': 'summer',
    'maple-tree': 'autumn', 'harvest-rice-stack': 'autumn', 'fox-spirit-shrine': 'autumn', 'golden-leaf-whirlpool': 'autumn',
    'snow-stone': 'winter', 'ice-bridge': 'winter', 'snowman-monk': 'winter', 'northern-light-lantern': 'winter',
  };
  const filtered = pool.filter(p => !seasonalIds[p.id] || seasonalIds[p.id] === season);
  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  return { ...pick };
}

export function grantReward(progress: ProgressData, reward: RewardItem) {
  if (reward.kind === 'garden') {
    progress.pendingTokens = [...(progress.pendingTokens || []), { id: reward.id, img: reward.img, label: reward.label }];
  } else {
    progress.relics = [...progress.relics, { id: reward.id, img: reward.img, title: reward.title, unlockedAt: new Date().toISOString() }];
  }
  progress.counters.itemsReceivedToday = (progress.counters.itemsReceivedToday || 0) + 1;
  progress.counters.lastRewardAt = Date.now();
}
