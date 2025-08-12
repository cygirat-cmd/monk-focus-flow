import { GardenStep, Relic, ProgressData, loadProgress } from './storageClient';


export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RewardItem = (
  | ({ kind: 'garden' } & GardenStep)
  | ({ kind: 'relic' } & Relic)
) & { rarity: Rarity; description?: string; bonus?: string };

// Minimal art mapping: use existing assets when available, otherwise placeholder
const P = '/placeholder.svg';

// Build item pools from the provided table (subset images mapped to placeholders as needed)
const COMMON: RewardItem[] = [
  { kind: 'garden', id: 'stone-1', img: '/assets/garden/stone_step.png', label: 'Stone Step', rarity: 'common' },
  { kind: 'garden', id: 'stone-2', img: '/assets/garden/stone_path.png', label: 'Stone Path', rarity: 'common' },
  { kind: 'garden', id: 'lantern-1', img: '/assets/garden/zen_lantern.png', label: 'Zen Lantern', rarity: 'common' },
  { kind: 'garden', id: 'bonsai-1', img: '/assets/garden/bonsai_tree.png', label: 'Bonsai Tree', rarity: 'common' },
  { kind: 'garden', id: 'wooden-bench', img: '/assets/garden/wooden_bench.png', label: 'Wooden Bench', rarity: 'common' },
  { kind: 'garden', id: 'gravel-patch', img: '/assets/garden/Gravel_Patch_Raked_Sand.png', label: 'Gravel Patch', rarity: 'common' },
  { kind: 'garden', id: 'small-pond', img: '/assets/garden/Small_Pond.png', label: 'Small Pond', rarity: 'common' },
  // removed: wooden-bridge item per design
  { kind: 'garden', id: 'bamboo-fence', img: '/assets/garden/Bamboo_Fence.png', label: 'Bamboo Fence', rarity: 'common' },
  { kind: 'garden', id: 'moss-rock', img: '/assets/garden/Moss_Rock_Cluster.png', label: 'Moss Rock Cluster', rarity: 'common' },
  { kind: 'garden', id: 'torii-gate', img: P, label: 'Garden Gate (Torii)', rarity: 'common' },
  { kind: 'garden', id: 'low-shrub', img: '/assets/garden/low_shrub.png', label: 'Low Shrub', rarity: 'common' },
  { kind: 'garden', id: 'lamp-post', img: '/assets/garden/Paper_Lamp_Post.png', label: 'Paper Lamp Post', rarity: 'common' },
  { kind: 'garden', id: 'water-ladle', img: '/assets/garden/Water_Ladle_Stand_(Tsukubai).png', label: 'Water Ladle Stand', rarity: 'common' },
  { kind: 'garden', id: 'cherry-blossom-tree', img: P, label: 'Cherry Blossom Tree', rarity: 'common' },
  { kind: 'garden', id: 'lotus-pond', img: '/assets/garden/Lotus_pond.png', label: 'Lotus Pond', rarity: 'common' },
  { kind: 'garden', id: 'maple-tree', img: P, label: 'Maple Tree', rarity: 'common' },
  { kind: 'garden', id: 'snow-stone', img: '/assets/garden/snow_stone.png', label: 'Snow Stone', rarity: 'common' },
];

const RARE: RewardItem[] = [
  { kind: 'garden', id: 'spring-waterfall', img: '/assets/garden/spring_waterfall.png', label: 'Spring Waterfall', rarity: 'rare' },
  { kind: 'garden', id: 'bamboo-pavilion', img: P, label: 'Bamboo Pavilion', rarity: 'rare' },
  { kind: 'garden', id: 'harvest-rice-stack', img: '/assets/garden/harvest_rice_stack.png', label: 'Harvest Rice Stack', rarity: 'rare' },
  { kind: 'garden', id: 'ice-bridge', img: '/assets/garden/ice_bridge.png', label: 'Ice Bridge', rarity: 'rare' },
  { kind: 'garden', id: 'meditation-mat', img: '/assets/garden/meditation_mat.png', label: 'Meditation Mat', rarity: 'rare' },
  { kind: 'garden', id: 'stone-pagoda', img: '/assets/garden/stone_pagoda_small.png', label: 'Stone Pagoda', rarity: 'rare' },
  { kind: 'garden', id: 'bamboo-water-spout', img: '/assets/garden/bamboo_water_sprout_shishi_odoshi.png', label: 'Bamboo Water Spout', rarity: 'rare' },
  { kind: 'garden', id: 'zen-arch-gate', img: P, label: 'Zen Arch Gate', rarity: 'rare' },
];

const EPIC: RewardItem[] = [
  { kind: 'garden', id: 'lucky-carp', img: '/assets/garden/Giant_Lucky_Carp_Statue.png', label: 'Giant Lucky Carp Statue', rarity: 'epic' },
  { kind: 'garden', id: 'lazy-panda-hammock', img: '/assets/garden/lazy_panda_hammock.gif', label: 'Lazy Panda Hammock', rarity: 'epic' },
  { kind: 'garden', id: 'fox-spirit-shrine', img: P, label: 'Fox Spirit Shrine', rarity: 'epic' },
  { kind: 'garden', id: 'snowman-monk', img: P, label: 'Snowman Monk', rarity: 'epic' },
  { kind: 'garden', id: 'spirit-wind-chimes', img: P, label: 'Spirit Wind Chimes', rarity: 'epic' },
  { kind: 'garden', id: 'golden-koi-pond', img: '/assets/garden/Golden_Koi_Pond.gif', label: 'Golden Koi Pond', rarity: 'epic' },
  { kind: 'garden', id: 'mini-mt-fuji', img: '/assets/garden/Miniature_Mount_Fuji.png', label: 'Miniature Mount Fuji', rarity: 'epic' },
];

