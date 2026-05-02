import type { Elysia } from "elysia";
import { logger } from "../config";
import { AppError, isOperationalError } from "../utils/errors";
import type { ErrorResponse } from "../types/errors";
import { env } from "../config/env";

/**
 * Enhanced error handling middleware for Elysia
 * Provides consistent error responses and logging
 */
export function errorHandler(app: Elysia) {
  return app.onError(({ code, error, set, request }) => {
    const isDevelopment = env.APP_ENV === "development";
    const timestamp = new Date().toISOString();
    const path = new URL(request.url).pathname;

    // Handle AppError instances (our custom errors)
    if (error instanceof AppError) {
      set.status = error.statusCode;

      const response: ErrorResponse = {
        success: false,
        error: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp,
        path,
      };

      // Add details if available
      if (error.details) {
        response.details = error.details;
      }

      // Add stack trace in development
      if (isDevelopment && error.stack) {
        response.stack = error.stack;
      }

      // Log based on severity
      if (error.statusCode >= 500) {
        logger.error(
          {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
            stack: error.stack,
            path,
          },
          "Application error",
        );
      } else {
        logger.warn(
          {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            path,
          },
          "Client error",
        );
      }

      return response;
    }

    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      set.status = 400;

      const response: ErrorResponse = {
        success: false,
        error: "ValidationError",
        message: "Request validation failed",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        timestamp,
        path,
        details: error instanceof Error ? error.message : String(error),
      };

      logger.warn(
        {
          error: response.details,
          path,
        },
        "Validation error",
      );

      return response;
    }

    // Handle Elysia NOT_FOUND errors
    if (code === "NOT_FOUND") {
      set.status = 404;

      const response: ErrorResponse = {
        success: false,
        error: "NotFoundError",
        message: "The requested resource was not found",
        code: "NOT_FOUND",
        statusCode: 404,
        timestamp,
        path,
      };

      logger.warn({ path }, "Resource not found");

      return response;
    }

    // Handle Elysia PARSE errors
    if (code === "PARSE") {
      set.status = 400;

      const response: ErrorResponse = {
        success: false,
        error: "ParseError",
        message: "Failed to parse request body",
        code: "BAD_REQUEST",
        statusCode: 400,
        timestamp,
        path,
      };

      logger.warn({ path }, "Parse error");

      return response;
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    set.status = 500;

    const response: ErrorResponse = {
      success: false,
      error: "InternalServerError",
      message: isDevelopment
        ? errorMessage
        : "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      timestamp,
      path,
    };

    // Add stack trace in development
    if (isDevelopment && errorStack) {
      response.stack = errorStack;
    }

    // Log all unexpected errors
    logger.error(
      {
        error: errorMessage,
        stack: errorStack,
        code,
        path,
        isOperational: isOperationalError(error as Error),
      },
      "Unexpected error",
    );

    return response;
  });
}

// Made with Bob
