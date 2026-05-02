import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env, logger, connectDatabase, getDatabase, getRedis } from "./config";

const app = new Elysia()
  .use(
    cors({
      origin: env.APP_ENV === "development" ? true : [env.API_PUBLIC_URL],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
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
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      { code, error: errorMessage, stack: errorStack },
      "Request error",
    );

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: "Validation error",
        message: errorMessage,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: "Not found",
        message: "The requested resource was not found",
      };
    }

    set.status = 500;
    return {
      success: false,
      error: "Internal server error",
      message:
        env.APP_ENV === "development"
          ? errorMessage
          : "An unexpected error occurred",
    };
  })
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
  );

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
