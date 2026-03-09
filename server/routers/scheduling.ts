import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eventSchedules, operatorAvailability, resourceAllocations, eventTemplates, users } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const schedulingRouter = router({
  createEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      scheduledStart: z.string(),
      scheduledEnd: z.string(),
      timezone: z.string().default("Africa/Johannesburg"),
      platform: z.string().default("pstn"),
      operatorId: z.string().optional(),
      templateId: z.string().optional(),
      features: z.record(z.string(), z.boolean()).optional(),
      setupMinutes: z.number().default(30),
      teardownMinutes: z.number().default(15),
      recurrenceRule: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Create the event schedule
      const [result] = await db.insert(eventSchedules).values({
        eventId: input.eventId,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: new Date(input.scheduledEnd),
        timezone: input.timezone,
        setupMinutes: input.setupMinutes,
        teardownMinutes: input.teardownMinutes,
        recurrenceRule: input.recurrenceRule ?? null,
        status: "confirmed", // Auto-confirm for this wizard flow
        createdBy: ctx.user.id,
      });

      const scheduleId = (result as any).insertId;

      // 2. Auto-allocate resources based on platform
      const allocations = [];
      if (input.platform === "pstn") {
        allocations.push({
          eventId: input.eventId,
          resourceType: "dial_in_number" as const,
          resourceIdentifier: "+442031234567", // Mock allocation
        });
      } else if (input.platform === "rtmp") {
        allocations.push({
          eventId: input.eventId,
          resourceType: "rtmp_key" as const,
          resourceIdentifier: "live_" + Math.random().toString(36).substring(7),
        });
      }

      // Always allocate Ably channel
      allocations.push({
        eventId: input.eventId,
        resourceType: "ably_channel" as const,
        resourceIdentifier: `event:${input.eventId}`,
      });

      for (const allocation of allocations) {
        await db.insert(resourceAllocations).values(allocation);
      }

      return { scheduleId, status: "confirmed" };
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

  getCalendar: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(eventSchedules)
        .where(and(
          gte(eventSchedules.scheduledStart, new Date(input.from)),
          lte(eventSchedules.scheduledStart, new Date(input.to))
        ))
        .orderBy(eventSchedules.scheduledStart);
    }),

  checkConflicts: protectedProcedure
    .input(z.object({ start: z.string(), end: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { hasConflict: false };
      const start = new Date(input.start);
      const end = new Date(input.end);
      const conflicts = await db.select().from(eventSchedules)
        .where(and(
          lte(eventSchedules.scheduledStart, end),
          gte(eventSchedules.scheduledEnd, start),
          eq(eventSchedules.status, "confirmed")
        ));
      return { hasConflict: conflicts.length > 0, conflicts };
    }),

  getAvailableOperators: protectedProcedure
    .input(z.object({ start: z.string(), end: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const start = new Date(input.start);
      const dayOfWeek = start.getDay();
      const startTimeStr = start.toTimeString().split(" ")[0];
      
      // Basic implementation: find operators with matching availability
      // and no conflicting confirmed events
      const allOperators = await db.select().from(users).where(eq(users.role, "operator"));
      return allOperators; // Simplified for now
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
