// A high-precision timer worker that avoids setInterval drift by using timestamps

let endAt = 0; // ms epoch
let running = false;
let rafId: number | null = null;

function tick() {
  if (!running) return;
  const now = Date.now();
  const remaining = Math.max(0, endAt - now);
  (self as any).postMessage({ type: 'tick', remaining });
  if (remaining <= 0) {
    running = false;
    (self as any).postMessage({ type: 'done' });
    return;
  }
  // Use setTimeout with small delay; worker timers are reasonably accurate
  setTimeout(tick, 200);
}

(self as any).onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  switch (type) {
    case 'start': {
      const { durationMs } = payload; // if null => flowtime
      if (durationMs == null) {
        running = true;
        endAt = Number.MAX_SAFE_INTEGER; // effectively infinite
        tick();
      } else {
        endAt = Date.now() + durationMs;
        running = true;
        tick();
      }
      break;
    }
    case 'stop': {
      running = false;
      (self as any).postMessage({ type: 'stopped' });
      break;
    }
    default:
      break;
  }
};
