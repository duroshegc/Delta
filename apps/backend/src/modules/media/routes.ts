import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "../../utils/errors";
import { COLLECTIONS } from "../../types/database";
import {
  mediaUploadCompleteSchema,
  moderationStatusSchema,
  validateMediaConstraints,
} from "./schemas";
import { generateUploadAuth, deleteFile } from "../../lib/imagekit";
import type { Media } from "../../types/media";
import type { Profile } from "../../types/profile";
import { MEDIA_LIMITS } from "../../types/media";

/**
 * Media management routes
 *
 * Endpoints:
 * - POST /media/upload-auth - Generate ImageKit auth for upload
 * - POST /media/complete - Complete upload and store metadata
 * - GET /media/me - List user's media
 * - DELETE /media/:mediaId - Delete media
 * - PATCH /media/:mediaId/status - Update moderation status (admin)
 */

export const mediaRoutes = new Elysia({ prefix: "/media" })
  .use(requireAuth)

  // Generate upload authentication
  .post(
    "/upload-auth",
    async (context) => {
      const { user, body } = context as any;

      // Generate ImageKit authentication parameters
      const authParams = generateUploadAuth(user.userId);

      logger.info(
        { userId: user.userId, mediaType: body.mediaType },
        "Generated upload auth",
      );

      return {
        success: true,
        data: {
          ...authParams,
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
          urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        },
      };
    },
    {
      body: t.Object({
        mediaType: t.Union([
          t.Literal("profile_image"),
          t.Literal("profile_video"),
          t.Literal("verification_selfie"),
          t.Literal("verification_video"),
          t.Literal("chat_image"),
          t.Literal("chat_video"),
          t.Literal("report_evidence"),
        ]),
      }),
      detail: {
        tags: ["Media"],
        summary: "Generate upload authentication",
        description:
          "Generate ImageKit authentication parameters for client-side upload",
      },
    },
  )

  // Complete upload and store metadata
  .post(
    "/complete",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      // Validate request body
      const validatedData = mediaUploadCompleteSchema.parse(body);

      // Validate media constraints
      const validation = validateMediaConstraints(validatedData);
      if (!validation.valid) {
        throw new ValidationError(validation.error!);
      }

      // Check media count limits for profile media
      if (
        validatedData.mediaType === "profile_image" ||
        validatedData.mediaType === "profile_video"
      ) {
        const profile = await db
          .collection<Profile>(COLLECTIONS.PROFILES)
          .findOne({ userId: new ObjectId(user.userId) });

        if (!profile) {
          throw new NotFoundError("Profile not found. Create a profile first.");
        }

        // Check photo limit
        if (validatedData.mediaType === "profile_image") {
          const photoCount = await db
            .collection<Media>(COLLECTIONS.MEDIA)
            .countDocuments({
              userId: new ObjectId(user.userId),
              mediaType: "profile_image",
            });

          if (photoCount >= MEDIA_LIMITS.PROFILE_IMAGE_MAX_COUNT) {
            throw new ValidationError(
              `Maximum ${MEDIA_LIMITS.PROFILE_IMAGE_MAX_COUNT} profile photos allowed`,
            );
          }
        }

        // Check video limit
        if (validatedData.mediaType === "profile_video") {
          const videoCount = await db
            .collection<Media>(COLLECTIONS.MEDIA)
            .countDocuments({
              userId: new ObjectId(user.userId),
              mediaType: "profile_video",
            });

          if (videoCount >= MEDIA_LIMITS.PROFILE_VIDEO_MAX_COUNT) {
            throw new ValidationError(
              `Maximum ${MEDIA_LIMITS.PROFILE_VIDEO_MAX_COUNT} profile videos allowed`,
            );
          }
        }
      }

      // Create media document
      const now = new Date();
      const media: Omit<Media, "_id"> = {
        userId: new ObjectId(user.userId),
        fileId: validatedData.fileId,
        url: validatedData.url,
        thumbnailUrl: validatedData.thumbnailUrl,
        mediaType: validatedData.mediaType as any,
        mimeType: validatedData.mimeType,
        size: validatedData.size,
        width: validatedData.width,
        height: validatedData.height,
        duration: validatedData.duration,
        moderationStatus: "pending",
        createdAt: now,
        updatedAt: now,
      };

      const result = await db
        .collection<Media>(COLLECTIONS.MEDIA)
        .insertOne(media as any);

      // If profile media, add to profile
      if (
        validatedData.mediaType === "profile_image" ||
        validatedData.mediaType === "profile_video"
      ) {
        const field =
          validatedData.mediaType === "profile_image" ? "photos" : "videos";
        await db.collection<Profile>(COLLECTIONS.PROFILES).updateOne(
          { userId: new ObjectId(user.userId) },
          {
            $push: { [field]: result.insertedId },
            $set: { updatedAt: now },
          },
        );
      }

      logger.info(
        {
          userId: user.userId,
          mediaId: result.insertedId.toString(),
          mediaType: validatedData.mediaType,
        },
        "Media upload completed",
      );

      return {
        success: true,
        message: "Media uploaded successfully",
        data: {
          id: result.insertedId.toString(),
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          moderationStatus: media.moderationStatus,
        },
      };
    },
    {
      body: t.Object({
        fileId: t.String({ minLength: 1 }),
        url: t.String({ format: "uri" }),
        thumbnailUrl: t.String({ format: "uri" }),
        mediaType: t.Union([
          t.Literal("profile_image"),
          t.Literal("profile_video"),
          t.Literal("verification_selfie"),
          t.Literal("verification_video"),
          t.Literal("chat_image"),
          t.Literal("chat_video"),
          t.Literal("report_evidence"),
        ]),
        mimeType: t.String(),
        size: t.Number({ minimum: 1 }),
        width: t.Optional(t.Number({ minimum: 1 })),
        height: t.Optional(t.Number({ minimum: 1 })),
        duration: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Media"],
        summary: "Complete media upload",
        description: "Store media metadata after successful upload to ImageKit",
      },
    },
  )

  // List user's media
  .get(
    "/me",
    async (context) => {
      const { user, query } = context as any;
      const db = getDatabase();

      const mediaType = query.mediaType;
      const filter: any = { userId: new ObjectId(user.userId) };

      if (mediaType) {
        filter.mediaType = mediaType;
      }

      const media = await db
        .collection<Media>(COLLECTIONS.MEDIA)
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      logger.debug(
        { userId: user.userId, count: media.length },
        "User media retrieved",
      );

      return {
        success: true,
        data: media.map((m) => ({
          id: m._id.toString(),
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          mediaType: m.mediaType,
          mimeType: m.mimeType,
          size: m.size,
          width: m.width,
          height: m.height,
          duration: m.duration,
          moderationStatus: m.moderationStatus,
          createdAt: m.createdAt,
        })),
      };
    },
    {
      query: t.Object({
        mediaType: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Media"],
        summary: "List user's media",
        description: "Retrieve all media uploaded by the authenticated user",
      },
    },
  )

  // Delete media
  .delete(
    "/:mediaId",
    async (context) => {
      const { user, params } = context as any;
      const db = getDatabase();

      if (!ObjectId.isValid(params.mediaId)) {
        throw new ValidationError("Invalid media ID");
      }

      const media = await db.collection<Media>(COLLECTIONS.MEDIA).findOne({
        _id: new ObjectId(params.mediaId),
      });

      if (!media) {
        throw new NotFoundError("Media not found");
      }

      // Check ownership
      if (media.userId.toString() !== user.userId) {
        throw new AuthorizationError("You can only delete your own media");
      }

      // Delete from ImageKit
      try {
        await deleteFile(media.fileId);
      } catch (error) {
        logger.error(
          { error, fileId: media.fileId },
          "Failed to delete from ImageKit",
        );
        // Continue with database deletion even if ImageKit deletion fails
      }

      // Remove from profile if profile media
      if (
        media.mediaType === "profile_image" ||
        media.mediaType === "profile_video"
      ) {
        const field = media.mediaType === "profile_image" ? "photos" : "videos";
        await db.collection<Profile>(COLLECTIONS.PROFILES).updateOne(
          { userId: new ObjectId(user.userId) },
          {
            $pull: { [field]: media._id },
            $set: { updatedAt: new Date() },
          },
        );
      }

      // Delete from database
      await db
        .collection<Media>(COLLECTIONS.MEDIA)
        .deleteOne({ _id: new ObjectId(params.mediaId) });

      logger.info(
        { userId: user.userId, mediaId: params.mediaId },
        "Media deleted",
      );

      return {
        success: true,
        message: "Media deleted successfully",
      };
    },
    {
      params: t.Object({
        mediaId: t.String(),
      }),
      detail: {
        tags: ["Media"],
        summary: "Delete media",
        description: "Delete a media file",
      },
    },
  )

  // Update moderation status (admin only)
  .use(requireRole("admin", "moderator"))
  .patch(
    "/:mediaId/status",
    async (context) => {
      const { user, params, body } = context as any;
      const db = getDatabase();

      if (!ObjectId.isValid(params.mediaId)) {
        throw new ValidationError("Invalid media ID");
      }

      const validatedData = moderationStatusSchema.parse(body);

      const result = await db
        .collection<Media>(COLLECTIONS.MEDIA)
        .findOneAndUpdate(
          { _id: new ObjectId(params.mediaId) },
          {
            $set: {
              moderationStatus: validatedData.status,
              moderationNotes: validatedData.notes,
              moderatedAt: new Date(),
              moderatedBy: new ObjectId(user.userId),
              updatedAt: new Date(),
            },
          },
          { returnDocument: "after" },
        );

      if (!result) {
        throw new NotFoundError("Media not found");
      }

      logger.info(
        {
          moderatorId: user.userId,
          mediaId: params.mediaId,
          status: validatedData.status,
        },
        "Media moderation status updated",
      );

      return {
        success: true,
        message: "Moderation status updated successfully",
        data: {
          id: result._id.toString(),
          moderationStatus: result.moderationStatus,
          moderatedAt: result.moderatedAt,
        },
      };
    },
    {
      params: t.Object({
        mediaId: t.String(),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("approved"),
          t.Literal("rejected"),
          t.Literal("flagged"),
          t.Literal("under_review"),
        ]),
        notes: t.Optional(t.String({ maxLength: 500 })),
      }),
      detail: {
        tags: ["Media"],
        summary: "Update moderation status",
        description:
          "Update the moderation status of a media file (admin only)",
      },
    },
  );

// Made with Bob
