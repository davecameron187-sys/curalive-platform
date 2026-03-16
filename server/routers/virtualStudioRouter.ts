// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { virtualStudioService } from "../services/VirtualStudioService";
import { getDb } from "../db";
import { esgStudioFlags, virtualStudios } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "pt", "zh", "ja", "ar", "hi", "ko", "it", "nl"];

const LAYOUT_TEMPLATES = [
  { id: "single-presenter", label: "Single Presenter", description: "Full-screen presenter with optional lower third", slots: 1 },
  { id: "dual-presenter", label: "Dual Presenter", description: "Side-by-side presenters with equal sizing", slots: 2 },
  { id: "presenter-slides", label: "Presenter + Slides", description: "Presenter in corner with slides taking main area", slots: 2 },
  { id: "panel-discussion", label: "Panel Discussion", description: "Grid layout for 3-6 panelists", slots: 6 },
  { id: "interview", label: "Interview", description: "Host and guest in equal split", slots: 2 },
  { id: "picture-in-picture", label: "Picture-in-Picture", description: "Main feed with small overlay window", slots: 2 },
  { id: "slides-only", label: "Slides Only", description: "Full-screen presentation or screen share", slots: 1 },
  { id: "three-up", label: "Three-Up", description: "Three equal panels side by side", slots: 3 },
];

async function rawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(query, params);
  return rows as T[];
}

