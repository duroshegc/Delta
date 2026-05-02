import type { Elysia } from "elysia";
import { z, type ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";
import type { ValidationErrorDetail } from "../types/errors";

/**
 * Validation middleware factory for Elysia
 * Validates request body, query, and params using Zod schemas
 */

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

/**
 * Create a validation middleware for a route
 */
export function validate(schemas: ValidationSchemas) {
  return async ({ body, query, params, request }: any) => {
    const errors: ValidationErrorDetail[] = [];

    // Validate body
    if (schemas.body) {
      const result = schemas.body.safeParse(body);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        );
      }
    }

    // Validate query parameters
    if (schemas.query) {
      const result = schemas.query.safeParse(query);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: `query.${err.path.join(".")}`,
            message: err.message,
            code: err.code,
          })),
        );
      }
    }

    // Validate path parameters
    if (schemas.params) {
      const result = schemas.params.safeParse(params);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: `params.${err.path.join(".")}`,
            message: err.message,
            code: err.code,
          })),
        );
      }
    }

    // Validate headers
    if (schemas.headers) {
      const headers = Object.fromEntries(request.headers.entries());
      const result = schemas.headers.safeParse(headers);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((err) => ({
            field: `headers.${err.path.join(".")}`,
            message: err.message,
            code: err.code,
          })),
        );
      }
    }

    // Throw validation error if any errors found
    if (errors.length > 0) {
      throw new ValidationError("Request validation failed", errors);
    }
  };
}

/**
 * Helper to create a validated route handler
 * Usage: app.post('/users', validatedHandler({ body: userSchema }, handler))
 */
export function validatedHandler<T = any>(
  schemas: ValidationSchemas,
  handler: (context: T) => any,
) {
  return async (context: T) => {
    await validate(schemas)(context);
    return handler(context);
  };
}

// Made with Bob
