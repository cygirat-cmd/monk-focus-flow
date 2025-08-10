export const GARDEN_COLS = 12;
export const GARDEN_ROWS = 8;
export const TILE_PX = 64; // visual reference

// Locked temple area: specific blocked tiles
export const isTileLocked = (x: number, y: number): boolean => {
  return (
    (x === 6 && (y === 2 || y === 3 || y === 4)) ||
    (x === 7 && (y === 2 || y === 3 || y === 4))
  );
};

export const defaultGardenBg = '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png';
