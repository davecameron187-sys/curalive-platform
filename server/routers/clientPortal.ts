import { z } from "zod";
import { router, protectedProcedure, adminProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { clients, clientPortals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const clientPortalRouter = router({
  createClient: adminProcedure
    .input(z.object({
      slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
      companyName: z.string().min(1),
      logoUrl: z.string().optional(),
      primaryColor: z.string().default("#6c3fc5"),
      secondaryColor: z.string().default("#1a1a2e"),
      customDomain: z.string().optional(),
      contactEmail: z.string().email().optional(),
      billingTier: z.enum(["starter", "professional", "enterprise"]).default("professional"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(clients).values({
        slug: input.slug,
        companyName: input.companyName,
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        customDomain: input.customDomain ?? null,
        contactEmail: input.contactEmail ?? null,
        billingTier: input.billingTier,
        isActive: true,
      });
      return { clientId: (result as any).insertId };
    }),

  listClients: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(clients).orderBy(clients.companyName);
    }),

  getClient: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(clients).where(eq(clients.slug, input.slug)).limit(1);
      return rows[0] ?? null;
    }),

  updateClient: adminProcedure
    .input(z.object({
      clientId: z.number(),
      companyName: z.string().optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { clientId, ...fields } = input;
      const updateSet = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
      if (Object.keys(updateSet).length > 0) {
        await db.update(clients).set(updateSet).where(eq(clients.id, clientId));
      }
      return { updated: true };
    }),

  publishEvent: adminProcedure
    .input(z.object({
      clientId: z.number(),
      eventId: z.string(),
      customTitle: z.string().optional(),
      customDescription: z.string().optional(),
      passwordProtected: z.boolean().default(false),
      accessCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(clientPortals).values({
        clientId: input.clientId,
        eventId: input.eventId,
        isPublished: true,
        customTitle: input.customTitle ?? null,
        customDescription: input.customDescription ?? null,
        passwordProtected: input.passwordProtected,
        accessCode: input.accessCode ?? null,
      });
      return { portalId: (result as any).insertId };
    }),

  getPortalBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const clientRows = await db.select().from(clients)
        .where(and(eq(clients.slug, input.slug), eq(clients.isActive, true)))
        .limit(1);
      if (!clientRows[0]) return null;
      const portals = await db.select().from(clientPortals)
        .where(and(eq(clientPortals.clientId, clientRows[0].id), eq(clientPortals.isPublished, true)));
      return { client: clientRows[0], events: portals };
    }),
});
