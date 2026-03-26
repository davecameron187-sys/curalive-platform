import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import { InsertUser, users, speakerPaceResults, InsertSpeakerPaceResult } from "../drizzle/schema";
import { ENV } from './_core/env';
import pg from "pg";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

function getConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith("postgresql://") || url.startsWith("postgres://"))) return url;
  const { PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || "5432"}/${PGDATABASE}`;
  }
  return undefined;
}

function getPool(): pg.Pool | null {
  if (!_pool) {
    const connStr = getConnectionString();
    if (connStr) {
      _pool = new pg.Pool({
        connectionString: connStr,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      });
    }
  }
  return _pool;
}

export async function getDb() {
  if (!_db) {
    const pool = getPool();
    if (pool) {
      try {
        _db = drizzle(pool);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

export async function rawSql(sql: string, params: any[] = []): Promise<[any[], any]> {
  const pool = getPool();
  if (!pool) throw new Error("Database not available");
  let pgSql = mysqlToPostgres(sql);
  const pgParams = params.filter(p => p !== undefined).map(p => {
    if (typeof p === "number" && p > 1_000_000_000_000 && p < 10_000_000_000_000) {
      return new Date(p);
    }
    return p;
  });
  const isInsert = /^\s*INSERT\s+INTO\s+/i.test(pgSql);
  if (isInsert && !/RETURNING\s+/i.test(pgSql)) {
    pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
  }
  try {
    const result = await pool.query(pgSql, pgParams);
    const rows = result.rows;
    if (isInsert && rows.length > 0 && rows[0]?.id != null) {
      (rows as any).insertId = rows[0].id;
    }
    return [rows, result.fields];
  } catch (err: any) {
    console.error("[rawSql] Query failed:", pgSql.slice(0, 200), "\nParams:", pgParams.length, "\nError:", err.message);
    throw err;
  }
}

function mysqlToPostgres(sql: string): string {
  let s = sql;
  s = s.replace(/`/g, '"');
  let idx = 0;
  s = s.replace(/\?/g, () => `$${++idx}`);
  s = s.replace(/ON DUPLICATE KEY UPDATE\s+(.+?)(?:;|\s*$)/gi, (_, updates) => {
    const cleanUpdates = updates.replace(/VALUES\(([^)]+)\)/gi, 'EXCLUDED.$1');
    return `ON CONFLICT DO UPDATE SET ${cleanUpdates}`;
  });
  s = s.replace(/IFNULL\(/gi, 'COALESCE(');
  s = s.replace(/NOW\(\)/gi, 'NOW()');
  s = s.replace(/DATE_SUB\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+)\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR)\s*\)/gi,
    (_, num, unit) => `(NOW() - INTERVAL '${num} ${unit.toLowerCase()}s')`);
  s = s.replace(/DATE_ADD\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+)\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH|YEAR)\s*\)/gi,
    (_, num, unit) => `(NOW() + INTERVAL '${num} ${unit.toLowerCase()}s')`);
  s = s.replace(/LIMIT\s+\$(\d+)\s*,\s*\$(\d+)/gi, 'LIMIT $$$2 OFFSET $$$1');
  return s;
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

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
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
  const pool = getPool();
  if (pool) {
    try {
      return drizzle(pool);
    } catch {
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
  const [result] = await dbInstance.insert(userFeedback).values({
    rating: input.rating,
    suggestion: input.suggestion ?? null,
    email: input.email ?? null,
    userId: input.userId ?? null,
    pageUrl: input.pageUrl ?? null,
    ipAddress: input.ipAddress ?? null,
  }).returning();
  return { id: result.id };
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


// ─────────────────────────────────────────────────────────────────────────────
// Post-Event Data Helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function savePostEventData(data: {
  eventId: string;
  conferenceId?: number;
  aiSummary?: string;
  keyTopics?: string;
  sentimentTrends?: string;
  keyQuotes?: string;
  fullTranscript?: string;
  transcriptFormat?: string;
  recordingUrl?: string;
  recordingKey?: string;
  recordingDurationSeconds?: number;
  complianceScore?: number;
  flaggedItems?: string;
  totalParticipants?: number;
  totalDuration?: number;
  engagementScore?: number;
  analyticsData?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { postEventData } = await import("../drizzle/schema");
  
  return db.insert(postEventData).values({
    eventId: data.eventId,
    conferenceId: data.conferenceId,
    aiSummary: data.aiSummary,
    keyTopics: data.keyTopics,
    sentimentTrends: data.sentimentTrends,
    keyQuotes: data.keyQuotes,
    fullTranscript: data.fullTranscript,
    transcriptFormat: data.transcriptFormat,
    recordingUrl: data.recordingUrl,
    recordingKey: data.recordingKey,
    recordingDurationSeconds: data.recordingDurationSeconds,
    complianceScore: data.complianceScore,
    flaggedItems: data.flaggedItems,
    totalParticipants: data.totalParticipants,
    totalDuration: data.totalDuration,
    engagementScore: data.engagementScore,
    analyticsData: data.analyticsData,
  });
}

export async function getPostEventData(eventId: string) {
  const db = await getDb();
  if (!db) return null;

  const { postEventData } = await import("../drizzle/schema");
  const result = await db.select().from(postEventData).where(eq(postEventData.eventId, eventId)).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Integration Helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function createStripeCustomer(userId: number, stripeCustomerId: string, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { stripeCustomers } = await import("../drizzle/schema");
  
  return db.insert(stripeCustomers).values({
    userId,
    stripeCustomerId,
    email,
  });
}

export async function getStripeCustomer(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const { stripeCustomers } = await import("../drizzle/schema");
  const result = await db.select().from(stripeCustomers).where(eq(stripeCustomers.userId, userId)).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function createStripeSubscription(userId: number, subscriptionData: {
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: "active" | "past_due" | "unpaid" | "canceled" | "incomplete";
  tier: "basic" | "professional" | "enterprise";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { stripeSubscriptions } = await import("../drizzle/schema");
  
  return db.insert(stripeSubscriptions).values({
    userId,
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
    stripePriceId: subscriptionData.stripePriceId,
    status: subscriptionData.status,
    tier: subscriptionData.tier,
    currentPeriodStart: subscriptionData.currentPeriodStart,
    currentPeriodEnd: subscriptionData.currentPeriodEnd,
  });
}

export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const { stripeSubscriptions } = await import("../drizzle/schema");
  const result = await db.select().from(stripeSubscriptions).where(
    eq(stripeSubscriptions.userId, userId)
  ).orderBy(desc(stripeSubscriptions.createdAt)).limit(1);
  
  return result.length > 0 && result[0].status === "active" ? result[0] : null;
}

export async function updateSubscriptionStatus(subscriptionId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { stripeSubscriptions } = await import("../drizzle/schema");
  
  return db.update(stripeSubscriptions).set({
    status: status as any,
  }).where(eq(stripeSubscriptions.stripeSubscriptionId, subscriptionId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium Features Helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function createPremiumFeatures(userId: number, tier: "basic" | "professional" | "enterprise") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { premiumFeatures } = await import("../drizzle/schema");
  
  const featureMap = {
    basic: {
      advancedAnalytics: false,
      complianceReporting: false,
      whiteLabel: false,
      multiLanguageTranscription: false,
      customBranding: false,
      apiAccess: false,
      maxEventsPerMonth: 5,
      maxParticipantsPerEvent: 500,
      storageGbPerMonth: 10,
    },
    professional: {
      advancedAnalytics: true,
      complianceReporting: true,
      whiteLabel: false,
      multiLanguageTranscription: true,
      customBranding: false,
      apiAccess: true,
      maxEventsPerMonth: 50,
      maxParticipantsPerEvent: 5000,
      storageGbPerMonth: 100,
    },
    enterprise: {
      advancedAnalytics: true,
      complianceReporting: true,
      whiteLabel: true,
      multiLanguageTranscription: true,
      customBranding: true,
      apiAccess: true,
      maxEventsPerMonth: 999,
      maxParticipantsPerEvent: 99999,
      storageGbPerMonth: 1000,
    },
  };

  return db.insert(premiumFeatures).values({
    userId,
    ...featureMap[tier],
  });
}

export async function getPremiumFeatures(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const { premiumFeatures } = await import("../drizzle/schema");
  const result = await db.select().from(premiumFeatures).where(eq(premiumFeatures.userId, userId)).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function logStripePaymentEvent(stripeEventId: string, eventType: string, userId: number | null, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { stripePaymentEvents } = await import("../drizzle/schema");
  
  return db.insert(stripePaymentEvents).values({
    stripeEventId,
    eventType,
    userId,
    data: JSON.stringify(data),
  });
}
