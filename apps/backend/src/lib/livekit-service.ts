/**
 * LiveKit Service
 * Room and participant token helpers with development-safe fallbacks.
 */

import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { env } from "../config/env";
import { ExternalServiceError } from "../utils/errors";

export class LiveKitService {
  private isConfigured(): boolean {
    return Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
  }

  private getConfig(): {
    url: string;
    apiKey: string;
    apiSecret: string;
  } {
    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      throw new ExternalServiceError("LiveKit", "LiveKit is not configured");
    }

    return {
      url: env.LIVEKIT_URL,
      apiKey: env.LIVEKIT_API_KEY,
      apiSecret: env.LIVEKIT_API_SECRET,
    };
  }

  async ensureRoom(roomName: string): Promise<{ roomName: string; provider: string }> {
    if (!this.isConfigured()) {
      if (env.APP_ENV === "production") {
        throw new ExternalServiceError("LiveKit", "LiveKit is not configured");
      }
      return { roomName, provider: "development" };
    }

    const config = this.getConfig();
    const client = new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
    await client.createRoom({
      name: roomName,
      emptyTimeout: 60,
      maxParticipants: 2,
    });

    return { roomName, provider: "livekit" };
  }

  async createParticipantToken(input: {
    roomName: string;
    userId: string;
  }): Promise<{ token: string; url: string; provider: string }> {
    if (!this.isConfigured()) {
      if (env.APP_ENV === "production") {
        throw new ExternalServiceError("LiveKit", "LiveKit is not configured");
      }
      return {
        token: `dev-livekit-token:${input.roomName}:${input.userId}`,
        url: env.LIVEKIT_URL || "development",
        provider: "development",
      };
    }

    const config = this.getConfig();
    const accessToken = new AccessToken(config.apiKey, config.apiSecret, {
      identity: input.userId,
    });
    accessToken.addGrant({
      room: input.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await accessToken.toJwt(),
      url: config.url,
      provider: "livekit",
    };
  }
}

// Made with Bob
