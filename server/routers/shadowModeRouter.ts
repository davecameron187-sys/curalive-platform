// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { shadowSessions, taggedMetrics, recallBots, agmIntelligenceSessions } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { writeAnonymizedRecord } from "../lib/aggregateIntelligence";
import { generateFullAiReport } from "./archiveUploadRouter";
import type { AiReport } from "./archiveUploadRouter";

async function autoGenerateAiReport(
  sessionId: number,
  clientName: string,
  eventName: string,
  eventType: string,
  transcript: Array<{ speaker: string; text: string; timestamp: number }>,
  sentimentAvg: number | null,
  complianceFlags: number
) {
  try {
    const fullText = transcript.map(s => `[${s.speaker}]: ${s.text}`).join("\n");
    if (fullText.length < 50) {
      console.log(`[Shadow] Skipping AI report for session ${sessionId} — transcript too short (${fullText.length} chars)`);
      return;
    }

    console.log(`[Shadow] Auto-generating AI report for session ${sessionId} (${fullText.length} chars)...`);

    const aiReport = await generateFullAiReport(
      fullText,
      clientName,
      eventName,
      eventType,
      sentimentAvg ?? 50,
      complianceFlags
    );

    const db = await getDb();
    const eventId = `shadow-${sessionId}`;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    const conn = (db as any).session?.client ?? (db as any).$client;
    await conn.execute(
      `INSERT INTO archive_events (event_id, client_name, event_name, event_type, transcript_text, word_count, segment_count, sentiment_avg, compliance_flags, status, ai_report, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, 'Auto-generated from Shadow Mode session')
       ON DUPLICATE KEY UPDATE ai_report = VALUES(ai_report), status = 'completed'`,
      [eventId, clientName, eventName, eventType, fullText, wordCount, transcript.length, sentimentAvg ?? 50, complianceFlags, JSON.stringify(aiReport)]
    );

    try {
      const { runMetaObserver, runAccumulationEngine } = await import("../services/AiEvolutionService");
      await runMetaObserver(aiReport, "live_session", sessionId, eventType, clientName, fullText.length);
      runAccumulationEngine().catch(err => console.error("[AiEvolution] Background accumulation failed:", err));
    } catch (err) {
      console.error("[AiEvolution] Meta-observer hook failed:", err);
    }

    try {
      const { analyzeCrisisRisk } = await import("./crisisPredictionRouter");
      const sentimentTrajectory = transcript.map((_, i) => (sentimentAvg ?? 50) + (Math.random() * 10 - 5) * (i / Math.max(transcript.length, 1)));
      await analyzeCrisisRisk(fullText, clientName, eventName, eventType, sentimentTrajectory, sessionId);
      console.log(`[Shadow] Crisis prediction completed for session ${sessionId}`);
    } catch (err) {
      console.error("[Shadow] Crisis prediction failed:", err);
    }

    try {
      const { generateDisclosureCertificate } = await import("./disclosureCertificateRouter");
      await generateDisclosureCertificate({
        eventId: `shadow-${sessionId}`,
        sessionId,
        clientName,
        eventName,
        eventType,
        transcriptText: fullText,
        aiReportJson: JSON.stringify(aiReport),
        complianceFlags,
        jurisdictions: ["JSE"],
      });
      console.log(`[Shadow] Disclosure certificate generated for session ${sessionId}`);
    } catch (err) {
      console.error("[Shadow] Disclosure certificate failed:", err);
    }

    try {
      const { analyzeValuationImpact } = await import("./valuationImpactRouter");
      await analyzeValuationImpact(fullText, clientName, eventName, eventType, sentimentAvg ?? 50, `shadow-${sessionId}`);
      console.log(`[Shadow] Valuation impact analysis completed for session ${sessionId}`);
    } catch (err) {
      console.error("[Shadow] Valuation impact analysis failed:", err);
    }

    console.log(`[Shadow] AI report generated for session ${sessionId} — ${aiReport.modulesGenerated} modules`);
  } catch (err) {
    console.error(`[Shadow] Auto AI report generation failed for session ${sessionId}:`, err);
  }
}

const RECALL_BASE_URL = process.env.RECALL_AI_BASE_URL ?? "https://eu-central-1.recall.ai/api/v1";
const RECALL_API_KEY = process.env.RECALL_AI_API_KEY ?? "";

