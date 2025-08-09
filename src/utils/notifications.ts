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
