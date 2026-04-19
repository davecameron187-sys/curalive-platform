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
