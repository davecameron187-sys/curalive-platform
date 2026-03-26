import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const restBridgeRouter = router({
  health: publicProcedure.query(async () => {
    const { validateEnv } = await import("../_core/config/env");
    const { getServiceStatus } = await import("../_core/config/serviceStatus");
    const { getStorageHealth } = await import("../storageAdapter");
    const validation = validateEnv();
    const services = getServiceStatus();
    const storage = getStorageHealth();
    return {
      ok: validation.isCoreValid,
      environment: process.env.NODE_ENV ?? "development",
      coreReady: validation.isCoreValid,
      missingCore: validation.missing.map((m: any) => m.key),
      missingOptional: validation.warnings.map((w: any) => ({
        key: w.key,
        requiredFor: w.requiredFor,
      })),
      services,
      storage,
      timestamp: new Date().toISOString(),
    };
  }),

  authStatus: publicProcedure.query(async ({ ctx }) => {
    const oauthEnabled = Boolean(process.env.OAUTH_SERVER_URL);
    const mode = oauthEnabled ? "oauth" : "dev-bypass";
    let user = null;
    try {
      const { sdk } = await import("../_core/sdk");
      const sessionUser = await sdk.authenticateRequest(ctx.req);
      if (sessionUser) {
        user = {
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          role: sessionUser.role,
        };
      }
    } catch {}
    return {
      authenticated: Boolean(user),
      mode,
      user,
      oauthConfigured: oauthEnabled,
    };
  }),

  archiveTranscript: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const { rawSql } = await import("../db");
      const [rows] = await rawSql(
        `SELECT event_name, client_name, event_date, transcript_text FROM archive_events WHERE id = ? LIMIT 1`,
        [input.id],
      );
      const row = (rows as any[])[0];
      if (!row) return { error: "Archive event not found", archiveId: input.id, found: false as const };
      if (!row.transcript_text)
        return { error: "No transcript available", archiveId: input.id, found: false as const };
      const header = `CuraLive Intelligence Transcript\n${"=".repeat(40)}\nEvent: ${row.event_name}\nClient: ${row.client_name}\nDate: ${row.event_date || "N/A"}\n${"=".repeat(40)}\n\n`;
      return {
        found: true as const,
        eventName: row.event_name,
        clientName: row.client_name,
        eventDate: row.event_date,
        content: header + row.transcript_text,
      };
    }),

  archiveRecording: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const { rawSql } = await import("../db");
      const [rows] = await rawSql(
        `SELECT event_name, recording_path FROM archive_events WHERE id = ? LIMIT 1`,
        [input.id],
      );
      const row = (rows as any[])[0];
      if (!row) return { error: "Archive event not found", archiveId: input.id, found: false as const };
      if (!row.recording_path)
        return { error: "No recording associated with this event", archiveId: input.id, found: false as const };
      const { resolveRecordingFile } = await import("../storageAdapter");
      const resolution = await resolveRecordingFile(row.recording_path);
      if (!resolution.found)
        return { error: "Recording file not found", archiveId: input.id, found: false as const, source: resolution.source };
      const safeName = (row.event_name || "recording").replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
      if (resolution.source === "object-storage" && resolution.url) {
        return { found: true as const, type: "redirect" as const, url: resolution.url, fileName: `${safeName}_Recording.mp3` };
      }
      return { found: true as const, type: "local" as const, localPath: resolution.localPath, fileName: `${safeName}_Recording.mp3` };
    }),

  archiveDownloads: publicProcedure.query(async () => {
    const { rawSql } = await import("../db");
    const [rows] = await rawSql(
      `SELECT id, event_name, client_name, event_type, event_date, status,
              length(transcript_text) as transcript_len, recording_path
       FROM archive_events ORDER BY id DESC`,
      [],
    );
    const items = (rows as any[]).map((r: any) => ({
      id: r.id,
      event_name: r.event_name,
      client_name: r.client_name,
      event_type: r.event_type,
      event_date: r.event_date,
      status: r.status,
      has_transcript: (r.transcript_len ?? 0) > 0,
      has_recording: !!(r.recording_path && r.recording_path.trim().length > 0),
    }));
    return { count: items.length, items };
  }),
});
