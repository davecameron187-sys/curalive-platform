import { z } from "zod";
import { router, operatorProcedure, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  liveRoadshows,
  liveRoadshowMeetings,
  liveRoadshowInvestors,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Ably publish helper ──────────────────────────────────────────────────────
async function ablyPublish(channel: string, event: string, data: unknown) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  try {
    const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: event, data }),
    });
  } catch (_) {
    // Non-fatal — real-time is best-effort
  }
}

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

    // ── Update investor waiting room status ─────────────────────────────────
  updateInvestorStatus: operatorProcedure
    .input(z.object({
      investorId: z.number(),
      waitingRoomStatus: z.enum(["not_arrived", "in_waiting_room", "admitted", "completed", "no_show"]),
      roadshowId: z.string().optional(),
      meetingDbId: z.number().optional(),
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

      // Publish real-time update to the investor's personal channel
      await ablyPublish(
        `roadshow-investor-${input.investorId}`,
        "status-update",
        { waitingRoomStatus: input.waitingRoomStatus, ts: Date.now() }
      );
      // Also publish to the roadshow operator channel if IDs provided
      if (input.roadshowId && input.meetingDbId) {
        await ablyPublish(
          `roadshow-${input.roadshowId}-meeting-${input.meetingDbId}`,
          "investor-status",
          { investorId: input.investorId, waitingRoomStatus: input.waitingRoomStatus, ts: Date.now() }
        );
      }
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

      // Only update to waiting room if not already further along
      if (investor.waitingRoomStatus === "not_arrived") {
        await db
          .update(liveRoadshowInvestors)
          .set({ waitingRoomStatus: "in_waiting_room", arrivedAt: new Date() })
          .where(eq(liveRoadshowInvestors.id, investor.id));
      }

      const [meeting] = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.id, investor.meetingId));

      const [roadshow] = await db
        .select()
        .from(liveRoadshows)
        .where(eq(liveRoadshows.roadshowId, investor.roadshowId));

      return {
        success: true,
        investor: {
          id: investor.id,
          name: investor.name,
          institution: investor.institution,
          jobTitle: investor.jobTitle,
          waitingRoomStatus: investor.waitingRoomStatus === "not_arrived" ? "in_waiting_room" : investor.waitingRoomStatus,
        },
        meeting: meeting ? {
          id: meeting.id,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          platform: meeting.platform,
          videoLink: meeting.videoLink,
          meetingId: meeting.meetingId,
          passcode: meeting.passcode,
          status: meeting.status,
          currentSlideIndex: meeting.currentSlideIndex,
          totalSlides: meeting.totalSlides,
          slideDeckUrl: meeting.slideDeckUrl,
        } : null,
        roadshow: roadshow ? { title: roadshow.title, issuer: roadshow.issuer } : null,
      };
    }),

  // ── Public: poll investor status (for waiting room page auto-refresh) ──────
  getInvestorStatus: publicProcedure
    .input(z.object({ inviteToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [investor] = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.inviteToken, input.inviteToken));
      if (!investor) throw new Error("Invalid invite token");

      const [meeting] = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.id, investor.meetingId));

      return {
        waitingRoomStatus: investor.waitingRoomStatus,
        meeting: meeting ? {
          status: meeting.status,
          videoLink: meeting.videoLink,
          meetingId: meeting.meetingId,
          passcode: meeting.passcode,
          currentSlideIndex: meeting.currentSlideIndex,
          totalSlides: meeting.totalSlides,
          slideDeckUrl: meeting.slideDeckUrl,
        } : null,
      };
    }),

  // ── Operator: upload slide deck URL for a meeting ─────────────────────────
  updateSlideDeck: operatorProcedure
    .input(z.object({
      meetingDbId: z.number(),
      slideDeckUrl: z.string().url(),
      slideDeckName: z.string(),
      totalSlides: z.number().int().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(liveRoadshowMeetings)
        .set({
          slideDeckUrl: input.slideDeckUrl,
          slideDeckName: input.slideDeckName,
          totalSlides: input.totalSlides,
          currentSlideIndex: 0,
        })
        .where(eq(liveRoadshowMeetings.id, input.meetingDbId));
      return { success: true };
    }),

  // ── Operator: advance / go back slide ─────────────────────────────────────
  setSlideIndex: operatorProcedure
    .input(z.object({
      meetingDbId: z.number(),
      slideIndex: z.number().int().min(0),
      roadshowId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(liveRoadshowMeetings)
        .set({ currentSlideIndex: input.slideIndex })
        .where(eq(liveRoadshowMeetings.id, input.meetingDbId));

      // Broadcast slide change to all attendees watching this meeting
      if (input.roadshowId) {
        await ablyPublish(
          `roadshow-${input.roadshowId}-meeting-${input.meetingDbId}`,
          "slide-change",
          { slideIndex: input.slideIndex, ts: Date.now() }
        );
      }
      return { success: true };
    }),

  // ── Operator: get Ably token scoped to a roadshow channel ──────────────
  getRoadshowAblyToken: protectedProcedure
    .input(z.object({ roadshowId: z.string(), meetingDbId: z.number() }))
    .query(async ({ input, ctx }) => {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) return { tokenRequest: null };
      const [keyName, keySecret] = apiKey.split(":");
      const clientId = `operator-${ctx.user.id}`;
      const timestamp = Date.now();
      const ttl = 3600 * 1000;
      const nonce = Math.random().toString(36).substring(2, 15);
      const channel = `roadshow-${input.roadshowId}-meeting-${input.meetingDbId}`;
      const capability = JSON.stringify({ [channel]: ["subscribe", "publish", "presence", "history"] });
      const { createHmac } = await import("crypto");
      const signString = [keyName, ttl, nonce, clientId, timestamp, capability, ""].join("\n");
      const mac = createHmac("sha256", keySecret).update(signString).digest("base64");
      return { tokenRequest: { keyName, ttl, nonce, clientId, timestamp, capability, mac } };
    }),

  // ── Public: investor Ably token scoped to their personal channel ─────────
  getInvestorAblyToken: publicProcedure
    .input(z.object({ inviteToken: z.string() }))
    .query(async ({ input }) => {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) return { tokenRequest: null };
      const db = await getDb();
      if (!db) return { tokenRequest: null };
      const [investor] = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.inviteToken, input.inviteToken));
      if (!investor) return { tokenRequest: null };

      const [keyName, keySecret] = apiKey.split(":");
      const clientId = `investor-${investor.id}`;
      const timestamp = Date.now();
      const ttl = 3600 * 1000;
      const nonce = Math.random().toString(36).substring(2, 15);
      // Investor can subscribe to their personal channel AND the meeting channel
      const channels: Record<string, string[]> = {
        [`roadshow-investor-${investor.id}`]: ["subscribe"],
        [`roadshow-${investor.roadshowId}-meeting-${investor.meetingId}`]: ["subscribe"],
      };
      const capability = JSON.stringify(channels);
      const { createHmac } = await import("crypto");
      const signString = [keyName, ttl, nonce, clientId, timestamp, capability, ""].join("\n");
      const mac = createHmac("sha256", keySecret).update(signString).digest("base64");
      return { tokenRequest: { keyName, ttl, nonce, clientId, timestamp, capability, mac } };
    }),
});
