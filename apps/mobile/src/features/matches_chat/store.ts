import { create } from 'zustand';
import { matchesApi } from './api';
import { ChatMessage, MatchHeader, MatchSummary } from './types';
import { USE_FIXTURES, fixtureHeaders, fixtureMatches, fixtureMessages } from './fixtures';

interface MatchesState {
  matches: MatchSummary[];
  messagesByMatch: Record<string, ChatMessage[]>;
  headersByMatch: Record<string, MatchHeader>;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  loadMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, text: string) => Promise<void>;
}

export const useMatchesStore = create<MatchesState>((set, get) => ({
  matches: [],
  messagesByMatch: {},
  headersByMatch: {},
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      if (USE_FIXTURES) {
        set({ matches: fixtureMatches, headersByMatch: fixtureHeaders });
      } else {
        const [matches, headersByMatch] = await Promise.all([
          matchesApi.list(),
          matchesApi.listHeaders(),
        ]);
        set({ matches, headersByMatch });
      }
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? err.message ?? 'Failed to load matches' });
    } finally {
      set({ loading: false });
    }
  },

  loadMessages: async (matchId) => {
    if (USE_FIXTURES) {
      set({
        messagesByMatch: {
          ...get().messagesByMatch,
          [matchId]: fixtureMessages[matchId] ?? [],
        },
      });
      return;
    }
    const messages = await matchesApi.messages(matchId);
    set({ messagesByMatch: { ...get().messagesByMatch, [matchId]: messages } });
  },

  sendMessage: async (matchId, text) => {
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      matchId,
      sender: 'me',
      text,
      sentAt: new Date().toISOString(),
    };
    const prev = get().messagesByMatch[matchId] ?? [];
    set({ messagesByMatch: { ...get().messagesByMatch, [matchId]: [...prev, optimistic] } });
    if (USE_FIXTURES) return;
    try {
      const real = await matchesApi.sendMessage(matchId, text);
      set({
        messagesByMatch: {
          ...get().messagesByMatch,
          [matchId]: [...prev, real],
        },
      });
    } catch (err) {
      set({ messagesByMatch: { ...get().messagesByMatch, [matchId]: prev } });
      throw err;
    }
  },
}));
