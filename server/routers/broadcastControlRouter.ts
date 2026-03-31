/**
 * Broadcast Control Router — Audio/Video Webcast Management Console
 *
 * Provides tRPC procedures for managing live broadcasts:
 *   1. create      — Create a new broadcast session
 *   2. start       — Start a broadcast (go live)
 *   3. stop        — Stop a broadcast
 *   4. getStatus   — Get current broadcast status and metrics
 *   5. updateMetrics — Record a metrics snapshot
 *   6. getAnalytics — Get analytics for a broadcast
 *   7. list        — List all broadcasts
 *   8. getShareUrl — Get/generate shareable URL
 *   9. archive     — Create archive record for a completed broadcast
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  broadcasts,
  broadcastMetrics,
  broadcastEvents,
  broadcastArchives,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ─── Router ──────────────────────────────────────────────────────────────────

export const broadcastControlRouter = router({
  /**
   * 1. Create a new broadcast session.
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        mode: z.enum(["audio", "video", "video_only"]),
        eventId: z.string().optional(),
        quality: z.enum(["480p", "720p", "1080p"]).default("720p"),
        autoRecord: z.boolean().default(true),
        allowChat: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const result = await db.insert(broadcasts).values({
        title: input.title,
        mode: input.mode,
        eventId: input.eventId ?? null,
        quality: input.quality,
        autoRecord: input.autoRecord,
        allowChat: input.allowChat,
        status: "ready",
        operatorId: ctx.user?.id ?? null,
      });

      const broadcastId = Number(result[0].insertId);

      // Log creation event
      await db.insert(broadcastEvents).values({
        broadcastId,
        eventType: "created",
        detail: `Broadcast "${input.title}" created in ${input.mode} mode`,
      });

      return {
        broadcastId,
        message: `Broadcast "${input.title}" created successfully`,
      };
    }),

  /**
   * 2. Start a broadcast (go live).
   */
  start: protectedProcedure
    .input(z.object({ broadcastId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (!broadcast)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });

      if (broadcast.status === "live")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Broadcast is already live",
        });

      // Generate shareable URL
      const shareUrl = `https://curalive.live/watch/${input.broadcastId}`;

      await db
        .update(broadcasts)
        .set({
          status: "live",
          startedAt: new Date(),
          shareUrl,
        })
        .where(eq(broadcasts.id, input.broadcastId));

      // Log start event
      await db.insert(broadcastEvents).values({
        broadcastId: input.broadcastId,
        eventType: "started",
        detail: `Broadcast went live at ${new Date().toISOString()}`,
      });

      return {
        success: true,
        shareUrl,
        message: "Broadcast is now LIVE",
      };
    }),

  /**
   * 3. Stop a broadcast.
   */
  stop: protectedProcedure
    .input(z.object({ broadcastId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (!broadcast)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });

      const now = new Date();
      const duration = broadcast.startedAt
        ? Math.round((now.getTime() - new Date(broadcast.startedAt).getTime()) / 1000)
        : 0;

      await db
        .update(broadcasts)
        .set({
          status: "stopped",
          stoppedAt: now,
          duration,
        })
        .where(eq(broadcasts.id, input.broadcastId));

      // Log stop event
      await db.insert(broadcastEvents).values({
        broadcastId: input.broadcastId,
        eventType: "stopped",
        detail: `Broadcast stopped after ${duration} seconds`,
      });

      // Auto-archive if recording was enabled
      if (broadcast.autoRecord) {
        await db.insert(broadcastArchives).values({
          broadcastId: input.broadcastId,
          duration,
          format: broadcast.mode === "audio" ? "mp3" : "mp4",
        });
      }

      return {
        success: true,
        duration,
        message: `Broadcast stopped. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
      };
    }),

  /**
   * 4. Get current broadcast status and latest metrics.
   */
  getStatus: publicProcedure
    .input(z.object({ broadcastId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (!broadcast)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });

      // Calculate live duration
      let liveDuration = broadcast.duration ?? 0;
      if (broadcast.status === "live" && broadcast.startedAt) {
        liveDuration = Math.round(
          (Date.now() - new Date(broadcast.startedAt).getTime()) / 1000
        );
      }

      // Get latest metrics snapshot
      const latestMetrics = await db
        .select()
        .from(broadcastMetrics)
        .where(eq(broadcastMetrics.broadcastId, input.broadcastId))
        .orderBy(desc(broadcastMetrics.recordedAt))
        .limit(1);

      return {
        ...broadcast,
        liveDuration,
        latestMetrics: latestMetrics[0] ?? null,
      };
    }),

  /**
   * 5. Record a metrics snapshot (called every ~2 seconds while live).
   */
  updateMetrics: protectedProcedure
    .input(
      z.object({
        broadcastId: z.number().int().positive(),
        viewerCount: z.number().int().min(0).default(0),
        bitrate: z.number().int().optional(),
        latency: z.number().int().optional(),
        cpuUsage: z.number().optional(),
        bufferHealth: z.number().optional(),
        droppedFrames: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      // Insert metrics snapshot
      await db.insert(broadcastMetrics).values({
        broadcastId: input.broadcastId,
        viewerCount: input.viewerCount,
        bitrate: input.bitrate ?? null,
        latency: input.latency ?? null,
        cpuUsage: input.cpuUsage ?? null,
        bufferHealth: input.bufferHealth ?? null,
        droppedFrames: input.droppedFrames,
      });

      // Update peak viewers on the broadcast record
      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (broadcast && input.viewerCount > (broadcast.peakViewers ?? 0)) {
        await db
          .update(broadcasts)
          .set({
            viewerCount: input.viewerCount,
            peakViewers: input.viewerCount,
            bitrate: input.bitrate ?? broadcast.bitrate,
            latency: input.latency ?? broadcast.latency,
          })
          .where(eq(broadcasts.id, input.broadcastId));
      } else if (broadcast) {
        await db
          .update(broadcasts)
          .set({
            viewerCount: input.viewerCount,
            bitrate: input.bitrate ?? broadcast.bitrate,
            latency: input.latency ?? broadcast.latency,
          })
          .where(eq(broadcasts.id, input.broadcastId));
      }

      return { success: true };
    }),

  /**
   * 6. Get analytics for a broadcast (metrics history + events).
   */
  getAnalytics: publicProcedure
    .input(z.object({ broadcastId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (!broadcast)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });

      const metrics = await db
        .select()
        .from(broadcastMetrics)
        .where(eq(broadcastMetrics.broadcastId, input.broadcastId))
        .orderBy(desc(broadcastMetrics.recordedAt));

      const events = await db
        .select()
        .from(broadcastEvents)
        .where(eq(broadcastEvents.broadcastId, input.broadcastId))
        .orderBy(desc(broadcastEvents.createdAt));

      const archives = await db
        .select()
        .from(broadcastArchives)
        .where(eq(broadcastArchives.broadcastId, input.broadcastId));

      return {
        broadcast,
        metrics,
        events,
        archives,
      };
    }),

  /**
   * 7. List all broadcasts.
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allBroadcasts = await db
      .select()
      .from(broadcasts)
      .orderBy(desc(broadcasts.createdAt));

    return allBroadcasts;
  }),

  /**
   * 8. Get/generate shareable URL for a broadcast.
   */
  getShareUrl: publicProcedure
    .input(z.object({ broadcastId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (!broadcast)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });

      const shareUrl =
        broadcast.shareUrl ??
        `https://curalive.live/watch/${input.broadcastId}`;

      // Persist if it wasn't already set
      if (!broadcast.shareUrl) {
        await db
          .update(broadcasts)
          .set({ shareUrl })
          .where(eq(broadcasts.id, input.broadcastId));
      }

      return {
        shareUrl,
        hlsUrl: broadcast.muxPlaybackId
          ? `https://stream.mux.com/${broadcast.muxPlaybackId}.m3u8`
          : null,
        mode: broadcast.mode,
        status: broadcast.status,
      };
    }),

  /**
   * 9. Create archive record for a completed broadcast.
   */
  archive: protectedProcedure
    .input(
      z.object({
        broadcastId: z.number().int().positive(),
        recordingUrl: z.string().url().optional(),
        s3Key: z.string().optional(),
        fileSize: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const [broadcast] = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (!broadcast)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast not found",
        });

      const result = await db.insert(broadcastArchives).values({
        broadcastId: input.broadcastId,
        recordingUrl: input.recordingUrl ?? null,
        duration: broadcast.duration,
        fileSize: input.fileSize ?? null,
        format: broadcast.mode === "audio" ? "mp3" : "mp4",
        s3Key: input.s3Key ?? null,
      });

      // Log archive event
      await db.insert(broadcastEvents).values({
        broadcastId: input.broadcastId,
        eventType: "archived",
        detail: `Recording archived${input.s3Key ? ` at ${input.s3Key}` : ""}`,
      });

      return {
        archiveId: Number(result[0].insertId),
        message: "Broadcast archived successfully",
      };
    }),
});
