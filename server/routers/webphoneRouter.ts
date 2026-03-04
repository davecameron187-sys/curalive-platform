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
import { eq, desc, and, gte, sql } from "drizzle-orm";
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

// ─── Twilio error code → user-friendly message map ─────────────────────────
const TWILIO_ERROR_MAP: Record<number, string> = {
  13224: "Invalid phone number format. Please use E.164 format (e.g. +27821234567).",
  13225: "Caller ID is not a verified Twilio number. Contact your administrator.",
  13227: "Destination number is not reachable or has been disconnected.",
  13228: "The call was rejected by the destination carrier.",
  13230: "The destination number is busy. Try again later.",
  13231: "The call timed out — no answer from the remote party.",
  13233: "International calling is not enabled on this Twilio account.",
  13235: "The destination country is not supported. Contact your administrator.",
  20101: "Access token is invalid or expired. Please refresh the page.",
  20103: "Access token has expired. Please refresh the page to get a new token.",
  20104: "Access token not yet valid. Check your system clock.",
  31002: "Connection declined by Twilio. Check your TwiML App configuration.",
  31003: "Connection timed out. Check your internet connection.",
  31005: "WebSocket connection to Twilio failed. Check your firewall settings.",
  31009: "Transport error — your internet connection may be unstable.",
  31201: "Authentication failed. Your Twilio credentials may be invalid.",
  31204: "Twilio Voice SDK could not register. Check your TwiML App SID.",
  31205: "JWT token expired during the call. Please refresh and try again.",
  31208: "Media connection failed. Check your microphone permissions and firewall.",
  31401: "Insufficient funds in your Twilio account. Please top up your balance.",
  31480: "The number you dialled did not answer.",
  31486: "The number you dialled is busy.",
  31603: "The call was rejected by the remote party.",
};

/**
 * Convert a Twilio error code to a human-readable message.
 */
