import { apiClient } from '../../core/api/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  profileComplete: boolean;
  role?: string;
}

interface BackendAuthUser {
  id: string;
  email?: string;
  role?: string;
  profileComplete?: boolean;
}

interface BackendProfileSummary {
  displayName?: string;
  dateOfBirth?: string;
  gender?: string | null;
  intent?: string | null;
  lookingFor?: string[];
}

const hasOnboardingProfile = (profile: BackendProfileSummary | null): boolean =>
  Boolean(
    profile?.displayName &&
      profile.dateOfBirth &&
      profile.gender &&
      profile.intent &&
      profile.lookingFor?.length,
  );

const normalizeUser = (user: BackendAuthUser, profileComplete?: boolean): AuthUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
  profileComplete: profileComplete ?? Boolean(user.profileComplete),
});

export const authApi = {
  async signIn(email: string, password: string) {
    const { data } = await apiClient.post<AuthTokens & { user: BackendAuthUser }>(
      '/auth/signin',
      { email, password },
    );
    return { ...data, user: normalizeUser(data.user) };
  },

  async signUp(email: string, password: string, name?: string) {
    const { data } = await apiClient.post<AuthTokens & { user: BackendAuthUser }>(
      '/auth/signup',
      { email, password, name },
    );
    return { ...data, user: normalizeUser(data.user) };
  },

  async me() {
    const { data } = await apiClient.get<{ user: BackendAuthUser }>('/auth/session');
    const profile = await apiClient
      .get<BackendProfileSummary | null>('/profiles/me')
      .then((response) => response.data)
      .catch(() => null);
    return normalizeUser(data.user, hasOnboardingProfile(profile));
  },

  async logout() {
    await apiClient.post('/auth/signout').catch(() => undefined);
  },
};