function getWebhookBaseUrl(): string {
  if (process.env.RECALL_WEBHOOK_BASE_URL) return process.env.RECALL_WEBHOOK_BASE_URL;
  if (process.env.REPLIT_DEPLOYMENT_URL) return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  throw new Error("Cannot determine webhook URL. Set RECALL_WEBHOOK_BASE_URL, or ensure REPLIT_DEV_DOMAIN / REPLIT_DEPLOYMENT_URL is available.");
}

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
      eventType: z.enum([
        "earnings_call", "interim_results", "annual_results", "results_call", "media_call", "analyst_call",
        "agm", "capital_markets_day", "ceo_town_hall", "board_meeting", "webcast",
        "investor_day", "roadshow", "special_call",
        "ipo_roadshow", "ipo_listing", "pre_ipo",
        "manda_call", "takeover_announcement", "merger_announcement", "scheme_of_arrangement",
        "credit_rating_call", "bondholder_meeting", "debt_restructuring",
        "proxy_contest", "activist_meeting", "extraordinary_general_meeting",
        "other",
      ]),
      platform: z.enum(["zoom", "teams", "meet", "webex", "choruscall", "other"]).default("zoom"),
      meetingUrl: z.string().url(),
      webhookBaseUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ENV.isStaging) {
        throw new Error("Live joins are disabled in staging environment.");
      }
      const db = await getDb();
      const userId = ctx.user?.id ?? null;

      const RECALL_SUPPORTED = new Set(["zoom", "teams", "meet", "webex"]);
      const isRecallSupported = RECALL_SUPPORTED.has(input.platform);

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
      const ablyChannel = `shadow-${sessionId}-${Date.now()}`;

      let agmSessionId: number | null = null;
      if (input.eventType === "agm" && userId != null) {
        try {
          const [agmInserted] = await db.insert(agmIntelligenceSessions).values({
            userId,
            shadowSessionId: sessionId,
            clientName: input.clientName,
            agmTitle: input.eventName,
            jurisdiction: "south_africa",
            status: "live",
          });
          agmSessionId = (agmInserted as { insertId: number }).insertId;
          console.log(`[Shadow] AGM Intelligence session ${agmSessionId} auto-created for shadow session ${sessionId}`);
        } catch (err) {
          console.error("[Shadow] Failed to auto-create AGM session:", err);
        }
      }

      if (!isRecallSupported) {
        const platformName = input.platform === "choruscall" ? "Chorus Call" : input.platform;
        console.log(`[Shadow] Session ${sessionId}: ${platformName} detected — starting Local Audio Capture mode (no Recall.ai bot)`);

        await db.update(shadowSessions)
          .set({
            ablyChannel,
            status: "live",
            startedAt: Date.now(),
          })
          .where(eq(shadowSessions.id, sessionId));

        return {
          sessionId,
          botId: null,
          ablyChannel,
          status: "live" as const,
          agmSessionId,
          manualCapture: true,
          message: `Session started — click "Start Local Audio Capture" and share the tab with the call. CuraLive will transcribe and record in real-time.`,
        };
      }

      if (!RECALL_API_KEY) {
        await db.update(shadowSessions)
          .set({ status: "failed" })
          .where(eq(shadowSessions.id, sessionId));
        throw new Error("RECALL_AI_API_KEY is not configured. Please add it to environment secrets.");
      }

      const resolvedBase = getWebhookBaseUrl();
      const webhookUrl = `${resolvedBase}/api/recall/webhook`;

      console.log(`[Shadow] Session ${sessionId}: webhook URL → ${webhookUrl}`);

      const MAX_RETRIES = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[Shadow] Auto-retry attempt ${attempt}/${MAX_RETRIES} for session ${sessionId}...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }

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
            agmSessionId,
            manualCapture: false,
            retriesUsed: attempt,
            message: input.eventType === "agm"
              ? "CuraLive Intelligence bot is joining the AGM. Governance AI algorithms activated automatically."
              : attempt > 0
                ? `CuraLive Intelligence bot is joining the meeting (succeeded on retry ${attempt}).`
                : "CuraLive Intelligence bot is joining the meeting. It will appear as a participant within 30–60 seconds.",
          };

        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`[Shadow] Bot deploy attempt ${attempt + 1} failed for session ${sessionId}:`, lastError.message);
        }
      }

      await db.update(shadowSessions)
        .set({ status: "failed" })
        .where(eq(shadowSessions.id, sessionId));
      throw new Error(`Failed to deploy bot after ${MAX_RETRIES + 1} attempts: ${lastError?.message ?? "Unknown error"}`);
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

        autoGenerateAiReport(
          input.sessionId,
          session.clientName,
          session.eventName,
          session.eventType ?? "other",
          transcript,
          sentimentAvg ?? null,
          liveComplianceFlags
        ).catch(err => console.error("[Shadow] Background AI report failed:", err));

        return {
          success: true,
          transcriptSegments: transcript.length,
          taggedMetricsGenerated: metricsCount,
          message: `Session complete. ${metricsCount} intelligence records added. AI report generating in background.`,
        };
      }

      const localTranscript: Array<{ speaker: string; text: string; timestamp: number }> =
        session.localTranscriptJson ? JSON.parse(session.localTranscriptJson as string) : [];

      if (localTranscript.length > 0) {
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
          localTranscript,
          sentimentAvg
        );

        await db.update(shadowSessions)
          .set({
            status: "completed",
            transcriptSegments: localTranscript.length,
            taggedMetricsGenerated: metricsCount,
          })
          .where(eq(shadowSessions.id, input.sessionId));

        const fullText = localTranscript.map(s => s.text).join(" ");
        const complianceKeywords = ["forward-looking", "guidance", "forecast", "predict", "expect", "material", "non-public", "insider"];
        const liveComplianceFlags = complianceKeywords.filter(k => fullText.toLowerCase().includes(k)).length;

        await writeAnonymizedRecord({
          eventType: session.eventType ?? "other",
          sentimentScore: session.sentimentAvg ?? null,
          segmentCount: localTranscript.length,
          complianceFlags: liveComplianceFlags,
          wordCount: fullText.split(/\s+/).filter(Boolean).length,
          eventDate: null,
          sourceType: "live_session",
        });

        autoGenerateAiReport(
          input.sessionId,
          session.clientName,
          session.eventName,
          session.eventType ?? "other",
          localTranscript,
          sentimentAvg ?? null,
          liveComplianceFlags
        ).catch(err => console.error("[Shadow] Background AI report failed:", err));

        return {
          success: true,
          transcriptSegments: localTranscript.length,
          taggedMetricsGenerated: metricsCount,
          message: `Session complete. ${metricsCount} intelligence records added. AI report generating in background.`,
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
      let recordingUrl: string | null = null;
      let botStatus: string | null = null;

      if (session.recallBotId) {
        const [bot] = await db
          .select()
          .from(recallBots)
          .where(eq(recallBots.recallBotId, session.recallBotId))
          .limit(1);
        if (bot?.transcriptJson) {
          transcriptSegments = JSON.parse(bot.transcriptJson);
        }
        if (bot?.recordingUrl) {
          recordingUrl = bot.recordingUrl;
        }
        if (bot?.status) {
          botStatus = bot.status;
        }
      }

      if (session.localTranscriptJson && transcriptSegments.length === 0) {
        try {
          transcriptSegments = JSON.parse(session.localTranscriptJson as string);
        } catch {}
      }

      let agmSessionId: number | null = null;
      if (session.eventType === "agm") {
        const [agmSession] = await db.select({ id: agmIntelligenceSessions.id })
          .from(agmIntelligenceSessions)
          .where(eq(agmIntelligenceSessions.shadowSessionId, session.id))
          .limit(1);
        if (agmSession) agmSessionId = agmSession.id;
      }

      const localRecordingUrl = session.localRecordingPath
        ? `/api/shadow/recording/${session.id}`
        : null;

      return { ...session, transcriptSegments, agmSessionId, recordingUrl: recordingUrl || localRecordingUrl, botStatus };
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

  retrySession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");
      if (session.status !== "failed") throw new Error("Only failed sessions can be retried");
      if (!session.meetingUrl) throw new Error("Session has no meeting URL to retry");

      if (!RECALL_API_KEY) {
        throw new Error("RECALL_AI_API_KEY is not configured. Please add it to environment secrets.");
      }

      const resolvedBase = getWebhookBaseUrl();
      const ablyChannel = `shadow-${session.id}-${Date.now()}`;
      const webhookUrl = `${resolvedBase}/api/recall/webhook`;

      console.log(`[Shadow] Retry session ${session.id}: webhook URL → ${webhookUrl}`);

      try {
        const bot = await recallFetch("/bot/", {
          method: "POST",
          body: JSON.stringify({
            meeting_url: session.meetingUrl,
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
            metadata: { ablyChannel, shadowSessionId: String(session.id) },
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
          .where(eq(shadowSessions.id, session.id));

        await db.insert(recallBots).values({
          recallBotId: bot.id,
          meetingUrl: session.meetingUrl,
          botName: "CuraLive Intelligence",
          eventId: null,
          meetingId: null,
          status: bot.status_code ?? "created",
          ablyChannel,
          transcriptJson: JSON.stringify([]),
        });

        return {
          sessionId: session.id,
          botId: bot.id,
          ablyChannel,
          status: "bot_joining",
          message: "Retrying — CuraLive Intelligence bot is joining the meeting.",
        };

      } catch (err) {
        throw new Error(`Retry failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  pushTranscriptSegment: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      speaker: z.string().default("Speaker"),
      text: z.string().min(1),
      timestamp: z.number(),
      timeLabel: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");
      if (session.status !== "live" && session.status !== "bot_joining") {
        throw new Error("Session is not active");
      }

      const segment = {
        speaker: input.speaker,
        text: input.text,
        timestamp: input.timestamp,
        timeLabel: input.timeLabel ?? new Date(input.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };

      const existingTranscript: Array<{ speaker: string; text: string; timestamp: number; timeLabel?: string }> =
        session.localTranscriptJson ? JSON.parse(session.localTranscriptJson as string) : [];
      existingTranscript.push(segment);

      await db.update(shadowSessions)
        .set({
          transcriptSegments: existingTranscript.length,
          localTranscriptJson: JSON.stringify(existingTranscript),
        })
        .where(eq(shadowSessions.id, input.sessionId));

      if (session.ablyChannel) {
        const ABLY_API_KEY = process.env.ABLY_API_KEY ?? "";
        if (ABLY_API_KEY) {
          const url = `https://rest.ably.io/channels/${encodeURIComponent(session.ablyChannel)}/messages`;
          const body = JSON.stringify({
            name: "curalive",
            data: JSON.stringify({ type: "transcript.segment", data: segment }),
          });
          try {
            await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Basic ${Buffer.from(ABLY_API_KEY).toString("base64")}`,
                "Content-Type": "application/json",
              },
              body,
            });
          } catch (err) {
            console.warn("[Shadow] Ably publish for local segment failed:", err);
          }
        }
      }

      return { success: true, segmentCount: existingTranscript.length };
    }),

  deleteSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId))
        .limit(1);

      if (!session) throw new Error("Session not found");
      if (session.status === "live" || session.status === "bot_joining") {
        throw new Error("Cannot delete an active session. End it first.");
      }

      const eventId = `shadow-${session.id}`;
      await db.delete(taggedMetrics).where(eq(taggedMetrics.eventId, eventId));

      if (session.recallBotId) {
        try {
          await db.delete(recallBots).where(eq(recallBots.recallBotId, session.recallBotId));
        } catch {}
      }

      if (session.eventType === "agm") {
        try {
          await db.delete(agmIntelligenceSessions).where(eq(agmIntelligenceSessions.shadowSessionId, session.id));
        } catch {}
      }

      if (session.localRecordingPath) {
        try {
          const { unlinkSync } = await import("fs");
          const { join } = await import("path");
          unlinkSync(join(process.cwd(), session.localRecordingPath));
        } catch {}
      }

      await db.delete(shadowSessions).where(eq(shadowSessions.id, input.sessionId));

      console.log(`[Shadow] Session ${input.sessionId} deleted`);
      return { success: true, message: "Session deleted" };
    }),

  deleteSessions: publicProcedure
    .input(z.object({ sessionIds: z.array(z.number()).min(1).max(100) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const sessions = await db
        .select()
        .from(shadowSessions)
        .where(inArray(shadowSessions.id, input.sessionIds));

      const deletable = sessions.filter(
        (s) => s.status !== "live" && s.status !== "bot_joining"
      );
      if (deletable.length === 0) {
        throw new Error("No deletable sessions found (active sessions cannot be deleted).");
      }

      const ids = deletable.map((s) => s.id);
      const eventIds = ids.map((id) => `shadow-${id}`);

      await db.delete(taggedMetrics).where(inArray(taggedMetrics.eventId, eventIds));

      const recallBotIds = deletable
        .map((s) => s.recallBotId)
        .filter(Boolean) as string[];
      if (recallBotIds.length > 0) {
        try {
          await db.delete(recallBots).where(inArray(recallBots.recallBotId, recallBotIds));
        } catch {}
      }

      const agmIds = deletable
        .filter((s) => s.eventType === "agm")
        .map((s) => s.id);
      if (agmIds.length > 0) {
        try {
          await db.delete(agmIntelligenceSessions).where(inArray(agmIntelligenceSessions.shadowSessionId, agmIds));
        } catch {}
      }

      for (const s of deletable) {
        if (s.localRecordingPath) {
          try {
            const { unlinkSync } = await import("fs");
            const { join } = await import("path");
            unlinkSync(join(process.cwd(), s.localRecordingPath));
          } catch {}
        }
      }

      await db.delete(shadowSessions).where(inArray(shadowSessions.id, ids));

      console.log(`[Shadow] Bulk deleted ${ids.length} sessions: ${ids.join(", ")}`);
      return { success: true, deleted: ids.length, message: `${ids.length} session${ids.length > 1 ? "s" : ""} deleted` };
    }),

  createFromCalendar: publicProcedure
    .input(z.object({
      clientName: z.string().min(1),
      eventName: z.string().min(1),
      eventType: z.enum([
        "earnings_call", "interim_results", "annual_results", "results_call", "media_call", "analyst_call",
        "agm", "capital_markets_day", "ceo_town_hall", "board_meeting", "webcast",
        "investor_day", "roadshow", "special_call",
        "ipo_roadshow", "ipo_listing", "pre_ipo",
        "manda_call", "takeover_announcement", "merger_announcement", "scheme_of_arrangement",
        "credit_rating_call", "bondholder_meeting", "debt_restructuring",
        "proxy_contest", "activist_meeting", "extraordinary_general_meeting",
        "other",
      ]),
      platform: z.enum(["zoom", "teams", "meet", "webex", "choruscall", "other"]).default("zoom"),
      meetingUrl: z.string().url(),
      scheduledStart: z.string(),
      calendarEventId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      const conn = (db as any).session?.client ?? (db as any).$client;
      if (input.calendarEventId) {
        const [existing] = await conn.execute(
          `SELECT id FROM shadow_sessions WHERE notes LIKE ? LIMIT 1`,
          [`%calendar:${input.calendarEventId}%`]
        );
        if ((existing as any[]).length > 0) {
          return { sessionId: (existing as any[])[0].id, alreadyExists: true, message: "Session already exists for this calendar event." };
        }
      }

      const calendarNote = input.calendarEventId
        ? `calendar:${input.calendarEventId} | Scheduled: ${input.scheduledStart}${input.notes ? ` | ${input.notes}` : ""}`
        : `Calendar-created | Scheduled: ${input.scheduledStart}${input.notes ? ` | ${input.notes}` : ""}`;

      const [inserted] = await db.insert(shadowSessions).values({
        clientName: input.clientName,
        eventName: input.eventName,
        eventType: input.eventType,
        platform: input.platform,
        meetingUrl: input.meetingUrl,
        status: "pending",
        notes: calendarNote,
      });

      const sessionId = (inserted as { insertId: number }).insertId;

      console.log(`[Shadow] Calendar auto-session created: ${sessionId} for ${input.eventName} @ ${input.scheduledStart}`);

      return {
        sessionId,
        alreadyExists: false,
        status: "pending",
        message: `Shadow Mode session pre-created for ${input.eventName}. Will activate automatically when the meeting starts.`,
      };
    }),

  pipeAgmGovernance: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      transcriptSegments: z.array(z.object({
        speaker: z.string(),
        text: z.string(),
        timestamp: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions)
        .where(eq(shadowSessions.id, input.sessionId)).limit(1);

      if (!session) throw new Error("Session not found");

      const [agmRow] = await db.select().from(agmIntelligenceSessions)
        .where(eq(agmIntelligenceSessions.shadowSessionId, input.sessionId)).limit(1);

      let agmSessionId = agmRow?.id ?? null;

      if (!agmSessionId) {
        const [agmInserted] = await db.insert(agmIntelligenceSessions).values({
          userId: 1,
          shadowSessionId: input.sessionId,
          clientName: session.clientName,
          agmTitle: session.eventName,
          jurisdiction: "south_africa",
          status: "live",
        });
        agmSessionId = (agmInserted as { insertId: number }).insertId;
      }

      const results: any = {};

      try {
        const { triageGovernanceQuestions, scanRegulatoryCompliance } = await import("../services/AgmGovernanceAiService");

        const triageResult = await triageGovernanceQuestions(1, agmSessionId, input.transcriptSegments);
        results.governanceQuestions = triageResult;

        const complianceResult = await scanRegulatoryCompliance(1, agmSessionId, input.transcriptSegments);
        results.regulatoryCompliance = complianceResult;
      } catch (err) {
        console.error("[Shadow] AGM governance piping failed:", err);
        results.error = String(err);
      }

      return { agmSessionId, results };
    }),

});
