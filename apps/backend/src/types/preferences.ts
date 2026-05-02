import type { ObjectId } from "mongodb";
import type { DatingIntent } from "./database";

/**
 * User Preferences Type Definitions
 * Stores user privacy settings, notification preferences, and discovery filters
 */

export interface UserPreferences {
  userId: ObjectId;

  // Privacy Settings
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showDistance: boolean;
    allowProfileViews: boolean;
  };

  // Notification Preferences
  notifications: {
    matches: boolean;
    messages: boolean;
    likes: boolean;
    liveMatch: boolean;
    email: boolean;
    push: boolean;
  };

  // Discovery Filters
  discovery: {
    showMe: boolean; // Pause profile visibility
    ageRange: {
      min: number; // 18-100
      max: number; // 18-100
    };
    maxDistance: number; // in kilometers
    intents: DatingIntent[];
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: Omit<
  UserPreferences,
  "userId" | "createdAt" | "updatedAt"
> = {
  privacy: {
    showOnlineStatus: true,
    showLastSeen: true,
    showDistance: true,
    allowProfileViews: true,
  },
  notifications: {
    matches: true,
    messages: true,
    likes: true,
    liveMatch: true,
    email: true,
    push: true,
  },
  discovery: {
    showMe: true,
    ageRange: {
      min: 18,
      max: 100,
    },
    maxDistance: 50, // 50km default
    intents: ["serious", "casual", "friendship", "networking"],
  },
};

/**
 * Account status and restrictions
 */
export interface AccountStatus {
  status: "active" | "suspended" | "banned" | "restricted" | "deleted";
  restrictions?: AccountRestriction[];
  warnings?: AccountWarning[];
}

export interface AccountRestriction {
  type: "messaging" | "matching" | "live_match" | "profile_edit";
  reason: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface AccountWarning {
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
}

// Made with Bob
