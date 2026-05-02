import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { requireAuth, optionalAuth } from "../../middleware/auth";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../utils/errors";
import { COLLECTIONS } from "../../types/database";
import { profileUpdateSchema, visibilityUpdateSchema } from "./schemas";
import {
  calculateAge,
  calculateProfileCompletion,
  isProfileComplete,
  sanitizeProfileForPublic,
} from "../../lib/profile-service";
import type { Profile } from "../../types/profile";

/**
 * Profile management routes
 *
 * Endpoints:
 * - GET /profiles/:userId - Get profile by user ID (public)
 * - GET /profiles/me - Get own profile
 * - PUT /profiles - Create or update own profile
 * - DELETE /profiles/me - Delete own profile
 * - PATCH /profiles/me/visibility - Update visibility
 * - GET /profiles/me/completion - Get profile completion status
 */

export const profileRoutes = new Elysia({ prefix: "/profiles" })
  // Get profile by user ID (public view)
  .get(
    "/:userId",
    async (context) => {
      const { params } = context as any;
      const { user } = context as any; // Optional auth
      const db = getDatabase();

      if (!ObjectId.isValid(params.userId)) {
        throw new ValidationError("Invalid user ID");
      }

      const profile = await db
        .collection<Profile>(COLLECTIONS.PROFILES)
        .findOne({
          userId: new ObjectId(params.userId),
          visibility: "active", // Only show active profiles
        });

      if (!profile) {
        throw new NotFoundError("Profile not found");
      }

      // Get viewer's location if authenticated
      let viewerLocation;
      if (user) {
        const viewerProfile = await db
          .collection<Profile>(COLLECTIONS.PROFILES)
          .findOne({ userId: new ObjectId(user.userId) });
        if (viewerProfile?.location) {
          viewerLocation = {
            latitude: viewerProfile.location.coordinates[1],
            longitude: viewerProfile.location.coordinates[0],
          };
        }
      }

      const publicProfile = sanitizeProfileForPublic(profile, viewerLocation);

      logger.debug(
        { profileId: profile._id.toString(), viewerId: user?.userId },
        "Profile viewed",
      );

      return {
        success: true,
        data: publicProfile,
      };
    },
    {
      detail: {
        tags: ["Profiles"],
        summary: "Get profile by user ID",
        description: "Retrieve a user's public profile information",
      },
    },
  )
  .use(optionalAuth)

  // Get own profile
  .use(requireAuth)
  .get(
    "/me",
    async (context) => {
      const { user } = context as any;
      const db = getDatabase();

      const profile = await db
        .collection<Profile>(COLLECTIONS.PROFILES)
        .findOne({
          userId: new ObjectId(user.userId),
        });

      if (!profile) {
        return {
          success: true,
          data: null,
          message: "Profile not created yet",
        };
      }

      logger.debug({ userId: user.userId }, "Own profile retrieved");

      return {
        success: true,
        data: {
          id: profile._id.toString(),
          displayName: profile.displayName,
          dateOfBirth: profile.dateOfBirth,
          age: profile.age,
          gender: profile.gender,
          bio: profile.bio,
          location: profile.location,
          city: profile.city,
          country: profile.country,
          intent: profile.intent,
          lookingFor: profile.lookingFor,
          ageRange: profile.ageRange,
          maxDistance: profile.maxDistance,
          interests: profile.interests,
          prompts: profile.prompts,
          photos: profile.photos.map((id) => id.toString()),
          videos: profile.videos.map((id) => id.toString()),
          verificationStatus: profile.verificationStatus,
          visibility: profile.visibility,
          completionScore: profile.completionScore,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          lastActiveAt: profile.lastActiveAt,
        },
      };
    },
    {
      detail: {
        tags: ["Profiles"],
        summary: "Get own profile",
        description: "Retrieve the authenticated user's profile",
      },
    },
  )

  // Create or update own profile
  .put(
    "/",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      // Validate request body
      const validatedData = profileUpdateSchema.parse(body);

      // Check if profile exists
      const existingProfile = await db
        .collection<Profile>(COLLECTIONS.PROFILES)
        .findOne({ userId: new ObjectId(user.userId) });

      const now = new Date();

      if (existingProfile) {
        // Update existing profile
        const updateData: any = {
          updatedAt: now,
          lastActiveAt: now,
        };

        if (validatedData.displayName) {
          updateData.displayName = validatedData.displayName;
        }
        if (validatedData.dateOfBirth) {
          const dob = new Date(validatedData.dateOfBirth);
          updateData.dateOfBirth = dob;
          updateData.age = calculateAge(dob);
        }
        if (validatedData.gender) {
          updateData.gender = validatedData.gender;
        }
        if (validatedData.bio) {
          updateData.bio = validatedData.bio;
        }
        if (validatedData.location) {
          updateData.location = {
            type: "Point",
            coordinates: [
              validatedData.location.longitude,
              validatedData.location.latitude,
            ],
          };
        }
        if (validatedData.city) {
          updateData.city = validatedData.city;
        }
        if (validatedData.country) {
          updateData.country = validatedData.country;
        }
        if (validatedData.intent) {
          updateData.intent = validatedData.intent;
        }
        if (validatedData.lookingFor) {
          updateData.lookingFor = validatedData.lookingFor;
        }
        if (validatedData.ageRange) {
          updateData.ageRange = validatedData.ageRange;
        }
        if (validatedData.maxDistance) {
          updateData.maxDistance = validatedData.maxDistance;
        }
        if (validatedData.interests) {
          updateData.interests = validatedData.interests;
        }
        if (validatedData.prompts) {
          updateData.prompts = validatedData.prompts;
        }

        // Recalculate completion score
        const updatedProfile = { ...existingProfile, ...updateData };
        const completion = calculateProfileCompletion(updatedProfile);
        updateData.completionScore = completion.total;

        // Update visibility based on completion
        if (
          isProfileComplete(updatedProfile) &&
          existingProfile.visibility === "hidden"
        ) {
          updateData.visibility = "active";
        }

        const result = await db
          .collection<Profile>(COLLECTIONS.PROFILES)
          .findOneAndUpdate(
            { userId: new ObjectId(user.userId) },
            { $set: updateData },
            { returnDocument: "after" },
          );

        if (!result) {
          throw new NotFoundError("Profile not found");
        }

        logger.info({ userId: user.userId }, "Profile updated");

        return {
          success: true,
          message: "Profile updated successfully",
          data: {
            id: result._id.toString(),
            completionScore: result.completionScore,
            visibility: result.visibility,
          },
        };
      } else {
        // Create new profile
        if (
          !validatedData.displayName ||
          !validatedData.dateOfBirth ||
          !validatedData.gender ||
          !validatedData.intent
        ) {
          throw new ValidationError(
            "Display name, date of birth, gender, and intent are required for profile creation",
          );
        }

        const dob = new Date(validatedData.dateOfBirth);
        const newProfile: Omit<Profile, "_id"> = {
          userId: new ObjectId(user.userId),
          displayName: validatedData.displayName,
          dateOfBirth: dob,
          age: calculateAge(dob),
          gender: validatedData.gender,
          bio: validatedData.bio || "",
          location: validatedData.location
            ? {
                type: "Point",
                coordinates: [
                  validatedData.location.longitude,
                  validatedData.location.latitude,
                ],
              }
            : { type: "Point", coordinates: [0, 0] },
          city: validatedData.city,
          country: validatedData.country || "US",
          intent: validatedData.intent,
          lookingFor: validatedData.lookingFor || ["male", "female"],
          ageRange: validatedData.ageRange || { min: 18, max: 100 },
          maxDistance: validatedData.maxDistance || 50,
          interests: validatedData.interests || [],
          prompts: validatedData.prompts || [],
          photos: [],
          videos: [],
          verificationStatus: "none",
          visibility: "hidden", // Hidden until profile is complete
          completionScore: 0,
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
        };

        // Calculate initial completion score
        const completion = calculateProfileCompletion(newProfile);
        newProfile.completionScore = completion.total;

        const result = await db
          .collection<Profile>(COLLECTIONS.PROFILES)
          .insertOne(newProfile as any);

        logger.info({ userId: user.userId }, "Profile created");

        return {
          success: true,
          message: "Profile created successfully",
          data: {
            id: result.insertedId.toString(),
            completionScore: newProfile.completionScore,
            visibility: newProfile.visibility,
          },
        };
      }
    },
    {
      body: t.Object({
        displayName: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
        dateOfBirth: t.Optional(t.String()),
        gender: t.Optional(
          t.Union([
            t.Literal("male"),
            t.Literal("female"),
            t.Literal("non-binary"),
            t.Literal("other"),
            t.Literal("prefer-not-to-say"),
          ]),
        ),
        bio: t.Optional(t.String({ minLength: 10, maxLength: 500 })),
        location: t.Optional(
          t.Object({
            longitude: t.Number({ minimum: -180, maximum: 180 }),
            latitude: t.Number({ minimum: -90, maximum: 90 }),
          }),
        ),
        city: t.Optional(t.String()),
        country: t.Optional(t.String({ minLength: 2, maxLength: 2 })),
        intent: t.Optional(
          t.Union([
            t.Literal("serious"),
            t.Literal("casual"),
            t.Literal("friendship"),
            t.Literal("networking"),
          ]),
        ),
        lookingFor: t.Optional(t.Array(t.String())),
        ageRange: t.Optional(
          t.Object({
            min: t.Number({ minimum: 18, maximum: 100 }),
            max: t.Number({ minimum: 18, maximum: 100 }),
          }),
        ),
        maxDistance: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
        interests: t.Optional(t.Array(t.String())),
        prompts: t.Optional(
          t.Array(
            t.Object({
              question: t.String(),
              answer: t.String(),
            }),
          ),
        ),
      }),
      detail: {
        tags: ["Profiles"],
        summary: "Create or update profile",
        description: "Create a new profile or update existing profile",
      },
    },
  )

  // Delete own profile
  .delete(
    "/me",
    async (context) => {
      const { user } = context as any;
      const db = getDatabase();

      const result = await db
        .collection<Profile>(COLLECTIONS.PROFILES)
        .deleteOne({ userId: new ObjectId(user.userId) });

      if (result.deletedCount === 0) {
        throw new NotFoundError("Profile not found");
      }

      logger.info({ userId: user.userId }, "Profile deleted");

      return {
        success: true,
        message: "Profile deleted successfully",
      };
    },
    {
      detail: {
        tags: ["Profiles"],
        summary: "Delete profile",
        description: "Delete the authenticated user's profile",
      },
    },
  )

  // Update profile visibility
  .patch(
    "/me/visibility",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      const validatedData = visibilityUpdateSchema.parse(body);

      const result = await db
        .collection<Profile>(COLLECTIONS.PROFILES)
        .findOneAndUpdate(
          { userId: new ObjectId(user.userId) },
          {
            $set: {
              visibility: validatedData.visibility,
              updatedAt: new Date(),
            },
          },
          { returnDocument: "after" },
        );

      if (!result) {
        throw new NotFoundError("Profile not found");
      }

      logger.info(
        { userId: user.userId, visibility: validatedData.visibility },
        "Profile visibility updated",
      );

      return {
        success: true,
        message: "Visibility updated successfully",
        data: {
          visibility: result.visibility,
        },
      };
    },
    {
      body: t.Object({
        visibility: t.Union([
          t.Literal("active"),
          t.Literal("paused"),
          t.Literal("hidden"),
        ]),
      }),
      detail: {
        tags: ["Profiles"],
        summary: "Update profile visibility",
        description: "Update the visibility status of the profile",
      },
    },
  )

  // Get profile completion status
  .get(
    "/me/completion",
    async (context) => {
      const { user } = context as any;
      const db = getDatabase();

      const profile = await db
        .collection<Profile>(COLLECTIONS.PROFILES)
        .findOne({
          userId: new ObjectId(user.userId),
        });

      if (!profile) {
        throw new NotFoundError("Profile not found");
      }

      const completion = calculateProfileCompletion(profile);

      logger.debug({ userId: user.userId }, "Profile completion retrieved");

      return {
        success: true,
        data: completion,
      };
    },
    {
      detail: {
        tags: ["Profiles"],
        summary: "Get profile completion",
        description: "Get the profile completion score and missing fields",
      },
    },
  );

// Made with Bob
