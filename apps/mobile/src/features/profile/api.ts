import { apiClient } from '../../core/api/client';
import { Profile, ProfileDraft } from './types';

export const profileApi = {
  async getMine() {
    const { data } = await apiClient.get<Profile>('/profiles/me');
    return data;
  },

  async update(patch: ProfileDraft) {
    const { data } = await apiClient.patch<Profile>('/profiles/me', patch);
    return data;
  },

  async uploadPhoto(uri: string, position: number) {
    const form = new FormData();
    form.append('position', String(position));
    form.append('file', {
      uri,
      name: `photo_${position}.jpg`,
      type: 'image/jpeg',
      // RN-style file blob — typed loosely on purpose
    } as unknown as Blob);
    const { data } = await apiClient.post<{ id: string; url: string; position: number }>(
      '/profiles/me/photos',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async removePhoto(photoId: string) {
    await apiClient.delete(`/profiles/me/photos/${photoId}`);
  },
};
