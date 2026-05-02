import { z } from "zod";
import { ALLOWED_MIME_TYPES, MEDIA_LIMITS } from "../../types/media";

/**
 * Validation schemas for media endpoints
 */

// Media type validation
export const mediaTypeSchema = z.enum([
  "profile_image",
  "profile_video",
  "verification_selfie",
  "verification_video",
  "chat_image",
  "chat_video",
  "report_evidence",
]);

// Upload completion schema
export const mediaUploadCompleteSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  url: z.string().url("Invalid URL"),
  thumbnailUrl: z.string().url("Invalid thumbnail URL"),
  mediaType: mediaTypeSchema,
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().positive("Size must be positive"),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().positive().optional(),
});

// Moderation status update schema
export const moderationStatusSchema = z.object({
  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "flagged",
    "under_review",
  ]),
  notes: z.string().max(500).optional(),
});

/**
 * Validate media based on type and constraints
 */
export function validateMediaConstraints(data: {
  mediaType: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
}): { valid: boolean; error?: string } {
  const { mediaType, mimeType, size, width, height, duration } = data;

  // Check MIME type
  const allowedMimeTypes = ALLOWED_MIME_TYPES[mediaType];
  if (!allowedMimeTypes || !allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid MIME type for ${mediaType}. Allowed: ${allowedMimeTypes?.join(", ")}`,
    };
  }

  // Check size limits
  switch (mediaType) {
    case "profile_image":
      if (size > MEDIA_LIMITS.PROFILE_IMAGE_MAX_SIZE) {
        return {
          valid: false,
          error: `Profile image size exceeds ${MEDIA_LIMITS.PROFILE_IMAGE_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      if (width && height) {
        if (
          width < MEDIA_LIMITS.PROFILE_IMAGE_MIN_WIDTH ||
          height < MEDIA_LIMITS.PROFILE_IMAGE_MIN_HEIGHT
        ) {
          return {
            valid: false,
            error: `Profile image must be at least ${MEDIA_LIMITS.PROFILE_IMAGE_MIN_WIDTH}x${MEDIA_LIMITS.PROFILE_IMAGE_MIN_HEIGHT}px`,
          };
        }
      }
      break;

    case "profile_video":
      if (size > MEDIA_LIMITS.PROFILE_VIDEO_MAX_SIZE) {
        return {
          valid: false,
          error: `Profile video size exceeds ${MEDIA_LIMITS.PROFILE_VIDEO_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      if (duration) {
        if (
          duration < MEDIA_LIMITS.PROFILE_VIDEO_MIN_DURATION ||
          duration > MEDIA_LIMITS.PROFILE_VIDEO_MAX_DURATION
        ) {
          return {
            valid: false,
            error: `Profile video must be between ${MEDIA_LIMITS.PROFILE_VIDEO_MIN_DURATION}-${MEDIA_LIMITS.PROFILE_VIDEO_MAX_DURATION} seconds`,
          };
        }
      }
      break;

    case "verification_selfie":
      if (size > MEDIA_LIMITS.VERIFICATION_IMAGE_MAX_SIZE) {
        return {
          valid: false,
          error: `Verification image size exceeds ${MEDIA_LIMITS.VERIFICATION_IMAGE_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      break;

    case "verification_video":
      if (size > MEDIA_LIMITS.VERIFICATION_VIDEO_MAX_SIZE) {
        return {
          valid: false,
          error: `Verification video size exceeds ${MEDIA_LIMITS.VERIFICATION_VIDEO_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      if (duration && duration > MEDIA_LIMITS.VERIFICATION_VIDEO_MAX_DURATION) {
        return {
          valid: false,
          error: `Verification video must not exceed ${MEDIA_LIMITS.VERIFICATION_VIDEO_MAX_DURATION} seconds`,
        };
      }
      break;

    case "chat_image":
      if (size > MEDIA_LIMITS.CHAT_IMAGE_MAX_SIZE) {
        return {
          valid: false,
          error: `Chat image size exceeds ${MEDIA_LIMITS.CHAT_IMAGE_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      break;

    case "chat_video":
      if (size > MEDIA_LIMITS.CHAT_VIDEO_MAX_SIZE) {
        return {
          valid: false,
          error: `Chat video size exceeds ${MEDIA_LIMITS.CHAT_VIDEO_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      if (duration && duration > MEDIA_LIMITS.CHAT_VIDEO_MAX_DURATION) {
        return {
          valid: false,
          error: `Chat video must not exceed ${MEDIA_LIMITS.CHAT_VIDEO_MAX_DURATION} seconds`,
        };
      }
      break;

    case "report_evidence":
      if (
        size > MEDIA_LIMITS.REPORT_IMAGE_MAX_SIZE &&
        mimeType.startsWith("image/")
      ) {
        return {
          valid: false,
          error: `Report image size exceeds ${MEDIA_LIMITS.REPORT_IMAGE_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      if (
        size > MEDIA_LIMITS.REPORT_VIDEO_MAX_SIZE &&
        mimeType.startsWith("video/")
      ) {
        return {
          valid: false,
          error: `Report video size exceeds ${MEDIA_LIMITS.REPORT_VIDEO_MAX_SIZE / 1024 / 1024}MB`,
        };
      }
      break;
  }

  return { valid: true };
}

// Made with Bob
