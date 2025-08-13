import { GardenStep, Relic } from '@/utils/storageClient';
import { X, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

type WindDownMode = 'SessionComplete' | 'BreakStart';

interface WindDownModalProps {
  open: boolean;
  onClose: () => void;
  mode?: WindDownMode;
  newGardenStep?: GardenStep;
  newRelic?: Relic;
  zenQuote?: string;
}

export default function WindDownModal({ 
  open, 
  onClose, 
  mode = 'SessionComplete',
  newGardenStep,
  newRelic,
  zenQuote
}: WindDownModalProps) {
  const [mounted, setMounted] = useState(false);
    const [placed, setPlaced] = useState(false);
    useEffect(() => { if (newGardenStep) setPlaced(true); }, [newGardenStep]);

  // Shopify Storefront API fetch
  type Product = {
    id: string;
    title: string;
    handle: string;
    image: string | null;
    price: string;
    descriptionHtml: string;
  };
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    setLoadingProducts(true);
    const SHOP_DOMAIN = 'zenmodoro.myshopify.com';
    const STOREFRONT_TOKEN = '7fc2675aef49f4108fbea719cfcd10d6';
    const API_URL = `https://${SHOP_DOMAIN}/api/2024-07/graphql.json`;
    const query = `#graphql\n      query Products {\n        products(first: 6) {\n          edges { node { id title handle descriptionHtml images(first: 3) { edges { node { url altText } } } priceRange { minVariantPrice { amount currencyCode } } } }\n        }\n      }\n    `;
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((json) => {
        const nodes = (json?.data?.products?.edges || []).map((e: any) => e.node);
        const mapped: Product[] = nodes.map((n: any) => ({
          id: n.id,
          title: n.title,
          handle: n.handle,
          descriptionHtml: n.descriptionHtml,
          image: n.images?.edges?.[0]?.node?.url || null,
          price: `${n.priceRange?.minVariantPrice?.amount} ${n.priceRange?.minVariantPrice?.currencyCode}`,
        }));
        setProducts(mapped);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [open, mounted]);


  if (!open) return null;

  const isSessionComplete = mode === 'SessionComplete';
  const title = isSessionComplete ? 'Nice work.' : 'Time to breathe.';
  const subtitle = isSessionComplete 
    ? 'Take a breath. A short walk helps reset.' 
    : 'Take a mindful break.';

  return (
    <div className="fixed inset-0 z-50 w-screen h-[100svh] p-0 bg-background/95 backdrop-blur">
      <div className="relative w-full h-full overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
        >
          <X size={20} />
        </button>

        <main className="mx-auto max-w-md px-4 pt-12 pb-24">
          <h1 className="text-2xl font-semibold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">{subtitle}</p>

          {/* Progress Display */}
          {isSessionComplete && (newGardenStep || newRelic) && (
            <div className="rounded-xl border bg-card p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-primary" size={18} />
                <h2 className="font-semibold">Progress Update</h2>
              </div>
              {newGardenStep && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <img src={newGardenStep.img} alt={newGardenStep.label} className="w-12 h-12 object-contain" />
                  <div>
                    <p className="font-medium">Added to your path</p>
                    <p className="text-sm text-muted-foreground">{newGardenStep.label}</p>
                  </div>
                </div>
              )}
              {newRelic && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <img src={newRelic.img} alt={newRelic.title} className="w-12 h-12 object-contain" />
                    <div>
                      <p className="font-medium">Relic unlocked!</p>
                      <p className="text-sm text-muted-foreground">{newRelic.title}</p>
                    </div>
                  </div>
                  {zenQuote && (
                    <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                      <p className="text-sm italic text-muted-foreground">"{zenQuote}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="rounded-xl border bg-card p-4 mb-6">
            <h2 className="font-semibold mb-3">Recommended</h2>
            {loadingProducts && (
              <div className="min-h-[120px] flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading recommendations...</div>
              </div>
            )}
            {!loadingProducts && products.length > 0 && (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  {products[0].image && (
                    <img src={products[0].image} alt={products[0].title} className="w-20 h-20 object-cover rounded-md" />
                  )}
                  <div>
                    <div className="font-semibold leading-tight">{products[0].title}</div>
                    <div className="text-sm text-muted-foreground">{products[0].price}</div>
                  </div>
                </div>
                <article className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: products[0].descriptionHtml }} />
                <div className="mt-3 flex justify-end">
                  <a href={`https://zenmodoro.myshopify.com/products/${products[0].handle}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">View on store</a>
                </div>
                {products.length > 1 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {products.slice(1, 5).map((p) => (
                      <a key={p.id} href={`https://zenmodoro.myshopify.com/products/${p.handle}`} target="_blank" rel="noreferrer" className="rounded-lg border border-border/40 glass-panel p-2 hover:opacity-90 transition">
                        {p.image && <img src={p.image} alt={p.title} className="w-full h-24 object-cover rounded" />}
                        <div className="mt-2 text-xs font-medium line-clamp-2">{p.title}</div>
                        <div className="text-[10px] text-muted-foreground">{p.price}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!loadingProducts && products.length === 0 && (
              <div className="text-sm text-muted-foreground">No recommendations right now.</div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isSessionComplete && newGardenStep && placed && (
              <div className="w-full py-3 rounded-lg text-center bg-secondary text-secondary-foreground font-medium">
                Added to collection
              </div>
            )}
            <div className="flex gap-3">
              <a href="/store" className="flex-1 py-3 rounded-lg text-center bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Shop Focus Essentials
              </a>
              <button onClick={onClose} className="flex-1 py-3 rounded-lg text-center bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">
                Continue
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
