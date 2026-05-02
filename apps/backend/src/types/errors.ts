/**
 * Error type definitions for the Delta API
 * Provides consistent error handling across the application
 */

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
  path?: string;
  stack?: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "TIMEOUT"
  | "SERVICE_UNAVAILABLE";

export interface AppErrorOptions {
  message: string;
  statusCode?: number;
  code?: ErrorCode;
  details?: unknown;
  cause?: Error;
}

// Made with Bob
