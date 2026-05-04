export interface DiscoveryCard {
  userId: string;
  displayName: string;
  age: number;
  bio: string;
  distanceKm?: number;
  city?: string;
  interests: string[];
  photos: { id: string; url: string }[];
  verified: boolean;
}

export type SwipeDirection = 'like' | 'pass' | 'super';
