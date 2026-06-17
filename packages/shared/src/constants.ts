export const MAX_FISH = 100;
export const FISH_LIFESPAN_MS = 5 * 60 * 1000;
export const FISH_COOLDOWN_MS = 4 * 60 * 60 * 1000;
export const FISH_POLL_INTERVAL_MS = 15 * 1000;
export const FISH_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const TEXT_FISH_MAX_LENGTH = 12;
export const FISH_SHAPE_TYPES = [
  "classic",
  "puffer",
  "shark",
  "ray",
  "angelfish",
  "blob",
  "long",
  "round",
] as const;
export type FishShapeType = (typeof FISH_SHAPE_TYPES)[number];
