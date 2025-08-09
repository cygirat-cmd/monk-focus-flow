type AnalyticsEvent =
  | { type: 'session_start'; minutes?: number; mode: 'fixed' | 'flow' }
  | { type: 'session_stop'; completed: boolean }
  | { type: 'task_added' }
  | { type: 'product_click'; productId?: string }
  | { type: 'subscription_checkout_click' };

export const analytics = {
  track: (event: AnalyticsEvent) => {
    // Stub: replace with your analytics provider later
    console.log('[analytics]', event);
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: 'monk_event', ...event });
  },
};
