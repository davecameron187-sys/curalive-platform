/**
 * aiRouter.ts — tRPC procedures for CuraLive AI features.
 *
 * Procedures:
 *   ai.generateRollingSummary   — summarise last N transcript segments (operatorProcedure)
 *   ai.triageQuestion           — classify a Q&A question (operatorProcedure)
 *   ai.generateEventBrief       — generate event brief from press release (operatorProcedure)
 *   ai.generatePressRelease     — draft SENS/RNS press release from transcript (operatorProcedure)
 *   ai.generateEnhancedSummary  — comprehensive post-event summary (operatorProcedure)
 *   ai.translateSegment         — translate a transcript segment (publicProcedure)
 */

import { z } from "zod";
import { router } from "../_core/trpc";
import { operatorProcedure, publicProcedure } from "../_core/trpc";
import {
  generateRollingSummary,
  triageQuestion,
  generateEventBrief,
  generatePressRelease,
  generateEnhancedSummary,
  translateText,
  analyzeSpeakingPace,
} from "../aiAnalysis";
import { getDb, savePaceResults, getPaceHistory, getEventPaceResults } from "../db";
import { recallBots } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const aiRouter = router({
  // ─── Rolling Summary ──────────────────────────────────────────────────────────
  generateRollingSummary: operatorProcedure
    .input(
      z.object({
        botId: z.number().optional(),
        segments: z
          .array(z.object({ speaker: z.string(), text: z.string() }))
          .optional(),
        eventTitle: z.string().default("Live Event"),
      })
    )
    .mutation(async ({ input }) => {
      let segments = input.segments ?? [];

      // If no segments provided, load from DB via botId
      if (segments.length === 0 && input.botId) {
        const db = await getDb();
        if (db) {
          const [bot] = await db
            .select({ transcriptJson: recallBots.transcriptJson })
            .from(recallBots)
            .where(eq(recallBots.id, input.botId))
            .limit(1);
          if (bot?.transcriptJson) {
            segments = JSON.parse(bot.transcriptJson);
          }
        }
      }

      if (segments.length === 0) {
        return {
          text: "No transcript available yet.",
          timestamp: Date.now(),
          segmentCount: 0,
        };
      }

      return generateRollingSummary(segments, input.eventTitle);
    }),

  // ─── Q&A Auto-Triage ──────────────────────────────────────────────────────────
  triageQuestion: operatorProcedure
    .input(
      z.object({
        question: z.string().min(1).max(1000),
        existingQuestions: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      return triageQuestion(input.question, input.existingQuestions);
    }),

  // ─── Event Brief Generator ────────────────────────────────────────────────────
  generateEventBrief: operatorProcedure
    .input(
      z.object({
        pressRelease: z.string().min(10).max(10000),
        eventTitle: z.string().default("Investor Event"),
        companyName: z.string().default(""),
      })
    )
    .mutation(async ({ input }) => {
      return generateEventBrief(
        input.pressRelease,
        input.eventTitle,
        input.companyName
      );
    }),

  // ─── Press Release Draft ──────────────────────────────────────────────────────
  generatePressRelease: operatorProcedure
    .input(
      z.object({
        botId: z.number().optional(),
        segments: z
          .array(z.object({ speaker: z.string(), text: z.string() }))
          .optional(),
        eventTitle: z.string().default("Investor Event"),
        companyName: z.string().default(""),
        eventDate: z.string().default(""),
      })
    )
    .mutation(async ({ input }) => {
      let segments = input.segments ?? [];

      if (segments.length === 0 && input.botId) {
        const db = await getDb();
        if (db) {
          const [bot] = await db
            .select({ transcriptJson: recallBots.transcriptJson })
            .from(recallBots)
            .where(eq(recallBots.id, input.botId))
            .limit(1);
          if (bot?.transcriptJson) {
            segments = JSON.parse(bot.transcriptJson);
          }
        }
      }

      return generatePressRelease(
        segments,
        input.eventTitle,
        input.companyName,
        input.eventDate || new Date().toLocaleDateString("en-ZA")
      );
    }),

  // ─── Enhanced Post-Event Summary ──────────────────────────────────────────────
  generateEnhancedSummary: operatorProcedure
    .input(
      z.object({
        botId: z.number().optional(),
        segments: z
          .array(z.object({ speaker: z.string(), text: z.string() }))
          .optional(),
        qaItems: z
          .array(
            z.object({
              question: z.string(),
              answer: z.string().optional(),
            })
          )
          .default([]),
        eventTitle: z.string().default("Investor Event"),
      })
    )
    .mutation(async ({ input }) => {
      let segments = input.segments ?? [];

      if (segments.length === 0 && input.botId) {
        const db = await getDb();
        if (db) {
          const [bot] = await db
            .select({ transcriptJson: recallBots.transcriptJson })
            .from(recallBots)
            .where(eq(recallBots.id, input.botId))
            .limit(1);
          if (bot?.transcriptJson) {
            segments = JSON.parse(bot.transcriptJson);
          }
        }
      }

      return generateEnhancedSummary(segments, input.eventTitle, input.qaItems);
    }),

  // ─── Speaking-Pace Coach ────────────────────────────────────────────
  analyzeSpeakingPace: operatorProcedure
    .input(
      z.object({
        transcript: z.array(
          z.object({
            speaker: z.string(),
            text: z.string(),
            timeLabel: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ input }) => {
      return analyzeSpeakingPace(input.transcript);
    }),
  // ─── Pace History (persist & retrieve) ────────────────────────────────
  savePaceResults: operatorProcedure
    .input(
      z.object({
        eventId: z.string(),
        eventTitle: z.string(),
        speakers: z.array(
          z.object({
            speaker: z.string(),
            wpm: z.number(),
            paceLabel: z.string(),
            pauseScore: z.number(),
            fillerWordCount: z.number(),
            overallScore: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const rows = input.speakers.map((sp) => ({
        eventId: input.eventId,
        eventTitle: input.eventTitle,
        speaker: sp.speaker,
        wpm: sp.wpm,
        paceLabel: sp.paceLabel,
        pauseScore: sp.pauseScore,
        fillerWordCount: sp.fillerWordCount,
        overallScore: sp.overallScore,
      }));
      await savePaceResults(rows);
      return { saved: rows.length };
    }),

  getPaceHistory: operatorProcedure
    .input(
      z.object({
        speaker: z.string(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      return getPaceHistory(input.speaker, input.limit);
    }),

  getEventPaceResults: operatorProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return getEventPaceResults(input.eventId);
    }),

  // ─── Translation ─────────────────────────────────────────────────
  translateSegment: publicProcedure .input(
      z.object({
        text: z.string().min(1).max(2000),
        targetLanguage: z.string().default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const translated = await translateText(input.text, input.targetLanguage);
      return { translated };
    }),
});
