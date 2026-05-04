import { apiClient } from '../../core/api/client';
import { DatingIntent, Gender, Profile, ProfileDraft, ProfilePhoto } from './types';

type BackendGender = 'male' | 'female' | 'non-binary' | 'other';
type BackendIntent = 'serious' | 'casual' | 'friendship' | 'networking';

interface BackendProfile {
  id?: string;
  userId?: string;
  displayName?: string;
  dateOfBirth?: string;
  birthDate?: string;
  gender?: BackendGender | null;
  bio?: string;
  location?: { coordinates?: [number, number] };
  city?: string;
  intent?: BackendIntent | null;
  lookingFor?: BackendGender[];
  ageRange?: { min: number; max: number };
  maxDistance?: number;
  interests?: string[];
  prompts?: Profile['prompts'];
  photos?: Array<string | ProfilePhoto>;
  verificationStatus?: string;
}

interface MediaItem {
  id: string;
  url: string;
  mediaType: string;
  createdAt?: string;
}

interface UploadAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

interface ImageKitUploadResult {
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  fileType?: string;
  size: number;
  width?: number;
  height?: number;
}

const toBackendGender = (gender: Gender | null | undefined): BackendGender | undefined => {
  if (!gender) return undefined;
  return gender === 'nonbinary' ? 'non-binary' : gender;
};

const toMobileGender = (gender: BackendGender | null | undefined): Gender | null => {
  if (!gender) return null;
  return gender === 'non-binary' ? 'nonbinary' : gender;
};

const toBackendDateOfBirth = (birthDate: string | undefined): string | undefined => {
  if (!birthDate) return undefined;
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const normalizePhotos = (
  media: MediaItem[],
  profilePhotos?: Array<string | ProfilePhoto>,
): ProfilePhoto[] => {
  const mediaPhotos = media
    .filter((item) => item.mediaType === 'profile_image')
    .map((item, index) => ({ id: item.id, url: item.url, position: index }));

  if (mediaPhotos.length > 0) return mediaPhotos;

  return (profilePhotos ?? [])
    .filter((photo): photo is ProfilePhoto => typeof photo !== 'string' && Boolean(photo.url))
    .map((photo, index) => ({ ...photo, position: photo.position ?? index }));
};

const normalizeProfile = (profile: BackendProfile | null, media: MediaItem[] = []): Profile | null => {
  if (!profile) return null;
  const [lng, lat] = profile.location?.coordinates ?? [];
  return {
    userId: profile.userId ?? profile.id ?? '',
    displayName: profile.displayName ?? '',
    birthDate: (profile.dateOfBirth ?? profile.birthDate ?? '').slice(0, 10),
    gender: toMobileGender(profile.gender),
    interestedIn: (profile.lookingFor ?? []).map(toMobileGender).filter(Boolean) as Gender[],
    intent: profile.intent ?? null,
    bio: profile.bio ?? '',
    interests: profile.interests ?? [],
    photos: normalizePhotos(media, profile.photos),
    prompts: profile.prompts ?? [],
    verified: profile.verificationStatus === 'verified',
    location: {
      city: profile.city,
      lat,
      lng,
    },
    preferences: {
      ageMin: profile.ageRange?.min ?? 18,
      ageMax: profile.ageRange?.max ?? 100,
      distanceKm: profile.maxDistance ?? 50,
      genders: (profile.lookingFor ?? []).map(toMobileGender).filter(Boolean) as Gender[],
    },
  };
};

const toBackendProfilePatch = (draft: ProfileDraft) => ({
  displayName: draft.displayName,
  dateOfBirth: toBackendDateOfBirth(draft.birthDate),
  gender: toBackendGender(draft.gender),
  bio: draft.bio,
  intent: draft.intent,
  lookingFor: draft.interestedIn?.map(toBackendGender).filter(Boolean),
  interests: draft.interests,
  prompts: draft.prompts,
  ageRange: draft.preferences
    ? { min: draft.preferences.ageMin, max: draft.preferences.ageMax }
    : undefined,
  maxDistance: draft.preferences?.distanceKm,
  city: draft.location?.city,
  location:
    draft.location?.lat !== undefined && draft.location.lng !== undefined
      ? { latitude: draft.location.lat, longitude: draft.location.lng }
      : undefined,
});

const uploadToImageKit = async (uri: string, auth: UploadAuth): Promise<ImageKitUploadResult> => {
  const form = new FormData();
  form.append('file', {
    uri,
    name: `profile_${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  form.append('fileName', `profile_${Date.now()}.jpg`);
  form.append('publicKey', auth.publicKey);
  form.append('signature', auth.signature);
  form.append('expire', String(auth.expire));
  form.append('token', auth.token);
  form.append('folder', '/delta/profile');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: form,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.message ?? 'Image upload failed');
  }
  return result;
};

export const profileApi = {
  async getMine() {
    const { data: profile } = await apiClient.get<BackendProfile | null>('/profiles/me');
    if (!profile) return null;
    const { data: media } = await apiClient.get<MediaItem[]>('/media/me', {
      params: { mediaType: 'profile_image' },
    });
    return normalizeProfile(profile, media);
  },

  async update(patch: ProfileDraft) {
    await apiClient.put('/profiles/', toBackendProfilePatch(patch));
    return this.getMine();
  },

  async uploadPhoto(uri: string, position: number) {
    const { data: auth } = await apiClient.post<UploadAuth>('/media/upload-auth', {
      mediaType: 'profile_image',
    });
    const uploaded = await uploadToImageKit(uri, auth);
    const { data } = await apiClient.post<{ id: string; url: string }>(
      '/media/complete',
      {
        fileId: uploaded.fileId,
        url: uploaded.url,
        thumbnailUrl: uploaded.thumbnailUrl ?? uploaded.url,
        mediaType: 'profile_image',
        mimeType: 'image/jpeg',
        size: uploaded.size,
        width: uploaded.width,
        height: uploaded.height,
      },
    );
    return { id: data.id, url: data.url, position };
  },

  async removePhoto(photoId: string) {
    await apiClient.delete(`/media/${photoId}`);
  },
};
