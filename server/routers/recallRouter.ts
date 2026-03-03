/**
 * Recall.ai Router — Meeting Bot Management
 *
 * Provides tRPC procedures for deploying, monitoring, and stopping Recall.ai
 * meeting bots that capture live audio and stream transcripts via Ably.
 *
 * Architecture:
 *   1. Operator calls `recall.deployBot` with a meeting URL
 *   2. Server creates a bot via Recall.ai REST API and persists it in recall_bots
 *   3. Recall.ai sends webhook events to POST /api/recall/webhook
 *   4. Webhook handler processes transcript chunks → publishes to Ably channel
 *   5. EventRoom / WebcastStudio subscribe to Ably and display live transcript
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { recallBots } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const RECALL_BASE_URL = process.env.RECALL_AI_BASE_URL ?? "https://eu-central-1.recall.ai/api/v1";
const RECALL_API_KEY = process.env.RECALL_AI_API_KEY ?? "";

// ─── Recall.ai REST helpers ──────────────────────────────────────────────────

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
    throw new Error(`Recall.ai API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function createRecallBot(params: {
  meetingUrl: string;
  botName: string;
  realtimeWebhookUrl: string;
  statusWebhookUrl: string;
  recordingEnabled: boolean;
  ablyChannel: string;
}) {
  return recallFetch("/bot/", {
    method: "POST",
    body: JSON.stringify({
      meeting_url: params.meetingUrl,
      bot_name: params.botName,
      // Use Recall.ai's built-in streaming transcription provider
      recording_config: {
        transcript: {
          provider: {
            recallai_streaming: {},
          },
        },
        // Optionally record video+audio for post-event replay
        ...(params.recordingEnabled ? { video: { format: "mp4" } } : {}),
        // Real-time endpoint: receives transcript.data events per-bot
        realtime_endpoints: [
          {
            type: "webhook",
            url: params.realtimeWebhookUrl,
            events: ["transcript.data"],
          },
        ],
      },
      // Status change webhooks are configured at the Recall dashboard level,
      // but we also pass a per-bot webhook_url as a fallback
      webhook_url: params.statusWebhookUrl,
      // Store our Ably channel in metadata so webhook handlers can look it up
      metadata: {
        ablyChannel: params.ablyChannel,
      },
      automatic_leave: {
        waiting_room_timeout: 1200, // 20 min wait before auto-leave
        noone_joined_timeout: 600,  // 10 min if no one joins
        everyone_left_timeout: 120, // 2 min after everyone leaves
      },
    }),
  });
}

async function getRecallBotStatus(recallBotId: string) {
  return recallFetch(`/bot/${recallBotId}/`);
}

async function stopRecallBot(recallBotId: string) {
  return recallFetch(`/bot/${recallBotId}/leave_call/`, { method: "POST" });
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const recallRouter = router({
  /**
   * Deploy a Recall.ai bot to a meeting URL.
   * The bot will join the meeting, capture audio, and stream transcripts via webhook.
   */
  deployBot: protectedProcedure
    .input(z.object({
      meetingUrl: z.string().url("Must be a valid meeting URL"),
      botName: z.string().default("Chorus.AI"),
      eventId: z.number().optional(),
      meetingId: z.number().optional(),
      enableRecording: z.boolean().default(false),
      // The public webhook URL for this deployment (passed from frontend)
      webhookBaseUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      if (!RECALL_API_KEY) {
        throw new Error("RECALL_AI_API_KEY is not configured");
      }

      const webhookUrl = `${input.webhookBaseUrl}/api/recall/webhook`;
      const ablyChannel = `chorus-event-${input.eventId ?? input.meetingId ?? "webcast"}-${Date.now()}`;

      // Create bot via Recall.ai API
      const bot = await createRecallBot({
        meetingUrl: input.meetingUrl,
        botName: input.botName,
        realtimeWebhookUrl: webhookUrl,
        statusWebhookUrl: webhookUrl,
        recordingEnabled: input.enableRecording,
        ablyChannel,
      });

      // Persist in database
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(recallBots).values({
        recallBotId: bot.id,
        meetingUrl: input.meetingUrl,
        botName: input.botName,
        eventId: input.eventId ?? null,
        meetingId: input.meetingId ?? null,
        status: bot.status_code ?? "created",
        ablyChannel,
        transcriptJson: JSON.stringify([]),
      });

      return {
        botId: bot.id,
        status: bot.status_code ?? "created",
        ablyChannel,
        message: `Bot deployed. It will join the meeting within 30–60 seconds.`,
      };
    }),

  /**
   * Get the current status of a deployed bot.
   */
  getBotStatus: publicProcedure
    .input(z.object({ recallBotId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [localBot] = await db
        .select()
        .from(recallBots)
        .where(eq(recallBots.recallBotId, input.recallBotId))
        .limit(1);

      if (!localBot) throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });

      // Also fetch live status from Recall.ai
      let liveStatus = localBot.status;
      try {
        const recallData = await getRecallBotStatus(input.recallBotId);
        liveStatus = (recallData.status_code as string) ?? localBot.status;
        // Update local status if changed
        if (liveStatus !== localBot.status) {
          await db
            .update(recallBots)
            .set({ status: liveStatus })
            .where(eq(recallBots.recallBotId, input.recallBotId));
        }
      } catch {
        // Use cached status if Recall.ai is unreachable
      }

      return {
        ...localBot,
        status: liveStatus,
        transcriptSegments: localBot.transcriptJson
          ? JSON.parse(localBot.transcriptJson)
          : [],
      };
    }),

  /**
   * Stop a bot and remove it from the meeting.
   */
  stopBot: protectedProcedure
    .input(z.object({ recallBotId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [localBot] = await db
        .select()
        .from(recallBots)
        .where(eq(recallBots.recallBotId, input.recallBotId))
        .limit(1);

      if (!localBot) throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });

      try {
        await stopRecallBot(input.recallBotId);
      } catch (err) {
        // Bot may have already left — that's fine
        console.warn("Stop bot warning:", err);
      }

      await db
        .update(recallBots)
        .set({ status: "done", leftAt: Date.now() })
        .where(eq(recallBots.recallBotId, input.recallBotId));

      return { success: true, message: "Bot removed from meeting." };
    }),

  /**
   * List all bots for a given event or meeting.
   */
  listBots: protectedProcedure
    .input(z.object({
      eventId: z.number().optional(),
      meetingId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const allBots = await db.select().from(recallBots);
      return allBots
        .filter((b) =>
          (input.eventId !== undefined && b.eventId === input.eventId) ||
          (input.meetingId !== undefined && b.meetingId === input.meetingId)
        )
        .map((b) => ({
          ...b,
          transcriptSegments: b.transcriptJson ? JSON.parse(b.transcriptJson) : [],
        }));
    }),

  /**
   * Get the full transcript for a bot (for post-event use).
   */
  getTranscript: publicProcedure
    .input(z.object({ recallBotId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [bot] = await db
        .select()
        .from(recallBots)
        .where(eq(recallBots.recallBotId, input.recallBotId))
        .limit(1);

      if (!bot) throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });

      return {
        recallBotId: bot.recallBotId,
        status: bot.status,
        summary: bot.summary,
        recordingUrl: bot.recordingUrl,
        segments: bot.transcriptJson ? JSON.parse(bot.transcriptJson) : [],
        startedAt: bot.startedAt,
        leftAt: bot.leftAt,
      };
    }),

  /**
   * Check if Recall.ai is configured (for UI feature gating).
   */
  isConfigured: publicProcedure.query(() => {
    return { configured: Boolean(RECALL_API_KEY) };
  }),
});
