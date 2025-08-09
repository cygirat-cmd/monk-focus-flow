import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import { loadProgress } from '@/utils/storage';
import { ProgressData } from '@/utils/storage';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function ZenPath() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress());

  useEffect(() => {
    document.title = 'Zen Path – Monk';
  }, []);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  return (
    <div className="path-screen bg-background text-foreground pb-20">
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <Link to="/" className="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Zen Path</h1>
          <p className="text-sm text-muted-foreground">
            Steps: {progress.currentPath.length} / {progress.pathLength}
          </p>
        </div>
      </header>

      <main className="p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-primary" size={18} />
            <span className="text-sm font-medium">Your Journey</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progress.currentPath.length / progress.pathLength) * 100}%` }}
            />
          </div>
        </div>

        <div className="path-grid">
          {Array.from({ length: progress.pathLength }).map((_, index) => {
            const step = progress.currentPath[index];
            const isEmpty = !step;
            
            return (
              <div
                key={index}
                className={`path-card flex-col ${
                  isEmpty 
                    ? '' 
                    : 'border-primary bg-card shadow-sm'
                }`}
              >
                  {step ? (
                    <>
                      <img 
                        src={step.img} 
                        alt={step.label}
                        className="w-12 h-12 object-contain mb-2"
                        onError={(e) => {
                          // Fallback for missing images
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-center px-2 text-muted-foreground">
                        {step.label}
                      </span>
                    </>
                  ) : (
                    <div className="text-muted-foreground/50">
                      <Sparkles size={24} />
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="mt-8">
          <Link 
            to="/treasure-hall"
            className="block w-full py-3 bg-primary text-primary-foreground rounded-lg text-center font-medium hover:opacity-90 transition-opacity"
          >
            View Treasure Hall
          </Link>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-card border">
          <h3 className="font-medium mb-2">Progress</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Sessions completed:</span>
              <span className="font-medium">{progress.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span>Relics collected:</span>
              <span className="font-medium">{progress.relics.length}</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}