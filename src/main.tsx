import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { loadProgress, saveProgress } from '@/utils/storageClient'
import { scheduleDailyReminder } from '@/utils/reminders'

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Decay check on open: notify based on previous stage once per day, then mark opened
try {
    const p = loadProgress();
    p.lastOpenedAt = Date.now();
    saveProgress(p);
} catch {}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
    // Schedule daily reminder after SW is ready
    try { scheduleDailyReminder(); } catch {}
  });
}

// Handle Add to Home Screen prompt capture
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Expose globally for Settings page to trigger
  (window as any).monkA2HS = {
    prompt: async () => {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return outcome;
    }
  };
});
