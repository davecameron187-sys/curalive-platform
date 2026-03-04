/**
 * Webphone tRPC router — handles token generation, session logging, and carrier management.
 *
 * Procedures:
 *   webphone.getToken          — returns a Twilio or Telnyx credential for the active carrier
 *   webphone.getCarrierStatus  — returns health of both carriers
 *   webphone.setCarrierStatus  — operator override to mark a carrier healthy/degraded/down
 *   webphone.logSession        — create a session record when a call starts
 *   webphone.endSession        — update session with duration/status when a call ends
 *   webphone.getSessionHistory — return last N sessions for the current user
 */

import { z } from "zod";
import { router, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { webphoneSessions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { generateTwilioToken } from "../webphone/twilio";
import { getTelnyxCredentials } from "../webphone/telnyx";
import {
  getActiveCarrier,
  getAllCarrierHealth,
  triggerFailover,
  restoreCarrier,
  setCarrierStatus,
  type Carrier,
} from "../webphone/carrierManager";

export const webphoneRouter = router({
  /**
   * Get a WebRTC token/credentials for the active carrier.
   * If the primary carrier fails, automatically triggers failover to the fallback.
   */
  getToken: operatorProcedure
    .input(z.object({
      preferredCarrier: z.enum(["twilio", "telnyx", "auto"]).optional().default("auto"),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Determine which carrier to use
      let carrier: Carrier = input.preferredCarrier === "auto"
        ? await getActiveCarrier()
        : input.preferredCarrier;

      // Try primary carrier
      if (carrier === "twilio") {
        const result = generateTwilioToken(userId);
        if (result) return { ...result, failoverUsed: false };

        // Twilio failed — trigger failover
        await triggerFailover("twilio");
        carrier = "telnyx";
      }

      // Try Telnyx (either as primary choice or as failover)
      if (carrier === "telnyx") {
        const result = getTelnyxCredentials(userId);
        if (result) {
          const failoverUsed = input.preferredCarrier !== "telnyx";
          return { ...result, failoverUsed };
        }

        // Both carriers failed
        await triggerFailover("telnyx");
        throw new Error("Both carriers are unavailable. Please contact your administrator.");
      }

      throw new Error("Unable to generate webphone credentials.");
    }),

  /**
   * Return the health status of both carriers.
   */
  getCarrierStatus: operatorProcedure.query(async () => {
    return await getAllCarrierHealth();
  }),

  /**
   * Operator override — manually set a carrier's status.
   */
  setCarrierStatus: operatorProcedure
    .input(z.object({
      carrier: z.enum(["twilio", "telnyx"]),
      status: z.enum(["healthy", "degraded", "down"]),
    }))
    .mutation(async ({ input }) => {
      if (input.status === "healthy") {
        await restoreCarrier(input.carrier as Carrier);
      } else {
        await setCarrierStatus(input.carrier as Carrier, input.status);
      }
      return { success: true };
    }),

  /**
   * Log a new call session when a call is initiated.
   */
  logSession: operatorProcedure
    .input(z.object({
      carrier: z.enum(["twilio", "telnyx"]),
      direction: z.enum(["outbound", "inbound"]).default("outbound"),
      remoteNumber: z.string().max(32).optional(),
      conferenceId: z.number().int().optional(),
      callSid: z.string().max(128).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { id: -1 };

      const [result] = await db.insert(webphoneSessions).values({
        userId: ctx.user.id,
        carrier: input.carrier,
        direction: input.direction,
        remoteNumber: input.remoteNumber ?? null,
        conferenceId: input.conferenceId ?? null,
        callSid: input.callSid ?? null,
        status: "initiated",
        startedAt: Date.now(),
      });

      return { id: (result as { insertId: number }).insertId };
    }),

  /**
   * Update a session when the call ends.
   */
  endSession: operatorProcedure
    .input(z.object({
      sessionId: z.number().int().positive(),
      status: z.enum(["completed", "failed", "no_answer"]),
      durationSecs: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(webphoneSessions)
        .set({
          status: input.status,
          durationSecs: input.durationSecs ?? null,
          endedAt: Date.now(),
        })
        .where(eq(webphoneSessions.id, input.sessionId));

      return { success: true };
    }),

  /**
   * Return the last N call sessions for the current user.
   */
  getSessionHistory: operatorProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(webphoneSessions)
        .where(eq(webphoneSessions.userId, ctx.user.id))
        .orderBy(desc(webphoneSessions.startedAt))
        .limit(input.limit);
    }),
});
