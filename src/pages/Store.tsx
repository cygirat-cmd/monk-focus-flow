import { useEffect, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';

const SHOP_DOMAIN = 'zenmodoro.myshopify.com';
const STOREFRONT_TOKEN = '7fc2675aef49f4108fbea719cfcd10d6';
const API_URL = `https://${SHOP_DOMAIN}/api/2024-07/graphql.json`;

interface ProductNode {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  images: { edges: { node: { url: string; altText: string | null } }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
}

interface Product {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  image: string | null;
  price: string;
}

async function fetchProducts(): Promise<Product[]> {
  const query = `#graphql
    query Products {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            descriptionHtml
            images(first: 4) { edges { node { url altText } } }
            priceRange { minVariantPrice { amount currencyCode } }
          }
        }
      }
    }
  `;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const nodes: ProductNode[] = json?.data?.products?.edges?.map((e: any) => e.node) || [];
  return nodes.map((n) => ({
    id: n.id,
    title: n.title,
    handle: n.handle,
    descriptionHtml: n.descriptionHtml,
    image: n.images?.edges?.[0]?.node?.url || null,
    price: `${n.priceRange.minVariantPrice.amount} ${n.priceRange.minVariantPrice.currencyCode}`,
  }));
}

export default function Store() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    document.title = 'Store – Monk';
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchProducts();
        if (mounted) {
          setProducts(items);
          setError(null);
        }
      } catch (e: any) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: 'url("/lovable-uploads/1fc15fd7-f361-44b2-8c64-4dc3673c5e9f.png")' }}>
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">Focus Store</h1>
          <p className="text-sm text-muted-foreground">Curated tools for deep work</p>
        </header>

        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/40 glass-panel aspect-square p-3" />
            ))}
          </div>
        )}
        {error && <div className="p-3 rounded-lg border bg-accent/20 text-accent-foreground text-sm">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <button key={p.id} className="rounded-lg border border-border/40 glass-panel aspect-square p-3 text-left hover:opacity-90 transition" onClick={() => setSelected(p)}>
                <div className="w-full h-24 rounded-md bg-background mb-2 overflow-hidden">
                  {p.image && (
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="text-sm font-medium line-clamp-1">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.price}</div>
              </button>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative max-w-md mx-auto h-full p-4 flex items-end sm:items-center">
            <div className="w-full rounded-t-2xl sm:rounded-xl glass-panel p-4 shadow-lg max-h-[85vh] overflow-y-auto">
              <div className="flex items-start gap-3 mb-3">
                {selected.image && (
                  <img src={selected.image} alt={selected.title} className="w-20 h-20 object-cover rounded-md" />
                )}
                <div>
                  <h2 className="text-lg font-semibold leading-tight">{selected.title}</h2>
                  <div className="text-sm text-muted-foreground">{selected.price}</div>
                </div>
              </div>
              <article className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: selected.descriptionHtml }} />
              <div className="mt-4 flex justify-end">
                <a href={`https://${SHOP_DOMAIN}/products/${selected.handle}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">View on store</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
