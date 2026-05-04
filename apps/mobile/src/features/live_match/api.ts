import { apiClient } from '../../core/api/client';
import { Env } from '../../core/config/env';
import { secureStorage } from '../../core/storage/secureStorage';

export interface LiveTicket {
  id: string;
  status: 'searching' | 'matched' | 'cancelled' | 'expired';
  sessionId?: string;
  expiresAt: string;
}

export interface LiveSession {
  id: string;
  sessionId: string;
  roomName: string;
  participants: string[];
  status: 'created' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'timeout';
  region: string;
  intent: string;
  interest?: string;
}

export interface LiveMatchResult {
  ticket: LiveTicket;
  session?: LiveSession;
}

export interface LiveKitToken {
  token: string;
  url: string;
  provider: string;
}

const idempotencyKey = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const liveMatchApi = {
  async search(interests: string[]) {
    const { data } = await apiClient.post<LiveMatchResult>('/live-match/search', {
      region: 'US',
      intent: 'serious',
      interests,
      idempotencyKey: idempotencyKey('live-search'),
    });
    return data;
  },

  async status(ticketId: string) {
    const { data } = await apiClient.get<LiveMatchResult>(`/live-match/status/${ticketId}`);
    return data;
  },

  async cancel(ticketId: string) {
    const { data } = await apiClient.post<LiveTicket>('/live-match/cancel', {
      ticketId,
      idempotencyKey: idempotencyKey('live-cancel'),
    });
    return data;
  },

  async createLiveKitToken(sessionId: string) {
    const { data } = await apiClient.post<LiveKitToken>('/livekit/token', { sessionId });
    return data;
  },

  async eventUrl(params: { ticketId?: string; sessionId?: string }) {
    const token = await secureStorage.getAccessToken();
    const url = new URL(Env.websocketUrl);
    if (token) url.searchParams.set('token', token);
    if (params.ticketId) url.searchParams.set('ticketId', params.ticketId);
    if (params.sessionId) url.searchParams.set('sessionId', params.sessionId);
    return url.toString();
  },
};
