export type Fog = { cols: number; rows: number; revealed: Uint8Array };

export const makeFog = (cols: number, rows: number): Fog =>
  ({ cols, rows, revealed: new Uint8Array(cols * rows) });

export const fromSavedFog = (data: { cols: number; rows: number; revealed: number[] }): Fog => {
  const f = makeFog(data.cols, data.rows);
  data.revealed?.forEach((v, i) => {
    if (i < f.revealed.length) f.revealed[i] = v;
  });
  return f;
};

const idx = (x: number, y: number, f: Fog) => y * f.cols + x;

export const isRevealed = (x: number, y: number, f: Fog) => 
  x >= 0 && y >= 0 && x < f.cols && y < f.rows && f.revealed[idx(x, y, f)] === 1;

const reveal = (x: number, y: number, f: Fog) => { 
  if (x >= 0 && y >= 0 && x < f.cols && y < f.rows) {
    f.revealed[idx(x, y, f)] = 1; 
  }
};

// Cache for expensive radius calculations
const radiusCache = new Map<string, Array<{x: number, y: number}>();

function getRadiusPositions(r: number): Array<{x: number, y: number}> {
  const key = `radius_${r}`;
  if (radiusCache.has(key)) {
    return radiusCache.get(key)!;
  }
  
  const positions: Array<{x: number, y: number}> = [];
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) {
        positions.push({ x, y });
      }
    }
  }
  
  radiusCache.set(key, positions);
  return positions;
}

export function revealRadius(cx: number, cy: number, r: number, f: Fog) {
  const positions = getRadiusPositions(r);
  
  for (const {x, y} of positions) {
    const tx = cx + x;
    const ty = cy + y;
    if (tx >= 0 && ty >= 0 && tx < f.cols && ty < f.rows) {
      reveal(tx, ty, f);
    }
  }
}

export function initializeFogAroundMonk(monkTx: number, monkTy: number, f: Fog) {
  // Start with completely black fog
  f.revealed.fill(0);
  // Only reveal around monk's initial position with larger radius for better UX
  revealRadius(monkTx, monkTy, 4, f);
}
