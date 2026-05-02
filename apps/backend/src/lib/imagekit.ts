import ImageKit from "imagekit";
import crypto from "crypto";
import { env } from "../config";
import { logger } from "../config/logger";
import type { ImageKitAuthParams } from "../types/media";

/**
 * ImageKit Service
 * Handles media uploads and management via ImageKit CDN
 */

let imagekitInstance: ImageKit | null = null;

/**
 * Initialize ImageKit instance
 */
export function getImageKit(): ImageKit {
  if (!imagekitInstance) {
    if (
      !env.IMAGEKIT_PUBLIC_KEY ||
      !env.IMAGEKIT_PRIVATE_KEY ||
      !env.IMAGEKIT_URL_ENDPOINT
    ) {
      throw new Error("ImageKit credentials not configured");
    }

    imagekitInstance = new ImageKit({
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    });

    logger.info("ImageKit initialized");
  }

  return imagekitInstance;
}

/**
 * Generate authentication parameters for client-side upload
 * These parameters are used by the client to upload directly to ImageKit
 */
export function generateUploadAuth(userId: string): ImageKitAuthParams {
  const token = crypto.randomBytes(16).toString("hex");
  const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  // Generate signature
  const privateKey = env.IMAGEKIT_PRIVATE_KEY!;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  logger.debug({ userId }, "Generated ImageKit upload auth");

  return {
    token,
    expire,
    signature,
  };
}

/**
 * Delete a file from ImageKit
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const imagekit = getImageKit();
    await imagekit.deleteFile(fileId);
    logger.info({ fileId }, "File deleted from ImageKit");
  } catch (error) {
    logger.error({ error, fileId }, "Failed to delete file from ImageKit");
    throw error;
  }
}

/**
 * Get file details from ImageKit
 */
export async function getFileDetails(fileId: string): Promise<any> {
  try {
    const imagekit = getImageKit();
    const details = await imagekit.getFileDetails(fileId);
    logger.debug({ fileId }, "Retrieved file details from ImageKit");
    return details;
  } catch (error) {
    logger.error({ error, fileId }, "Failed to get file details from ImageKit");
    throw error;
  }
}

/**
 * List files for a user (by tags)
 */
export async function listUserFiles(
  userId: string,
  limit = 100,
): Promise<any[]> {
  try {
    const imagekit = getImageKit();
    const files = await imagekit.listFiles({
      tags: [`user:${userId}`],
      limit,
    });
    logger.debug(
      { userId, count: files.length },
      "Listed user files from ImageKit",
    );
    return files;
  } catch (error) {
    logger.error({ error, userId }, "Failed to list user files from ImageKit");
    throw error;
  }
}

/**
 * Bulk delete files
 */
export async function bulkDeleteFiles(fileIds: string[]): Promise<void> {
  try {
    const imagekit = getImageKit();
    await imagekit.bulkDeleteFiles(fileIds);
    logger.info({ count: fileIds.length }, "Bulk deleted files from ImageKit");
  } catch (error) {
    logger.error(
      { error, count: fileIds.length },
      "Failed to bulk delete files from ImageKit",
    );
    throw error;
  }
}

// Made with Bob
