import type { ObjectId } from "mongodb";
import type {
  Gender,
  DatingIntent,
  VerificationStatus,
  ProfileVisibility,
  GeoLocation,
} from "./database";

/**
 * Profile Type Definitions
 * User dating profiles with location, preferences, and media
 */

export interface Profile {
  _id: ObjectId;
  userId: ObjectId;

  // Basic Info
  displayName: string; // 2-50 characters
  dateOfBirth: Date;
  age: number; // Calculated from dateOfBirth
  gender: Gender;
  bio: string; // 10-500 characters

  // Location
  location: GeoLocation; // GeoJSON Point [longitude, latitude]
  city?: string;
  country: string; // ISO 3166-1 alpha-2 code

  // Dating Preferences
  intent: DatingIntent;
  lookingFor: Gender[]; // Genders user is interested in
  ageRange: {
    min: number; // 18-100
    max: number; // 18-100
  };
  maxDistance: number; // in kilometers

  // Interests & Prompts
  interests: string[]; // 3-10 tags
  prompts: ProfilePrompt[]; // Exactly 3 prompts

  // Media
  photos: ObjectId[]; // 2-6 photo IDs
  videos: ObjectId[]; // 0-2 video IDs

  // Verification
  verificationStatus: VerificationStatus;
  verificationMedia?: ObjectId;

  // Visibility & Status
  visibility: ProfileVisibility;
  completionScore: number; // 0-100, calculated

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface ProfilePrompt {
  question: string;
  answer: string; // 10-300 characters
}

/**
 * Profile completion scoring
 */
export interface ProfileCompletionScore {
  total: number; // 0-100
  breakdown: {
    photos: number; // 30 points (min 2 photos)
    bio: number; // 20 points
    prompts: number; // 30 points (10 per prompt)
    interests: number; // 10 points (min 3)
    verification: number; // 10 points
  };
  missingFields: string[];
}

/**
 * Available prompt questions
 */
export const PROMPT_QUESTIONS = [
  "My ideal first date",
  "I'm looking for someone who",
  "My perfect weekend",
  "I'm passionate about",
  "My hidden talent",
  "The way to my heart",
  "I'm weirdly attracted to",
  "My simple pleasures",
  "I geek out on",
  "My go-to karaoke song",
  "I'm overly competitive about",
  "The best way to ask me out",
  "My most controversial opinion",
  "I want someone who",
  "My love language is",
] as const;

export type PromptQuestion = (typeof PROMPT_QUESTIONS)[number];

/**
 * Profile creation/update request
 */
export interface ProfileUpdateRequest {
  displayName?: string;
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  bio?: string;
  location?: {
    longitude: number;
    latitude: number;
  };
  city?: string;
  country?: string;
  intent?: DatingIntent;
  lookingFor?: Gender[];
  ageRange?: {
    min: number;
    max: number;
  };
  maxDistance?: number;
  interests?: string[];
  prompts?: ProfilePrompt[];
}

/**
 * Public profile view (for discovery/matching)
 */
export interface PublicProfile {
  id: string;
  displayName: string;
  age: number;
  gender: Gender;
  bio: string;
  distance?: number; // Distance from viewer in km
  city?: string;
  intent: DatingIntent;
  interests: string[];
  prompts: ProfilePrompt[];
  photos: string[]; // Photo URLs
  videos?: string[]; // Video URLs
  verificationStatus: VerificationStatus;
  completionScore: number;
  lastActiveAt: Date;
}

// Made with Bob
