/**
 * Discovery Service
 * Business logic for profile discovery and matching algorithms
 */

import { ObjectId, type Collection } from "mongodb";
import type { Profile } from "../types/profile";
import type { Media } from "../types/media";
import type { Like, Match } from "../types/matching";
import type {
  DiscoveryFilters,
  DiscoveryCandidate,
  DiscoveryFeed,
} from "../types/discovery";
import { DEFAULT_DISCOVERY_CONFIG } from "../types/discovery";
import { calculateDistance } from "./profile-service";
import { logger } from "../config/logger";
import { SafetyService } from "./safety-service";

/**
 * Discovery Service Class
 */
export class DiscoveryService {
  constructor(
    private profilesCollection: Collection<Profile>,
    private mediaCollection: Collection<Media>,
    private likesCollection: Collection<Like>,
    private matchesCollection: Collection<Match>,
    private safetyService?: SafetyService,
  ) {}

  /**
   * Get discovery feed with filtered and ranked candidates
   */
  async getDiscoveryFeed(
    currentUserId: ObjectId,
    filters: DiscoveryFilters,
    limit: number = DEFAULT_DISCOVERY_CONFIG.defaultPageSize,
    cursor?: string,
  ): Promise<DiscoveryFeed> {
    try {
      const excludedUserIds = await this.getExcludedUserIds(currentUserId);
      const blockedUserIds = this.safetyService
        ? await this.safetyService.getBlockedUserIds(currentUserId)
        : [];
      const query = this.buildDiscoveryQuery(
        currentUserId,
        filters,
        [...excludedUserIds, ...blockedUserIds],
      );

      // Get profiles with geospatial query if location provided
      let profiles: Profile[];
      if (filters.location && filters.maxDistance) {
        profiles = await this.getProfilesNearLocation(
          query,
          filters.location,
          filters.maxDistance,
          limit + 1, // Get one extra to check if there are more
          cursor,
        );
      } else {
        profiles = await this.getProfilesWithoutLocation(
          query,
          limit + 1,
          cursor,
        );
      }

      // Check if there are more results
      const hasMore = profiles.length > limit;
      if (hasMore) {
        profiles = profiles.slice(0, limit);
      }

      // Get media for all profiles
      const profileIds = profiles.map((p) => p._id);
      const mediaMap = await this.getMediaForProfiles(profileIds);

      // Convert to discovery candidates with ranking
      const candidates = await Promise.all(
        profiles.map((profile) =>
          this.profileToCandidate(
            profile,
            mediaMap.get(profile._id.toString()) || [],
            filters,
          ),
        ),
      );

      // Sort by match score
      candidates.sort((a, b) => b.matchScore - a.matchScore);

      // Generate cursor for pagination
      const nextCursor =
        hasMore && profiles.length > 0
          ? profiles[profiles.length - 1]!._id.toString()
          : undefined;

      return {
        candidates,
        cursor: nextCursor,
        hasMore,
      };
    } catch (error) {
      logger.error({ error, filters }, "Failed to get discovery feed");
      throw error;
    }
  }

  /**
   * Build MongoDB query for discovery
   */
  private buildDiscoveryQuery(
    currentUserId: ObjectId,
    filters: DiscoveryFilters,
    excludedUserIds: ObjectId[],
  ): any {
    const query: any = {
      // Exclude current user
      userId: { $nin: [currentUserId, ...excludedUserIds] },
      // Only visible profiles
      visibility: "active",
      // Minimum completion threshold
      completionScore: {
        $gte:
          filters.minCompletion ||
          DEFAULT_DISCOVERY_CONFIG.minCompletionThreshold,
      },
    };

    // Age range filter
    if (filters.minAge || filters.maxAge) {
      query.age = {};
      if (filters.minAge) query.age.$gte = filters.minAge;
      if (filters.maxAge) query.age.$lte = filters.maxAge;
    }

    // Intent filter
    if (filters.intent) {
      query.intent = filters.intent;
    }

    // Gender preference filter
    if (filters.genderPreference && filters.genderPreference !== "all") {
      query.gender = filters.genderPreference;
    }

    // Interests filter (at least one common interest)
    if (filters.interests && filters.interests.length > 0) {
      query.interests = { $in: filters.interests };
    }

    // Verified only filter
    if (filters.verifiedOnly) {
      query.verificationStatus = "verified";
    }

    return query;
  }

  /**
   * Exclude profiles the user has already liked or actively matched.
   */
  private async getExcludedUserIds(currentUserId: ObjectId): Promise<ObjectId[]> {
    const [likes, matches] = await Promise.all([
      this.likesCollection
        .find({ fromUserId: currentUserId, status: "active" })
        .project<{ toUserId: ObjectId }>({ toUserId: 1 })
        .toArray(),
      this.matchesCollection
        .find({ participants: currentUserId, status: "active" })
        .project<{ participants: ObjectId[] }>({ participants: 1 })
        .toArray(),
    ]);

    const excluded = new Map<string, ObjectId>();

    for (const like of likes) {
      excluded.set(like.toUserId.toString(), like.toUserId);
    }

    for (const match of matches) {
      for (const participant of match.participants) {
        if (!participant.equals(currentUserId)) {
          excluded.set(participant.toString(), participant);
        }
      }
    }

    return Array.from(excluded.values());
  }

