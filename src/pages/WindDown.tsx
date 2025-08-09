import BottomNav from '@/components/layout/BottomNav';
import { useEffect } from 'react';

export default function WindDown() {
  useEffect(() => {
    document.title = 'Wind Down – Monk';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-10">
        <h1 className="text-2xl font-semibold mb-2">Nice work.</h1>
        <p className="text-muted-foreground mb-6">Take a breath. A short walk helps reset.</p>

        <div className="rounded-xl border bg-card p-4 mb-6">
          <h2 className="font-semibold mb-2">Recommended</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-[160px] h-[120px] rounded-lg border bg-background flex items-center justify-center text-sm">
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <a href="/store" className="flex-1 py-3 rounded-lg text-center bg-primary text-primary-foreground">Shop Focus Essentials</a>
          <a href="/" className="flex-1 py-3 rounded-lg text-center bg-accent">Skip</a>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
