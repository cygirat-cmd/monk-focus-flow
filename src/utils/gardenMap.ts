export const GARDEN_COLS = 32;
export const GARDEN_ROWS = 32;
export const TILE_PX = 64; // visual reference

// Locked temple area: specific blocked tiles (scaled for 32x32 grid)
export const isTileLocked = (x: number, y: number): boolean => {
  return (
    (x >= 13 && x <= 16 && y >= 3 && y <= 5)
  );
};

export const defaultGardenBg = '/lovable-uploads/54b5b4ae-8aa8-48b7-bca1-19ecbde2be2d.png';
