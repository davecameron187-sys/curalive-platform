import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc } from "drizzle-orm";
import { InsertUser, users, speakerPaceResults, InsertSpeakerPaceResult } from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.id);
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "operator") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  profile: {
    name?: string | null;
    jobTitle?: string | null;
    organisation?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    timezone?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Filter out undefined keys so we only update what was provided
  const updateSet = Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(updateSet).length === 0) return;
  await db.update(users).set(updateSet).where(eq(users.id, userId));
}

// ─── Speaking-Pace Coach helpers ─────────────────────────────────────────────

/** Persist a batch of per-speaker pace results for one event. */
export async function savePaceResults(rows: InsertSpeakerPaceResult[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return;
  await db.insert(speakerPaceResults).values(rows);
}

/** Fetch the last N pace results for a given speaker across all events. */
export async function getPaceHistory(speaker: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(speakerPaceResults)
    .where(eq(speakerPaceResults.speaker, speaker))
    .orderBy(desc(speakerPaceResults.analysedAt))
    .limit(limit);
}

/** Fetch all pace results for a specific event. */
export async function getEventPaceResults(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(speakerPaceResults)
    .where(eq(speakerPaceResults.eventId, eventId));
}

// TODO: add feature queries here as your schema grows.

// ──────────────────────────────────────────────────────────────────────────────
// Synchronous db export — used by modules that import `db` directly.
// Falls back to a lazy-initialised instance so tests without DATABASE_URL
// still import without crashing (queries will throw at runtime).
// ──────────────────────────────────────────────────────────────────────────────

function buildSyncDb() {
  if (process.env.DATABASE_URL) {
    try {
      return drizzle(process.env.DATABASE_URL);
    } catch {
      // ignore — tests may not have a real DB
    }
  }
  // Return a proxy that throws a clear error on first use
  return new Proxy({} as ReturnType<typeof drizzle>, {
    get(_target, prop) {
      if (prop === "then") return undefined; // not a Promise
      throw new Error(
        `[db] Cannot call db.${String(prop)}() — DATABASE_URL is not set. ` +
          "Use getDb() for async-safe access."
      );
    },
  });
}

/** Synchronous Drizzle instance (used by legacy imports). */
export const db = buildSyncDb();

// ──────────────────────────────────────────────────────────────────────────────
// Feedback helpers (used by feedback.test.ts)
// ──────────────────────────────────────────────────────────────────────────────
import { userFeedback } from "../drizzle/schema";

export async function submitFeedback(input: {
  rating: number;
  suggestion?: string | null;
  email?: string | null;
  userId?: number | null;
  pageUrl?: string | null;
  ipAddress?: string | null;
}): Promise<{ id: number }> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  const result = await dbInstance.insert(userFeedback).values({
    rating: input.rating,
    suggestion: input.suggestion ?? null,
    email: input.email ?? null,
    userId: input.userId ?? null,
    pageUrl: input.pageUrl ?? null,
    ipAddress: input.ipAddress ?? null,
  });
  return { id: (result as any).insertId ?? 0 };
}

export async function getRecentFeedback(limit = 20) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];
  return dbInstance
    .select()
    .from(userFeedback)
    .orderBy(desc(userFeedback.createdAt))
    .limit(limit);
}
