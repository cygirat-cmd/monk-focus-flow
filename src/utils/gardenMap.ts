export const GARDEN_COLS = 12;
export const GARDEN_ROWS = 8;
export const TILE_PX = 32; // visual reference

// Locked temple area: specific blocked tiles
export const isTileLocked = (x: number, y: number): boolean => {
  return (
    (x === 5 && (y === 1 || y === 2 || y === 3)) ||
    (x === 6 && (y === 1 || y === 2 || y === 3))
  );
};

export const defaultGardenBg = '/lovable-uploads/54b5b4ae-8aa8-48b7-bca1-19ecbde2be2d.png';
