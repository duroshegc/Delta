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
  draft: ProfileDraft;
  load: () => Promise<void>;
  setDraft: (patch: ProfileDraft) => void;
  save: () => Promise<void>;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  saving: false,
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

  clear: () => set({ profile: null, draft: {}, loading: false, saving: false }),
}));
