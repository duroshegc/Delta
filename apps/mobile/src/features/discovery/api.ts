import { apiClient } from '../../core/api/client';
import { DiscoveryCard, SwipeDirection } from './types';

export const discoveryApi = {
  async fetchFeed(limit = 10) {
    const { data } = await apiClient.get<{ cards: DiscoveryCard[] }>('/discovery/feed', {
      params: { limit },
    });
    return data.cards;
  },

  async swipe(targetUserId: string, direction: SwipeDirection) {
    const { data } = await apiClient.post<{ matched: boolean }>('/discovery/swipe', {
      targetUserId,
      direction,
    });
    return data;
  },
};
