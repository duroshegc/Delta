import type { ObjectId } from "mongodb";

/**
 * Authentication and session types for Better-auth
 */

export interface User {
  _id: ObjectId;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: "active" | "suspended" | "banned" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationToken {
  _id: ObjectId;
  identifier: string; // email or phone
  token: string;
  type: "email" | "phone" | "password-reset";
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthContext {
  user: User | null;
  session: Session | null;
}

// Made with Bob
