import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GardenStep, Relic } from '@/utils/storage';
import { getRandomZenQuote } from '@/utils/zenData';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && mounted) {
      // Load Shopify script when modal opens
      const script = document.createElement('script');
      script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
      script.onload = () => {
        if ((window as any).ShopifyBuy) {
          initShopifyCarousel();
        }
      };
      document.head.appendChild(script);

      return () => {
        const existingScript = document.querySelector('script[src*="buy-button-storefront"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [open, mounted]);

  const initShopifyCarousel = () => {
    try {
      const client = (window as any).ShopifyBuy.buildClient({
        domain: 'zenmodoro.com',
        storefrontAccessToken: '657052401989'
      });
      
      const ui = (window as any).ShopifyBuy.UI.init(client);
      const targetElement = document.getElementById('winddown-recs');
      
      if (targetElement) {
        ui.createComponent('collection', {
          id: '657052401989',
          node: targetElement,
          options: {
            product: {
              buttonDestination: 'checkout',
              isButton: true
            },
            layout: 'carousel',
            carousel: true
          }
        });
      }
    } catch (error) {
      console.log('Shopify integration not available:', error);
    }
  };
  const isSessionComplete = mode === 'SessionComplete';
  const title = isSessionComplete ? 'Nice work.' : 'Time to breathe.';
  const subtitle = isSessionComplete 
    ? 'Take a breath. A short walk helps reset.' 
    : 'Take a mindful break.';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-screen h-[100svh] p-0 sm:max-w-none sm:rounded-none border-none bg-background overflow-y-auto">
        <div className="relative">
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
                    <img 
                      src={newGardenStep.img} 
                      alt={newGardenStep.label}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <p className="font-medium">Added to your path</p>
                      <p className="text-sm text-muted-foreground">{newGardenStep.label}</p>
                    </div>
                  </div>
                )}

                {newRelic && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <img 
                        src={newRelic.img} 
                        alt={newRelic.title}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
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

            {/* Shopify Recommendations */}
            <div className="rounded-xl border bg-card p-4 mb-6">
              <h2 className="font-semibold mb-3">Recommended</h2>
              <div id="winddown-recs" className="min-h-[120px] flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading recommendations...</div>
              </div>
            </div>

            <div className="flex gap-3">
              <a href="/store" className="flex-1 py-3 rounded-lg text-center bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Shop Focus Essentials
              </a>
              <button 
                onClick={onClose} 
                className="flex-1 py-3 rounded-lg text-center bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
