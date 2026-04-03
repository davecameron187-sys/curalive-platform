import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { rawSql, getDb } from "../db";
import { partners } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const partnerRouter = router({
  getPartners: operatorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(partners).orderBy(partners.name);
  }),

  getPartnerBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [partner] = await db.select().from(partners).where(eq(partners.slug, input.slug)).limit(1);
      return partner || null;
    }),

  getPartnerById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [partner] = await db.select().from(partners).where(eq(partners.id, input.id)).limit(1);
      return partner || null;
    }),

  getBrandConfig: publicProcedure
    .input(z.object({ partnerId: z.number().int().optional(), domain: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      let partner;
      if (input.partnerId) {
        [partner] = await db.select().from(partners).where(eq(partners.id, input.partnerId)).limit(1);
      } else if (input.domain) {
        const [rows] = await rawSql(
          `SELECT * FROM partners WHERE custom_domain = $1 AND active = true LIMIT 1`,
          [input.domain]
        );
        partner = rows[0];
      }
      if (!partner) return { displayName: "CuraLive", primaryColor: "#1a1a2e", accentColor: "#6b21a8", isWhiteLabel: false };
      return {
        displayName: partner.displayName || partner.name,
        logoUrl: partner.logoUrl,
        primaryColor: partner.primaryColor || "#1a1a2e",
        accentColor: partner.accentColor || "#6b21a8",
        fontFamily: partner.fontFamily,
        isWhiteLabel: true,
      };
    }),

  upsertPartner: operatorProcedure
    .input(z.object({
      slug: z.string(),
      name: z.string(),
      displayName: z.string().optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      model: z.string().optional(),
      revenueSharePct: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const [rows] = await rawSql(
        `INSERT INTO partners (slug, name, display_name, logo_url, primary_color, accent_color, model, revenue_share_pct)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           display_name = EXCLUDED.display_name,
           logo_url = EXCLUDED.logo_url,
           primary_color = EXCLUDED.primary_color,
           accent_color = EXCLUDED.accent_color,
           model = EXCLUDED.model,
           revenue_share_pct = EXCLUDED.revenue_share_pct`,
        [input.slug, input.name, input.displayName || null, input.logoUrl || null,
         input.primaryColor || "#1a1a2e", input.accentColor || "#0A2540",
         input.model || "revenue_share", input.revenueSharePct || 20]
      );
      return { success: true };
    }),

  validateToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT ct.*, p.display_name as partner_display_name, p.logo_url as partner_logo_url,
                p.primary_color as partner_primary_color, p.accent_color as partner_accent_color
         FROM client_tokens ct
         LEFT JOIN partners p ON ct.partner_id = p.id
         WHERE ct.token = $1 AND (ct.expires_at IS NULL OR ct.expires_at > NOW())`,
        [input.token]
      );
      if (rows.length === 0) return { valid: false };
      const t = rows[0];
      await rawSql(`UPDATE client_tokens SET last_accessed_at = NOW() WHERE token = $1`, [input.token]);
      return {
        valid: true,
        sessionId: t.session_id,
        partnerId: t.partner_id,
        recipientName: t.recipient_name,
        recipientEmail: t.recipient_email,
        accessType: t.access_type,
        brand: t.partner_id ? {
          displayName: t.partner_display_name,
          logoUrl: t.partner_logo_url,
          primaryColor: t.partner_primary_color,
          accentColor: t.partner_accent_color,
          isWhiteLabel: true,
        } : null,
      };
    }),
});