  /**
   * Get profiles near a location using geospatial query
   */
  private async getProfilesNearLocation(
    query: any,
    location: { type: "Point"; coordinates: [number, number] },
    maxDistance: number,
    limit: number,
    cursor?: string,
  ): Promise<Profile[]> {
    // Add geospatial query
    const geoQuery = {
      ...query,
      location: {
        $near: {
          $geometry: location,
          $maxDistance: maxDistance * 1000, // Convert km to meters
        },
      },
    };

    // Add cursor pagination
    if (cursor) {
      geoQuery._id = { $gt: new ObjectId(cursor) };
    }

    return await this.profilesCollection.find(geoQuery).limit(limit).toArray();
  }

  /**
   * Get profiles without location filter
   */
  private async getProfilesWithoutLocation(
    query: any,
    limit: number,
    cursor?: string,
  ): Promise<Profile[]> {
    if (cursor) {
      query._id = { $gt: new ObjectId(cursor) };
    }

    return await this.profilesCollection
      .find(query)
      .sort({ updatedAt: -1 }) // Most recently updated first
      .limit(limit)
      .toArray();
  }

  /**
   * Get media for multiple profiles
   */
  private async getMediaForProfiles(
    profileIds: ObjectId[],
  ): Promise<Map<string, Media[]>> {
    const userIds = await this.profilesCollection
      .find({ _id: { $in: profileIds } })
      .project({ userId: 1 })
      .toArray();

    const userIdMap = new Map(userIds.map((p) => [p._id.toString(), p.userId]));

    const media = await this.mediaCollection
      .find({
        userId: { $in: Array.from(userIdMap.values()) },
        mediaType: { $in: ["profile_image", "profile_video"] },
        moderationStatus: "approved",
      })
      .sort({ order: 1 })
      .toArray();

    // Group media by profile ID
    const mediaMap = new Map<string, Media[]>();
    for (const m of media) {
      const profileId = Array.from(userIdMap.entries()).find(([_, userId]) =>
        userId.equals(m.userId),
      )?.[0];
      if (profileId) {
        if (!mediaMap.has(profileId)) {
          mediaMap.set(profileId, []);
        }
        mediaMap.get(profileId)!.push(m);
      }
    }

    return mediaMap;
  }

  /**
   * Convert profile to discovery candidate with ranking
   */
  private async profileToCandidate(
    profile: Profile,
    media: Media[],
    filters: DiscoveryFilters,
  ): Promise<DiscoveryCandidate> {
    // Calculate distance if location provided
    let distance = 0;
    if (filters.location) {
      distance = calculateDistance(
        filters.location.coordinates[1],
        filters.location.coordinates[0],
        profile.location.coordinates[1],
        profile.location.coordinates[0],
      );
    }

    // Calculate match score
    const matchScore = this.calculateMatchScore(profile, filters, distance);

    // Format prompts
    const prompts = profile.prompts.map((p) => ({
      question: p.question,
      answer: p.answer,
    }));

    return {
      userId: profile.userId.toString(),
      displayName: profile.displayName,
      age: profile.age,
      gender: profile.gender,
      intent: profile.intent,
      bio: profile.bio,
      media: media.map((m, index) => ({
        id: m._id.toString(),
        url: m.url,
        type: m.mediaType as "profile_image" | "profile_video",
        order: index,
      })),
      interests: profile.interests,
      prompts,
      distance,
      completionScore: profile.completionScore,
      isVerified: profile.verificationStatus === "verified",
      location: {
        city: profile.city,
        country: profile.country,
      },
      matchScore,
    };
  }

  /**
   * Calculate match score based on multiple factors
   */
  private calculateMatchScore(
    profile: Profile,
    filters: DiscoveryFilters,
    distance: number,
  ): number {
    const weights = DEFAULT_DISCOVERY_CONFIG.rankingWeights;
    let score = 0;

    // Distance score (closer is better)
    if (filters.location && filters.maxDistance) {
      const distanceScore = Math.max(
        0,
        100 - (distance / filters.maxDistance) * 100,
      );
      score += distanceScore * weights.distance;
    } else {
      // If no location filter, give neutral score
      score += 50 * weights.distance;
    }

    // Common interests score
    if (filters.interests && filters.interests.length > 0) {
      const commonInterests = profile.interests.filter((i) =>
        filters.interests!.includes(i),
      ).length;
      const interestScore = Math.min(
        100,
        (commonInterests / filters.interests.length) * 100,
      );
      score += interestScore * weights.interests;
    } else {
      // If no interest filter, give neutral score
      score += 50 * weights.interests;
    }

    // Profile completion score
    score += profile.completionScore * weights.completion;

    // Verification score
    const verificationScore =
      profile.verificationStatus === "verified" ? 100 : 0;
    score += verificationScore * weights.verification;

    // Activity score (based on last update)
    const daysSinceUpdate =
      (Date.now() - profile.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(0, 100 - daysSinceUpdate * 5); // Decay 5 points per day
    score += activityScore * weights.activity;

    return Math.round(score);
  }
}

// Made with Bob
