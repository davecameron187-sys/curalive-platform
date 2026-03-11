// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const mobileNotificationsRouter = router({
  subscribe: publicProcedure
    .input(z.object({
      eventId: z.string(),
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
      deviceType: z.enum(["ios", "android", "web"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(pushSubscriptions).values({
        userId: ctx.user?.id ?? null,
        eventId: input.eventId,
        endpoint: input.endpoint,
        p256dhKey: input.p256dh,
        authKey: input.auth,
        deviceType: input.deviceType,
        isActive: true,
      });

      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({
      endpoint: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(pushSubscriptions)
        .set({ isActive: false })
        .where(eq(pushSubscriptions.endpoint, input.endpoint));

      return { success: true };
    }),

  sendReminder: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      title: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const subs = await db.select().from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.eventId, input.eventId),
          eq(pushSubscriptions.isActive, true)
        ));

      // In a real app, we'd trigger web-push here
      console.log(`Sending push to ${subs.length} subscribers: ${input.title}`);
      
      return { success: true, count: subs.length };
    }),

  sendQAAlert: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      questionId: z.number(),
      body: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Logic for alerting about Q&A answers
      return { success: true };
    }),
});
