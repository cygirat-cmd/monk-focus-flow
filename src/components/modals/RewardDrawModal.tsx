import { useEffect, useMemo, useRef, useState } from 'react';
import { RewardItem, drawReward, Rarity } from '@/utils/rewards';
import GardenPlacementModal from './GardenPlacementModal';
import { Sparkles } from 'lucide-react';


interface RewardDrawModalProps {
  open: boolean;
  seconds: number;
  onClose: () => void;
  onResult: (reward: RewardItem | null) => void;
}

const silhouettes = [
  '/assets/garden/stone_1.png',
  '/assets/garden/stone_2.png',
  '/assets/garden/lantern_1.png',
  '/assets/garden/bonsai_1.png',
  '/assets/relics/tea_bowl.png',
  '/assets/relics/fan.png',
  '/assets/relics/koan_scroll.png',
  '/assets/relics/hand_bell.png',
];

// Seasonal eligibility (for reveal highlighting only)
const seasonalIds: Record<string, 'spring'|'summer'|'autumn'|'winter'> = {
  'cherry-blossom-tree': 'spring',
  'spring-waterfall': 'spring',
  'lucky-carp': 'spring',
  'eternal-bloom-sakura': 'spring',
  'lotus-pond': 'summer',
  'bamboo-pavilion': 'summer',
  'lazy-panda-hammock': 'summer',
  'sun-spirit-fountain': 'summer',
  'maple-tree': 'autumn',
  'harvest-rice-stack': 'autumn',
  'fox-spirit-shrine': 'autumn',
  'golden-leaf-whirlpool': 'autumn',
  'snow-stone': 'winter',
  'ice-bridge': 'winter',
  'snowman-monk': 'winter',
  'northern-light-lantern': 'winter',
};

export default function RewardDrawModal({ open, seconds, onClose, onResult }: RewardDrawModalProps) {
  const [spinning, setSpinning] = useState(true);
  const [finalItem, setFinalItem] = useState<RewardItem | null>(null);
  const [idx, setIdx] = useState(0);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placedThisReward, setPlacedThisReward] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSpinning(true);
    setFinalItem(null);
    setPlacedThisReward(false);
    setIdx(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setIdx((i) => (i + 1) % silhouettes.length), 120);
    const t = window.setTimeout(() => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      const item = drawReward(seconds);
      setFinalItem(item);
      setSpinning(false);
      // rare reveal sound skipped for now
      onResult(item);
    }, 2000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); window.clearTimeout(t); };
  }, [open, seconds, onResult]);

  if (!open) return null;

  const glow = finalItem && finalItem.rarity === 'legendary';

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur">
      <div className="max-w-md mx-auto px-4 pt-12 pb-24">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2"><Sparkles className="text-primary" size={18}/> Reward Draw</h2>
        <p className="text-muted-foreground mb-6">Completing focus grants items for your Zen Garden.</p>

        <div className="rounded-xl border bg-card p-6 flex flex-col items-center gap-4">
          <div className={`w-40 h-40 rounded-lg border flex items-center justify-center ${glow ? 'shadow-[0_0_24px_hsl(var(--primary)/0.5)]' : ''}`}>
            {spinning && (
              <img src={silhouettes[idx]} alt="mystery" className="w-28 h-28 opacity-60 animate-spin blur-sm" />
            )}
              {!spinning && finalItem && (
                <div className={`${glow ? 'legendary-ring p-1' : ''}`}>
                  <img src={finalItem.kind === 'garden' ? finalItem.img : finalItem.img} alt={finalItem.kind === 'garden' ? finalItem.label : finalItem.title} className="w-32 h-32 object-contain" />
                </div>
              )}
            {!spinning && !finalItem && (
              <div className="text-sm text-muted-foreground">No reward for short sessions.</div>
            )}
          </div>
          {!spinning && finalItem && (
            <div className="text-center">
              <div className="text-sm uppercase tracking-wide text-muted-foreground">{finalItem.rarity}</div>
              <div className="font-medium">
                {finalItem.kind === 'garden' ? finalItem.label : finalItem.title}
              </div>
              {finalItem.description && (
                <div className="text-xs text-muted-foreground mt-1">{finalItem.description}</div>
              )}
              {finalItem.bonus && (
                <div className="text-xs mt-1">Bonus: <span className="font-medium">{finalItem.bonus}</span></div>
              )}
              {finalItem.kind === 'garden' && seasonalIds[finalItem.id] && (
                <div className="text-xs mt-1">Seasonal: <span className="font-medium capitalize">{seasonalIds[finalItem.id]}</span></div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {!spinning && finalItem && finalItem.kind === 'garden' && (
            <button className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium disabled:opacity-50" disabled={placedThisReward} onClick={() => setPlaceOpen(true)}>{placedThisReward ? 'Placed' : 'Place in Garden'}</button>
          )}
          <button className="flex-1 py-3 rounded-lg bg-accent text-accent-foreground font-medium" onClick={onClose}>Continue</button>
        </div>
      </div>

      {finalItem && finalItem.kind === 'garden' && (
        <GardenPlacementModal open={placeOpen} onClose={() => setPlaceOpen(false)} token={{ id: finalItem.id, img: finalItem.img, label: finalItem.label }} onPlaced={() => setPlacedThisReward(true)} />
      )}
    </div>
  );
}
