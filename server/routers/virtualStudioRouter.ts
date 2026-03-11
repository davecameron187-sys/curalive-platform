// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { virtualStudioService } from "../services/VirtualStudioService";
import { getDb } from "../db";
import { esgStudioFlags, virtualStudios } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "pt", "zh", "ja", "ar", "hi", "ko", "it", "nl"];

export const virtualStudioRouter = router({
  createStudio: publicProcedure
    .input(z.object({
      eventId: z.string(),
      bundleId: z.string(),
      studioName: z.string().optional(),
      avatarStyle: z.string().optional(),
      primaryLanguage: z.string().default("en"),
    }))
    .mutation(async ({ input }) => {
      const studio = await virtualStudioService.createOrUpdateStudio(input.eventId, input.bundleId, {
        studioName: input.studioName,
        avatarStyle: input.avatarStyle,
        primaryLanguage: input.primaryLanguage,
      });
      const bundleConfig = virtualStudioService.getBundleCustomization(input.bundleId);
      return { studio, bundleConfig };
    }),

  getStudio: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const studio = await virtualStudioService.getStudio(input.eventId);
      if (!studio) return { studio: null, bundleConfig: null, overlays: null };
      const bundleConfig = virtualStudioService.getBundleCustomization(studio.bundleId);
      const overlays = virtualStudioService.generateInterconnectionOverlays(studio.bundleId);
      return { studio, bundleConfig, overlays };
    }),

  updateAvatarConfig: publicProcedure
    .input(z.object({
      eventId: z.string(),
      avatarStyle: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(virtualStudios)
        .set({ avatarStyle: input.avatarStyle })
        .where(eq(virtualStudios.eventId, input.eventId));
      return { success: true };
    }),

  updateLanguageConfig: publicProcedure
    .input(z.object({
      eventId: z.string(),
      primaryLanguage: z.string(),
      dubbingLanguages: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(virtualStudios)
        .set({
          primaryLanguage: input.primaryLanguage,
          dubbingLanguages: JSON.stringify(input.dubbingLanguages),
        })
        .where(eq(virtualStudios.eventId, input.eventId));
      return { success: true, supported: SUPPORTED_LANGUAGES };
    }),

  toggleESG: publicProcedure
    .input(z.object({
      eventId: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(virtualStudios)
        .set({ esgEnabled: input.enabled })
        .where(eq(virtualStudios.eventId, input.eventId));
      return { success: true, esgEnabled: input.enabled };
    }),

  getESGFlags: publicProcedure
    .input(z.object({ studioId: z.number() }))
    .query(async ({ input }) => {
      return virtualStudioService.getESGReport(input.studioId);
    }),

  resolveESGFlag: publicProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input }) => {
      return virtualStudioService.resolveFlag(input.flagId);
    }),

  generateReplay: publicProcedure
    .input(z.object({
      eventId: z.string(),
      quality: z.enum(["720p", "1080p", "4k"]).default("1080p"),
      includeOverlays: z.boolean().default(true),
      includeSubtitles: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        replayConfig: {
          eventId: input.eventId,
          quality: input.quality,
          includeOverlays: input.includeOverlays,
          includeSubtitles: input.includeSubtitles,
          estimatedProcessingMinutes: input.quality === "4k" ? 45 : input.quality === "1080p" ? 20 : 10,
          status: "queued",
          queuedAt: new Date().toISOString(),
        },
      };
    }),

  getSupportedLanguages: publicProcedure.query(() => SUPPORTED_LANGUAGES),
});

export type VirtualStudioRouter = typeof virtualStudioRouter;
