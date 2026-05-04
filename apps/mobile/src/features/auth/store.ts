import { create } from 'zustand';
import { secureStorage } from '../../core/storage/secureStorage';
import { setUnauthorizedHandler } from '../../core/api/client';
import { authApi, AuthUser } from './api';

type Status = 'unknown' | 'unauthenticated' | 'onboarding' | 'authenticated';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  setProfileComplete: (complete: boolean) => void;
  logout: () => Promise<void>;
}

const statusFor = (user: AuthUser): Status =>
  user.profileComplete ? 'authenticated' : 'onboarding';

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,

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

  signIn: async (email, password) => {
    const result = await authApi.signIn(email, password);
    await secureStorage.setTokens(result.accessToken, result.refreshToken);
    const user = await authApi.me().catch(() => result.user);
    set({
      status: statusFor(user),
      user,
    });
  },

  signUp: async (email, password, name) => {
    const result = await authApi.signUp(email, password, name);
    await secureStorage.setTokens(result.accessToken, result.refreshToken);
    const user = await authApi.me().catch(() => result.user);
    set({
      status: statusFor(user),
      user,
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
