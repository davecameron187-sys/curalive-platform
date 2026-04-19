import { rawSql } from "../db";
import crypto from "crypto";

export class PlatformEmbedService {

  static async getEmbedToken(sessionId: string, orgId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    await rawSql(
      `INSERT INTO platform_embed_tokens (session_id, org_id, token, created_at, expires_at)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '24 hours')
       ON CONFLICT (session_id, org_id) DO UPDATE SET token = $3, expires_at = NOW() + INTERVAL '24 hours'`,
      [sessionId, orgId, token]
    );
    return token;
  }

  static async validateToken(token: string): Promise<{ sessionId: string; orgId: number } | null> {
    const [rows] = await rawSql(
      `SELECT session_id, org_id FROM platform_embed_tokens
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    const row = rows?.[0];
    if (!row) return null;
    return { sessionId: row.session_id, orgId: row.org_id };
  }

  static async revokeToken(sessionId: string, orgId: number): Promise<void> {
    await rawSql(
      `DELETE FROM platform_embed_tokens WHERE session_id = $1 AND org_id = $2`,
      [sessionId, orgId]
    );
  }
}

// ─── Standalone exports used by platformEmbedRouter ──────────────────────────

export function generateShareLink(
  sessionId: number,
  sessionCode: string,
  platform: string,
  baseUrl: string
): { shareLink: string; platform: string; sessionId: number } {
  const shareLink = `${baseUrl}/embed/${sessionCode}?platform=${platform}&ref=share`;
  return { shareLink, platform, sessionId };
}

export function getEmbedCode(
  sessionCode: string,
  baseUrl: string,
  options: {
    whiteLabel?: boolean;
    brandName?: string;
    brandColor?: string;
    width?: number;
    height?: number;
    hideBranding?: boolean;
  } = {}
): string {
  const w = options.width ?? 800;
  const h = options.height ?? 600;
  const src = `${baseUrl}/embed/${sessionCode}`;
  const params = new URLSearchParams();
  if (options.whiteLabel) params.set("whiteLabel", "1");
  if (options.brandName) params.set("brand", options.brandName);
  if (options.brandColor) params.set("color", options.brandColor.replace("#", ""));
  if (options.hideBranding) params.set("hideBranding", "1");
  const query = params.toString() ? `?${params.toString()}` : "";
  return `<iframe src="${src}${query}" width="${w}" height="${h}" frameborder="0" allowfullscreen></iframe>`;
}

export async function trackEmbedShare(
  sessionId: number,
  platform: string,
  shareType: string,
  shareLink: string,
  whiteLabel?: boolean,
  brandName?: string,
  brandColor?: string
): Promise<void> {
  await rawSql(
    `INSERT INTO embed_share_events
       (session_id, platform, share_type, share_link, white_label, brand_name, brand_color, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT DO NOTHING`,
    [sessionId, platform, shareType, shareLink, whiteLabel ?? false, brandName ?? null, brandColor ?? null]
  ).catch(() => {
    // Table may not exist yet — fail silently
  });
}

export async function getShareAnalytics(
  sessionId: number
): Promise<{ total: number; byPlatform: Record<string, number>; byType: Record<string, number> }> {
  const [rows] = await rawSql(
    `SELECT platform, share_type, COUNT(*) as count
     FROM embed_share_events
     WHERE session_id = $1
     GROUP BY platform, share_type`,
    [sessionId]
  ).catch(() => [[]]);

  const byPlatform: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let total = 0;

  for (const row of rows ?? []) {
    const c = Number(row.count);
    byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + c;
    byType[row.share_type] = (byType[row.share_type] ?? 0) + c;
    total += c;
  }

  return { total, byPlatform, byType };
}

export async function generateEventSummary(
  sessionId: number
): Promise<{ sessionId: number; eventName: string | null; status: string | null; transcriptLength: number; questionCount: number }> {
  const [[sessionRows], [qaRows]] = await Promise.all([
    rawSql(`SELECT event_name, status FROM shadow_sessions WHERE id = $1`, [sessionId]).catch(() => [[]]),
    rawSql(`SELECT COUNT(*) as count FROM qa_questions WHERE session_id = $1`, [String(sessionId)]).catch(() => [[]]),
  ]);

  const session = sessionRows?.[0];
  const qaCount = Number(qaRows?.[0]?.count ?? 0);

  const [txRows] = await rawSql(
    `SELECT transcript FROM shadow_sessions WHERE id = $1`,
    [sessionId]
  ).catch(() => [[]]);

  let transcriptLength = 0;
  try {
    const tx = txRows?.[0]?.transcript;
    if (tx) {
      const segments = typeof tx === "string" ? JSON.parse(tx) : tx;
      transcriptLength = Array.isArray(segments) ? segments.length : 0;
    }
  } catch { /* ignore */ }

  return {
    sessionId,
    eventName: session?.event_name ?? null,
    status: session?.status ?? null,
    transcriptLength,
    questionCount: qaCount,
  };
}
