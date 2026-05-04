import { apiClient } from '../../core/api/client';
import { DiscoveryCard, SwipeDirection } from './types';

interface BackendDiscoveryCandidate {
  userId: string;
  displayName: string;
  age: number;
  bio?: string;
  distance?: number;
  location?: { city?: string };
  interests?: string[];
  media?: Array<{ id: string; url: string; type: string; order?: number }>;
  isVerified?: boolean;
}

const normalizeCard = (candidate: BackendDiscoveryCandidate): DiscoveryCard => ({
  userId: candidate.userId,
  displayName: candidate.displayName,
  age: candidate.age,
  bio: candidate.bio ?? '',
  distanceKm: candidate.distance,
  city: candidate.location?.city,
  interests: candidate.interests ?? [],
  photos: (candidate.media ?? [])
    .filter((item) => item.type === 'profile_image')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({ id: item.id, url: item.url })),
  verified: Boolean(candidate.isVerified),
});

export const discoveryApi = {
  async fetchFeed(limit = 10) {
    const { data } = await apiClient.get<{ candidates: BackendDiscoveryCandidate[] }>('/discovery/feed', {
      params: { limit },
    });
    return data.candidates.map(normalizeCard);
  },

  async swipe(targetUserId: string, direction: SwipeDirection) {
    if (direction === 'pass') {
      return { matched: false };
    }

    const { data } = await apiClient.post<{ matched: boolean }>('/likes/', {
      targetUserId,
      type: direction === 'super' ? 'super_like' : 'like',
    });
    return data;
  },
};
