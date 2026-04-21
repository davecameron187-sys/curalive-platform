// @ts-nocheck
import { z } from "zod";
import { router, operatorProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { shadowSessions, taggedMetrics, recallBots, agmIntelligenceSessions, operatorActions } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { writeAnonymizedRecord } from "../lib/aggregateIntelligence";
import { generateFullAiReport } from "./archiveUploadRouter";
import type { AiReport } from "./archiveUploadRouter";
import { runSessionClosePipeline } from "../services/SessionClosePipeline";

async function logOperatorAction(opts: {
  sessionId?: number | null;
  archiveId?: number | null;
  actionType: string;
  detail?: string | null;
  operatorName?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const db = await getDb();
    await db.insert(operatorActions).values({
      sessionId: opts.sessionId ?? null,
      archiveId: opts.archiveId ?? null,
      actionType: opts.actionType,
      detail: opts.detail ?? null,
      operatorName: opts.operatorName ?? "Operator",
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    });
  } catch (err) {
    console.warn("[OperatorAction] Failed to log action:", opts.actionType, err);
  }
}

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
    await rawSql(
      `INSERT INTO archive_events (event_id, client_name, event_name, event_type, transcript_text, word_count, segment_count, sentiment_avg, compliance_flags, status, ai_report, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', $10, 'Auto-generated from Shadow Mode session')
       ON CONFLICT (event_id) DO UPDATE SET ai_report = EXCLUDED.ai_report, status = 'completed'`,
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

function normalizeBaseUrl(url: string): string {
  // Remove trailing slashes and whitespace
  return url.trim().replace(/\/+$/, "");
}

function getWebhookBaseUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.trim()) {
    return normalizeBaseUrl(overrideUrl);
  }
  if (process.env.RECALL_WEBHOOK_BASE_URL) return normalizeBaseUrl(process.env.RECALL_WEBHOOK_BASE_URL);
  if (process.env.REPLIT_DEPLOYMENT_URL) return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.PUBLIC_URL) return normalizeBaseUrl(process.env.PUBLIC_URL);
  if (process.env.APP_URL) return normalizeBaseUrl(process.env.APP_URL);

  throw new Error(
    "Cannot determine webhook URL. Set RECALL_WEBHOOK_BASE_URL or APP_URL, or ensure REPLIT_DEV_DOMAIN / REPLIT_DEPLOYMENT_URL is available."
  );
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

  startSession: operatorProcedure
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
      const db = await getDb();
      const userId = ctx.user?.id ?? null;

      const RECALL_SUPPORTED = new Set(["zoom", "teams", "meet", "webex"]);
      const isRecallSupported = RECALL_SUPPORTED.has(input.platform);

      let inserted: any;
      try {
        const [insertRows] = await rawSql(
          `INSERT INTO shadow_sessions (session_id, client_name, event_name, event_type, platform, meeting_url, status, notes)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'pending', $6)
           RETURNING *`,
          [input.clientName, input.eventName, input.eventType, input.platform, input.meetingUrl, input.notes ?? null]
        );
        inserted = insertRows[0];
      } catch (insertErr: any) {
        console.error("[Shadow] rawSql INSERT failed:", insertErr?.message ?? insertErr);
        console.error("[Shadow] rawSql error code:", insertErr?.code ?? "none");
        console.error("[Shadow] rawSql error detail:", insertErr?.detail ?? "none");
        throw new Error(`Session insert failed [${insertErr?.code ?? "no-code"}]: ${insertErr?.message ?? "unknown"}`);
      }

      if (!inserted) {
        console.error("[Shadow] shadow_sessions INSERT returned no rows");
        throw new Error("Session insert returned no rows — check database table structure");
      }

      const sessionId = inserted.id;
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
          }).returning();
          agmSessionId = agmInserted.id;
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

        await logOperatorAction({ sessionId, actionType: "session_started", detail: `${input.clientName} — ${input.eventName} (Local Audio Capture)`, metadata: { platform: input.platform, eventType: input.eventType } });

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

      const resolvedBase = getWebhookBaseUrl(input.webhookBaseUrl);
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
                  events: ["transcript.data", "bot.status_change", "recording.done"],
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
            webhookUrl,
            transcriptJson: JSON.stringify([]),
          });

          await logOperatorAction({ sessionId, actionType: "session_started", detail: `${input.clientName} — ${input.eventName} (Recall.ai bot)`, metadata: { platform: input.platform, eventType: input.eventType, botId: bot.id } });

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

  endSession: operatorProcedure
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

        runSessionClosePipeline(input.sessionId).catch(console.error);

        await logOperatorAction({ sessionId: input.sessionId, actionType: "session_ended", detail: `${transcript.length} transcript segments, ${metricsCount} metrics generated`, metadata: { transcriptSegments: transcript.length, metricsCount } });

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

        runSessionClosePipeline(input.sessionId).catch(console.error);

        await logOperatorAction({ sessionId: input.sessionId, actionType: "session_ended", detail: `${localTranscript.length} local transcript segments, ${metricsCount} metrics generated`, metadata: { transcriptSegments: localTranscript.length, metricsCount } });

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

      runSessionClosePipeline(input.sessionId).catch(console.error);

      await logOperatorAction({ sessionId: input.sessionId, actionType: "session_ended", detail: "Session closed (no transcript captured)" });

      return { success: true, transcriptSegments: 0, taggedMetricsGenerated: 0, message: "Session closed." };
    }),

  listSessions: operatorProcedure.query(async () => {
    try {
      const db = await getDb();
      return db.select().from(shadowSessions).orderBy(desc(shadowSessions.createdAt)).limit(50);
    } catch { return []; }
  }),

  getSession: operatorProcedure
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

      let aiReport: AiReport | null = null;
      try {
        const eventId = `shadow-${session.id}`;
    const [rows] = await rawSql(
          `SELECT ai_report FROM archive_events WHERE event_id = $1 LIMIT 1`,
          [eventId]
        );
        if (rows?.[0]?.ai_report) {
          aiReport = typeof rows[0].ai_report === "string" ? JSON.parse(rows[0].ai_report) : rows[0].ai_report;
        }
      } catch {}

      return { ...session, transcriptSegments, agmSessionId, recordingUrl: recordingUrl || localRecordingUrl, botStatus, aiReport };
    }),

  updateStatus: operatorProcedure
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

  retrySession: operatorProcedure
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
          webhookUrl,
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

  pushTranscriptSegment: operatorProcedure
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

  getIntelligenceFeed: operatorProcedure
    .input(z.object({
      sessionId: z.string(),
      since: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const sql = `
          SELECT id, session_id, feed_type, severity, title, body, metadata, pipeline, speaker, timestamp_in_event, created_at
          FROM intelligence_feed
          WHERE session_id = $1
          ${input.since ? "AND id > $2" : ""}
          ORDER BY created_at ASC
          LIMIT 100`;
        const params = input.since ? [input.sessionId, input.since] : [input.sessionId];
        const [rows] = await rawSql(sql, params);
        return rows as any[];
      } catch {
        return [];
      }
    }),

  deleteSession: operatorProcedure
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

  deleteSessions: operatorProcedure
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

  createFromCalendar: operatorProcedure
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
    if (input.calendarEventId) {
        const [existing] = await rawSql(
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
      }).returning();

      const sessionId = inserted.id;

      console.log(`[Shadow] Calendar auto-session created: ${sessionId} for ${input.eventName} @ ${input.scheduledStart}`);

      return {
        sessionId,
        alreadyExists: false,
        status: "pending",
        message: `Shadow Mode session pre-created for ${input.eventName}. Will activate automatically when the meeting starts.`,
      };
    }),

  pipeAgmGovernance: operatorProcedure
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
        }).returning();
        agmSessionId = agmInserted.id;
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

  addNote: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      text: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      const existingNotes: Array<{ id: string; text: string; createdAt: string }> = session.notes ? (() => { try { return JSON.parse(session.notes as string); } catch { return []; } })() : [];
      const noteId = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      existingNotes.push({ id: noteId, text: input.text, createdAt: new Date().toISOString() });

      await db.update(shadowSessions).set({ notes: JSON.stringify(existingNotes) }).where(eq(shadowSessions.id, input.sessionId));
      await logOperatorAction({ sessionId: input.sessionId, actionType: "note_created", detail: input.text.slice(0, 200) });

      return { success: true, noteId, noteCount: existingNotes.length };
    }),

  deleteNote: operatorProcedure
    .input(z.object({ sessionId: z.number(), noteId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      let notes: Array<{ id: string; text: string; createdAt: string }> = [];
      try { notes = session.notes ? JSON.parse(session.notes as string) : []; } catch {}
      notes = notes.filter(n => n.id !== input.noteId);

      await db.update(shadowSessions).set({ notes: JSON.stringify(notes) }).where(eq(shadowSessions.id, input.sessionId));
      await logOperatorAction({ sessionId: input.sessionId, actionType: "note_deleted", detail: `Note ${input.noteId} removed` });

      return { success: true };
    }),

  getNotes: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select({ notes: shadowSessions.notes }).from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) return [];
      try { return session.notes ? JSON.parse(session.notes as string) : []; } catch { return []; }
    }),

  getActionLog: operatorProcedure
    .input(z.object({ sessionId: z.number().optional(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (input.sessionId) {
        return db.select().from(operatorActions).where(eq(operatorActions.sessionId, input.sessionId)).orderBy(desc(operatorActions.createdAt)).limit(input.limit);
      }
      return db.select().from(operatorActions).orderBy(desc(operatorActions.createdAt)).limit(input.limit);
    }),

  qaAction: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      questionId: z.string(),
      action: z.enum(["approve", "reject", "hold", "legal_review", "send_to_speaker", "answered", "bulk_approve", "bulk_reject", "generate_draft", "link_duplicate", "unlink_duplicate"]),
      questionText: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const actionLabels: Record<string, string> = {
        approve: "Question approved for live display",
        reject: "Question rejected/dismissed",
        hold: "Question placed on hold",
        legal_review: "Question flagged for legal review",
        send_to_speaker: "Question sent to speaker queue",
        answered: "Question marked as answered",
        bulk_approve: "Question bulk-approved",
        bulk_reject: "Question bulk-rejected",
        generate_draft: "AI draft generated",
        link_duplicate: "Question linked as duplicate",
        unlink_duplicate: "Question unlinked from duplicate",
      };

      await logOperatorAction({
        sessionId: input.sessionId,
        actionType: `question_${input.action}`,
        detail: `${actionLabels[input.action]}${input.questionText ? `: "${input.questionText.slice(0, 100)}"` : ""}`,
        metadata: { questionId: input.questionId, action: input.action },
      });

      return { success: true, action: input.action, message: actionLabels[input.action] };
    }),

  getHandoffPackage: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      let transcript: Array<{ speaker: string; text: string; timestamp: number }> = [];
      let recordingUrl: string | null = null;

      if (session.recallBotId) {
        const [bot] = await db.select().from(recallBots).where(eq(recallBots.recallBotId, session.recallBotId)).limit(1);
        if (bot?.transcriptJson) transcript = JSON.parse(bot.transcriptJson);
        if (bot?.recordingUrl) recordingUrl = bot.recordingUrl;
      }
      if (session.localTranscriptJson && transcript.length === 0) {
        try { transcript = JSON.parse(session.localTranscriptJson as string); } catch {}
      }
      if (session.localRecordingPath) recordingUrl = `/api/shadow/recording/${session.id}`;

      let notes: Array<{ id: string; text: string; createdAt: string }> = [];
      try { notes = session.notes ? JSON.parse(session.notes as string) : []; } catch {}

      const actions = await db.select().from(operatorActions).where(eq(operatorActions.sessionId, input.sessionId)).orderBy(desc(operatorActions.createdAt)).limit(200);

      let aiReport: AiReport | null = null;
      try {
        const [rows] = await rawSql(`SELECT ai_report FROM archive_events WHERE event_id = ? LIMIT 1`, [`shadow-${session.id}`]);
        if (rows?.[0]?.ai_report) aiReport = typeof rows[0].ai_report === "string" ? JSON.parse(rows[0].ai_report) : rows[0].ai_report;
      } catch {}

      const fullText = transcript.map(s => `[${s.speaker}]: ${s.text}`).join("\n");
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;
      const qaActions = actions.filter(a => a.actionType.startsWith("question_"));
      const duration = session.startedAt && session.endedAt ? Math.round((session.endedAt - session.startedAt) / 1000) : null;

      let qaData: any[] = [];
      let dedupGroups: Record<number, number[]> = {};
      let legalReviewItems: any[] = [];
      try {
        const [qaRows] = await rawSql(
          `SELECT q.id, q.question_text, q.question_status, q.triage_classification, q.priority_score,
                  q.duplicate_of_id, q.legal_review_reason, q.ai_draft_text, q.submitter_name, q.submitter_company
           FROM live_qa_questions q
           JOIN live_qa_sessions s ON s.id = q.session_id
           WHERE s.shadow_session_id = ?
           ORDER BY q.priority_score DESC`, [input.sessionId]);
        qaData = qaRows || [];
        for (const q of qaData) {
          if (q.duplicate_of_id) {
            if (!dedupGroups[q.duplicate_of_id]) dedupGroups[q.duplicate_of_id] = [];
            dedupGroups[q.duplicate_of_id].push(q.id);
          }
          if (q.legal_review_reason) legalReviewItems.push({ id: q.id, text: q.question_text, reason: q.legal_review_reason, status: q.question_status });
        }
      } catch {}

      const readiness = {
        hasTranscript: transcript.length > 0,
        hasRecording: !!recordingUrl,
        hasAiReport: !!aiReport,
        hasNotes: notes.length > 0,
        hasActions: actions.length > 0,
        score: [transcript.length > 0, !!recordingUrl, !!aiReport, notes.length > 0].filter(Boolean).length,
        maxScore: 4,
      };

      return {
        session: {
          id: session.id,
          clientName: session.clientName,
          eventName: session.eventName,
          eventType: session.eventType,
          platform: session.platform,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration,
        },
        transcript: { segments: transcript, wordCount },
        recording: { url: recordingUrl },
        notes,
        actionLog: actions,
        qaSummary: {
          total: qaActions.length,
          approved: qaActions.filter(a => a.actionType === "question_approve").length,
          rejected: qaActions.filter(a => a.actionType === "question_reject").length,
          held: qaActions.filter(a => a.actionType === "question_hold").length,
          legalReview: qaActions.filter(a => a.actionType === "question_legal_review").length,
          sentToSpeaker: qaActions.filter(a => a.actionType === "question_send_to_speaker").length,
          questions: qaData.length,
          duplicateGroups: Object.keys(dedupGroups).length,
          legalReviewPending: legalReviewItems.length,
        },
        qaQuestions: qaData,
        dedupGroups,
        legalReviewItems,
        aiReport,
        readiness,
      };
    }),

  exportSession: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      format: z.enum(["csv", "json", "pdf"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(shadowSessions).where(eq(shadowSessions.id, input.sessionId)).limit(1);
      if (!session) throw new Error("Session not found");

      let transcript: Array<{ speaker: string; text: string; timestamp: number }> = [];
      if (session.recallBotId) {
        const [bot] = await db.select().from(recallBots).where(eq(recallBots.recallBotId, session.recallBotId)).limit(1);
        if (bot?.transcriptJson) transcript = JSON.parse(bot.transcriptJson);
      }
      if (session.localTranscriptJson && transcript.length === 0) {
        try { transcript = JSON.parse(session.localTranscriptJson as string); } catch {}
      }

      let notes: Array<{ id: string; text: string; createdAt: string }> = [];
      try { notes = session.notes ? JSON.parse(session.notes as string) : []; } catch {}

      const actions = await db.select().from(operatorActions).where(eq(operatorActions.sessionId, input.sessionId)).orderBy(desc(operatorActions.createdAt)).limit(500);

      let aiReport: AiReport | null = null;
      try {
        const [rows] = await rawSql(`SELECT ai_report FROM archive_events WHERE event_id = ? LIMIT 1`, [`shadow-${session.id}`]);
        if (rows?.[0]?.ai_report) aiReport = typeof rows[0].ai_report === "string" ? JSON.parse(rows[0].ai_report) : rows[0].ai_report;
      } catch {}

      let recordingUrl: string | null = null;
      if (session.recallBotId) {
        const [bot] = await db.select().from(recallBots).where(eq(recallBots.recallBotId, session.recallBotId)).limit(1);
        if (bot?.recordingUrl) recordingUrl = bot.recordingUrl;
      }
      if (!recordingUrl && session.localRecordingPath) recordingUrl = `/api/shadow/recording/${session.id}`;

      const startTime = session.startedAt ? new Date(session.startedAt) : null;
      const endTime = session.endedAt ? new Date(session.endedAt) : null;
      const durationMs = startTime && endTime ? endTime.getTime() - startTime.getTime() : null;
      const durationFormatted = durationMs ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s` : "N/A";

      const exportedAt = new Date().toISOString();

      let qaData: any[] = [];
      try {
        const [qaRows] = await rawSql(
          `SELECT q.id, q.question_text, q.question_status, q.triage_classification, q.priority_score,
                  q.duplicate_of_id, q.legal_review_reason, q.ai_draft_text, q.submitter_name, q.submitter_company
           FROM live_qa_questions q
           JOIN live_qa_sessions s ON s.id = q.session_id
           WHERE s.shadow_session_id = ?
           ORDER BY q.priority_score DESC`, [input.sessionId]);
        qaData = qaRows || [];
      } catch {}

      await logOperatorAction({ sessionId: input.sessionId, actionType: "export_generated", detail: `${input.format.toUpperCase()} export generated` });

      if (input.format === "csv") {
        const csvSafe = (val: string): string => {
          if (!val) return '""';
          let s = val.replace(/\r?\n/g, " ");
          if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
          return `"${s.replace(/"/g, '""')}"`;
        };

        const csvRows: string[] = [];
        csvRows.push("Section,Timestamp,Speaker,Content,Metadata");

        csvRows.push(`Event Info,,,${csvSafe(`${session.clientName} — ${session.eventName}`)},${csvSafe(`Type: ${session.eventType}, Platform: ${session.platform}, Status: ${session.status}`)}`);
        if (startTime) csvRows.push(`Event Info,${startTime.toISOString()},,${csvSafe("Session Started")},`);
        if (endTime) csvRows.push(`Event Info,${endTime.toISOString()},,${csvSafe("Session Ended")},`);
        csvRows.push(`Event Info,,,${csvSafe(`Duration: ${durationFormatted}`)},`);
        if (session.meetingUrl) csvRows.push(`Event Info,,,${csvSafe(`Meeting URL: ${session.meetingUrl}`)},`);
        if (recordingUrl) csvRows.push(`Event Info,,,${csvSafe(`Recording: ${recordingUrl}`)},has_recording`);
        csvRows.push(`Event Info,${exportedAt},,${csvSafe("Export Generated")},export_timestamp`);

        for (const seg of transcript) {
          csvRows.push(`Transcript,${seg.timestamp},${csvSafe(seg.speaker)},${csvSafe(seg.text)},`);
        }

        for (const note of notes) {
          csvRows.push(`Note,${note.createdAt},,${csvSafe(note.text)},`);
        }

        for (const act of actions) {
          csvRows.push(`Action,${act.createdAt.toISOString()},${csvSafe(act.operatorName ?? "")},${csvSafe(act.detail ?? act.actionType)},${csvSafe(act.actionType)}`);
        }

        if (aiReport?.executiveSummary) {
          csvRows.push(`AI Report,,,${csvSafe(aiReport.executiveSummary)},executive_summary`);
        }
        if (aiReport?.sentimentAnalysis) {
          csvRows.push(`AI Report,,,${csvSafe(`Sentiment: ${aiReport.sentimentAnalysis.score}/100 — ${aiReport.sentimentAnalysis.narrative?.slice(0, 200) ?? ""}`)},sentiment`);
        }
        if (aiReport?.complianceReview) {
          csvRows.push(`AI Report,,,${csvSafe(`Risk: ${aiReport.complianceReview.riskLevel}${aiReport.complianceReview.flaggedPhrases?.length ? ` — Flags: ${aiReport.complianceReview.flaggedPhrases.join(", ")}` : ""}`)},compliance`);
        }
        if (aiReport?.keyTopics) {
          const topics = Array.isArray(aiReport.keyTopics)
            ? aiReport.keyTopics.map((t: any) => typeof t === "string" ? t : (t?.topic || t?.name || JSON.stringify(t))).join("; ")
            : String(aiReport.keyTopics);
          csvRows.push(`AI Report,,,${csvSafe(topics)},key_topics`);
        }
        if (aiReport?.riskFactors) {
          const risks = Array.isArray(aiReport.riskFactors)
            ? aiReport.riskFactors.map((r: any) => typeof r === "string" ? r : (r?.factor || r?.description || r?.name || JSON.stringify(r))).join("; ")
            : String(aiReport.riskFactors);
          csvRows.push(`AI Report,,,${csvSafe(risks)},risk_factors`);
        }
        if (aiReport?.actionItems) {
          const items = Array.isArray(aiReport.actionItems)
            ? aiReport.actionItems.map((a: any) => typeof a === "string" ? a : (a?.action || a?.description || a?.item || JSON.stringify(a))).join("; ")
            : String(aiReport.actionItems);
          csvRows.push(`AI Report,,,${csvSafe(items)},action_items`);
        }

        if (!aiReport) {
          csvRows.push(`Compliance,,,${csvSafe("No AI report generated — compliance review not available")},no_report`);
        }

        for (const q of qaData) {
          const dupLabel = q.duplicate_of_id ? `DUP of Q#${q.duplicate_of_id}` : "";
          const legalLabel = q.legal_review_reason ? `LEGAL: ${q.legal_review_reason}` : "";
          const meta = [q.question_status, q.triage_classification, dupLabel, legalLabel].filter(Boolean).join(" | ");
          csvRows.push(`Q&A,Q#${q.id},${csvSafe(q.submitter_name || "Anonymous")},${csvSafe(q.question_text)},${csvSafe(meta)}`);
        }

        return { content: csvRows.join("\n"), filename: `curalive-session-${session.id}.csv`, contentType: "text/csv" };
      }

      const sessionMeta = {
        id: session.id,
        clientName: session.clientName,
        eventName: session.eventName,
        eventType: session.eventType,
        platform: session.platform,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: durationFormatted,
        durationMs,
        meetingUrl: session.meetingUrl ?? null,
        recordingUrl,
        exportedAt,
      };

      const dedupGroups: Record<number, number[]> = {};
      const legalReviewItems: any[] = [];
      for (const q of qaData) {
        if (q.duplicate_of_id) {
          if (!dedupGroups[q.duplicate_of_id]) dedupGroups[q.duplicate_of_id] = [];
          dedupGroups[q.duplicate_of_id].push(q.id);
        }
        if (q.legal_review_reason) legalReviewItems.push({ id: q.id, text: q.question_text, reason: q.legal_review_reason });
      }
      const qaExport = { questions: qaData, dedupGroups, legalReviewItems };

      if (input.format === "pdf") {
        return {
          content: JSON.stringify({ session: sessionMeta, transcript, notes, actionLog: actions, aiReport, qa: qaExport }),
          filename: `curalive-session-${session.id}.pdf`,
          contentType: "application/pdf",
          pdfData: true,
        };
      }

      return {
        content: JSON.stringify({ session: sessionMeta, transcript, notes, actionLog: actions, aiReport, qa: qaExport }, null, 2),
        filename: `curalive-session-${session.id}.json`,
        contentType: "application/json",
      };
    }),

  getReport: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const eventId = `shadow-${input.sessionId}`;
      try {
        const [rows] = await rawSql(
          `SELECT ai_report FROM archive_events WHERE event_id = $1 LIMIT 1`,
          [eventId]
        );
        if (rows?.[0]?.ai_report) {
          const report = typeof rows[0].ai_report === "string"
            ? JSON.parse(rows[0].ai_report)
            : rows[0].ai_report;
          return report;
        }
      } catch {}
      return null;
    }),

});
