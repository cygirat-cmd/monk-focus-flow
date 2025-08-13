export type Fog = { cols: number; rows: number; revealed: Uint8Array };

export const makeFog = (cols: number, rows: number): Fog =>
  ({ cols, rows, revealed: new Uint8Array(cols * rows) });

export type SavedFog = { cols: number; rows: number; revealed: number[] };

export const fromSavedFog = (saved: SavedFog): Fog => ({
  cols: saved.cols,
  rows: saved.rows,
  revealed: Uint8Array.from(saved.revealed),
});

const idx = (x: number, y: number, f: Fog) => y * f.cols + x;

export const isRevealed = (x: number, y: number, f: Fog) => 
  x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.revealed[idx(x, y, f)] === 1;

const reveal = (x: number, y: number, f: Fog) => { 
  if (x >= 0 && y >= 0 && x < f.cols && y < f.rows) {
    f.revealed[idx(x, y, f)] = 1; 
  }
};

export function revealRadius(cx: number, cy: number, r: number, f: Fog) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= f.cols || y >= f.rows) continue;
      const dx = x - cx, dy = y - cy; 
      if (dx * dx + dy * dy <= r * r) reveal(x, y, f);
    }
  }
}

export function initializeFogAroundMonk(monkTx: number, monkTy: number, f: Fog) {
  // Start with completely black fog
  f.revealed.fill(0);
  // Only reveal around monk's initial position
  revealRadius(monkTx, monkTy, 3, f);
}
