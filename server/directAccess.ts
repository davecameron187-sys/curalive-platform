/**
 * directAccess.ts — CuraLive Direct (Diamond Pass equivalent)
 *
 * Provides PIN generation, uniqueness checking, and lookup helpers for the
 * auto-admit IVR flow. Registered participants receive a unique 5-digit PIN
 * in their confirmation email; when they dial in and enter the PIN, the IVR
 * auto-routes them to the conference bridge without operator intervention.
 */
import { getDb } from "./db";
import {
  attendeeRegistrations,
  diamondPassRegistrations,
  occConferences,
  directAccessLog,
  type InsertDirectAccessLog,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── PIN Generation ───────────────────────────────────────────────────────────

/**
 * Generate a random 5-digit PIN string (10000–99999).
 * The leading digit is always 1–9 so the PIN never starts with 0.
 */
export function generatePin(): string {
  const pin = Math.floor(10000 + Math.random() * 90000);
  return String(pin);
}

/**
 * Generate a PIN that is unique within the given event.
 * Retries up to 20 times before throwing.
 */
export async function generateUniquePin(eventId: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  for (let attempt = 0; attempt < 20; attempt++) {
    const pin = generatePin();
    const existing = await db
      .select({ id: attendeeRegistrations.id })
      .from(attendeeRegistrations)
      .where(
        and(
          eq(attendeeRegistrations.eventId, eventId),
          eq(attendeeRegistrations.accessPin, pin)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const existingDiamond = await db
      .select({ id: diamondPassRegistrations.id })
      .from(diamondPassRegistrations)
      .where(
        and(
          eq(diamondPassRegistrations.eventId, eventId),
          eq(diamondPassRegistrations.pin, pin)
        )
      )
      .limit(1);

    if (existingDiamond.length === 0) return pin;
  }

  throw new Error("Could not generate a unique PIN after 20 attempts");
}

/**
 * Generate a Diamond Pass PIN unique across DP registrations.
 * Also avoids collisions with attendee access pins for the same event.
 */
export async function generateUniqueDiamondPassPin(eventId: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  for (let attempt = 0; attempt < 30; attempt++) {
    const pin = generatePin();

    const existingDiamond = await db
      .select({ id: diamondPassRegistrations.id })
      .from(diamondPassRegistrations)
      .where(eq(diamondPassRegistrations.pin, pin))
      .limit(1);

    if (existingDiamond.length > 0) {
      continue;
    }

    const existingAttendee = await db
      .select({ id: attendeeRegistrations.id })
      .from(attendeeRegistrations)
      .where(
        and(
          eq(attendeeRegistrations.eventId, eventId),
          eq(attendeeRegistrations.accessPin, pin)
        )
      )
      .limit(1);

    if (existingAttendee.length === 0) {
      return pin;
    }
  }

  throw new Error("Could not generate unique Diamond Pass PIN");
}

// ─── PIN Lookup ───────────────────────────────────────────────────────────────

/**
 * Look up a registration by PIN for a specific event.
 * Returns the registration row if found, otherwise null.
 */
export async function lookupPinForEvent(
  eventId: string,
  pin: string
): Promise<(typeof attendeeRegistrations.$inferSelect) | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(attendeeRegistrations)
    .where(
      and(
        eq(attendeeRegistrations.eventId, eventId),
        eq(attendeeRegistrations.accessPin, pin)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Look up a Diamond Pass registration by PIN for a specific event.
 */
export async function lookupDiamondPassForEvent(
  eventId: string,
  pin: string
): Promise<(typeof diamondPassRegistrations.$inferSelect) | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(diamondPassRegistrations)
    .where(
      and(
        eq(diamondPassRegistrations.eventId, eventId),
        eq(diamondPassRegistrations.pin, pin)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Mark a PIN as used (record the timestamp of first use).
 * The PIN is NOT invalidated after first use — callers who get disconnected
 * can re-enter without operator help.
 */
export async function markPinUsed(registrationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(attendeeRegistrations)
    .set({ pinUsedAt: new Date() })
    .where(eq(attendeeRegistrations.id, registrationId));
}

export async function markDiamondPassJoined(registrationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(diamondPassRegistrations)
    .set({
      status: "joined",
      joinedAt: new Date(),
    })
    .where(eq(diamondPassRegistrations.id, registrationId));
}

// ─── Conference lookup by dial-in number ─────────────────────────────────────

/**
 * Find the currently-running OCC conference for a given dial-in number.
 * Used by the IVR to determine which conference a caller is trying to reach.
 */
export async function findRunningConferenceByDialIn(
  dialInNumber: string
): Promise<(typeof occConferences.$inferSelect) | null> {
  const db = await getDb();
  if (!db) return null;

  // Normalise: strip spaces, dashes, parentheses, dots
  const normalised = dialInNumber.replace(/[\s\-().+]/g, "");

  const rows = await db
    .select()
    .from(occConferences)
    .where(eq(occConferences.status, "running"))
    .limit(50);

  const match = rows.find((c) => {
    if (!c.dialInNumber) return false;
    const n = c.dialInNumber.replace(/[\s\-().+]/g, "");
    return n === normalised || n.endsWith(normalised) || normalised.endsWith(n);
  });

  return match ?? null;
}

// ─── Audit log ───────────────────────────────────────────────────────────────

/**
 * Write an entry to the direct_access_log table for every PIN attempt.
 */
export async function logDirectAccessAttempt(
  entry: Omit<InsertDirectAccessLog, "id" | "createdAt" | "attemptedAt">
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(directAccessLog).values({
    ...entry,
    attemptedAt: Date.now(),
  });
}

// ─── Recent PIN activity for OCC status panel ─────────────────────────────────

/**
 * Return the last N direct-access attempts for a given conference.
 * Used by the OCC Direct Access status panel.
 */
export async function getRecentDirectAccessAttempts(
  conferenceId: number,
  limit = 20
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(directAccessLog)
    .where(eq(directAccessLog.conferenceId, conferenceId))
    .orderBy(desc(directAccessLog.attemptedAt))
    .limit(limit);
}

/**
 * Get summary stats for a conference's direct access activity.
 */
export async function getDirectAccessStats(conferenceId: number) {
  const attempts = await getRecentDirectAccessAttempts(conferenceId, 200);
  const admitted = attempts.filter((a) => a.outcome === "admitted").length;
  const failed = attempts.filter((a) => a.outcome === "failed").length;
  const operatorQueue = attempts.filter((a) => a.outcome === "operator_queue").length;
  const noConference = attempts.filter((a) => a.outcome === "no_conference").length;
  return {
    total: attempts.length,
    admitted,
    failed,
    operatorQueue,
    noConference,
    admitRate: attempts.length > 0 ? Math.round((admitted / attempts.length) * 100) : 0,
    recent: attempts.slice(0, 20),
  };
}