async function rawExecute(query: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(query, params);
}

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

  getLayoutTemplates: publicProcedure.query(() => LAYOUT_TEMPLATES),

  createSession: publicProcedure
    .input(z.object({
      eventId: z.string(),
      layout: z.string().default("single-presenter"),
    }))
    .mutation(async ({ input }) => {
      const defaultFeeds = [
        { id: "feed-1", label: "Presenter Camera", type: "camera", active: true, position: "main" },
      ];
      const defaultLowerThirds = [
        { id: "lt-1", label: "Presenter Name", type: "presenter_info", visible: false, text: "", subtext: "", position: "bottom-left", style: "corporate" },
        { id: "lt-2", label: "Company Logo", type: "logo", visible: false, logoUrl: "", position: "top-right", style: "corporate" },
        { id: "lt-3", label: "Live Sentiment", type: "dynamic_data", visible: false, dataSource: "sentiment_score", position: "bottom-right", style: "data-bar" },
        { id: "lt-4", label: "Participant Count", type: "dynamic_data", visible: false, dataSource: "participant_count", position: "top-left", style: "counter" },
      ];

      await rawExecute(`
        INSERT INTO studio_sessions
          (event_id, active_layout, feed_sources, lower_thirds, active_overlays,
           live_sentiment_overlay, participant_count_overlay)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          active_layout = VALUES(active_layout),
          updated_at = NOW()
      `, [
        input.eventId, input.layout,
        JSON.stringify(defaultFeeds), JSON.stringify(defaultLowerThirds),
        JSON.stringify([]), false, false,
      ]);

      return {
        success: true,
        layout: input.layout,
        feedSources: defaultFeeds,
        lowerThirds: defaultLowerThirds,
      };
    }),

  getSession: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const [session] = await rawQuery(`SELECT * FROM studio_sessions WHERE event_id = ? LIMIT 1`, [input.eventId]);
      if (!session) return null;
      return {
        id: session.id,
        eventId: session.event_id,
        activeLayout: session.active_layout,
        feedSources: typeof session.feed_sources === 'string' ? JSON.parse(session.feed_sources) : session.feed_sources ?? [],
        lowerThirds: typeof session.lower_thirds === 'string' ? JSON.parse(session.lower_thirds) : session.lower_thirds ?? [],
        activeOverlays: typeof session.active_overlays === 'string' ? JSON.parse(session.active_overlays) : session.active_overlays ?? [],
        liveSentimentOverlay: !!session.live_sentiment_overlay,
        participantCountOverlay: !!session.participant_count_overlay,
        recordingStatus: session.recording_status,
        streamKey: session.stream_key,
      };
    }),

  switchLayout: publicProcedure
    .input(z.object({
      eventId: z.string(),
      layout: z.string(),
    }))
    .mutation(async ({ input }) => {
      const template = LAYOUT_TEMPLATES.find(t => t.id === input.layout);
      if (!template) return { success: false, error: "Unknown layout template" };

      await rawExecute(`UPDATE studio_sessions SET active_layout = ?, updated_at = NOW() WHERE event_id = ?`, [input.layout, input.eventId]);
      return { success: true, layout: template };
    }),

  updateFeedSources: publicProcedure
    .input(z.object({
      eventId: z.string(),
      feedSources: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["camera", "screen_share", "pre_recorded", "remote_guest"]),
        active: z.boolean(),
        position: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      await rawExecute(`UPDATE studio_sessions SET feed_sources = ?, updated_at = NOW() WHERE event_id = ?`, [JSON.stringify(input.feedSources), input.eventId]);
      return { success: true, feedCount: input.feedSources.length };
    }),

  updateLowerThirds: publicProcedure
    .input(z.object({
      eventId: z.string(),
      lowerThirds: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["presenter_info", "logo", "dynamic_data", "custom_text", "ticker"]),
        visible: z.boolean(),
        text: z.string().optional(),
        subtext: z.string().optional(),
        logoUrl: z.string().optional(),
        dataSource: z.string().optional(),
        position: z.string().optional(),
        style: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      await rawExecute(`UPDATE studio_sessions SET lower_thirds = ?, updated_at = NOW() WHERE event_id = ?`, [JSON.stringify(input.lowerThirds), input.eventId]);
      return { success: true };
    }),

  toggleOverlay: publicProcedure
    .input(z.object({
      eventId: z.string(),
      overlay: z.enum(["live_sentiment", "participant_count"]),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const col = input.overlay === "live_sentiment" ? "live_sentiment_overlay" : "participant_count_overlay";
      await rawExecute(`UPDATE studio_sessions SET ${col} = ?, updated_at = NOW() WHERE event_id = ?`, [input.enabled ? 1 : 0, input.eventId]);
      return { success: true, overlay: input.overlay, enabled: input.enabled };
    }),

  getPreview: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const [session] = await rawQuery(`SELECT * FROM studio_sessions WHERE event_id = ? LIMIT 1`, [input.eventId]);
      if (!session) return null;

      const feeds = typeof session.feed_sources === 'string' ? JSON.parse(session.feed_sources) : session.feed_sources ?? [];
      const lowerThirds = typeof session.lower_thirds === 'string' ? JSON.parse(session.lower_thirds) : session.lower_thirds ?? [];
      const layout = LAYOUT_TEMPLATES.find(t => t.id === session.active_layout) ?? LAYOUT_TEMPLATES[0];

      return {
        layout,
        activeFeeds: feeds.filter((f: any) => f.active),
        visibleLowerThirds: lowerThirds.filter((lt: any) => lt.visible),
        liveSentimentOverlay: !!session.live_sentiment_overlay,
        participantCountOverlay: !!session.participant_count_overlay,
        recordingStatus: session.recording_status,
        previewDescription: `Broadcasting in "${layout.label}" layout with ${feeds.filter((f: any) => f.active).length} active feed(s) and ${lowerThirds.filter((lt: any) => lt.visible).length} overlay(s).`,
      };
    }),

  startRecording: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      await rawExecute(`UPDATE studio_sessions SET recording_status = 'recording', updated_at = NOW() WHERE event_id = ?`, [input.eventId]);
      return { success: true, status: "recording", startedAt: new Date().toISOString() };
    }),

  stopRecording: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      await rawExecute(`UPDATE studio_sessions SET recording_status = 'stopped', updated_at = NOW() WHERE event_id = ?`, [input.eventId]);
      return { success: true, status: "stopped", stoppedAt: new Date().toISOString() };
    }),
});

export type VirtualStudioRouter = typeof virtualStudioRouter;
