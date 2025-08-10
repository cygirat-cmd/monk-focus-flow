export const GARDEN_COLS = 12;
export const GARDEN_ROWS = 8;
export const TILE_PX = 64; // visual reference

// Locked temple area: center 3x3 tiles (x:5-7, y:3-5) in a 12x8 grid
export const isTileLocked = (x: number, y: number): boolean => {
  return x >= 5 && x <= 7 && y >= 3 && y <= 5;
};

export const defaultGardenBg = '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png';
