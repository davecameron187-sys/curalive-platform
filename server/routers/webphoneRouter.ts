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
import twilio from "twilio";
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

  /**
   * Return all call sessions for a specific event (by conferenceId or all if null).
   * Used by the Post-Event Webphone Activity report.
   */
  getEventSessions: operatorProcedure
    .input(z.object({
      conferenceId: z.number().int().optional(),
      limit: z.number().int().min(1).max(200).default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const { and, isNotNull } = await import("drizzle-orm");

      const conditions = input.conferenceId != null
        ? eq(webphoneSessions.conferenceId, input.conferenceId)
        : isNotNull(webphoneSessions.id); // all sessions

      const rows = await db
        .select()
        .from(webphoneSessions)
        .where(conditions)
        .orderBy(desc(webphoneSessions.startedAt))
        .limit(input.limit);

      // Aggregate stats
      const totalCalls = rows.length;
      const completedCalls = rows.filter(r => r.status === "completed").length;
      const failedCalls = rows.filter(r => r.status === "failed" || r.status === "no_answer").length;
      const totalMinutes = rows.reduce((sum, r) => sum + (r.durationSecs ?? 0), 0) / 60;
      const twilioCount = rows.filter(r => r.carrier === "twilio").length;
      const telnyxCount = rows.filter(r => r.carrier === "telnyx").length;
      const failoverEvents = rows.filter(r => r.carrier === "telnyx" && r.direction === "outbound").length;

      return {
        sessions: rows,
        stats: {
          totalCalls,
          completedCalls,
          failedCalls,
          totalMinutes: Math.round(totalMinutes * 10) / 10,
          twilioCount,
          telnyxCount,
          failoverEvents,
        },
      };
    }),

  /**
   * getCallerIds — fetches all verified outbound caller IDs from Twilio.
   * Returns a list of { phoneNumber, friendlyName, type } objects.
   * Combines both purchased Twilio numbers and verified outgoing caller IDs.
   */
  getCallerIds: operatorProcedure.query(async () => {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        // Fall back to the env-configured caller ID
        const defaultId = process.env.TWILIO_CALLER_ID ?? "";
        return defaultId
          ? [{ phoneNumber: defaultId, friendlyName: "Default", type: "purchased" as const }]
          : [];
      }

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const headers = { Authorization: `Basic ${auth}` };

      // Fetch purchased phone numbers (always verified for outbound)
      const [numbersRes, callerIdsRes] = await Promise.all([
        fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=50`,
          { headers }
        ),
        fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/OutgoingCallerIds.json?PageSize=50`,
          { headers }
        ),
      ]);

      const numbersData = await numbersRes.json() as {
        incoming_phone_numbers?: Array<{ phone_number: string; friendly_name: string }>;
      };
      const callerIdsData = await callerIdsRes.json() as {
        outgoing_caller_ids?: Array<{ phone_number: string; friendly_name: string }>;
      };

      const seen = new Set<string>();
      const results: Array<{ phoneNumber: string; friendlyName: string; type: "purchased" | "verified" }> = [];

      for (const n of numbersData.incoming_phone_numbers ?? []) {
        if (!seen.has(n.phone_number)) {
          seen.add(n.phone_number);
          results.push({ phoneNumber: n.phone_number, friendlyName: n.friendly_name, type: "purchased" });
        }
      }
      for (const c of callerIdsData.outgoing_caller_ids ?? []) {
        if (!seen.has(c.phone_number)) {
          seen.add(c.phone_number);
          results.push({ phoneNumber: c.phone_number, friendlyName: c.friendly_name, type: "verified" });
        }
      }

      return results;
    } catch (err: any) {
      console.error("[Webphone] getCallerIds error:", err.message);
      const defaultId = process.env.TWILIO_CALLER_ID ?? "";
      return defaultId
        ? [{ phoneNumber: defaultId, friendlyName: "Default", type: "purchased" as const }]
        : [];
    }
  }),

  /**
   * getAccountStatus — fetches the real Twilio account type to determine if trial banner should show.
   * Returns { isTrial: boolean, accountType: string, friendlyName: string }
   */
  getAccountStatus: operatorProcedure.query(async () => {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const apiKey = process.env.TWILIO_API_KEY;
      const apiSecret = process.env.TWILIO_API_SECRET;
      if (!accountSid || !apiKey || !apiSecret) {
        return { isTrial: false, accountType: "unknown", friendlyName: "" };
      }
      const client = twilio(apiKey, apiSecret, { accountSid });
      const account = await client.api.accounts(accountSid).fetch();
      // Twilio trial accounts have type "Trial"
      const isTrial = account.type === "Trial";
      return {
        isTrial,
        accountType: account.type ?? "Full",
        friendlyName: account.friendlyName ?? "",
      };
    } catch (err: any) {
      console.error("[Webphone] getAccountStatus error:", err.message);
      // On error, assume not trial to avoid false warnings
      return { isTrial: false, accountType: "unknown", friendlyName: "" };
    }
  }),
});
