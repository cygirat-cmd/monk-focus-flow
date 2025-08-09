import { useEffect, useRef, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { analytics } from '@/utils/analytics';

export default function Store() {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Store – Monk';
  }, []);

  useEffect(() => {
    // Placeholder Shopify Buy Button SDK loader
    const script = document.createElement('script');
    script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    // TODO: Initialize Shopify Buy Button using your shop domain and access token
  }, [ready]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">Focus Store</h1>
          <p className="text-sm text-muted-foreground">Curated tools for deep work</p>
        </header>

        <div className="grid grid-cols-2 gap-3" ref={containerRef}>
          {Array.from({ length: 6 }).map((_, i) => (
            <button key={i} className="rounded-lg border bg-card aspect-square p-3 text-left" onClick={() => analytics.track({ type: 'product_click', productId: `p${i}` })}>
              <div className="w-full h-24 rounded-md bg-background mb-2" />
              <div className="h-3 w-2/3 bg-muted rounded mb-1" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </button>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
