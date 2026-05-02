import type { ObjectId } from "mongodb";
import type { MediaType, ModerationStatus } from "./database";

/**
 * Media Type Definitions
 * Handles media uploads via ImageKit CDN
 */

export interface Media {
  _id: ObjectId;
  userId: ObjectId;

  // ImageKit Info
  fileId: string; // ImageKit file ID
  url: string; // Full URL to the media
  thumbnailUrl: string; // Thumbnail URL

  // Media Details
  mediaType: MediaType;
  mimeType: string;
  size: number; // bytes
  width?: number;
  height?: number;
  duration?: number; // for videos, in seconds

  // Moderation
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  moderatedAt?: Date;
  moderatedBy?: ObjectId;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ImageKit authentication parameters
 */
export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
}

/**
 * Media upload completion request
 */
export interface MediaUploadComplete {
  fileId: string;
  url: string;
  thumbnailUrl: string;
  mediaType: MediaType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Media validation limits
 */
export const MEDIA_LIMITS = {
  // Profile images
  PROFILE_IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  PROFILE_IMAGE_MIN_WIDTH: 800,
  PROFILE_IMAGE_MIN_HEIGHT: 800,
  PROFILE_IMAGE_MAX_COUNT: 6,

  // Profile videos
  PROFILE_VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  PROFILE_VIDEO_MIN_DURATION: 3, // seconds
  PROFILE_VIDEO_MAX_DURATION: 30, // seconds
  PROFILE_VIDEO_MAX_COUNT: 2,

  // Verification media
  VERIFICATION_IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VERIFICATION_VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  VERIFICATION_VIDEO_MAX_DURATION: 15, // seconds

  // Chat media
  CHAT_IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  CHAT_VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  CHAT_VIDEO_MAX_DURATION: 60, // seconds

  // Report evidence
  REPORT_IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  REPORT_VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Allowed MIME types by media type
 */
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  profile_image: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  profile_video: ["video/mp4", "video/quicktime", "video/webm"],
  verification_selfie: ["image/jpeg", "image/jpg", "image/png"],
  verification_video: ["video/mp4", "video/quicktime", "video/webm"],
  chat_image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  chat_video: ["video/mp4", "video/quicktime", "video/webm"],
  report_evidence: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "video/mp4",
    "video/quicktime",
  ],
};

// Made with Bob
