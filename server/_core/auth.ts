// server/_core/auth.ts
// CuraLive Auth Abstraction Layer
// This is the ONLY file in the codebase that knows about Clerk.
// Everything else imports getCurrentUser, requireAuth, requireRole, requireOrgAccess.

import { clerkMiddleware, getAuth } from "@clerk/express";
import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export { clerkMiddleware };

/**
 * Resolves the current authenticated user into CuraLive's internal user model.
 * Clerk identity is mapped to CuraLive DB user via clerkUserId (openId field).
 * Returns null if unauthenticated.
 */
export async function getCurrentUser(req: Request): Promise<User | null> {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return null;

    const user = await db.getUserByOpenId(auth.userId);
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Throws if no valid user.
 */
export async function requireAuth(req: Request): Promise<User> {
  const user = await getCurrentUser(req);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return user;
}

/**
 * Requires a specific role.
 */
export async function requireRole(
  req: Request,
  role: User["role"]
): Promise<User> {
  const user = await requireAuth(req);
  if (user.role !== role) throw new TRPCError({ code: "FORBIDDEN" });
  return user;
}

/**
 * Requires org access.
 */
export async function requireOrgAccess(
  req: Request,
  orgId: number
): Promise<User> {
  const user = await requireAuth(req);
  if (user.orgId !== orgId) throw new TRPCError({ code: "FORBIDDEN" });
  return user;
}
