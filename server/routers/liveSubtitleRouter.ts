// @ts-nocheck
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { LiveSubtitleTranslationService } from "../services/LiveSubtitleTranslationService";

export const liveSubtitleRouter = router({
  getSupportedLanguages: publicProcedure
    .query(async () => {
      return LiveSubtitleTranslationService.getSupportedLanguages();
    }),

  getFinancialGlossary: publicProcedure
    .input(z.object({ languageCode: z.string().max(10) }))
    .query(async ({ input }) => {
      return LiveSubtitleTranslationService.getFinancialGlossary(input.languageCode);
    }),

  startSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().max(64),
      eventId: z.string().max(128),
      sourceLanguage: z.string().max(10).optional(),
      targetLanguages: z.array(z.string().max(10)).min(1).max(10),
    }))
    .mutation(async ({ input }) => {
      return LiveSubtitleTranslationService.startSession(input);
    }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return LiveSubtitleTranslationService.getSession(input.sessionId);
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      return LiveSubtitleTranslationService.endSession(input.sessionId);
    }),

  translateSegment: protectedProcedure
    .input(z.object({
      sessionId: z.string().max(64),
      text: z.string().max(5000),
      speaker: z.string().max(255),
      timestamp: z.number(),
      targetLanguage: z.string().max(10),
    }))
    .mutation(async ({ input }) => {
      return LiveSubtitleTranslationService.translateSegment(input);
    }),

  translateBatch: protectedProcedure
    .input(z.object({
      segments: z.array(z.object({
        text: z.string().max(5000),
        speaker: z.string().max(255),
        timestamp: z.number(),
      })).min(1).max(50),
      targetLanguage: z.string().max(10),
      sessionId: z.string().max(64).optional(),
    }))
    .mutation(async ({ input }) => {
      return LiveSubtitleTranslationService.translateBatch(input);
    }),

  detectLanguage: publicProcedure
    .input(z.object({ text: z.string().max(2000) }))
    .mutation(async ({ input }) => {
      return LiveSubtitleTranslationService.detectLanguage(input.text);
    }),

  verifyQuality: protectedProcedure
    .input(z.object({
      original: z.string().max(5000),
      translated: z.string().max(5000),
      targetLanguage: z.string().max(10),
    }))
    .mutation(async ({ input }) => {
      return LiveSubtitleTranslationService.verifyTranslationQuality(input);
    }),

  getStats: protectedProcedure
    .query(async () => {
      return LiveSubtitleTranslationService.getTranslationStats();
    }),
});
