/**
 * Discovery Routes
 * Profile discovery and matching endpoints
 */

import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { COLLECTIONS } from "../../types/database";
import type { Profile } from "../../types/profile";
import type { Media } from "../../types/media";
import { requireAuth } from "../../middleware/auth";
import { DiscoveryService } from "../../lib/discovery-service";
import { discoveryFeedQuerySchema } from "./schemas";
import { ValidationError } from "../../utils/errors";
import { logger } from "../../config/logger";
import { userRateLimit } from "../../middleware/rate-limit";
import { RATE_LIMITS } from "../../config/rate-limits";

export const discoveryRoutes = new Elysia({ prefix: "/discovery" })
  .use(requireAuth)
  /**
   * GET /discovery/feed
   * Get discovery feed with filtered and ranked candidates
   */
  .get(
    "/feed",
    async (context) => {
      const { query } = context as any;
      const { user } = context as any;

      try {
        // Validate query parameters
        const validatedQuery = discoveryFeedQuerySchema.parse(query);

        // Validate location parameters
        if (
          (validatedQuery.latitude !== undefined ||
            validatedQuery.longitude !== undefined) &&
          (validatedQuery.latitude === undefined ||
            validatedQuery.longitude === undefined)
        ) {
          throw new ValidationError(
            "Both latitude and longitude must be provided together",
          );
        }

        // Get user's profile to use their preferences
        const db = getDatabase();
        const profilesCollection = db.collection<Profile>(COLLECTIONS.PROFILES);
        const mediaCollection = db.collection<Media>(COLLECTIONS.MEDIA);

        const userProfile = await profilesCollection.findOne({
          userId: new ObjectId(user.id),
        });

        if (!userProfile) {
          throw new ValidationError(
            "Please complete your profile before discovering others",
          );
        }

        // Build filters from query and user preferences
        const filters: any = {};

        // Location filter
        if (validatedQuery.latitude && validatedQuery.longitude) {
          filters.location = {
            type: "Point" as const,
            coordinates: [validatedQuery.longitude, validatedQuery.latitude],
          };
          filters.maxDistance =
            validatedQuery.maxDistance || userProfile.maxDistance;
        }

        // Age range filter (use query params or user preferences)
        filters.minAge = validatedQuery.minAge || userProfile.ageRange.min;
        filters.maxAge = validatedQuery.maxAge || userProfile.ageRange.max;

        // Intent filter
        if (validatedQuery.intent) {
          filters.intent = validatedQuery.intent;
        }

        // Gender preference filter
        if (validatedQuery.genderPreference) {
          filters.genderPreference = validatedQuery.genderPreference;
        } else if (userProfile.lookingFor.length > 0) {
          // Use user's gender preferences
          if (userProfile.lookingFor.length === 1) {
            filters.genderPreference = userProfile.lookingFor[0];
          } else {
            filters.genderPreference = "all";
          }
        }

        // Interests filter
        if (validatedQuery.interests) {
          filters.interests = validatedQuery.interests;
        }

        // Quality filters
        if (validatedQuery.minCompletion) {
          filters.minCompletion = validatedQuery.minCompletion;
        }
        if (validatedQuery.verifiedOnly) {
          filters.verifiedOnly = validatedQuery.verifiedOnly;
        }

        // Get discovery feed
        const discoveryService = new DiscoveryService(
          profilesCollection,
          mediaCollection,
        );

        const feed = await discoveryService.getDiscoveryFeed(
          new ObjectId(user.id),
          filters,
          validatedQuery.limit,
          validatedQuery.cursor,
        );

        logger.info(
          {
            userId: user.id,
            filters,
            candidatesCount: feed.candidates.length,
          },
          "Discovery feed retrieved",
        );

        return {
          success: true,
          data: feed,
        };
      } catch (error) {
        logger.error(
          { error, userId: user.id },
          "Failed to get discovery feed",
        );
        throw error;
      }
    },
    {
      detail: {
        tags: ["Discovery"],
        summary: "Get discovery feed",
        description:
          "Get a personalized feed of profile candidates based on preferences and filters. Uses geospatial queries and ranking algorithms.",
      },
    },
  );

// Made with Bob
