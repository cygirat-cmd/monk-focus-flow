import { loadSettings } from '@/utils/storageClient';
import { showLocalNotification } from '@/utils/notifications';

export function scheduleDailyReminder() {
  try {
    const s = loadSettings() as any;
    if (!s || s.notifications === false) return;
    const hour: number = typeof s.reminderHour === 'number' ? s.reminderHour : 9;
    const minute: number = typeof s.reminderMinute === 'number' ? s.reminderMinute : 0;

    const now = new Date();
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);

    const delay = Math.max(0, next.getTime() - now.getTime());
    window.setTimeout(async () => {
      try {
        await showLocalNotification('Time for your focus session — keep your Zen Garden alive!');
      } catch {}
      // Reschedule for the next day
      scheduleDailyReminder();
    }, Math.min(delay, 24 * 60 * 60 * 1000));
  } catch {}
}
