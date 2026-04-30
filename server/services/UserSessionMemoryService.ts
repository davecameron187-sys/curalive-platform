import { rawSql } from "../db";

/**
 * UserSessionMemoryService.ts
 * Phase 4 Foundation - Session Memory Write
 *
 * Writes one summary record per user per session at session close.
 * Derives all values from existing tables - never duplicates source data.
 * Write-once, immutable. No updates after write.
 */

export async function writeUserSessionMemory(params: {
  userId: number;
  orgId: number;
  sessionId: number;
  sessionClosedAt?: Date;
  sessionDurationMs?: number;
}): Promise<void> {
  const { userId, orgId, sessionId, sessionClosedAt, sessionDurationMs } = params;
  const feedSessionId = `shadow-${sessionId}`;

  try {
    const [surfacedRows] = await rawSql(
      `SELECT COUNT(*) as total FROM intelligence_feed WHERE session_id = $1`,
      [feedSessionId]
    );
    const surfaced = parseInt(surfacedRows?.[0]?.total ?? '0', 10);

    const [actionedRows] = await rawSql(
      `SELECT COUNT(DISTINCT target_id) as total FROM customer_actions WHERE session_id = $1 AND user_id = $2 AND org_id = $3`,
      [sessionId, userId, orgId]
    );
    const actioned = parseInt(actionedRows?.[0]?.total ?? '0', 10);

    const [ignoredRows] = await rawSql(
      `SELECT COUNT(*) as total FROM intelligence_feed f WHERE f.session_id = $1 AND f.severity IN ('high', 'critical') AND NOT EXISTS (SELECT 1 FROM customer_actions ca WHERE ca.target_id = f.id AND ca.session_id = $2 AND ca.user_id = $3)`,
      [feedSessionId, sessionId, userId]
    );
    const ignored = parseInt(ignoredRows?.[0]?.total ?? '0', 10);

    const [severityRows] = await rawSql(
      `SELECT severity FROM intelligence_feed WHERE session_id = $1 ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC LIMIT 1`,
      [feedSessionId]
    );
    const highestSeverity = severityRows?.[0]?.severity ?? null;

    await rawSql(
      `INSERT INTO user_session_memory (user_id, org_id, session_id, signals_surfaced, signals_actioned, signals_ignored, highest_severity_seen, session_duration_ms, session_closed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (user_id, session_id) DO NOTHING`,
      [userId, orgId, sessionId, surfaced, actioned, ignored, highestSeverity, sessionDurationMs ?? null, sessionClosedAt ?? new Date()]
    );

    console.log(`[UserSessionMemory] Written for user=${userId} session=${sessionId} surfaced=${surfaced} actioned=${actioned} ignored=${ignored} highest=${highestSeverity}`);
  } catch (err: any) {
    console.error(`[UserSessionMemory] Failed for user=${userId} session=${sessionId}:`, err?.message ?? err);
  }
}
