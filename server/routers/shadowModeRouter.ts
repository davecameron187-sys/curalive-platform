// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { shadowSessions, taggedMetrics, recallBots, webphoneSessions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { writeAnonymizedRecord } from "../lib/aggregateIntelligence";
import { initiateOutboundBridgeCall } from "../webphone/bridgeDial";

const RECALL_BASE_URL = process.env.RECALL_AI_BASE_URL ?? "https://eu-central-1.recall.ai/api/v1";
const RECALL_API_KEY = process.env.RECALL_AI_API_KEY ?? "";
const WEBPHONE_ENABLED = process.env.TELNYX_API_KEY || process.env.TWILIO_AUTH_TOKEN; // Check if Webphone is configured

async function recallFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${RECALL_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Token ${RECALL_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Recall.ai ${res.status}: ${body}`);
  }
  return res.json();
}

async function generateTaggedMetricsFromSession(
  sessionId: number,
  eventId: string,
  eventTitle: string,
  bundle: string,
  transcript: Array<{ speaker: string; text: string; timestamp: number }>,
  sentimentAvg: number | null
) {
  const db = await getDb();
  const metricsToInsert = [];

  if (sentimentAvg != null) {
    metricsToInsert.push({
      eventId, eventTitle,
      tagType: "sentiment" as const,
      metricValue: sentimentAvg,
      label: sentimentAvg >= 70 ? "Positive Sentiment Session" : sentimentAvg >= 50 ? "Neutral Sentiment Session" : "Low Sentiment Session",
      detail: `Average sentiment across ${transcript.length} transcript segments captured during live session.`,
      bundle,
      severity: sentimentAvg >= 70 ? "positive" as const : sentimentAvg >= 50 ? "neutral" as const : "negative" as const,
      source: "shadow-mode",
    });
  }

  metricsToInsert.push({
    eventId, eventTitle,
    tagType: "engagement" as const,
    metricValue: transcript.length,
    label: `${transcript.length} Transcript Segments Captured`,
    detail: `Shadow Mode bot captured ${transcript.length} real-time transcript segments. Active speaker participation recorded.`,
    bundle,
    severity: transcript.length > 20 ? "positive" as const : transcript.length > 5 ? "neutral" as const : "negative" as const,
    source: "shadow-mode",
  });

  if (transcript.length > 0) {
    const fullText = transcript.map(s => s.text).join(" ");
    const complianceKeywords = ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"];
    const flagCount = complianceKeywords.filter(k => fullText.toLowerCase().includes(k)).length;

    metricsToInsert.push({
      eventId, eventTitle,
      tagType: "compliance" as const,
      metricValue: parseFloat((flagCount / complianceKeywords.length).toFixed(2)),
      label: flagCount > 2 ? "Compliance Flags Detected" : "Low Compliance Risk",
      detail: `Automated scan found ${flagCount} compliance keyword(s) across transcript. Keywords checked: ${complianceKeywords.join(", ")}.`,
      bundle,
      severity: flagCount > 3 ? "critical" as const : flagCount > 1 ? "negative" as const : "positive" as const,
      source: "shadow-mode",
    });
  }

  metricsToInsert.push({
    eventId, eventTitle,
    tagType: "intervention" as const,
    metricValue: 0,
    label: "Shadow Mode Session Completed",
    detail: `CuraLive ran silently in the background. No human intervention required. Intelligence dataset updated with ${metricsToInsert.length + 1} tagged records.`,
    bundle,
    severity: "positive" as const,
    source: "shadow-mode",
  });

  if (metricsToInsert.length > 0) {
    await db.insert(taggedMetrics).values(metricsToInsert);
  }

  await db.update(shadowSessions)
    .set({ taggedMetricsGenerated: metricsToInsert.length })
    .where(eq(shadowSessions.id, sessionId));

  return metricsToInsert.length;
}

export const shadowModeRouter = router({

  startSession: publicProcedure
    .input(z.object({
      clientName: z.string().min(1),
      eventName: z.string().min(1),
      eventType: z.enum(["earnings_call", "agm", "capital_markets_day", "ceo_town_hall", "board_meeting", "webcast", "other"]),
      platform: z.enum(["zoom", "teams", "meet", "webex", "webphone", "sip", "other"]).default("webphone"), // Default to Webphone for cost-effective testing
      meetingUrl: z.string().min(1), // Can be URL or Webphone/SIP identifier
      webhookBaseUrl: z.string().url(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Platform URL validation
      if (input.platform === "zoom" && !input.meetingUrl.includes("zoom.us") && !input.meetingUrl.includes("zoom.com")) {
        throw new Error("Invalid Zoom URL. Must be a zoom.us or zoom.com meeting link.");
      }
      if (input.platform === "teams" && !input.meetingUrl.includes("teams.microsoft.com") && !input.meetingUrl.includes("teams.live.com")) {
        throw new Error("Invalid Teams URL. Must be a teams.microsoft.com or teams.live.com meeting link.");
      }
      if (input.platform === "webex" && !input.meetingUrl.includes("webex.com")) {
        throw new Error("Invalid Webex URL. Must be a webex.com meeting link.");
      }
      if (input.platform === "meet" && !input.meetingUrl.includes("meet.google.com")) {
        throw new Error("Invalid Google Meet URL. Must be a meet.google.com link.");
      }
      if (input.platform === "webphone" && !input.meetingUrl.match(/^[a-zA-Z0-9\-_]+$/)) {
        throw new Error("Invalid Webphone identifier. Use alphanumeric characters, hyphens, or underscores only.");
      }
      if (input.platform === "sip" && !input.meetingUrl.match(/^sip:[a-zA-Z0-9\-_.]+@[a-zA-Z0-9\-_.]+/)) {
        throw new Error("Invalid SIP URI. Format should be: sip:user@domain");
      }

      const [inserted] = await db.insert(shadowSessions).values({
        clientName: input.clientName,
        eventName: input.eventName,
        eventType: input.eventType,
        platform: input.platform,
        meetingUrl: input.meetingUrl,
        status: "pending",
        notes: input.notes ?? null,
      });

      const sessionId = (inserted as { insertId: number }).insertId;

      if (!RECALL_API_KEY) {
        await db.update(shadowSessions)
          .set({ status: "failed" })
          .where(eq(shadowSessions.id, sessionId));
        throw new Error("RECALL_AI_API_KEY is not configured. Please add it to environment secrets.");
      }

      const ablyChannel = `shadow-${sessionId}-${Date.now()}`;
      const webhookUrl = `${input.webhookBaseUrl}/api/recall/webhook`;
      const eventSlug = `shadow-${sessionId}`;

      // Handle Webphone platform separately
      if (input.platform === "webphone") {
        try {
          // Create Webphone session for bridge dialing
          const bridgeCallResult = await initiateOutboundBridgeCall({
            targetNumber: input.meetingUrl,
            sessionId,
            eventName: input.eventName,
            clientName: input.clientName,
            ablyChannel,
          });

          await db.update(shadowSessions)
            .set({
              status: "webphone_active",
              startedAt: Date.now(),
              notes: `Webphone bridge call initiated. Call ID: ${bridgeCallResult.callId}`,
            })
            .where(eq(shadowSessions.id, sessionId));

          return {
            sessionId,
            botId: `webphone-${sessionId}`,
            ablyChannel,
            status: "webphone_active",
            message: `CuraLive Webphone bridge is dialing ${input.meetingUrl}. Connection will be established within 10-15 seconds.`,
            callId: bridgeCallResult.callId,
          };
        } catch (err) {
          await db.update(shadowSessions)
            .set({ status: "failed" })
            .where(eq(shadowSessions.id, sessionId));
          throw new Error(`Webphone bridge failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      try {
        const bot = await recallFetch("/bot/", {
          method: "POST",
          body: JSON.stringify({
            meeting_url: input.meetingUrl,
            bot_name: "CuraLive Intelligence",
            recording_config: {
              transcript: { provider: { recallai_streaming: {} } },
              realtime_endpoints: [{
                type: "webhook",
                url: webhookUrl,
                events: ["transcript.data"],
              }],
            },
            webhook_url: webhookUrl,
            metadata: { ablyChannel, shadowSessionId: String(sessionId) },
            automatic_leave: {
              waiting_room_timeout: 600,
              noone_joined_timeout: 300,
              everyone_left_timeout: 60,
            },
          }),
        });

        await db.update(shadowSessions)
          .set({
            recallBotId: bot.id,
            ablyChannel,
            status: "bot_joining",
            startedAt: Date.now(),
          })
          .where(eq(shadowSessions.id, sessionId));

        await db.insert(recallBots).values({
          recallBotId: bot.id,
          meetingUrl: input.meetingUrl,
          botName: "CuraLive Intelligence",
          eventId: null,
          meetingId: null,
          status: bot.status_code ?? "created",
          ablyChannel,
          transcriptJson: JSON.stringify([]),
        });

        return {
          sessionId,
          botId: bot.id,
          ablyChannel,
          status: "bot_joining",
          message: "CuraLive Intelligence bot is joining the meeting. It will appear as a participant within 30–60 seconds.",
        };

      } catch (err) {
        await db.update(shadowSessions)
          .set({ status: "failed" })
          .where(eq(shadowSessions.id, sessionId));
        throw new Error(`Failed to deploy bot: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  endSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");

      if (session.recallBotId) {
        try {
          await recallFetch(`/bot/${session.recallBotId}/leave_call/`, { method: "POST" });
        } catch { /* bot may have already left */ }

        const [botRecord] = await db
          .select()
          .from(recallBots)
          .where(eq(recallBots.recallBotId, session.recallBotId))
          .limit(1);

        const transcript: Array<{ speaker: string; text: string; timestamp: number }> =
          botRecord?.transcriptJson ? JSON.parse(botRecord.transcriptJson) : [];

        const sentimentAvg = session.sentimentAvg;
        const bundle = session.eventType === "earnings_call" || session.eventType === "capital_markets_day"
          ? "Investor Relations" : session.eventType === "agm" || session.eventType === "board_meeting"
          ? "Compliance & Risk" : "Webcasting";

        const eventId = `shadow-${session.id}`;
        const eventTitle = `${session.clientName} — ${session.eventName}`;

        await db.update(shadowSessions)
          .set({ status: "processing", endedAt: Date.now() })
          .where(eq(shadowSessions.id, input.sessionId));

        const metricsCount = await generateTaggedMetricsFromSession(
          input.sessionId,
          eventId,
          eventTitle,
          bundle,
          transcript,
          sentimentAvg
        );

        await db.update(shadowSessions)
          .set({
            status: "completed",
            transcriptSegments: transcript.length,
            taggedMetricsGenerated: metricsCount,
          })
          .where(eq(shadowSessions.id, input.sessionId));

        const fullText = transcript.map(s => s.text).join(" ");
        const complianceKeywords = ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"];
        const liveComplianceFlags = complianceKeywords.filter(k => fullText.toLowerCase().includes(k)).length;

        await writeAnonymizedRecord({
          eventType: session.eventType ?? "other",
          sentimentScore: session.sentimentAvg ?? null,
          segmentCount: transcript.length,
          complianceFlags: liveComplianceFlags,
          wordCount: fullText.split(/\s+/).filter(Boolean).length,
          eventDate: null,
          sourceType: "live_session",
        });

        return {
          success: true,
          transcriptSegments: transcript.length,
          taggedMetricsGenerated: metricsCount,
          message: `Session complete. ${metricsCount} intelligence records added to your Tagged Metrics database.`,
        };
      }

      await db.update(shadowSessions)
        .set({ status: "completed", endedAt: Date.now() })
        .where(eq(shadowSessions.id, input.sessionId));

      return { success: true, transcriptSegments: 0, taggedMetricsGenerated: 0, message: "Session closed." };
    }),

  listSessions: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      return db.select().from(shadowSessions).orderBy(desc(shadowSessions.createdAt)).limit(50);
    } catch { return []; }
  }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");

      let transcriptSegments: Array<{ speaker: string; text: string; timestamp: number; timeLabel?: string }> = [];

      if (session.recallBotId) {
        const [bot] = await db
          .select()
          .from(recallBots)
          .where(eq(recallBots.recallBotId, session.recallBotId))
          .limit(1);
        if (bot?.transcriptJson) {
          transcriptSegments = JSON.parse(bot.transcriptJson);
        }
      }

      return { ...session, transcriptSegments };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      status: z.enum(["pending", "bot_joining", "live", "processing", "completed", "failed"]),
      sentimentAvg: z.number().optional(),
      transcriptSegments: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: Record<string, unknown> = { status: input.status };
      if (input.sentimentAvg != null) updates.sentimentAvg = input.sentimentAvg;
      if (input.transcriptSegments != null) updates.transcriptSegments = input.transcriptSegments;
      await db.update(shadowSessions).set(updates).where(eq(shadowSessions.id, input.sessionId));
      return { success: true };
    }),

  // ─── Bridge Dial-Out ───────────────────────────────────────────────────────
  dialOutToBridge: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      eventName: z.string(),
      dialInNumber: z.string().min(7),
      conferenceId: z.string().optional(),
      accessCode: z.string().optional(),
      hostPin: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { initiateOutboundBridgeCall } = await import("../webphone/bridgeDial");
      const db = await getDb();
      const conn = (db as any).session?.client ?? (db as any).$client;

      const domain = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `http://localhost:${process.env.PORT ?? 5000}`;

      const params = new URLSearchParams();
      if (input.conferenceId) params.set("conferenceId", input.conferenceId);
      if (input.accessCode) params.set("accessCode", input.accessCode);
      if (input.hostPin) params.set("hostPin", input.hostPin);

      const twimlUrl = `${domain}/api/shadow/bridge-twiml?${params.toString()}`;
      const statusCallbackUrl = `${domain}/api/shadow/bridge-status`;

      const result = await initiateOutboundBridgeCall({
        dialInNumber: input.dialInNumber,
        conferenceId: input.conferenceId,
        accessCode: input.accessCode,
        hostPin: input.hostPin,
        twimlUrl,
        statusCallbackUrl,
      });

      await conn.execute(
        `INSERT INTO bridge_calls (session_id, call_sid, event_name, dial_in_number, conference_id, access_code, host_pin, status, from_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.sessionId,
          result.callSid,
          input.eventName,
          input.dialInNumber,
          input.conferenceId ?? null,
          input.accessCode ?? null,
          input.hostPin ?? null,
          result.status,
          result.fromNumber,
        ]
      );

      return { success: true, callSid: result.callSid, status: result.status, fromNumber: result.fromNumber };
    }),

  getBridgeCallStatus: publicProcedure
    .input(z.object({ callSid: z.string() }))
    .query(async ({ input }) => {
      const { getCallStatus } = await import("../webphone/bridgeDial");
      const db = await getDb();
      const conn = (db as any).session?.client ?? (db as any).$client;

      const [rows]: any = await conn.execute(
        `SELECT status, duration_seconds, started_at, ended_at FROM bridge_calls WHERE call_sid = ? ORDER BY created_at DESC LIMIT 1`,
        [input.callSid]
      );
      const dbRow = rows?.[0];

      // Also pull live status from Twilio if still in progress
      let liveStatus = dbRow?.status ?? "unknown";
      if (liveStatus === "queued" || liveStatus === "ringing" || liveStatus === "in-progress" || liveStatus === "initiated") {
        try {
          const live = await getCallStatus(input.callSid);
          liveStatus = live.status;
          if (live.duration !== null) {
            await conn.execute(`UPDATE bridge_calls SET status = ?, duration_seconds = ? WHERE call_sid = ?`,
              [live.status, live.duration, input.callSid]);
          }
        } catch (_) {}
      }

      return {
        callSid: input.callSid,
        status: liveStatus,
        durationSeconds: dbRow?.duration_seconds ?? null,
        startedAt: dbRow?.started_at ?? null,
      };
    }),

  hangupBridgeCall: publicProcedure
    .input(z.object({ callSid: z.string() }))
    .mutation(async ({ input }) => {
      const { hangupCall } = await import("../webphone/bridgeDial");
      const db = await getDb();
      const conn = (db as any).session?.client ?? (db as any).$client;

      await hangupCall(input.callSid);
      await conn.execute(
        `UPDATE bridge_calls SET status = 'completed', ended_at = ? WHERE call_sid = ?`,
        [new Date(), input.callSid]
      );
      return { success: true };
    }),
});
