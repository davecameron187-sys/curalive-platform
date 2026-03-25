import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { whiteLabelClients, clientEventAssignments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const clientPortalRouter = router({
  createClient: adminProcedure
    .input(z.object({
      slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
      clientName: z.string().min(1),
      logoUrl: z.string().optional(),
      primaryColor: z.string().default("#6c3fc5"),
      secondaryColor: z.string().default("#1a1a2e"),
      accentColor: z.string().default("#007bff"),
      customDomain: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactName: z.string().optional(),
      billingTier: z.enum(["starter", "professional", "enterprise"]).default("professional"),
      featuresEnabled: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(whiteLabelClients).values({
        slug: input.slug,
        clientName: input.clientName,
        logoUrl: input.logoUrl ?? null,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        accentColor: input.accentColor,
        customDomain: input.customDomain ?? null,
        contactEmail: input.contactEmail ?? null,
        contactName: input.contactName ?? null,
        billingTier: input.billingTier,
        featuresEnabled: input.featuresEnabled ?? null,
        isActive: true,
      });
      return { clientId: (result as any).insertId };
    }),

  listClients: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const allClients = await db.select().from(whiteLabelClients).orderBy(whiteLabelClients.clientName);
      
      const results = await Promise.all(allClients.map(async (client) => {
        const assignments = await db.select().from(clientEventAssignments)
          .where(eq(clientEventAssignments.clientId, client.id));
        return { ...client, events: assignments };
      }));
      
      return results;
    }),

  getClientBySlug: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(whiteLabelClients).where(eq(whiteLabelClients.slug, input.slug)).limit(1);
      return rows[0] ?? null;
    }),

  updateClient: adminProcedure
    .input(z.object({
      clientId: z.number(),
      clientName: z.string().optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { clientId, ...fields } = input;
      const updateSet = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
      if (Object.keys(updateSet).length > 0) {
        await db.update(whiteLabelClients).set(updateSet).where(eq(whiteLabelClients.id, clientId));
      }
      return { updated: true };
    }),

  getPortal: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const clientRows = await db.select().from(whiteLabelClients)
        .where(and(eq(whiteLabelClients.slug, input.slug), eq(whiteLabelClients.isActive, true)))
        .limit(1);
      if (!clientRows[0]) return null;
      const assignments = await db.select().from(clientEventAssignments)
        .where(eq(clientEventAssignments.clientId, clientRows[0].id));
      return { 
        client: clientRows[0], 
        events: assignments
      };
    }),

  assignEvent: adminProcedure
    .input(z.object({
      clientId: z.number(),
      eventId: z.number(),
      customTitle: z.string().optional(),
      customDescription: z.string().optional(),
      displayOrder: z.number().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(clientEventAssignments).values({
        clientId: input.clientId,
        eventId: input.eventId,
        customTitle: input.customTitle ?? null,
        customDescription: input.customDescription ?? null,
        displayOrder: input.displayOrder ?? 0,
        isFeatured: input.isFeatured ?? false,
      });
      return { assignmentId: (result as any).insertId };
    }),

  unassignEvent: adminProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(clientEventAssignments).where(eq(clientEventAssignments.id, input.assignmentId));
      return { success: true };
    }),
});
