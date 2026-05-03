import { apiClient } from '../../core/api/client';

export type AuthIdentifier = { phone: string } | { email: string };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  profileComplete: boolean;
}

export const authApi = {
  async requestOtp(identifier: AuthIdentifier) {
    const { data } = await apiClient.post<{ challengeId: string }>(
      '/auth/otp/request',
      identifier,
    );
    return data;
  },

  async verifyOtp(challengeId: string, code: string) {
    const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
      '/auth/otp/verify',
      { challengeId, code },
    );
    return data;
  },

  async me() {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    return data;
  },

  async logout() {
    await apiClient.post('/auth/logout').catch(() => undefined);
  },
};
