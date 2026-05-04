import { apiClient } from '../../core/api/client';
import { ChatMessage, MatchHeader, MatchSummary } from './types';

export const matchesApi = {
  async list() {
    const { data } = await apiClient.get<{ matches: MatchSummary[] }>('/matches');
    return data.matches;
  },

  async messages(matchId: string, before?: string) {
    const { data } = await apiClient.get<{ messages: ChatMessage[] }>(
      `/matches/${matchId}/messages`,
      { params: { before } },
    );
    return data.messages;
  },

  async sendMessage(matchId: string, text: string) {
    const { data } = await apiClient.post<ChatMessage>(`/matches/${matchId}/messages`, { text });
    return data;
  },

  async getMatch(matchId: string) {
    const { data } = await apiClient.get<MatchHeader>(`/matches/${matchId}`);
    return data;
  },

  async unmatch(matchId: string) {
    await apiClient.delete(`/matches/${matchId}`);
  },
};
