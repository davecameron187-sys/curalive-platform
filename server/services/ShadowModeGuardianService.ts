// @ts-nocheck
import { getDb } from "../db";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;
const WATCHDOG_INTERVAL_MS = 60 * 1000;

let watchdogTimer: ReturnType<typeof setInterval> | null = null;

export async function reconcileShadowSessions() {
  try {
    const db = await getDb();
    const conn = (db as any).session?.client ?? (db as any).$client;
    const now = Date.now();

    const [liveRows] = await conn.execute(
      `SELECT id, client_name, event_name, status, started_at, ended_at, created_at
       FROM shadow_sessions
       WHERE status IN ('live', 'bot_joining', 'processing')
       ORDER BY created_at DESC`
    );

    let recovered = 0;
    let failed = 0;

    for (const session of liveRows as any[]) {
      const startedAt = session.started_at ? Number(session.started_at) : new Date(session.created_at).getTime();
      const age = now - startedAt;

      if (session.status === "processing" && age > PROCESSING_TIMEOUT_MS) {
        await conn.execute(
          `UPDATE shadow_sessions SET status = 'failed', notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Processing timed out after restart — marked failed at ${new Date().toISOString()}') WHERE id = ?`,
          [session.id]
        );
        failed++;
        console.log(`[ShadowGuardian] Session ${session.id} (${session.event_name}) stuck in processing — marked failed`);
        continue;
      }

      if ((session.status === "live" || session.status === "bot_joining") && age > STALE_THRESHOLD_MS) {
        const [botRows] = await conn.execute(
          `SELECT id, transcript FROM recall_bots WHERE shadow_session_id = ? ORDER BY created_at DESC LIMIT 1`,
          [session.id]
        );

        const bot = (botRows as any[])[0];
        const hasTranscript = bot?.transcript && JSON.parse(bot.transcript || "[]").length > 0;

        if (hasTranscript) {
          await conn.execute(
            `UPDATE shadow_sessions SET status = 'completed', ended_at = ?, notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Auto-recovered after server restart at ${new Date().toISOString()}') WHERE id = ?`,
            [now, session.id]
          );
          recovered++;
          console.log(`[ShadowGuardian] Session ${session.id} (${session.event_name}) had transcript — auto-recovered to completed`);
        } else {
          await conn.execute(
            `UPDATE shadow_sessions SET status = 'failed', notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Stale session with no transcript — marked failed at ${new Date().toISOString()}') WHERE id = ?`,
            [session.id]
          );
          failed++;
          console.log(`[ShadowGuardian] Session ${session.id} (${session.event_name}) stale with no data — marked failed`);
        }
      }
    }

    const active = (liveRows as any[]).length - recovered - failed;
    if ((liveRows as any[]).length > 0) {
      console.log(`[ShadowGuardian] Reconciliation: ${recovered} recovered, ${failed} marked failed, ${active} still active`);
    }

    return { total: (liveRows as any[]).length, recovered, failed, active };
  } catch (err) {
    console.error("[ShadowGuardian] Reconciliation failed:", err);
    return { total: 0, recovered: 0, failed: 0, active: 0 };
  }
}

async function watchdogCheck() {
  try {
    const db = await getDb();
    const conn = (db as any).session?.client ?? (db as any).$client;
    const now = Date.now();

    const [liveSessions] = await conn.execute(
      `SELECT s.id, s.client_name, s.event_name, s.status, s.started_at, s.created_at,
              b.id as bot_id, b.last_activity_at
       FROM shadow_sessions s
       LEFT JOIN recall_bots b ON b.shadow_session_id = s.id
       WHERE s.status IN ('live', 'bot_joining')
       ORDER BY s.created_at DESC`
    );

    for (const session of liveSessions as any[]) {
      const startedAt = session.started_at ? Number(session.started_at) : new Date(session.created_at).getTime();
      const age = now - startedAt;

      if (session.status === "bot_joining" && age > 10 * 60 * 1000) {
        await conn.execute(
          `UPDATE shadow_sessions SET status = 'failed', notes = CONCAT(COALESCE(notes, ''), '\n[Watchdog] Bot never joined after 10min — marked failed at ${new Date().toISOString()}') WHERE id = ?`,
          [session.id]
        );
        console.warn(`[ShadowWatchdog] Session ${session.id} (${session.event_name}) bot_joining timeout — marked failed`);
      }

      if (session.status === "live" && age > 6 * 60 * 60 * 1000) {
        await conn.execute(
          `UPDATE shadow_sessions SET status = 'completed', ended_at = ?, notes = CONCAT(COALESCE(notes, ''), '\n[Watchdog] Session exceeded 6h max duration — auto-completed at ${new Date().toISOString()}') WHERE id = ?`,
          [now, session.id]
        );
        console.warn(`[ShadowWatchdog] Session ${session.id} (${session.event_name}) exceeded 6h — auto-completed`);
      }
    }
  } catch (err) {
    console.error("[ShadowWatchdog] Check failed:", err);
  }
}

export function startShadowWatchdog() {
  if (watchdogTimer) return;
  watchdogTimer = setInterval(watchdogCheck, WATCHDOG_INTERVAL_MS);
  console.log("[ShadowWatchdog] Started — checking every 60s for zombie sessions");
}

export function stopShadowWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

export async function gracefulShutdown(signal: string) {
  console.log(`[ShadowGuardian] Received ${signal} — starting graceful shutdown...`);
  stopShadowWatchdog();

  try {
    const db = await getDb();
    const conn = (db as any).session?.client ?? (db as any).$client;
    const now = Date.now();

    const [activeSessions] = await conn.execute(
      `SELECT id, event_name, status FROM shadow_sessions WHERE status IN ('live', 'bot_joining', 'processing')`
    );

    const count = (activeSessions as any[]).length;
    if (count > 0) {
      await conn.execute(
        `UPDATE shadow_sessions SET notes = CONCAT(COALESCE(notes, ''), '\n[Guardian] Server shutting down (${signal}) at ${new Date().toISOString()} — session will be reconciled on restart') WHERE status IN ('live', 'bot_joining', 'processing')`
      );
      console.log(`[ShadowGuardian] Marked ${count} active session(s) for recovery on restart`);
    }
  } catch (err) {
    console.error("[ShadowGuardian] Shutdown annotation failed:", err);
  }
}
