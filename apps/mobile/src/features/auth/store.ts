import { create } from 'zustand';
import { secureStorage } from '../../core/storage/secureStorage';
import { setUnauthorizedHandler } from '../../core/api/client';
import { authApi, AuthIdentifier, AuthUser } from './api';

type Status = 'unknown' | 'unauthenticated' | 'onboarding' | 'authenticated';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  pendingChallengeId: string | null;
  pendingIdentifier: AuthIdentifier | null;
  bootstrap: () => Promise<void>;
  requestOtp: (identifier: AuthIdentifier) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  setProfileComplete: (complete: boolean) => void;
  logout: () => Promise<void>;
}

const statusFor = (user: AuthUser): Status =>
  user.profileComplete ? 'authenticated' : 'onboarding';

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
      set({ status: statusFor(user), user });
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
      status: statusFor(result.user),
      user: result.user,
      pendingChallengeId: null,
      pendingIdentifier: null,
    });
  },

  setProfileComplete: (complete) => {
    const user = get().user;
    if (!user) return;
    const next = { ...user, profileComplete: complete };
    set({ user: next, status: statusFor(next) });
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
