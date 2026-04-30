import { rawSql } from "../db";
import { writeUserSessionMemory } from "./UserSessionMemoryService";

/**
 * SessionMemoryBackfillService.ts
 * Phase 4 — Automatic Session Memory Writer
 *
 * Polls every 60 seconds for completed sessions missing memory records.
 * Writes memory using UserSessionMemoryService.
 * Idempotent — safe to run repeatedly.
 * Additive — no locked files touched.
 */

let isRunning = false;
let intervalHandle: NodeJS.Timeout | null = null;

export function startSessionMemoryBackfill(intervalMs = 60000): void {
  if (intervalHandle) {
    console.log("[SessionMemoryBackfill] Already running");
    return;
  }
  console.log("[SessionMemoryBackfill] Starting polling worker");
  intervalHandle = setInterval(async () => {
    await runBackfillOnce();
  }, intervalMs);
  if (intervalHandle.unref) intervalHandle.unref();
  void runBackfillOnce();
}

export function stopSessionMemoryBackfill(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[SessionMemoryBackfill] Stopped");
  }
}

export async function runBackfillOnce(): Promise<void> {
  if (isRunning) {
    console.log("[SessionMemoryBackfill] Previous run still active — skipping");
    return;
  }
  isRunning = true;
  try {
    const [sessionRows] = await rawSql(
      `SELECT s.id as session_id, s.org_id, s.started_at, s.ended_at
       FROM shadow_sessions s
       WHERE s.status = 'completed'
       AND EXISTS (
         SELECT 1 FROM users u
         WHERE u.role = 'customer'
         AND NOT EXISTS (
           SELECT 1 FROM user_session_memory m
           WHERE m.session_id = s.id
           AND m.user_id = u.id
         )
       )
       ORDER BY s.created_at ASC
       LIMIT 20`,
      []
    );

    const sessions = (sessionRows ?? []) as any[];

    if (sessions.length === 0) {
      return;
    }

    console.log(`[SessionMemoryBackfill] Found ${sessions.length} session(s) missing memory`);

    for (const session of sessions) {
      try {
        const [userRows] = await rawSql(
          `SELECT id as user_id FROM users WHERE role = 'customer'`,
          []
        );
        const users = (userRows ?? []) as any[];

        if (users.length === 0) {
          console.log(`[SessionMemoryBackfill] No customer users found — skipping session ${session.session_id}`);
          continue;
        }

        const durationMs = session.ended_at && session.started_at
          ? Number(session.ended_at) - Number(session.started_at)
          : null;

        for (const user of users) {
          await writeUserSessionMemory({
            userId: user.user_id,
            orgId: 1,
            sessionId: session.session_id,
            sessionDurationMs: durationMs ?? undefined,
            sessionClosedAt: new Date(),
          });
        }
      } catch (err: any) {
        console.error(`[SessionMemoryBackfill] Failed for session ${session.session_id}:`, err?.message ?? err);
      }
    }
  } catch (err: any) {
    console.error("[SessionMemoryBackfill] Worker run failed:", err?.message ?? err);
  } finally {
    isRunning = false;
  }
}
