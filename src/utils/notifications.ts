export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export async function showLocalNotification(title: string, body?: string) {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await (reg as any).showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      } as any);
    } else if ('Notification' in window) {
      new Notification(title, { body });
    }
  } catch (e) {
    console.warn('Notification error', e);
  }
}

const DECAY_NOTIF_KEY = 'monk.lastDecayNotif';

/**
 * Show garden decay warning at most once per 24 hours.
 */
export function maybeShowGardenDecayNotification(stage?: 0 | 1 | 2) {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(DECAY_NOTIF_KEY) || 0);
    const dayMs = 24 * 60 * 60 * 1000;
    if (now - last < dayMs) return;
    if (stage === 1) {
      showLocalNotification('Your Zen Garden is getting thirsty…', 'Time to focus!');
      localStorage.setItem(DECAY_NOTIF_KEY, String(now));
    } else if (stage === 2) {
      showLocalNotification('Your garden has withered — revive it by focusing!', 'Complete 3 sessions to revive it.');
      localStorage.setItem(DECAY_NOTIF_KEY, String(now));
    }
  } catch {}
}
