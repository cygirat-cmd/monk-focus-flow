import BottomNav from '@/components/layout/BottomNav';
import { analytics } from '@/utils/analytics';
import { useEffect } from 'react';

export default function FocusClub() {
  useEffect(() => { document.title = 'Focus Club – Monk'; }, []);

  const onCheckout = () => {
    analytics.track({ type: 'subscription_checkout_click' });
    // TODO: Integrate Stripe via Supabase Edge Functions
    window.alert('Checkout coming soon.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-xl font-semibold mb-2">Zenmodoro Focus Club</h1>
        <p className="text-sm text-muted-foreground mb-4">Monthly digital pack: focus cards, planner, wallpapers, audio.</p>

        <section className="rounded-xl border bg-card p-4 mb-4">
          <div className="aspect-[16/9] w-full rounded-md bg-background mb-3" />
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Printable focus cards (PDF)</li>
            <li>Weekly planner templates</li>
            <li>Ambient focus audio</li>
            <li>Minimalist wallpapers</li>
          </ul>
        </section>

        <button onClick={onCheckout} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold">Subscribe Monthly</button>
      </main>
      <BottomNav />
    </div>
  );
}
