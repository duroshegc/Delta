import type { ObjectId } from "mongodb";
import type { Profile, ProfileCompletionScore } from "../types/profile";

/**
 * Profile Service
 * Business logic for profile operations
 */

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

/**
 * Calculate profile completion score
 * Total: 100 points
 * - Photos: 30 points (min 2 photos)
 * - Bio: 20 points
 * - Prompts: 30 points (10 per prompt, need 3)
 * - Interests: 10 points (min 3)
 * - Verification: 10 points
 */
export function calculateProfileCompletion(
  profile: Partial<Profile>,
): ProfileCompletionScore {
  const breakdown = {
    photos: 0,
    bio: 0,
    prompts: 0,
    interests: 0,
    verification: 0,
  };
  const missingFields: string[] = [];

  // Photos (30 points)
  if (profile.photos && profile.photos.length >= 2) {
    breakdown.photos = 30;
  } else {
    missingFields.push("At least 2 photos required");
  }

  // Bio (20 points)
  if (profile.bio && profile.bio.length >= 10) {
    breakdown.bio = 20;
  } else {
    missingFields.push("Bio required (min 10 characters)");
  }

  // Prompts (30 points)
  if (profile.prompts && profile.prompts.length === 3) {
    breakdown.prompts = 30;
  } else {
    missingFields.push("3 prompts required");
  }

  // Interests (10 points)
  if (profile.interests && profile.interests.length >= 3) {
    breakdown.interests = 10;
  } else {
    missingFields.push("At least 3 interests required");
  }

  // Verification (10 points)
  if (profile.verificationStatus === "verified") {
    breakdown.verification = 10;
  } else {
    missingFields.push("Profile verification pending");
  }

  const total =
    breakdown.photos +
    breakdown.bio +
    breakdown.prompts +
    breakdown.interests +
    breakdown.verification;

  return {
    total,
    breakdown,
    missingFields,
  };
}

/**
 * Validate profile is complete enough for discovery
 * Minimum requirements:
 * - At least 2 photos
 * - Bio filled
 * - 3 prompts answered
 * - At least 3 interests
 * - Location set
 */
export function isProfileComplete(profile: Partial<Profile>): boolean {
  return (
    (profile.photos?.length ?? 0) >= 2 &&
    (profile.bio?.length ?? 0) >= 10 &&
    (profile.prompts?.length ?? 0) === 3 &&
    (profile.interests?.length ?? 0) >= 3 &&
    profile.location !== undefined
  );
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Sanitize profile data for public view
 * Removes sensitive information
 */
export function sanitizeProfileForPublic(
  profile: Profile,
  viewerLocation?: { latitude: number; longitude: number },
): any {
  const publicProfile: any = {
    id: profile._id.toString(),
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender,
    bio: profile.bio,
    city: profile.city,
    intent: profile.intent,
    interests: profile.interests,
    prompts: profile.prompts,
    verificationStatus: profile.verificationStatus,
    completionScore: profile.completionScore,
    lastActiveAt: profile.lastActiveAt,
  };

  // Calculate distance if viewer location is provided
  if (viewerLocation && profile.location) {
    publicProfile.distance = calculateDistance(
      viewerLocation.latitude,
      viewerLocation.longitude,
      profile.location.coordinates[1], // latitude
      profile.location.coordinates[0], // longitude
    );
  }

  return publicProfile;
}

// Made with Bob
