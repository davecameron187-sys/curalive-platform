/**
 * CuraLive Database Helpers
 * GROK2 Live Q&A Intelligence Engine (Module 31)
 * Phase 1-2: Foundation & Intelligence Layer
 */

import { drizzle } from "drizzle-orm/mysql2/driver";
import { eq, desc, and } from "drizzle-orm";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Database operations are now handled directly via getDb() in procedures and helpers

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const database = await getDb();
  if (!database) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    const existingUser = await database
      .select()
      .from(users)
      .where(eq(users.openId, user.openId))
      .then((rows) => rows[0]);

    if (existingUser) {
      await database
        .update(users)
        .set({
          ...updateSet,
          lastSignedIn: new Date(),
        })
        .where(eq(users.openId, user.openId));
    } else {
      await database.insert(users).values({
        ...values,
        role: "user",
        lastSignedIn: new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Upsert user error:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const database = await getDb();
  if (!database) return null;

  return database
    .select()
    .from(users)
    .where(eq(users.id, id))
    .then((rows) => rows[0] || null);
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) return null;

  return database
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .then((rows) => rows[0] || null);
}

export async function listUsers() {
  const database = await getDb();
  if (!database) return [];

  return database.select().from(users).orderBy(desc(users.lastSignedIn));
}

export async function updateUserRole(
  userId: number,
  role: "user" | "admin" | "operator" | "moderator" | "speaker" | "legal",
  expiresAt?: Date
) {
  const database = await getDb();
  if (!database) return null;

  return database
    .update(users)
    .set({ role, roleExpiresAt: expiresAt })
    .where(eq(users.id, userId))
    .then(() => ({ success: true }));
}

export async function updateUserProfile(
  userId: number,
  profile: {
    name?: string;
    jobTitle?: string;
    organisation?: string;
    bio?: string;
    phone?: string;
    linkedinUrl?: string;
    timezone?: string;
  }
) {
  const database = await getDb();
  if (!database) return null;

  const updateData: Record<string, any> = {};
  if (profile.name !== undefined) updateData.name = profile.name;
  if (profile.jobTitle !== undefined) updateData.jobTitle = profile.jobTitle;
  if (profile.organisation !== undefined) updateData.organisation = profile.organisation;
  if (profile.bio !== undefined) updateData.bio = profile.bio;
  if (profile.phone !== undefined) updateData.phone = profile.phone;
  if (profile.linkedinUrl !== undefined) updateData.linkedinUrl = profile.linkedinUrl;
  if (profile.timezone !== undefined) updateData.timezone = profile.timezone;

  return database
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .then(() => ({ success: true }));
}
