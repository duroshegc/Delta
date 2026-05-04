import { create } from 'zustand';
import { discoveryApi } from './api';
import { DiscoveryCard, SwipeDirection } from './types';

interface DiscoveryState {
  cards: DiscoveryCard[];
  loading: boolean;
  error: string | null;
  lastMatch: DiscoveryCard | null;
  load: () => Promise<void>;
  swipe: (direction: SwipeDirection) => Promise<{ matched: boolean } | null>;
  dismissMatch: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  cards: [],
  loading: false,
  error: null,
  lastMatch: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const cards = await discoveryApi.fetchFeed();
      set({ cards });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? err.message ?? 'Failed to load' });
    } finally {
      set({ loading: false });
    }
  },

  swipe: async (direction) => {
    const top = get().cards[0];
    if (!top) return null;
    // Optimistic pop.
    set({ cards: get().cards.slice(1) });
    try {
      const result = await discoveryApi.swipe(top.userId, direction);
      if (result.matched) set({ lastMatch: top });
      // Re-fill feed when running low.
      if (get().cards.length <= 2) get().load();
      return result;
    } catch (err) {
      // Re-insert on failure so the user can retry.
      set({ cards: [top, ...get().cards] });
      throw err;
    }
  },

  dismissMatch: () => set({ lastMatch: null }),
}));
