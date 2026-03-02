import { z } from "zod";
import { router, operatorProcedure, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  liveRoadshows,
  liveRoadshowMeetings,
  liveRoadshowInvestors,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Helper: generate a short unique ID ──────────────────────────────────────
function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Live Video Meetings Router ───────────────────────────────────────────────
export const liveVideoRouter = router({

  // ── List all roadshows ─────────────────────────────────────────────────────
  listRoadshows: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(liveRoadshows).orderBy(liveRoadshows.createdAt);
    return rows;
  }),

  // ── Get a single roadshow with its meetings and investors ──────────────────
  getRoadshow: protectedProcedure
    .input(z.object({ roadshowId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [roadshow] = await db
        .select()
        .from(liveRoadshows)
        .where(eq(liveRoadshows.roadshowId, input.roadshowId));
      if (!roadshow) throw new Error("Roadshow not found");

      const meetings = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.roadshowId, input.roadshowId))
        .orderBy(liveRoadshowMeetings.meetingDate, liveRoadshowMeetings.startTime);

      const investors = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.roadshowId, input.roadshowId));

      return { roadshow, meetings, investors };
    }),

  // ── Create a new roadshow ──────────────────────────────────────────────────
  createRoadshow: operatorProcedure
    .input(z.object({
      title: z.string().min(1),
      issuer: z.string().min(1),
      bank: z.string().optional(),
      serviceType: z.enum(["capital_raising_1x1", "research_presentation", "earnings_call", "hybrid_conference"]),
      platform: z.enum(["zoom", "teams", "webex", "mixed"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      timezone: z.string().default("Europe/London"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const roadshowId = makeId("rs");
      await db.insert(liveRoadshows).values({
        roadshowId,
        title: input.title,
        issuer: input.issuer,
        bank: input.bank,
        serviceType: input.serviceType,
        platform: input.platform,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone,
        notes: input.notes,
        status: "draft",
        createdByUserId: ctx.user.id,
      });
      return { success: true, roadshowId };
    }),

  // ── Update roadshow status ─────────────────────────────────────────────────
  updateRoadshowStatus: operatorProcedure
    .input(z.object({
      roadshowId: z.string(),
      status: z.enum(["draft", "active", "completed", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(liveRoadshows)
        .set({ status: input.status })
        .where(eq(liveRoadshows.roadshowId, input.roadshowId));
      return { success: true };
    }),

  // ── Add a meeting slot to a roadshow ──────────────────────────────────────
  addMeeting: operatorProcedure
    .input(z.object({
      roadshowId: z.string(),
      meetingDate: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      meetingType: z.enum(["1x1", "group", "large_group"]).default("1x1"),
      platform: z.enum(["zoom", "teams", "webex", "mixed"]).default("zoom"),
      videoLink: z.string().optional(),
      meetingId: z.string().optional(),
      passcode: z.string().optional(),
      timezone: z.string().default("Europe/London"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(liveRoadshowMeetings).values({
        roadshowId: input.roadshowId,
        meetingDate: input.meetingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        meetingType: input.meetingType,
        platform: input.platform,
        videoLink: input.videoLink,
        meetingId: input.meetingId,
        passcode: input.passcode,
        timezone: input.timezone,
        status: "scheduled",
      });
      return { success: true, id: Number((result as any).insertId) };
    }),

  // ── Update meeting status (operator opens/closes waiting room, starts meeting) ──
  updateMeetingStatus: operatorProcedure
    .input(z.object({
      meetingDbId: z.number(),
      status: z.enum(["scheduled", "waiting_room_open", "in_progress", "completed", "cancelled"]),
      operatorNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(liveRoadshowMeetings)
        .set({
          status: input.status,
          ...(input.operatorNotes !== undefined ? { operatorNotes: input.operatorNotes } : {}),
        })
        .where(eq(liveRoadshowMeetings.id, input.meetingDbId));
      return { success: true };
    }),

  // ── Add an investor to a meeting slot ─────────────────────────────────────
  addInvestor: operatorProcedure
    .input(z.object({
      roadshowId: z.string(),
      meetingId: z.number(),
      name: z.string().min(1),
      institution: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      jobTitle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const result = await db.insert(liveRoadshowInvestors).values({
        roadshowId: input.roadshowId,
        meetingId: input.meetingId,
        name: input.name,
        institution: input.institution,
        email: input.email,
        phone: input.phone,
        jobTitle: input.jobTitle,
        waitingRoomStatus: "not_arrived",
        inviteToken: token,
      });
      return { success: true, id: Number((result as any).insertId), inviteToken: token };
    }),

  // ── Update investor waiting room status ───────────────────────────────────
  updateInvestorStatus: operatorProcedure
    .input(z.object({
      investorId: z.number(),
      waitingRoomStatus: z.enum(["not_arrived", "in_waiting_room", "admitted", "completed", "no_show"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const now = new Date();
      await db
        .update(liveRoadshowInvestors)
        .set({
          waitingRoomStatus: input.waitingRoomStatus,
          ...(input.waitingRoomStatus === "in_waiting_room" ? { arrivedAt: now } : {}),
          ...(input.waitingRoomStatus === "admitted" ? { admittedAt: now } : {}),
        })
        .where(eq(liveRoadshowInvestors.id, input.investorId));
      return { success: true };
    }),

  // ── Remove an investor from a slot ────────────────────────────────────────
  removeInvestor: operatorProcedure
    .input(z.object({ investorId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(liveRoadshowInvestors).where(eq(liveRoadshowInvestors.id, input.investorId));
      return { success: true };
    }),

  // ── Public: investor self-check-in via invite token ───────────────────────
  investorCheckIn: publicProcedure
    .input(z.object({ inviteToken: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [investor] = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.inviteToken, input.inviteToken));
      if (!investor) throw new Error("Invalid invite token");

      await db
        .update(liveRoadshowInvestors)
        .set({ waitingRoomStatus: "in_waiting_room", arrivedAt: new Date() })
        .where(eq(liveRoadshowInvestors.id, investor.id));

      const [meeting] = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.id, investor.meetingId));

      return {
        success: true,
        investor: { name: investor.name, institution: investor.institution },
        meeting: meeting ? {
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          platform: meeting.platform,
          status: meeting.status,
        } : null,
      };
    }),
});
