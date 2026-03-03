/**
 * webcastRouter.ts — tRPC procedures for the Chorus.AI Webcasting Platform.
 * Covers: event CRUD, registration, Q&A moderation, polls, and analytics.
 */
import { z } from "zod";
import { randomBytes } from "crypto";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sendEmail, buildRegistrationConfirmationEmail } from "../_core/email";
import {
  webcastEvents,
  webcastRegistrations,
  webcastQa,
  webcastPolls,
  type WebcastEvent,
  type WebcastRegistration,
  type WebcastQa,
  type WebcastPoll,
} from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ─── ICS calendar attachment builder ─────────────────────────────────────────
function buildICS(opts: {
  uid: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  timezone: string;
  organizer: string;
  attendeeEmail: string;
  attendeeName: string;
  attendUrl: string;
}): string {
  const fmt = (ts: number) => {
    const d = new Date(ts);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chorus.AI//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(opts.startTime)}`,
    `DTEND:${fmt(opts.endTime)}`,
    `SUMMARY:${opts.title}`,
    `DESCRIPTION:Join at: ${opts.attendUrl}`,
    `ORGANIZER;CN=${opts.organizer}:mailto:noreply@choruscall.ai`,
    `ATTENDEE;CN=${opts.attendeeName};RSVP=TRUE:mailto:${opts.attendeeEmail}`,
    `URL:${opts.attendUrl}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ─── Demo seed data ───────────────────────────────────────────────────────────
const DEMO_EVENTS = [
  {
    slug: "q4-2025-earnings-webcast",
    title: "Q4 2025 Earnings Results Webcast",
    description: "Chorus Call Inc. presents its Q4 2025 financial results to analysts and investors. Live Q&A session to follow the presentation.",
    eventType: "webcast" as const,
    industryVertical: "financial_services" as const,
    status: "ended" as const,
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000,
    timezone: "America/New_York",
    maxAttendees: 5000,
    registrationCount: 1247,
    peakAttendees: 982,
    hostName: "Sarah Mitchell, CFO",
    hostOrganization: "Chorus Call Inc.",
    tags: "earnings,investor-relations,financial-results",
    recordingUrl: "https://example.com/recordings/q4-2025",
  },
  {
    slug: "africa-capital-markets-summit-2026",
    title: "Africa Capital Markets Summit 2026",
    description: "The premier gathering of African capital markets professionals. Three days of keynotes, panels, and networking across ESG investing, infrastructure finance, and digital assets.",
    eventType: "virtual_event" as const,
    industryVertical: "financial_services" as const,
    status: "scheduled" as const,
    startTime: Date.now() + 14 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 17 * 24 * 60 * 60 * 1000,
    timezone: "Africa/Johannesburg",
    maxAttendees: 10000,
    registrationCount: 3842,
    hostName: "Chorus Call Events",
    hostOrganization: "Chorus Call Inc.",
    tags: "africa,capital-markets,summit,ESG",
  },
  {
    slug: "product-launch-webinar-march-2026",
    title: "Chorus.AI Platform Launch — What's New in 2026",
    description: "Join our product team for a live walkthrough of the new Chorus.AI webcasting platform. See AI-powered features, the new Studio, and live demos.",
    eventType: "webinar" as const,
    industryVertical: "technology" as const,
    status: "scheduled" as const,
    startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
    timezone: "Europe/London",
    maxAttendees: 2000,
    registrationCount: 678,
    hostName: "James Okafor, Head of Product",
    hostOrganization: "Chorus Call Inc.",
    tags: "product-launch,webinar,technology",
  },
  {
    slug: "ceo-town-hall-q1-2026",
    title: "CEO All-Hands Town Hall — Q1 2026",
    description: "Quarterly all-hands meeting for Chorus Call Inc. employees. CEO update on company strategy, Q1 results, and roadmap for the year ahead.",
    eventType: "webcast" as const,
    industryVertical: "corporate_communications" as const,
    status: "live" as const,
    startTime: Date.now() - 30 * 60 * 1000,
    endTime: Date.now() + 60 * 60 * 1000,
    timezone: "Europe/London",
    maxAttendees: 500,
    registrationCount: 487,
    peakAttendees: 412,
    hostName: "David Cameron, CEO",
    hostOrganization: "Chorus Call Inc.",
    tags: "town-hall,all-hands,internal",
  },
  {
    slug: "medical-education-cme-series-2026",
    title: "CME Webinar Series: Advances in Oncology 2026",
    description: "Accredited continuing medical education series. Episode 3: Immunotherapy advances in solid tumour treatment. 1.5 CME credits available.",
    eventType: "webinar" as const,
    industryVertical: "healthcare" as const,
    status: "on_demand" as const,
    startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 30 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000,
    timezone: "UTC",
    maxAttendees: 3000,
    registrationCount: 2156,
    peakAttendees: 1834,
    hostName: "Prof. Amara Diallo, MD",
    hostOrganization: "Pan-African Oncology Society",
    tags: "CME,healthcare,oncology,medical-education",
    recordingUrl: "https://example.com/recordings/cme-oncology-ep3",
  },
  {
    slug: "agm-annual-general-meeting-2026",
    title: "Annual General Meeting 2026",
    description: "Formal annual general meeting of Chorus Call Inc. shareholders. Voting on resolutions, board elections, and auditor appointment.",
    eventType: "hybrid_event" as const,
    industryVertical: "financial_services" as const,
    status: "scheduled" as const,
    startTime: Date.now() + 21 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
    timezone: "Africa/Johannesburg",
    maxAttendees: 1500,
    registrationCount: 892,
    hostName: "Board of Directors",
    hostOrganization: "Chorus Call Inc.",
    tags: "AGM,shareholders,governance",
  },
  {
    slug: "government-budget-briefing-2026",
    title: "National Budget Briefing — Public Webcast 2026",
    description: "Live public webcast of the National Budget Speech with expert commentary, real-time Q&A, and post-budget analysis panel.",
    eventType: "webcast" as const,
    industryVertical: "government" as const,
    status: "scheduled" as const,
    startTime: Date.now() + 10 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
    timezone: "Africa/Johannesburg",
    maxAttendees: 50000,
    registrationCount: 12450,
    hostName: "Ministry of Finance",
    hostOrganization: "Government Communications",
    tags: "government,budget,public,policy",
  },
  {
    slug: "partner-enablement-training-q1",
    title: "Partner Enablement Training — Q1 2026",
    description: "Quarterly training for Chorus Call channel partners. New product features, sales playbooks, and certification exam.",
    eventType: "simulive" as const,
    industryVertical: "technology" as const,
    status: "on_demand" as const,
    startTime: Date.now() - 14 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 14 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000,
    timezone: "UTC",
    maxAttendees: 800,
    registrationCount: 623,
    peakAttendees: 501,
    hostName: "Partner Success Team",
    hostOrganization: "Chorus Call Inc.",
    tags: "training,partners,enablement,certification",
    recordingUrl: "https://example.com/recordings/partner-q1",
  },
];

// ─── Router ───────────────────────────────────────────────────────────────────
export const webcastRouter = router({
  /**
   * List all webcast events (public — for hub page and on-demand library).
   */
  listEvents: publicProcedure
    .input(z.object({
      eventType: z.string().optional(),
      industryVertical: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return DEMO_EVENTS.map((e, i) => ({ ...e, id: i + 1, chatEnabled: true, qaEnabled: true, pollsEnabled: true, recordingEnabled: true, registrationEnabled: true, streamUrl: null, rtmpKey: null, logoUrl: null, primaryColor: "#3b82f6", createdAt: Date.now(), updatedAt: Date.now() }));

      // Seed demo events if table is empty
      const existing = await db.select({ id: webcastEvents.id }).from(webcastEvents).limit(1);
      if (existing.length === 0) {
        for (const ev of DEMO_EVENTS) {
          await db.insert(webcastEvents).values(ev as any).onDuplicateKeyUpdate({ set: { title: ev.title } });
        }
      }
      const events = await db.select().from(webcastEvents).orderBy(desc(webcastEvents.createdAt)).limit(input?.limit ?? 20);
      return events;
    }),

  /**
   * Get a single webcast event by slug (public).
   */
  getEvent: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const demo = DEMO_EVENTS.find(e => e.slug === input.slug);
        if (!demo) throw new Error("Event not found");
        return { ...demo, id: 1, chatEnabled: true, qaEnabled: true, pollsEnabled: true, recordingEnabled: true, registrationEnabled: true, streamUrl: null, rtmpKey: null, logoUrl: null, primaryColor: "#3b82f6", createdAt: Date.now(), updatedAt: Date.now() };
      }
      const [event] = await db.select().from(webcastEvents).where(eq(webcastEvents.slug, input.slug));
      if (!event) throw new Error("Event not found");
      return event;
    }),

  /**
   * Create a new webcast event (operator only).
   */
  createEvent: operatorProcedure
    .input(z.object({
      slug: z.string().min(3).max(128),
      title: z.string().min(3).max(300),
      description: z.string().optional(),
      eventType: z.enum(["webinar", "webcast", "virtual_event", "hybrid_event", "on_demand", "simulive", "audio_conference", "capital_markets"]),
      industryVertical: z.enum(["financial_services", "corporate_communications", "healthcare", "technology", "professional_services", "government", "education", "media_entertainment", "general"]),
      startTime: z.number().optional(),
      endTime: z.number().optional(),
      timezone: z.string().default("UTC"),
      maxAttendees: z.number().default(1000),
      hostName: z.string().optional(),
      hostOrganization: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(webcastEvents).values({
        ...input,
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);
      return { success: true, slug: input.slug };
    }),

  /**
   * Update webcast event status (operator only).
   */
  updateEventStatus: operatorProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "scheduled", "live", "ended", "on_demand", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(webcastEvents).set({ status: input.status as any, updatedAt: Date.now() }).where(eq(webcastEvents.id, input.id));
      return { success: true };
    }),

  /**
   * Register for a webcast event (public).
   */
  register: publicProcedure
    .input(z.object({
      eventId: z.number(),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email(),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
      customFields: z.record(z.string(), z.string()).optional(),
      registrationSource: z.string().default("direct"),
      utmSource: z.string().optional(),
      origin: z.string().optional(), // frontend passes window.location.origin for attendee link
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true, attendeeToken: null };
      const { customFields, origin, ...rest } = input;
      // Generate a secure unique token for the attendee's personal event link
      const attendeeToken = randomBytes(24).toString("hex");
      await db.insert(webcastRegistrations).values({
        ...rest,
        customFields: customFields ? JSON.stringify(customFields) : null,
        attendeeToken,
        registeredAt: Date.now(),
      } as any);
      await db.update(webcastEvents)
        .set({ registrationCount: sql`registration_count + 1`, updatedAt: Date.now() })
        .where(eq(webcastEvents.id, input.eventId));
      // Fetch event details for the confirmation email
      const [event] = await db.select().from(webcastEvents).where(eq(webcastEvents.id, input.eventId)).limit(1);
      if (event) {
        const baseUrl = origin ?? "https://chorusai-mdu4k2ib.manus.space";
        const attendUrl = `${baseUrl}/live-video/webcast/${event.slug}/attend?token=${attendeeToken}`;
        const startTs = event.startTime ?? Date.now() + 24 * 60 * 60 * 1000;
        const endTs = event.endTime ?? startTs + 90 * 60 * 1000;
        const eventDate = new Date(startTs).toLocaleDateString("en-GB", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit", timeZoneName: "short",
        });
        // Build ICS calendar invite
        const icsContent = buildICS({
          uid: `webcast-${event.id}-${attendeeToken}@choruscall.ai`,
          title: event.title,
          description: event.description ?? "",
          startTime: startTs,
          endTime: endTs,
          timezone: event.timezone ?? "UTC",
          organizer: event.hostOrganization ?? "Chorus Call Inc.",
          attendeeEmail: input.email,
          attendeeName: `${input.firstName} ${input.lastName}`,
          attendUrl,
        });
        const html = buildRegistrationConfirmationEmail({
          firstName: input.firstName,
          lastName: input.lastName,
          eventTitle: event.title,
          company: event.hostOrganization ?? "Chorus Call Inc.",
          eventDate,
          attendUrl,
          icsContent,
        });
        // Send confirmation email (non-blocking — don't fail registration if email fails)
        sendEmail({
          to: input.email,
          subject: `Registration Confirmed: ${event.title}`,
          html,
        }).catch(err => console.error("[Webcast] Email send failed:", err));
      }
      return { success: true, attendeeToken };
    }),

  /**
   * Get registrations for an event (operator only).
   */
  getRegistrations: operatorProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(webcastRegistrations).where(eq(webcastRegistrations.eventId, input.eventId)).orderBy(desc(webcastRegistrations.registeredAt));
    }),

  /**
   * Submit a Q&A question (public — during live events).
   */
  submitQuestion: publicProcedure
    .input(z.object({
      eventId: z.number(),
      attendeeName: z.string().min(1).max(200),
      attendeeEmail: z.string().email().optional(),
      attendeeCompany: z.string().optional(),
      question: z.string().min(5).max(2000),
      isAnonymous: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      await db.insert(webcastQa).values({
        ...input,
        status: "pending",
        upvotes: 0,
        createdAt: Date.now(),
      } as any);
      return { success: true };
    }),

  /**
   * Get Q&A questions for an event (public — approved only for attendees).
   */
  getQuestions: publicProcedure
    .input(z.object({
      eventId: z.number(),
      includeAll: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const questions = await db.select().from(webcastQa)
        .where(
          input.includeAll
            ? eq(webcastQa.eventId, input.eventId)
            : and(eq(webcastQa.eventId, input.eventId), eq(webcastQa.status, "approved"))
        )
        .orderBy(desc(webcastQa.upvotes), desc(webcastQa.createdAt));
      return questions;
    }),

  /**
   * Moderate a Q&A question (operator only).
   */
  moderateQuestion: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      status: z.enum(["pending", "approved", "answered", "dismissed", "flagged"]),
      answer: z.string().optional(),
      answeredBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(webcastQa).set({
        status: input.status as any,
        answer: input.answer,
        answeredBy: input.answeredBy,
        answeredAt: input.answer ? Date.now() : undefined,
      }).where(eq(webcastQa.id, input.questionId));
      return { success: true };
    }),

  /**
   * Upvote a Q&A question (public).
   */
  upvoteQuestion: publicProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      await db.update(webcastQa).set({ upvotes: sql`upvotes + 1` }).where(eq(webcastQa.id, input.questionId));
      return { success: true };
    }),

  /**
   * Create a poll for an event (operator only).
   */
  createPoll: operatorProcedure
    .input(z.object({
      eventId: z.number(),
      question: z.string().min(5).max(500),
      options: z.array(z.string().min(1).max(200)).min(2).max(10),
      allowMultiple: z.boolean().default(false),
      showResultsToAttendees: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { options, ...rest } = input;
      const initialResults = options.reduce((acc: Record<number, number>, _: string, i: number) => ({ ...acc, [i]: 0 }), {});
      await db.insert(webcastPolls).values({
        ...rest,
        options: JSON.stringify(options),
        results: JSON.stringify(initialResults),
        status: "draft",
        totalVotes: 0,
        createdAt: Date.now(),
      } as any);
      return { success: true };
    }),

  /**
   * Get polls for an event (public).
   */
  getPolls: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const polls = await db.select().from(webcastPolls).where(eq(webcastPolls.eventId, input.eventId)).orderBy(desc(webcastPolls.createdAt));
      return polls.map((p: WebcastPoll) => ({
        ...p,
        options: JSON.parse(p.options || "[]") as string[],
        results: JSON.parse(p.results || "{}") as Record<string, number>,
      }));
    }),

  /**
   * Launch or close a poll (operator only).
   */
  updatePollStatus: operatorProcedure
    .input(z.object({
      pollId: z.number(),
      status: z.enum(["draft", "live", "closed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(webcastPolls).set({
        status: input.status as any,
        closedAt: input.status === "closed" ? Date.now() : undefined,
      }).where(eq(webcastPolls.id, input.pollId));
      return { success: true };
    }),

  /**
   * Vote on a poll (public).
   */
  votePoll: publicProcedure
    .input(z.object({
      pollId: z.number(),
      optionIndexes: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const [poll] = await db.select().from(webcastPolls).where(eq(webcastPolls.id, input.pollId));
      if (!poll || poll.status !== "live") throw new Error("Poll is not active");
      const results = JSON.parse(poll.results || "{}") as Record<string, number>;
      for (const idx of input.optionIndexes) {
        results[idx] = (results[idx] || 0) + 1;
      }
      await db.update(webcastPolls).set({
        results: JSON.stringify(results),
        totalVotes: sql`total_votes + 1`,
      }).where(eq(webcastPolls.id, input.pollId));
      return { success: true };
    }),

  /**
   * Get analytics summary for an event (operator only).
   */
  getEventAnalytics: operatorProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [event] = await db.select().from(webcastEvents).where(eq(webcastEvents.id, input.eventId));
      const registrations = await db.select().from(webcastRegistrations).where(eq(webcastRegistrations.eventId, input.eventId));
      const questions = await db.select().from(webcastQa).where(eq(webcastQa.eventId, input.eventId));
      const polls = await db.select().from(webcastPolls).where(eq(webcastPolls.eventId, input.eventId));

      const attended = registrations.filter((r: WebcastRegistration) => r.attended).length;
      const avgWatchTime = attended > 0
        ? Math.round(registrations.filter((r: WebcastRegistration) => r.attended).reduce((sum: number, r: WebcastRegistration) => sum + (r.watchTimeSeconds || 0), 0) / attended)
        : 0;

      return {
        event,
        totalRegistrations: registrations.length,
        totalAttendees: attended,
        showUpRate: registrations.length > 0 ? Math.round((attended / registrations.length) * 100) : 0,
        avgWatchTimeSeconds: avgWatchTime,
        peakAttendees: event?.peakAttendees || 0,
        totalQuestions: questions.length,
        approvedQuestions: questions.filter((q: WebcastQa) => q.status === "approved" || q.status === "answered").length,
        totalPolls: polls.length,
        totalPollVotes: polls.reduce((sum: number, p: WebcastPoll) => sum + (p.totalVotes || 0), 0),
        engagementScore: Math.round(
          (attended > 0 ? (attended / Math.max(registrations.length, 1)) * 40 : 0) +
          (questions.length > 0 ? Math.min(questions.length / Math.max(attended, 1) * 100, 30) : 0) +
          (polls.length > 0 ? 30 : 0)
        ),
      };
    }),

  /**
   * Verify an attendee token and return the registration + event details.
   * Used by the Attendee Event Room to validate the join link.
   */
  verifyAttendeeToken: publicProcedure
    .input(z.object({
      slug: z.string(),
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      // Find the event by slug
      const [event] = await db.select().from(webcastEvents).where(eq(webcastEvents.slug, input.slug)).limit(1);
      if (!event) return null;
      // Find the registration by token
      const [registration] = await db.select().from(webcastRegistrations)
        .where(and(eq(webcastRegistrations.eventId, event.id), eq(webcastRegistrations.attendeeToken, input.token)))
        .limit(1);
      if (!registration) return null;
      return {
        valid: true,
        event,
        registration: {
          id: registration.id,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          company: registration.company,
          jobTitle: registration.jobTitle,
        },
      };
    }),

  /**
   * Mark an attendee as having joined the event.
   */
  markAttendeeJoined: publicProcedure
    .input(z.object({
      slug: z.string(),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const [event] = await db.select().from(webcastEvents).where(eq(webcastEvents.slug, input.slug)).limit(1);
      if (!event) return { success: false };
      await db.update(webcastRegistrations)
        .set({ attended: true, joinedAt: Date.now() })
        .where(and(eq(webcastRegistrations.eventId, event.id), eq(webcastRegistrations.attendeeToken, input.token)));
      return { success: true };
    }),
});
