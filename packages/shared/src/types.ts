export interface Fish {
  id: string;
  r2Key: string;
  fingerprint: string;
  createdAt: number;
  expiresAt: number;
  x: number;
  y: number;
  rotation: number;
  shapeType: string;
  textLabel?: string;
  textColor?: string;
}

export interface FishResponse {
  fish: Fish[];
}

export interface AddFishRequest {
  fingerprint: string;
  shapeType: string;
  textLabel?: string;
  textColor?: string;
}

export interface RateLimitResponse {
  allowed: boolean;
  remainingSeconds: number;
}
