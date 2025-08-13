export type Fog = { cols: number; rows: number; revealed: Uint8Array };
export const makeFog = (cols: number, rows: number): Fog =>
  ({ cols, rows, revealed: new Uint8Array(cols * rows) });
const idx = (x: number, y: number, f: Fog) => y * f.cols + x;
export const isRevealed = (x: number, y: number, f: Fog) => f.revealed[idx(x, y, f)] === 1;
const reveal = (x: number, y: number, f: Fog) => { f.revealed[idx(x, y, f)] = 1; };
export function revealRadius(cx: number, cy: number, r: number, f: Fog) {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if (x < 0 || y < 0 || x >= f.cols || y >= f.rows) continue;
    const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r * r) reveal(x, y, f);
  }
}
