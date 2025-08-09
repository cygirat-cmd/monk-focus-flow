import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import { loadProgress } from '@/utils/storageClient';
import { ProgressData } from '@/utils/storageClient';
import { RELICS_POOL } from '@/utils/zenData';
import { ArrowLeft, Lock, Calendar } from 'lucide-react';

export default function TreasureHall() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress());

  useEffect(() => {
    document.title = 'Treasure Hall – Monk';
  }, []);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <Link to="/zen-path" className="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Treasure Hall</h1>
          <p className="text-sm text-muted-foreground">
            Relics collected: {progress.relics.length}
          </p>
        </div>
      </header>

      <main className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {RELICS_POOL.map((relic) => {
            const unlockedRelic = progress.relics.find(r => r.id === relic.id);
            const isUnlocked = !!unlockedRelic;

            return (
              <div
                key={relic.id}
                className={`relative aspect-square rounded-lg border-2 p-4 transition-all ${
                  isUnlocked 
                    ? 'border-primary bg-card shadow-md' 
                    : 'border-dashed border-border bg-card/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  {isUnlocked ? (
                    <>
                      <img 
                        src={relic.img} 
                        alt={relic.title}
                        className="w-16 h-16 object-contain mb-3"
                        onError={(e) => {
                          // Fallback for missing images
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <h3 className="font-medium text-center text-sm mb-1">
                        {relic.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        <span>{formatDate(unlockedRelic.unlockedAt)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                        <Lock size={24} className="text-muted-foreground/50" />
                      </div>
                      <h3 className="font-medium text-center text-sm text-muted-foreground">
                        ???
                      </h3>
                      <p className="text-xs text-muted-foreground/70 text-center mt-1">
                        Complete path to unlock
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {progress.relics.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground/50 mb-4">
              <Lock size={48} className="mx-auto" />
            </div>
            <h3 className="font-medium mb-2">No relics yet</h3>
            <p className="text-sm text-muted-foreground">
              Complete your first zen path to unlock your first relic
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}