/**
 * aiRouter.ts — tRPC procedures for Chorus.AI AI features.
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
} from "../aiAnalysis";
import { getDb } from "../db";
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

  // ─── Translation ──────────────────────────────────────────────────────────────
  translateSegment: publicProcedure
    .input(
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
