export type Gender = 'male' | 'female' | 'nonbinary' | 'other';
export type DatingIntent = 'serious' | 'casual' | 'friendship' | 'networking';

export interface ProfilePhoto {
  id: string;
  url: string;
  position: number;
}

export interface Prompt {
  id: string;
  question: string;
  answer: string;
}

export interface Profile {
  userId: string;
  displayName: string;
  birthDate: string; // ISO yyyy-mm-dd
  gender: Gender | null;
  interestedIn: Gender[];
  intent: DatingIntent | null;
  bio: string;
  interests: string[];
  photos: ProfilePhoto[];
  prompts: Prompt[];
  verified: boolean;
  location?: { city?: string; lat?: number; lng?: number };
  preferences?: {
    ageMin: number;
    ageMax: number;
    distanceKm: number;
    genders: Gender[];
  };
}

export type ProfileDraft = Partial<Omit<Profile, 'userId' | 'verified' | 'photos' | 'prompts'>> & {
  photos?: ProfilePhoto[];
  prompts?: Prompt[];
};
