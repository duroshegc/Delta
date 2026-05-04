import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env, logger, connectDatabase, getDatabase, getRedis } from "./config";
import { errorHandler } from "./middleware/error-handler";
import { globalRateLimit } from "./middleware/rate-limit";
import { authRoutes } from "./modules/auth/routes";
import { userRoutes } from "./modules/users/routes";
import { profileRoutes } from "./modules/profiles/routes";
import { mediaRoutes } from "./modules/media/routes";
import { discoveryRoutes } from "./modules/discovery/routes";
import { likeRoutes, matchRoutes } from "./modules/matches/routes";
import { chatRoutes } from "./modules/chat/routes";
import { walletRoutes } from "./modules/wallet/routes";
import {
  liveKitRoutes,
  liveMatchRoutes,
  liveMatchWebSocketRoutes,
} from "./modules/live-match/routes";
import { moderationRoutes } from "./modules/moderation/routes";
import { adminRoutes } from "./modules/admin/routes";
import { ServiceUnavailableError } from "./utils/errors";

function corsOriginConfig(): true | string[] {
  if (env.APP_ENV === "development") return true;
  const origins = new Set<string>([
    env.API_PUBLIC_URL,
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    ...env.CORS_ALLOWED_ORIGINS,
  ]);
  return [...origins];
}


const app = new Elysia()
  .use(
    cors({
      origin: corsOriginConfig(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Delta API",
          version: "1.0.0",
          description: "Dating and Live Social Discovery Platform API",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Users", description: "User management endpoints" },
          { name: "Profiles", description: "Profile management endpoints" },
          { name: "Discovery", description: "Profile discovery endpoints" },
          { name: "Matches", description: "Match management endpoints" },
          { name: "Chat", description: "Chat and messaging endpoints" },
          {
            name: "Media",
            description: "Media upload and management endpoints",
          },
          { name: "Wallet", description: "Delt token wallet endpoints" },
          { name: "Live Match", description: "Live matching endpoints" },
          {
            name: "Moderation",
            description: "Moderation and safety endpoints",
          },
          { name: "Admin", description: "Admin dashboard endpoints" },
        ],
      },
    }),
  )
  // Enhanced error handling middleware
  .use(errorHandler)
  // Global rate limiting (optional - can be enabled per route)
  // .onBeforeHandle(globalRateLimit())
  .get(
    "/health",
    async () => {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: env.APP_ENV,
        services: {
          api: "ok",
          database: "unknown",
          redis: "unknown",
        },
      };

      // Check MongoDB
      try {
        const db = getDatabase();
        await db.command({ ping: 1 });
        health.services.database = "ok";
      } catch (error) {
        health.services.database = "error";
        health.status = "degraded";
        logger.error({ error }, "MongoDB health check failed");
      }

      // Check Redis
      try {
        const redis = getRedis();
        await redis.ping();
        health.services.redis = "ok";
      } catch (error) {
        health.services.redis = "error";
        health.status = "degraded";
        logger.error({ error }, "Redis health check failed");
      }

      return health;
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check the health status of the API and its dependencies",
      },
    },
  )
  .get(
    "/",
    () => ({
      name: "Delta API",
      version: "1.0.0",
      description: "Dating and Live Social Discovery Platform",
      documentation: "/swagger",
      health: "/health",
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "API information",
        description: "Get basic information about the API",
      },
    },
  )
  .derive(async () => {
    try {
      await connectDatabase();
      getRedis();
      return {};
    } catch (error) {
      logger.error({ error }, "Core services are not ready");
      throw new ServiceUnavailableError(
        "Core services are not ready. Verify MongoDB, Redis, and environment variables.",
        { database: "required", redis: "required" },
        error instanceof Error ? error : undefined,
      );
    }
  })
  // Mount authentication routes
  .use(authRoutes)
  // Mount user management routes
  .use(userRoutes)
  // Mount profile management routes
  .use(profileRoutes)
  // Mount media management routes
  .use(mediaRoutes)
  // Mount discovery routes
  .use(discoveryRoutes)
  // Mount likes and matches routes
  .use(likeRoutes)
  .use(matchRoutes)
  // Mount chat routes
  .use(chatRoutes)
  // Mount wallet routes
  .use(walletRoutes)
  // Mount live match and LiveKit routes
  .use(liveMatchRoutes)
  .use(liveKitRoutes)
  .use(liveMatchWebSocketRoutes)
  // Mount safety and admin routes
  .use(moderationRoutes)
  .use(adminRoutes);

// Initialize database connection before starting server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Redis (lazy connection)
    getRedis();

    // Start server
    app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.APP_ENV,
          url: `http://localhost:${env.PORT}`,
          swagger: `http://localhost:${env.PORT}/swagger`,
        },
        "🚀 Delta API server started",
      );
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

startServer();

export default app;

// Made with Bob
