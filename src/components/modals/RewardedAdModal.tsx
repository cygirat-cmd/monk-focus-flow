import React, { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { ADS_CONFIG } from '@/utils/ads';

interface RewardedAdModalProps {
  open: boolean;
  onClose: () => void;
  onFinished: (watched: boolean) => void;
}

export default function RewardedAdModal({ open, onClose, onFinished }: RewardedAdModalProps) {
  const [watching, setWatching] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setWatching(false);
      setSecondsLeft(10);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const startWatching = () => {
    // Mock rewarded ad playback. For real web rewarded ads, switch provider in ADS_CONFIG
    setWatching(true);
    setSecondsLeft(10);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          setWatching(false);
          // grant on full watch
          onFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  if (!open) return null;

  const progress = ((10 - secondsLeft) / 10) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur">
      <div className="max-w-md mx-auto px-4 pt-12 pb-24">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Extra Daily Reward
        </h2>
        <p className="text-muted-foreground mb-6">
          Daily reward limit reached. Watch an ad to get another item.
        </p>

        {!watching ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              Provider: {ADS_CONFIG.provider.toUpperCase()} {ADS_CONFIG.provider === 'admob' ? `• App ID: ${ADS_CONFIG.admob?.appId} • Unit: ${ADS_CONFIG.admob?.rewardedUnitId}` : ''}
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium"
                onClick={startWatching}
              >
                Watch Ad
              </button>
              <button
                className="flex-1 py-3 rounded-lg bg-accent text-accent-foreground font-medium"
                onClick={() => { onFinished(false); onClose(); }}
              >
                No thanks
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-6">
            <div className="text-center mb-4">
              <div className="text-sm text-muted-foreground">Ad is playing…</div>
              <div className="text-3xl font-semibold tabular-nums mt-1">{secondsLeft}s</div>
            </div>
            <Progress value={progress} />
            <div className="mt-4 text-center text-xs text-muted-foreground">Please watch until the end to claim your reward.</div>
          </div>
        )}
      </div>
    </div>
  );
}
