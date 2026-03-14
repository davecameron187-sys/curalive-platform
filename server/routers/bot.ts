import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Simplified types to reduce memory overhead
type BotStatus = "idle" | "connecting" | "connected" | "recording" | "stopped";

interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
}

interface BotSession {
  id: string;
  conferenceId: string;
  meetingUrl: string;
  status: BotStatus;
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  transcriptionSegments: TranscriptionSegment[];
}

// In-memory store for bot sessions
const botSessions = new Map<string, BotSession>();

export const botRouter = router({
  createBot: publicProcedure
    .input(z.object({ conferenceId: z.string(), meetingUrl: z.string().url() }))
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
      return { botId, status: "created" };
    }),

  startTranscription: publicProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      const botSession = botSessions.get(input.botId);
      if (!botSession) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });
      }
      botSession.status = "connecting";
      botSession.startedAt = new Date();
      return { botId: input.botId, status: botSession.status };
    }),

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
        throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });
      }
      botSession.transcriptionSegments.push({
        text: input.text,
        startTime: input.startTime,
        endTime: input.endTime,
        speaker: input.speaker,
      });
      return { botId: input.botId, segmentCount: botSession.transcriptionSegments.length };
    }),

  getBotStatus: publicProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ input }) => {
      const botSession = botSessions.get(input.botId);
      if (!botSession) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });
      }
      return {
        botId: input.botId,
        status: botSession.status,
        conferenceId: botSession.conferenceId,
        segmentCount: botSession.transcriptionSegments.length,
      };
    }),

  getTranscriptionSegments: publicProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ input }) => {
      const botSession = botSessions.get(input.botId);
      if (!botSession) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });
      }
      return {
        botId: input.botId,
        segments: botSession.transcriptionSegments,
        totalSegments: botSession.transcriptionSegments.length,
      };
    }),

  stopTranscription: publicProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      const botSession = botSessions.get(input.botId);
      if (!botSession) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bot not found" });
      }
      botSession.status = "stopped";
      botSession.stoppedAt = new Date();
      return { botId: input.botId, status: botSession.status };
    }),

  deleteBot: publicProcedure
    .input(z.object({ botId: z.string() }))
    .mutation(async ({ input }) => {
      botSessions.delete(input.botId);
      return { botId: input.botId, message: "Bot deleted" };
    }),

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
          segmentCount: bot.transcriptionSegments.length,
        })),
        totalBots: bots.length,
      };
    }),
});
