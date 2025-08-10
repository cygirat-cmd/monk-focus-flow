let bg: HTMLAudioElement | null = null;
let rare: HTMLAudioElement | null = null;
let end: HTMLAudioElement | null = null;

export function initAudio() {
  try {
    if (!bg) bg = new Audio('/assets/audio/bg.mp3');
    if (!rare) rare = new Audio('/assets/audio/rare_drop.mp3');
    if (!end) end = new Audio('/assets/audio/timer_end.mp3');
    if (bg) { bg.loop = true; bg.volume = 0.3; }
  } catch {}
}

export function playBg(loop = true) {
  try { initAudio(); if (bg) { bg.loop = loop; bg.play().catch(() => {}); } } catch {}
}
export function stopBg() { try { if (bg) bg.pause(); } catch {} }
export function playRare() { try { initAudio(); rare?.play().catch(() => {}); } catch {} }
export function playEnd() { try { initAudio(); end?.play().catch(() => {}); } catch {} }
