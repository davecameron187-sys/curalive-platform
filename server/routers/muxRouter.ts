/**
 * Mux Router — RTMP Live Stream Management
 *
 * Provides tRPC procedures for creating and managing Mux live streams.
 * Each stream has an RTMP ingest URL + stream key (for OBS/vMix) and
 * an HLS playback URL (for attendees in the Event Room / Webcast Studio).
 *
 * Architecture:
 *   1. Operator calls `mux.createStream` for an event
 *   2. Server creates a Mux Live Stream via REST API, persists in mux_streams
 *   3. Operator copies RTMP URL + stream key into OBS/vMix and starts streaming
 *   4. Mux sends webhook events to POST /api/mux/webhook (status updates)
 *   5. Attendees watch via the HLS playback URL in the Event Room
 *
 * Mux REST API docs: https://docs.mux.com/api-reference/video
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { muxStreams } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID ?? "";
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET ?? "";
const MUX_API_BASE = "https://api.mux.com";

// ─── Mux REST helpers ─────────────────────────────────────────────────────────

function muxAuthHeader() {
  const credentials = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");
  return `Basic ${credentials}`;
}

async function muxFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${MUX_API_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": muxAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mux API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const muxRouter = router({
  /**
   * Check if Mux is configured (for UI feature gating).
   */
  isConfigured: publicProcedure.query(() => {
    return { configured: Boolean(MUX_TOKEN_ID && MUX_TOKEN_SECRET) };
  }),

  /**
   * Create a new Mux live stream for an event.
   * Returns the RTMP URL, stream key, and HLS playback URL.
   */
  createStream: protectedProcedure
    .input(z.object({
      label: z.string().min(1).max(200),
      eventId: z.number().optional(),
      meetingId: z.number().optional(),
      recordingEnabled: z.boolean().default(true),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Mux API credentials are not configured. Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET.",
        });
      }

      // Create live stream via Mux REST API
      const muxResponse = await muxFetch("/video/v1/live-streams", {
        method: "POST",
        body: JSON.stringify({
          playback_policy: [input.isPublic ? "public" : "signed"],
          new_asset_settings: input.recordingEnabled
            ? { playback_policy: ["public"] }
            : undefined,
          reduced_latency: true,
          reconnect_window: 60, // 60s grace period for reconnects
          max_continuous_duration: 43200, // 12 hours max
        }),
      });

      const stream = muxResponse.data;
      const playbackId = stream.playback_ids?.[0]?.id ?? null;

      // Persist in database
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(muxStreams).values({
        eventId: input.eventId ?? null,
        meetingId: input.meetingId ?? null,
        muxStreamId: stream.id,
        muxPlaybackId: playbackId,
        streamKey: stream.stream_key,
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        status: stream.status ?? "idle",
        label: input.label,
        isPublic: input.isPublic,
        recordingEnabled: input.recordingEnabled,
      });

      return {
        id: stream.id,
        streamKey: stream.stream_key,
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        playbackId,
        hlsUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        playerUrl: playbackId ? `https://stream.mux.com/${playbackId}` : null,
        status: stream.status ?? "idle",
        label: input.label,
      };
    }),

  /**
   * Get the current status and details of a stream.
   */
  getStream: publicProcedure
    .input(z.object({ muxStreamId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [localStream] = await db
        .select()
        .from(muxStreams)
        .where(eq(muxStreams.muxStreamId, input.muxStreamId))
        .limit(1);

      if (!localStream) throw new TRPCError({ code: "NOT_FOUND", message: "Stream not found" });

      // Fetch live status from Mux if configured
      let liveStatus = localStream.status;
      if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
        try {
          const muxData = await muxFetch(`/video/v1/live-streams/${input.muxStreamId}`);
          liveStatus = muxData.data?.status ?? localStream.status;
          if (liveStatus !== localStream.status) {
            await db
              .update(muxStreams)
              .set({ status: liveStatus, updatedAt: Date.now() })
              .where(eq(muxStreams.muxStreamId, input.muxStreamId));
          }
        } catch {
          // Use cached status if Mux is unreachable
        }
      }

      return {
        ...localStream,
        status: liveStatus,
        hlsUrl: localStream.muxPlaybackId
          ? `https://stream.mux.com/${localStream.muxPlaybackId}.m3u8`
          : null,
        playerUrl: localStream.muxPlaybackId
          ? `https://stream.mux.com/${localStream.muxPlaybackId}`
          : null,
      };
    }),

  /**
   * List all streams for an event or meeting.
   */
  listStreams: protectedProcedure
    .input(z.object({
      eventId: z.number().optional(),
      meetingId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const allStreams = await db.select().from(muxStreams);
      const filtered = allStreams.filter((s) => {
        if (input.eventId !== undefined) return s.eventId === input.eventId;
        if (input.meetingId !== undefined) return s.meetingId === input.meetingId;
        return true;
      });

      return filtered.map((s) => ({
        ...s,
        hlsUrl: s.muxPlaybackId ? `https://stream.mux.com/${s.muxPlaybackId}.m3u8` : null,
        playerUrl: s.muxPlaybackId ? `https://stream.mux.com/${s.muxPlaybackId}` : null,
      }));
    }),

  /**
   * Disable a stream (prevents future connections).
   */
  disableStream: protectedProcedure
    .input(z.object({ muxStreamId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [localStream] = await db
        .select()
        .from(muxStreams)
        .where(eq(muxStreams.muxStreamId, input.muxStreamId))
        .limit(1);

      if (!localStream) throw new TRPCError({ code: "NOT_FOUND", message: "Stream not found" });

      if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
        try {
          await muxFetch(`/video/v1/live-streams/${input.muxStreamId}/disable`, {
            method: "PUT",
          });
        } catch (err) {
          console.warn("Mux disable stream warning:", err);
        }
      }

      await db
        .update(muxStreams)
        .set({ status: "disabled", endedAt: Date.now(), updatedAt: Date.now() })
        .where(eq(muxStreams.muxStreamId, input.muxStreamId));

      return { success: true, message: "Stream disabled." };
    }),

  /**
   * Re-enable a previously disabled stream.
   */
  enableStream: protectedProcedure
    .input(z.object({ muxStreamId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [localStream] = await db
        .select()
        .from(muxStreams)
        .where(eq(muxStreams.muxStreamId, input.muxStreamId))
        .limit(1);

      if (!localStream) throw new TRPCError({ code: "NOT_FOUND", message: "Stream not found" });

      if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
        try {
          await muxFetch(`/video/v1/live-streams/${input.muxStreamId}/enable`, {
            method: "PUT",
          });
        } catch (err) {
          console.warn("Mux enable stream warning:", err);
        }
      }

      await db
        .update(muxStreams)
        .set({ status: "idle", endedAt: null, updatedAt: Date.now() })
        .where(eq(muxStreams.muxStreamId, input.muxStreamId));

      return { success: true, message: "Stream re-enabled." };
    }),

  /**
   * Delete a stream permanently.
   */
  deleteStream: protectedProcedure
    .input(z.object({ muxStreamId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [localStream] = await db
        .select()
        .from(muxStreams)
        .where(eq(muxStreams.muxStreamId, input.muxStreamId))
        .limit(1);

      if (!localStream) throw new TRPCError({ code: "NOT_FOUND", message: "Stream not found" });

      if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
        try {
          await muxFetch(`/video/v1/live-streams/${input.muxStreamId}`, {
            method: "DELETE",
          });
        } catch (err) {
          console.warn("Mux delete stream warning:", err);
        }
      }

      await db
        .delete(muxStreams)
        .where(eq(muxStreams.muxStreamId, input.muxStreamId));

      return { success: true };
    }),
});
