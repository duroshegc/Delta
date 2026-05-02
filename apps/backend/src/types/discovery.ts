/**
 * Discovery Types
 * Types for profile discovery and matching algorithms
 */

import type { GeoLocation, Gender, DatingIntent } from "./database";

/**
 * Discovery filters for finding potential matches
 */
export interface DiscoveryFilters {
  /** User's current location */
  location?: GeoLocation;
  /** Maximum distance in kilometers */
  maxDistance?: number;
  /** Minimum age */
  minAge?: number;
  /** Maximum age */
  maxAge?: number;
  /** Relationship intent filter */
  intent?: "serious" | "casual" | "friendship" | "networking";
  /** Gender preference */
  genderPreference?:
    | "male"
    | "female"
    | "non-binary"
    | "other"
    | "prefer-not-to-say"
    | "all";
  /** Interests to match */
  interests?: string[];
  /** Minimum profile completion percentage */
  minCompletion?: number;
  /** Include verified profiles only */
  verifiedOnly?: boolean;
}

/**
 * Discovery candidate with calculated fields
 */
export interface DiscoveryCandidate {
  /** Profile user ID */
  userId: string;
  /** Display name */
  displayName: string;
  /** Age */
  age: number;
  /** Gender */
  gender: Gender;
  /** Relationship intent */
  intent: DatingIntent;
  /** Bio */
  bio?: string;
  /** Profile media */
  media: {
    id: string;
    url: string;
    type: "profile_image" | "profile_video";
    order: number;
  }[];
  /** Interests */
  interests: string[];
  /** Prompts with answers */
  prompts: {
    question: string;
    answer: string;
  }[];
  /** Distance from user in kilometers */
  distance: number;
  /** Profile completion percentage */
  completionScore: number;
  /** Is profile verified */
  isVerified: boolean;
  /** Location (city, country) */
  location: {
    city?: string;
    country: string;
  };
  /** Match score (0-100) */
  matchScore: number;
}

/**
 * Discovery feed response
 */
export interface DiscoveryFeed {
  /** List of candidates */
  candidates: DiscoveryCandidate[];
  /** Cursor for pagination */
  cursor?: string;
  /** Has more results */
  hasMore: boolean;
  /** Total count (if available) */
  totalCount?: number;
}

/**
 * Ranking weights for match score calculation
 */
export interface RankingWeights {
  /** Distance weight (0-1) */
  distance: number;
  /** Common interests weight (0-1) */
  interests: number;
  /** Profile completion weight (0-1) */
  completion: number;
  /** Verification status weight (0-1) */
  verification: number;
  /** Activity recency weight (0-1) */
  activity: number;
}

/**
 * Default ranking weights
 */
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  distance: 0.3,
  interests: 0.25,
  completion: 0.2,
  verification: 0.15,
  activity: 0.1,
};

/**
 * Discovery algorithm configuration
 */
export interface DiscoveryConfig {
  /** Default maximum distance in km */
  defaultMaxDistance: number;
  /** Maximum results per page */
  maxPageSize: number;
  /** Default page size */
  defaultPageSize: number;
  /** Minimum profile completion to show */
  minCompletionThreshold: number;
  /** Ranking weights */
  rankingWeights: RankingWeights;
}

/**
 * Default discovery configuration
 */
export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  defaultMaxDistance: 50, // 50km
  maxPageSize: 50,
  defaultPageSize: 20,
  minCompletionThreshold: 30, // 30% completion minimum
  rankingWeights: DEFAULT_RANKING_WEIGHTS,
};

// Made with Bob
