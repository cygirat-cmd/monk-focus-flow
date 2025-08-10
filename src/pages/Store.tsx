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
    // Theme-aware styling overrides (best-effort; Shopify Buy Button may render in iframe)
    const style = document.createElement('style');
    style.textContent = `
      .shopify-buy__btn { background: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; border-radius: var(--radius); }
      .shopify-buy__product__title, .shopify-buy__product__price { color: hsl(var(--foreground)) !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [ready]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: 'url("/lovable-uploads/1fc15fd7-f361-44b2-8c64-4dc3673c5e9f.png")' }}>
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">Focus Store</h1>
          <p className="text-sm text-muted-foreground">Curated tools for deep work</p>
        </header>

        <div className="grid grid-cols-2 gap-3" ref={containerRef}>
          {Array.from({ length: 6 }).map((_, i) => (
            <button key={i} className="rounded-lg border border-border/40 bg-background/60 backdrop-blur aspect-square p-3 text-left" onClick={() => analytics.track({ type: 'product_click', productId: `p${i}` })}>
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
