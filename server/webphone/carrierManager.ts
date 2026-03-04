/**
 * Carrier Manager — determines which carrier (Twilio or Telnyx) should be used
 * for a given call, and handles automatic failover between them.
 *
 * Architecture:
 *   Primary:  Twilio  (WebRTC + PSTN, already referenced in codebase)
 *   Fallback: Telnyx  (lowest per-minute cost, strong Africa/EMEA coverage)
 *
 * Failover triggers:
 *   - Token generation fails for the primary carrier
 *   - DB carrier status is "down" or "degraded" for the primary
 *   - Explicit operator override via the Webphone UI
 */

import { getDb } from "../db";
import { webphoneCarrierStatus } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type Carrier = "twilio" | "telnyx";

export interface CarrierHealth {
  carrier: Carrier;
  status: "healthy" | "degraded" | "down";
  failoverActive: boolean;
  lastCheckedAt: number;
}

/**
 * Seed initial carrier rows if they don't exist yet.
 * Called once at server startup.
 */
export async function seedCarrierStatus(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  for (const carrier of ["twilio", "telnyx"] as Carrier[]) {
    await db
      .insert(webphoneCarrierStatus)
      .values({ carrier, status: "healthy", failoverActive: false, lastCheckedAt: Date.now() })
      .onDuplicateKeyUpdate({ set: { lastCheckedAt: Date.now() } });
  }
}

/**
 * Return the health status of both carriers from the DB.
 */
export async function getAllCarrierHealth(): Promise<CarrierHealth[]> {
  const db = await getDb();
  if (!db) {
    return [
      { carrier: "twilio", status: "healthy", failoverActive: false, lastCheckedAt: Date.now() },
      { carrier: "telnyx", status: "healthy", failoverActive: false, lastCheckedAt: Date.now() },
    ];
  }
  const rows = await db.select().from(webphoneCarrierStatus);
  return rows.map(r => ({
    carrier: r.carrier as Carrier,
    status: r.status as CarrierHealth["status"],
    failoverActive: r.failoverActive,
    lastCheckedAt: r.lastCheckedAt ?? Date.now(),
  }));
}

/**
 * Determine which carrier to use for a new call.
 * Returns "twilio" unless Twilio is down/degraded and Telnyx is healthy.
 */
export async function getActiveCarrier(): Promise<Carrier> {
  const health = await getAllCarrierHealth();
  const twilio = health.find(h => h.carrier === "twilio");
  const telnyx = health.find(h => h.carrier === "telnyx");

  // If Twilio is down or failover is active, use Telnyx
  if (twilio?.status === "down" || twilio?.failoverActive) {
    return "telnyx";
  }
  // If Twilio is degraded and Telnyx is healthy, prefer Telnyx
  if (twilio?.status === "degraded" && telnyx?.status === "healthy") {
    return "telnyx";
  }
  return "twilio";
}

/**
 * Mark a carrier as down and activate failover to the other carrier.
 * Called automatically when token generation fails.
 */
export async function triggerFailover(failedCarrier: Carrier): Promise<void> {
  const db = await getDb();
  if (!db) return;

  console.warn(`[CarrierManager] Triggering failover — ${failedCarrier} is unavailable`);

  await db
    .update(webphoneCarrierStatus)
    .set({ status: "down", failoverActive: true, lastCheckedAt: Date.now() })
    .where(eq(webphoneCarrierStatus.carrier, failedCarrier));

  // Mark the other carrier as active primary
  const fallback: Carrier = failedCarrier === "twilio" ? "telnyx" : "twilio";
  await db
    .update(webphoneCarrierStatus)
    .set({ status: "healthy", failoverActive: false, lastCheckedAt: Date.now() })
    .where(eq(webphoneCarrierStatus.carrier, fallback));
}

/**
 * Restore a carrier to healthy status (called by operator or health check).
 */
export async function restoreCarrier(carrier: Carrier): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(webphoneCarrierStatus)
    .set({ status: "healthy", failoverActive: false, lastCheckedAt: Date.now() })
    .where(eq(webphoneCarrierStatus.carrier, carrier));
}

/**
 * Update carrier status (used by operator override in the UI).
 */
export async function setCarrierStatus(
  carrier: Carrier,
  status: "healthy" | "degraded" | "down"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(webphoneCarrierStatus)
    .set({ status, lastCheckedAt: Date.now() })
    .where(eq(webphoneCarrierStatus.carrier, carrier));
}
