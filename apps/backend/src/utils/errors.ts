import type {
  ErrorCode,
  AppErrorOptions,
  ValidationErrorDetail,
} from "../types/errors";

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message);

    this.name = this.constructor.name;
    this.statusCode = options.statusCode || 500;
    this.code = options.code || "INTERNAL_SERVER_ERROR";
    this.details = options.details;
    this.isOperational = true;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Preserve the original error cause if provided
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Validation error (400)
 * Used when request data fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: ValidationErrorDetail[]) {
    super({
      message,
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details,
    });
  }
}

/**
 * Authentication error (401)
 * Used when authentication is required but not provided or invalid
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super({
      message,
      statusCode: 401,
      code: "AUTHENTICATION_ERROR",
    });
  }
}

/**
 * Authorization error (403)
 * Used when user is authenticated but lacks permission
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super({
      message,
      statusCode: 403,
      code: "AUTHORIZATION_ERROR",
    });
  }
}

/**
 * Not found error (404)
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super({
      message: `${resource} not found`,
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }
}

/**
 * Conflict error (409)
 * Used when a request conflicts with current state (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      statusCode: 409,
      code: "CONFLICT",
      details,
    });
  }
}

/**
 * Rate limit error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", retryAfter?: number) {
    super({
      message,
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
      details: retryAfter ? { retryAfter } : undefined,
    });
  }
}

/**
 * Internal server error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", cause?: Error) {
    super({
      message,
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      cause,
    });
  }
}

/**
 * Database error (500)
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super({
      message,
      statusCode: 500,
      code: "DATABASE_ERROR",
      cause,
    });
  }
}

/**
 * External service error (502)
 * Used when external service calls fail
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, cause?: Error) {
    super({
      message: message || `${service} service unavailable`,
      statusCode: 502,
      code: "EXTERNAL_SERVICE_ERROR",
      details: { service },
      cause,
    });
  }
}

/**
 * Bad request error (400)
 * Used for general bad request errors
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      statusCode: 400,
      code: "BAD_REQUEST",
      details,
    });
  }
}

/**
 * Check if an error is an operational error (expected)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// Made with Bob
