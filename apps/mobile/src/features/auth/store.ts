import { create } from 'zustand';
import { secureStorage } from '../../core/storage/secureStorage';
import { setUnauthorizedHandler } from '../../core/api/client';
import { authApi, AuthIdentifier, AuthUser } from './api';

type Status = 'unknown' | 'unauthenticated' | 'authenticated';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  pendingChallengeId: string | null;
  pendingIdentifier: AuthIdentifier | null;
  bootstrap: () => Promise<void>;
  requestOtp: (identifier: AuthIdentifier) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,
  pendingChallengeId: null,
  pendingIdentifier: null,

  bootstrap: async () => {
    const token = await secureStorage.getAccessToken();
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const user = await authApi.me();
      set({ status: 'authenticated', user });
    } catch {
      await secureStorage.clear();
      set({ status: 'unauthenticated', user: null });
    }
  },

  requestOtp: async (identifier) => {
    const { challengeId } = await authApi.requestOtp(identifier);
    set({ pendingChallengeId: challengeId, pendingIdentifier: identifier });
  },

  verifyOtp: async (code) => {
    const challengeId = get().pendingChallengeId;
    if (!challengeId) throw new Error('No pending OTP challenge');
    const result = await authApi.verifyOtp(challengeId, code);
    await secureStorage.setTokens(result.accessToken, result.refreshToken);
    set({
      status: 'authenticated',
      user: result.user,
      pendingChallengeId: null,
      pendingIdentifier: null,
    });
  },

  logout: async () => {
    await authApi.logout();
    await secureStorage.clear();
    set({ status: 'unauthenticated', user: null });
  },
}));

setUnauthorizedHandler(() => {
  useAuthStore.setState({ status: 'unauthenticated', user: null });
});
