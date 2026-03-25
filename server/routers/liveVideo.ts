import { z } from "zod";
import { router, operatorProcedure, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  liveRoadshows,
  liveRoadshowMeetings,
  liveRoadshowInvestors,
  liveMeetingSummaries,
  slideThumbnails,
} from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
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
  listRoadshows: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(liveRoadshows).orderBy(liveRoadshows.createdAt);
    return rows;
  }),

  // ── Get a single roadshow with its meetings and investors ──────────────────
  getRoadshow: publicProcedure
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
  getRoadshowAblyToken: publicProcedure
    .input(z.object({ roadshowId: z.string(), meetingDbId: z.number() }))
    .query(async ({ input, ctx }) => {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) return { tokenRequest: null };
      const [keyName, keySecret] = apiKey.split(":");
      const clientId = ctx.user ? `operator-${ctx.user.id}` : `guest-${Date.now()}`;
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

  // ── Operator: send invite email to an investor ────────────────────────────
  sendInviteEmail: operatorProcedure
    .input(z.object({
      investorId: z.number(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [investor] = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.id, input.investorId));
      if (!investor) throw new Error("Investor not found");
      if (!investor.email) throw new Error("Investor has no email address");
      if (!investor.inviteToken) throw new Error("Investor has no invite token — please re-save the investor");

      // Fetch roadshow title for the email
      const [roadshow] = await db
        .select()
        .from(liveRoadshows)
        .where(eq(liveRoadshows.roadshowId, investor.roadshowId));

      // Fetch meeting details
      const [meeting] = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.id, investor.meetingId));

      const inviteUrl = `${input.origin}/live-video/join/${investor.inviteToken}`;
      const eventTitle = roadshow?.title ?? "Roadshow Meeting";
      const issuer = roadshow?.issuer ?? "";
      const meetingDate = meeting?.meetingDate ?? "";
      const startTime = meeting?.startTime ?? "";
      const endTime = meeting?.endTime ?? "";

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Meeting Invitation — ${eventTitle}</title></head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0d14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b,#0f172a);padding:32px 40px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#818cf8;">Meeting Invitation</p>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#f1f5f9;line-height:1.3;">${eventTitle}</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">${issuer}${meetingDate ? ` · ${meetingDate}` : ""}${startTime ? ` · ${startTime}${endTime ? `–${endTime}` : ""}` : ""}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;">Dear ${investor.name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">You have been invited to a private meeting. Please use the link below to access your personal waiting room and join when admitted by the operator.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr><td align="center">
                <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">Join Waiting Room</a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Or copy this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:12px;color:#6366f1;word-break:break-all;font-family:monospace;">${inviteUrl}</p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Please keep this link private. If you have any questions, contact your account manager.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;padding:20px 40px;border-top:1px solid #1e293b;">
            <p style="margin:0;font-size:12px;color:#475569;text-align:center;">CuraLive · Powered by CuraLive Inc.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const result = await sendEmail({
        to: investor.email,
        subject: `Meeting Invitation: ${eventTitle}${meetingDate ? ` — ${meetingDate}` : ""}`,
        html,
      });

      if (result.success) {
        // Mark invite as sent
        await db
          .update(liveRoadshowInvestors)
          .set({ inviteSentAt: new Date() })
          .where(eq(liveRoadshowInvestors.id, input.investorId));
      }

      return result;
    }),

  // ── Operator: generate AI post-meeting summary ────────────────────────────
  generateMeetingSummary: operatorProcedure
    .input(z.object({
      meetingDbId: z.number(),
      roadshowId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [meeting] = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.id, input.meetingDbId));
      if (!meeting) throw new Error("Meeting not found");

      const investors = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.meetingId, input.meetingDbId));

      const [roadshow] = await db
        .select()
        .from(liveRoadshows)
        .where(eq(liveRoadshows.roadshowId, input.roadshowId));

      const investorList = investors
        .map((i) => `${i.name} (${i.institution}${i.jobTitle ? `, ${i.jobTitle}` : ""}) — status: ${i.waitingRoomStatus}`)
        .join("\n");

      const context = [
        `Roadshow: ${roadshow?.title ?? "Unknown"} — ${roadshow?.issuer ?? ""}`,
        `Meeting Date: ${meeting.meetingDate} ${meeting.startTime}–${meeting.endTime}`,
        `Platform: ${meeting.platform}`,
        `Status: ${meeting.status}`,
        meeting.slideDeckName ? `Slide Deck: ${meeting.slideDeckName} (${meeting.totalSlides} slides)` : "",
        meeting.operatorNotes ? `Operator Notes:\n${meeting.operatorNotes}` : "",
        investorList ? `Participants:\n${investorList}` : "",
      ].filter(Boolean).join("\n");

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an expert capital markets analyst. Generate a concise, professional post-meeting summary for an investor roadshow meeting. Return JSON only.",
          },
          {
            role: "user",
            content: `Generate a post-meeting summary for this meeting:\n\n${context}\n\nReturn JSON with these fields:\n- summary (string, 2-3 paragraphs, professional tone)\n- keyTopics (array of strings, max 6)\n- actionItems (array of strings, max 5)\n- sentiment ("positive", "neutral", or "negative")`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "meeting_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                keyTopics: { type: "array", items: { type: "string" } },
                actionItems: { type: "array", items: { type: "string" } },
                sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              },
              required: ["summary", "keyTopics", "actionItems", "sentiment"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = llmResponse?.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned no content");
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      // Upsert summary
      const existing = await db
        .select()
        .from(liveMeetingSummaries)
        .where(eq(liveMeetingSummaries.meetingDbId, input.meetingDbId));

      if (existing.length > 0) {
        await db
          .update(liveMeetingSummaries)
          .set({
            summary: parsed.summary,
            keyTopics: JSON.stringify(parsed.keyTopics),
            actionItems: JSON.stringify(parsed.actionItems),
            sentiment: parsed.sentiment,
            generatedAt: new Date(),
          })
          .where(eq(liveMeetingSummaries.meetingDbId, input.meetingDbId));
      } else {
        await db.insert(liveMeetingSummaries).values({
          meetingDbId: input.meetingDbId,
          roadshowId: input.roadshowId,
          summary: parsed.summary,
          keyTopics: JSON.stringify(parsed.keyTopics),
          actionItems: JSON.stringify(parsed.actionItems),
          sentiment: parsed.sentiment,
        });
      }

      return parsed;
    }),

  // ── Operator: get meeting summary ─────────────────────────────────────────
  getMeetingSummary: publicProcedure
    .input(z.object({ meetingDbId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [summary] = await db
        .select()
        .from(liveMeetingSummaries)
        .where(eq(liveMeetingSummaries.meetingDbId, input.meetingDbId));
      if (!summary) return null;
      return {
        ...summary,
        keyTopics: summary.keyTopics ? JSON.parse(summary.keyTopics) : [],
        actionItems: summary.actionItems ? JSON.parse(summary.actionItems) : [],
      };
    }),

  // ── Server: generate slide thumbnails from uploaded PDF ───────────────────
  getSlideThumbnails: publicProcedure
    .input(z.object({ meetingDbId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const thumbs = await db
        .select()
        .from(slideThumbnails)
        .where(eq(slideThumbnails.meetingDbId, input.meetingDbId));
      return thumbs.sort((a, b) => a.slideIndex - b.slideIndex);
    }),
});
