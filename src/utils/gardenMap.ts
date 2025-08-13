export const GARDEN_COLS = 12;
export const GARDEN_ROWS = 8;
export const TILE_PX = 64; // visual reference

// Temple collisions removed per user request
export const isTileLocked = (x: number, y: number): boolean => {
  return false;
};

export const defaultGardenBg = '/lovable-uploads/54b5b4ae-8aa8-48b7-bca1-19ecbde2be2d.png';
