import { apiClient } from '../../core/api/client';

export interface UserPreferences {
  privacy: {
    showDistance: boolean;
  };
  notifications: {
    matches: boolean;
    messages: boolean;
    likes: boolean;
  };
}

export const settingsApi = {
  async getPreferences() {
    const { data } = await apiClient.get<UserPreferences>('/users/me/preferences');
    return data;
  },

  async updatePreferences(patch: Partial<UserPreferences>) {
    const { data } = await apiClient.patch<UserPreferences>('/users/me/preferences', patch);
    return data;
  },

  async deleteAccount(password: string) {
    await apiClient.delete('/users/me', {
      data: {
        password,
        confirmation: 'DELETE_MY_ACCOUNT',
      },
    });
  },
};
