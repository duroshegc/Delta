import { z } from "zod";

export const adminRoleSchema = z.enum([
  "super_admin",
  "admin",
  "trust_safety_manager",
  "moderator",
  "support",
  "finance",
  "analyst",
]);

export const adminUsersQuerySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
});

export const adminReportsQuerySchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
});

export const adminSessionsQuerySchema = z.object({
  status: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
});

export const adminUserActionSchema = z.object({
  status: z.enum(["active", "suspended", "banned", "deleted"]).optional(),
  verificationStatus: z.enum(["none", "pending", "verified", "rejected"]).optional(),
  reason: z.string().min(3).max(500),
});

export const createAdminAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
  role: adminRoleSchema.default("admin"),
  reason: z.string().min(3).max(500),
});

// Made with Bob