const LEGENDARY_NON_RELIC: RewardItem[] = [
  { kind: 'garden', id: 'eternal-bloom-sakura', img: P, label: 'Eternal Bloom Sakura', rarity: 'legendary' },
  { kind: 'garden', id: 'sun-spirit-fountain', img: '/assets/garden/Sun_spirit_fountain.gif', label: 'Sun Spirit Fountain', rarity: 'legendary' },
  { kind: 'garden', id: 'golden-leaf-whirlpool', img: '/assets/garden/golden_leaf_whirlpool.png', label: 'Golden Leaf Whirlpool', rarity: 'legendary' },
  { kind: 'garden', id: 'northern-light-lantern', img: '/assets/garden/Northern_light_lantern.png', label: 'Northern Light Lantern', rarity: 'legendary' },
  { kind: 'garden', id: 'dragon-fountain', img: '/assets/garden/Dragon_Fountain.gif', label: 'Dragon Fountain', rarity: 'legendary' },
  { kind: 'garden', id: 'eternal-sand-garden', img: P, label: 'Eternal Sand Garden', rarity: 'legendary' },
  { kind: 'garden', id: 'phoenix-perch', img: '/assets/garden/Phoenix_Perch.gif', label: 'Phoenix Perch', rarity: 'legendary' },
];

export const ALL_GARDEN_ITEMS: GardenStep[] = [
  ...COMMON,
  ...RARE,
  ...EPIC,
  ...LEGENDARY_NON_RELIC,
]
  .filter((it): it is RewardItem & { kind: 'garden' } => it.kind === 'garden')
  .map(({ id, img, label }) => ({ id, img, label }));


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
  const baseDist = getAllowedRarity(seconds);
  if (baseDist.length === 0) return null;

  // Determine current season
  const month = new Date().getMonth();
  const season: 'spring' | 'summer' | 'autumn' | 'winter' =
    month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';

  // Seasonal eligibility per item id
  const seasonalIds: Record<string, 'spring'|'summer'|'autumn'|'winter'> = {
    'cherry-blossom-tree': 'spring', 'spring-waterfall': 'spring', 'lucky-carp': 'spring', 'eternal-bloom-sakura': 'spring',
    'lotus-pond': 'summer', 'bamboo-pavilion': 'summer', 'lazy-panda-hammock': 'summer', 'sun-spirit-fountain': 'summer',
    'maple-tree': 'autumn', 'harvest-rice-stack': 'autumn', 'fox-spirit-shrine': 'autumn', 'golden-leaf-whirlpool': 'autumn',
    'snow-stone': 'winter', 'ice-bridge': 'winter', 'snowman-monk': 'winter', 'northern-light-lantern': 'winter',
  };

  // Build rarity pools with seasonal filtering (garden items only)
  const byRarity: Record<Rarity, RewardItem[]> = {
    common: COMMON.filter(p => !seasonalIds[p.id] || seasonalIds[p.id] === season),
    rare: RARE.filter(p => !seasonalIds[p.id] || seasonalIds[p.id] === season),
    epic: EPIC.filter(p => !seasonalIds[p.id] || seasonalIds[p.id] === season),
    legendary: LEGENDARY_NON_RELIC.filter(p => !seasonalIds[p.id] || seasonalIds[p.id] === season),
  };

  // Compute rarity weight multipliers from placed items (bonuses)
  const progress = loadProgress();
  const placedIds = progress.garden?.placed?.map(it => it.tokenId) || [];
  const rarityMultipliers: Record<Rarity, number> = { common: 1, rare: 1, epic: 1, legendary: 1 };
  // Example bonuses: flow-crystal gives +10% rare drops. Extend as needed.
  const RARITY_BONUS_BY_TOKEN: Record<string, Partial<Record<Rarity, number>>> = {
    'flow-crystal': { rare: 1.10 },
  };
  for (const tid of placedIds) {
    const bonus = RARITY_BONUS_BY_TOKEN[tid];
    if (!bonus) continue;
    for (const r of Object.keys(bonus) as Rarity[]) {
      rarityMultipliers[r] *= bonus[r] as number;
    }
  }

  // Apply bonuses and exclude empty rarities, then normalize to 100
  const weighted: Array<{ rarity: Rarity; weight: number }> = [];
  for (const { rarity, weight } of baseDist) {
    const pool = byRarity[rarity];
    if (!pool.length) continue; // seasonally ineligible
    const adjusted = weight * (rarityMultipliers[rarity] || 1);
    if (adjusted > 0) weighted.push({ rarity, weight: adjusted });
  }
  if (!weighted.length) return null;
  const sum = weighted.reduce((s, w) => s + w.weight, 0);
  const normalized = weighted.map(w => ({ rarity: w.rarity, weight: (w.weight / sum) * 100 }));

  const chosenRarity = weightedPick(normalized).rarity;
  const pool = byRarity[chosenRarity];
  const pick = pool[Math.floor(Math.random() * pool.length)];
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
