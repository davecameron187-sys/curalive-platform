import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

interface BotSession {
  id: string;
  conferenceId: string;
  meetingUrl: string;
  status: "idle" | "connecting" | "connected" | "recording" | "stopped";
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  transcriptionSegments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    speaker?: string;
  }>;
}

// In-memory store for bot sessions (in production, use database)
const botSessions = new Map<string, BotSession>();

export const botRouter = router({
  // Create a new bot session
  createBot: publicProcedure
    .input(
      z.object({
        conferenceId: z.string(),
        meetingUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const botId = `bot_${input.conferenceId}_${Date.now()}`;

      const botSession: BotSession = {
        id: botId,
        conferenceId: input.conferenceId,
        meetingUrl: input.meetingUrl,
        status: "idle",
        createdAt: new Date(),
        transcriptionSegments: [],
      };

      botSessions.set(botId, botSession);

      console.log(`[Bot] Created bot session: ${botId}`);

      return {
        botId,
        status: "created",
        message: "Bot session created successfully",
      };
    }),

  // Start transcription for a bot
  startTranscription: publicProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      const botSession = botSessions.get(input.botId);

      if (!botSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot session not found",
        });
      }

      botSession.status = "connecting";
      botSession.startedAt = new Date();

      console.log(`[Bot] Starting transcription for bot: ${input.botId}`);

      // Simulate connection delay
      setTimeout(() => {
        const session = botSessions.get(input.botId);
        if (session) {
          session.status = "connected";
          setTimeout(() => {
            if (session) {
              session.status = "recording";
              console.log(`[Bot] Bot ${input.botId} is now recording`);
            }
          }, 1000);
        }
      }, 2000);

      return {
        botId: input.botId,
        status: botSession.status,
        message: "Transcription started",
      };
    }),

  // Add transcription segment
  addTranscriptionSegment: publicProcedure
    .input(
      z.object({
        botId: z.string(),
        text: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        speaker: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const botSession = botSessions.get(input.botId);

      if (!botSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot session not found",
        });
      }

      botSession.transcriptionSegments.push({
        text: input.text,
        startTime: input.startTime,
        endTime: input.endTime,
        speaker: input.speaker,
      });

      console.log(
        `[Bot] Added transcription segment to ${input.botId}: ${input.text.substring(0, 50)}...`
      );

      return {
        botId: input.botId,
        segmentCount: botSession.transcriptionSegments.length,
        message: "Transcription segment added",
      };
    }),

  // Get bot status
  getBotStatus: publicProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ input }) => {
      const botSession = botSessions.get(input.botId);

      if (!botSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot session not found",
        });
      }

      return {
        botId: input.botId,
        status: botSession.status,
        conferenceId: botSession.conferenceId,
        meetingUrl: botSession.meetingUrl,
        createdAt: botSession.createdAt,
        startedAt: botSession.startedAt,
        transcriptionSegments: botSession.transcriptionSegments,
        segmentCount: botSession.transcriptionSegments.length,
      };
    }),

  // Get transcription segments
  getTranscriptionSegments: publicProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ input }) => {
      const botSession = botSessions.get(input.botId);

      if (!botSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot session not found",
        });
      }

      return {
        botId: input.botId,
        segments: botSession.transcriptionSegments,
        totalSegments: botSession.transcriptionSegments.length,
      };
    }),

  // Stop transcription
  stopTranscription: publicProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      const botSession = botSessions.get(input.botId);

      if (!botSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot session not found",
        });
      }

      botSession.status = "stopped";
      botSession.stoppedAt = new Date();

      console.log(`[Bot] Stopped transcription for bot: ${input.botId}`);

      return {
        botId: input.botId,
        status: botSession.status,
        stoppedAt: botSession.stoppedAt,
        totalSegments: botSession.transcriptionSegments.length,
        message: "Transcription stopped",
      };
    }),

  // Delete bot session
  deleteBot: publicProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      const botSession = botSessions.get(input.botId);

      if (!botSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot session not found",
        });
      }

      botSessions.delete(input.botId);
      console.log(`[Bot] Deleted bot session: ${input.botId}`);

      return {
        botId: input.botId,
        message: "Bot session deleted",
      };
    }),

  // List all bot sessions for a conference
  listBots: publicProcedure
    .input(z.object({ conferenceId: z.string() }))
    .query(async ({ input }) => {
      const bots = Array.from(botSessions.values()).filter(
        (bot) => bot.conferenceId === input.conferenceId
      );

      return {
        conferenceId: input.conferenceId,
        bots: bots.map((bot) => ({
          botId: bot.id,
          status: bot.status,
          createdAt: bot.createdAt,
          startedAt: bot.startedAt,
          stoppedAt: bot.stoppedAt,
          segmentCount: bot.transcriptionSegments.length,
        })),
        totalBots: bots.length,
      };
    }),
});
