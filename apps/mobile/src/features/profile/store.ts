import { create } from 'zustand';
import { profileApi } from './api';
import { Profile, ProfileDraft } from './types';
import { useAuthStore } from '../auth/store';

const REQUIRED_FIELDS: Array<keyof Profile> = [
  'displayName',
  'birthDate',
  'gender',
  'interestedIn',
  'intent',
];

const isComplete = (p: Profile | null): boolean => {
  if (!p) return false;
  for (const field of REQUIRED_FIELDS) {
    const v = p[field];
    if (v === null || v === undefined) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === 'string' && v.trim() === '') return false;
  }
  return true;
};

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  saving: boolean;
  uploadingPhoto: boolean;
  draft: ProfileDraft;
  load: () => Promise<void>;
  setDraft: (patch: ProfileDraft) => void;
  save: () => Promise<void>;
  uploadPhoto: (uri: string) => Promise<void>;
  removePhoto: (photoId: string) => Promise<void>;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  saving: false,
  uploadingPhoto: false,
  draft: {},

  load: async () => {
    set({ loading: true });
    try {
      const profile = await profileApi.getMine();
      set({ profile, draft: {} });
      useAuthStore.getState().setProfileComplete(isComplete(profile));
    } finally {
      set({ loading: false });
    }
  },

  setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),

  save: async () => {
    const draft = get().draft;
    if (Object.keys(draft).length === 0) return;
    set({ saving: true });
    try {
      const profile = await profileApi.update(draft);
      set({ profile, draft: {} });
      useAuthStore.getState().setProfileComplete(isComplete(profile));
    } finally {
      set({ saving: false });
    }
  },

  uploadPhoto: async (uri: string) => {
    const current = get().profile;
    const nextPosition = (current?.photos.length ?? 0);
    set({ uploadingPhoto: true });
    try {
      const photo = await profileApi.uploadPhoto(uri, nextPosition);
      const photos = [...(current?.photos ?? []), photo].sort((a, b) => a.position - b.position);
      const next = current ? { ...current, photos } : current;
      set({ profile: next });
      useAuthStore.getState().setProfileComplete(isComplete(next));
    } finally {
      set({ uploadingPhoto: false });
    }
  },

  removePhoto: async (photoId: string) => {
    await profileApi.removePhoto(photoId);
    const current = get().profile;
    if (!current) return;
    const next = { ...current, photos: current.photos.filter((p) => p.id !== photoId) };
    set({ profile: next });
    useAuthStore.getState().setProfileComplete(isComplete(next));
  },

  clear: () => set({ profile: null, draft: {}, loading: false, saving: false, uploadingPhoto: false }),
}));
