import { z } from "zod";
import { router, operatorProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eventBranding } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const brandingRouter = router({

  // ── Get branding for a roadshow (public — used by attendee-facing pages) ──
  getBranding: publicProcedure
    .input(z.object({ roadshowId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(eventBranding)
        .where(eq(eventBranding.roadshowId, input.roadshowId))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ── Upsert branding (operator only) ──────────────────────────────────────
  saveBranding: operatorProcedure
    .input(z.object({
      roadshowId: z.string(),
      clientName: z.string().min(1),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      fontFamily: z.string().optional(),
      tagline: z.string().optional(),
      footerText: z.string().optional(),
      faviconUrl: z.string().optional(),
      showCuraLiveWatermark: z.boolean().optional(),
      customCss: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select()
        .from(eventBranding)
        .where(eq(eventBranding.roadshowId, input.roadshowId))
        .limit(1);

      const values = {
        roadshowId: input.roadshowId,
        clientName: input.clientName,
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor ?? "#3b82f6",
        accentColor: input.accentColor ?? "#10b981",
        backgroundColor: input.backgroundColor ?? "#0f172a",
        textColor: input.textColor ?? "#f8fafc",
        fontFamily: input.fontFamily ?? "Space Grotesk",
        tagline: input.tagline ?? null,
        footerText: input.footerText ?? null,
        faviconUrl: input.faviconUrl ?? null,
        showCuraLiveWatermark: input.showCuraLiveWatermark !== false,
        customCss: input.customCss ?? null,
        updatedAt: Date.now(),
      };

      if (existing.length > 0) {
        await db
          .update(eventBranding)
          .set(values)
          .where(eq(eventBranding.roadshowId, input.roadshowId));
      } else {
        await db.insert(eventBranding).values({ ...values, createdAt: Date.now() });
      }

      return { success: true };
    }),

  // ── Delete branding (reset to CuraLive defaults) ────────────────────────────
  deleteBranding: operatorProcedure
    .input(z.object({ roadshowId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(eventBranding).where(eq(eventBranding.roadshowId, input.roadshowId));
      return { success: true };
    }),
});
