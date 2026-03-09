import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eventSchedules, operatorAvailability, resourceAllocations, eventTemplates } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const schedulingRouter = router({
  createEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      scheduledStart: z.string(),
      scheduledEnd: z.string(),
      timezone: z.string().default("Africa/Johannesburg"),
      setupMinutes: z.number().default(30),
      teardownMinutes: z.number().default(15),
      recurrenceRule: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(eventSchedules).values({
        eventId: input.eventId,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: new Date(input.scheduledEnd),
        timezone: input.timezone,
        setupMinutes: input.setupMinutes,
        teardownMinutes: input.teardownMinutes,
        recurrenceRule: input.recurrenceRule ?? null,
        status: "tentative",
        createdBy: ctx.user.id,
      });
      return { scheduleId: (result as any).insertId, status: "tentative" };
    }),

  confirmEvent: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(eventSchedules).set({ status: "confirmed" }).where(eq(eventSchedules.id, input.scheduleId));
      return { confirmed: true };
    }),

  cancelEvent: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(eventSchedules).set({ status: "cancelled" }).where(eq(eventSchedules.id, input.scheduleId));
      return { cancelled: true };
    }),

  getSchedule: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(eventSchedules).where(eq(eventSchedules.eventId, input.eventId)).limit(1);
      return rows[0] ?? null;
    }),

  listUpcoming: protectedProcedure
    .input(z.object({ from: z.string().optional(), to: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const from = input.from ? new Date(input.from) : new Date();
      return db.select().from(eventSchedules)
        .where(gte(eventSchedules.scheduledStart, from))
        .orderBy(eventSchedules.scheduledStart);
    }),

  setOperatorAvailability: protectedProcedure
    .input(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean().default(true),
      overrideDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(operatorAvailability).values({
        operatorId: ctx.user.id,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        isAvailable: input.isAvailable,
        overrideDate: input.overrideDate ?? null,
      });
      return { availabilityId: (result as any).insertId };
    }),

  getOperatorAvailability: protectedProcedure
    .input(z.object({ operatorId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const targetId = input.operatorId ?? ctx.user.id;
      return db.select().from(operatorAvailability).where(eq(operatorAvailability.operatorId, targetId));
    }),

  allocateResource: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      resourceType: z.enum(["dial_in_number", "rtmp_key", "mux_stream", "recall_bot", "ably_channel"]),
      resourceIdentifier: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(resourceAllocations).values({
        eventId: input.eventId,
        resourceType: input.resourceType,
        resourceIdentifier: input.resourceIdentifier,
      });
      return { allocationId: (result as any).insertId };
    }),

  releaseResource: protectedProcedure
    .input(z.object({ allocationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(resourceAllocations).set({ releasedAt: new Date() }).where(eq(resourceAllocations.id, input.allocationId));
      return { released: true };
    }),

  createTemplate: protectedProcedure
    .input(z.object({
      templateName: z.string(),
      eventType: z.enum(["earnings_call", "investor_day", "roadshow", "webcast", "audio_bridge", "board_briefing"]),
      defaultDurationMinutes: z.number().default(60),
      defaultPlatform: z.enum(["zoom", "teams", "webex", "rtmp", "pstn"]).default("pstn"),
      maxAttendees: z.number().default(500),
      requiresRegistration: z.boolean().default(true),
      complianceEnabled: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(eventTemplates).values({
        templateName: input.templateName,
        createdBy: ctx.user.id,
        eventType: input.eventType,
        defaultDurationMinutes: input.defaultDurationMinutes,
        defaultPlatform: input.defaultPlatform,
        maxAttendees: input.maxAttendees,
        requiresRegistration: input.requiresRegistration,
        complianceEnabled: input.complianceEnabled,
      });
      return { templateId: (result as any).insertId };
    }),

  listTemplates: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(eventTemplates).orderBy(desc(eventTemplates.createdAt));
    }),
});