function friendlyTwilioError(code: number | undefined, fallback: string): string {
  if (code && TWILIO_ERROR_MAP[code]) return TWILIO_ERROR_MAP[code];
  return fallback;
}

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
   * Get available caller IDs — fetches purchased Twilio numbers and verified outgoing caller IDs.
   */
  getCallerIds: operatorProcedure.query(async () => {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) return { callerIds: [], defaultCallerId: process.env.TWILIO_CALLER_ID ?? "" };

      const client = twilio(accountSid, authToken);
      const numbers: Array<{ number: string; label: string; type: string }> = [];

      // Fetch purchased incoming phone numbers
      const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
      for (const n of incomingNumbers) {
        numbers.push({
          number: n.phoneNumber,
          label: n.friendlyName || n.phoneNumber,
          type: "purchased",
        });
      }

      // Fetch verified outgoing caller IDs
      const outgoingCallerIds = await client.outgoingCallerIds.list({ limit: 20 });
      for (const c of outgoingCallerIds) {
        // Skip if already in purchased numbers
        if (!numbers.find(n => n.number === c.phoneNumber)) {
          numbers.push({
            number: c.phoneNumber,
            label: c.friendlyName || c.phoneNumber,
            type: "verified",
          });
        }
      }

      return {
        callerIds: numbers,
        defaultCallerId: process.env.TWILIO_CALLER_ID ?? (numbers[0]?.number ?? ""),
      };
    } catch (err: any) {
      console.error("[Webphone] getCallerIds error:", err.message);
      return { callerIds: [], defaultCallerId: process.env.TWILIO_CALLER_ID ?? "" };
    }
  }),

  /**
   * Translate a Twilio error code to a human-readable message.
   */
  translateError: operatorProcedure
    .input(z.object({ code: z.number().int(), fallback: z.string().optional() }))
    .query(({ input }) => {
      return { message: friendlyTwilioError(input.code, input.fallback ?? "An unknown error occurred.") };
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

  /**
   * Configure inbound routing — updates a Twilio phone number's Voice URL
   * to point to our /api/webphone/inbound endpoint.
   */
  configureInboundRouting: operatorProcedure
    .input(z.object({
      phoneNumber: z.string().optional(),
      voiceUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
          return { success: false, error: "Twilio credentials not configured." };
        }

        const client = twilio(accountSid, authToken);

        // Determine the target phone number — use input or first purchased number
        let targetSid: string | null = null;
        let targetNumber = input.phoneNumber ?? "";

        const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });

        if (targetNumber) {
          const match = incomingNumbers.find(n => n.phoneNumber === targetNumber);
          if (match) targetSid = match.sid;
        } else if (incomingNumbers.length > 0) {
          targetSid = incomingNumbers[0].sid;
          targetNumber = incomingNumbers[0].phoneNumber;
        }

        if (!targetSid) {
          return { success: false, error: `Phone number ${targetNumber || '(none)'} not found in your Twilio account.` };
        }

        // Determine the Voice URL — use the published domain or input override
        const appId = process.env.VITE_APP_ID ?? "";
        const defaultVoiceUrl = appId
          ? `https://${appId}.manus.space/api/webphone/inbound`
          : "";
        const voiceUrl = input.voiceUrl || defaultVoiceUrl;

        if (!voiceUrl) {
          return { success: false, error: "Cannot determine Voice URL. Set VITE_APP_ID or provide a voiceUrl." };
        }

        // Update the phone number's Voice URL
        await client.incomingPhoneNumbers(targetSid).update({
          voiceUrl,
          voiceMethod: "POST",
          statusCallback: voiceUrl.replace("/inbound", "/status"),
          statusCallbackMethod: "POST",
        });

        console.log(`[Webphone] Configured inbound routing: ${targetNumber} → ${voiceUrl}`);
        return {
          success: true,
          phoneNumber: targetNumber,
          voiceUrl,
          message: `Inbound calls to ${targetNumber} will now ring in the Webphone.`,
        };
      } catch (err: any) {
        console.error("[Webphone] configureInboundRouting error:", err.message);
        return { success: false, error: err.message };
      }
    }),

  /**
   * Get the current inbound routing configuration for all Twilio numbers.
   */
  getInboundRoutingStatus: operatorProcedure.query(async () => {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) return { numbers: [] };

      const client = twilio(accountSid, authToken);
      const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });

      const appId = process.env.VITE_APP_ID ?? "";
      const expectedUrl = appId ? `https://${appId}.manus.space/api/webphone/inbound` : "";

      return {
        numbers: incomingNumbers.map(n => ({
          phoneNumber: n.phoneNumber,
          friendlyName: n.friendlyName,
          voiceUrl: n.voiceUrl ?? "",
          isConfigured: expectedUrl ? (n.voiceUrl ?? "").includes("/api/webphone/inbound") : false,
        })),
      };
    } catch (err: any) {
      console.error("[Webphone] getInboundRoutingStatus error:", err.message);
      return { numbers: [] };
    }
  }),

  /**
   * Purchase a Telnyx phone number and assign it to the SIP connection.
   * Searches for available numbers in the specified country (default: US).
   */
  purchaseTelnyxNumber: operatorProcedure
    .input(z.object({
      countryCode: z.string().default("US"),
      areaCode: z.string().optional(),
      numberType: z.enum(["local", "toll_free", "national"]).default("local"),
    }))
    .mutation(async ({ input }) => {
      try {
        const apiKey = process.env.TELNYX_API_KEY;
        const connectionId = process.env.TELNYX_SIP_CONNECTION_ID;
        if (!apiKey) {
          return { success: false, error: "TELNYX_API_KEY not configured." };
        }

        const headers = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };

        // Step 1: Search for available numbers
        const searchParams = new URLSearchParams({
          "filter[country_code]": input.countryCode,
          "filter[features]": "sip_trunking",
          "filter[limit]": "5",
        });
        if (input.areaCode) {
          searchParams.set("filter[national_destination_code]", input.areaCode);
        }

        const searchRes = await fetch(
          `https://api.telnyx.com/v2/available_phone_numbers?${searchParams}`,
          { headers }
        );
        const searchData = await searchRes.json() as { data?: Array<{ phone_number: string; features?: Array<{ name: string }>; region_information?: Array<{ region_name: string }> }> };

        if (!searchData.data || searchData.data.length === 0) {
          return { success: false, error: `No ${input.numberType} numbers available in ${input.countryCode}${input.areaCode ? ` (area ${input.areaCode})` : ""}.` };
        }

        const availableNumber = searchData.data[0];
        console.log(`[Telnyx] Found available number: ${availableNumber.phone_number}`);

        // Step 2: Purchase the number
        const orderBody: Record<string, unknown> = {
          phone_numbers: [{ phone_number: availableNumber.phone_number }],
        };
        if (connectionId) {
          orderBody.connection_id = connectionId;
        }

        const orderRes = await fetch("https://api.telnyx.com/v2/number_orders", {
          method: "POST",
          headers,
          body: JSON.stringify(orderBody),
        });
        const orderData = await orderRes.json() as { data?: { id: string; status: string; phone_numbers?: Array<{ phone_number: string; status: string }> }; errors?: Array<{ detail: string }> };

        if (orderData.errors && orderData.errors.length > 0) {
          return { success: false, error: orderData.errors[0].detail };
        }

        const purchasedNumber = orderData.data?.phone_numbers?.[0]?.phone_number ?? availableNumber.phone_number;
        console.log(`[Telnyx] Purchased number: ${purchasedNumber}, order: ${orderData.data?.id}`);

        // Step 3: If connection ID is set, assign the number to the SIP connection
        if (connectionId) {
          try {
            // Update the phone number's connection
            await fetch(`https://api.telnyx.com/v2/phone_numbers/${purchasedNumber}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ connection_id: connectionId }),
            });
            console.log(`[Telnyx] Assigned ${purchasedNumber} to connection ${connectionId}`);
          } catch (assignErr: any) {
            console.warn(`[Telnyx] Failed to assign to connection: ${assignErr.message}`);
          }
        }

        return {
          success: true,
          phoneNumber: purchasedNumber,
          orderId: orderData.data?.id ?? "",
          connectionId: connectionId ?? null,
          message: `Purchased ${purchasedNumber}${connectionId ? ` and assigned to SIP connection ${connectionId}` : ""}.`,
        };
      } catch (err: any) {
        console.error("[Webphone] purchaseTelnyxNumber error:", err.message);
        return { success: false, error: err.message };
      }
    }),

  /**
   * List Telnyx phone numbers on the account.
   */
  getTelnyxNumbers: operatorProcedure.query(async () => {
    try {
      const apiKey = process.env.TELNYX_API_KEY;
      if (!apiKey) return { numbers: [] };

      const res = await fetch("https://api.telnyx.com/v2/phone_numbers?page[size]=20", {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const data = await res.json() as { data?: Array<{ phone_number: string; status: string; connection_id: string | null; connection_name: string | null }> };

      return {
        numbers: (data.data ?? []).map(n => ({
          phoneNumber: n.phone_number,
          status: n.status,
          connectionId: n.connection_id,
          connectionName: n.connection_name,
        })),
      };
    } catch (err: any) {
      console.error("[Webphone] getTelnyxNumbers error:", err.message);
      return { numbers: [] };
    }
  }),

  /**
   * Get aggregated webphone activity stats for the OCC dashboard.
   * Returns totals for today, this week, and all-time, plus per-carrier breakdown.
   */
  getActivityStats: operatorProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return getEmptyStats();

      const now = Date.now();
      const todayStart = now - (now % 86400000); // Start of UTC day
      const weekStart = todayStart - (6 * 86400000); // 7 days ago

      // All sessions
      const allSessions = await db
        .select()
        .from(webphoneSessions)
        .orderBy(desc(webphoneSessions.startedAt))
        .limit(500);

      const todaySessions = allSessions.filter(s => (s.startedAt ?? 0) >= todayStart);
      const weekSessions = allSessions.filter(s => (s.startedAt ?? 0) >= weekStart);

      // Currently active calls (status = 'initiated' and no endedAt)
      const activeCalls = allSessions.filter(s => s.status === "initiated" && !s.endedAt);

      const computeStats = (sessions: typeof allSessions) => {
        const total = sessions.length;
        const completed = sessions.filter(s => s.status === "completed").length;
        const failed = sessions.filter(s => s.status === "failed" || s.status === "no_answer").length;
        const totalSecs = sessions.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
        const avgDuration = total > 0 ? Math.round(totalSecs / total) : 0;
        const twilioCount = sessions.filter(s => s.carrier === "twilio").length;
        const telnyxCount = sessions.filter(s => s.carrier === "telnyx").length;
        const inbound = sessions.filter(s => s.direction === "inbound").length;
        const outbound = sessions.filter(s => s.direction === "outbound").length;
        return { total, completed, failed, totalSecs, avgDuration, twilioCount, telnyxCount, inbound, outbound };
      }

      return {
        today: computeStats(todaySessions),
        week: computeStats(weekSessions),
        allTime: computeStats(allSessions),
        activeCalls: activeCalls.length,
        recentCalls: allSessions.slice(0, 5).map(s => ({
          id: s.id,
          carrier: s.carrier,
          direction: s.direction,
          remoteNumber: s.remoteNumber,
          status: s.status,
          durationSecs: s.durationSecs,
          startedAt: s.startedAt,
        })),
      };
    } catch (err: any) {
      console.error("[Webphone] getActivityStats error:", err.message);
      return getEmptyStats();
    }
  }),
});

function getEmptyStats() {
  const empty = { total: 0, completed: 0, failed: 0, totalSecs: 0, avgDuration: 0, twilioCount: 0, telnyxCount: 0, inbound: 0, outbound: 0 };
  return {
    today: empty,
    week: empty,
    allTime: empty,
    activeCalls: 0,
    recentCalls: [] as Array<{ id: number; carrier: string; direction: string; remoteNumber: string | null; status: string; durationSecs: number | null; startedAt: number | null }>,
  };
}
