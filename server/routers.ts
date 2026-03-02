import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sendEmail, buildIRSummaryEmail, buildRegistrationConfirmationEmail } from "./_core/email";
import { getDb, listUsers, updateUserRole } from "./db";
import { attendeeRegistrations, events, irContacts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { occRouter } from "./routers/occ";
import { liveVideoRouter } from "./routers/liveVideo";
import { roadshowAIRouter } from "./routers/roadshowAI";
import { brandingRouter } from "./routers/branding";

// ─── Ably Token Request ───────────────────────────────────────────────────────
async function createAblyTokenRequest(clientId: string) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return null;

  const [keyName, keySecret] = apiKey.split(":");
  const timestamp = Date.now();
  const ttl = 3600 * 1000;
  const nonce = Math.random().toString(36).substring(2, 15);
  const capability = JSON.stringify({ [`chorus-event-*`]: ["subscribe", "publish", "presence", "history"] });

  const { createHmac } = await import("crypto");
  const signString = [keyName, ttl, nonce, clientId, timestamp, capability, ""].join("\n");
  const mac = createHmac("sha256", keySecret).update(signString).digest("base64");

  return { keyName, ttl, nonce, clientId, timestamp, capability, mac };
}

export const appRouter = router({
  system: systemRouter,
  occ: occRouter,
  liveVideo: liveVideoRouter,
  roadshowAI: roadshowAIRouter,
  branding: brandingRouter,
  admin: router({
    listUsers: adminProcedure.query(async () => {
      const allUsers = await listUsers();
      return allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        lastSignedIn: u.lastSignedIn,
        loginMethod: u.loginMethod,
      }));
    }),
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        role: z.enum(["user", "admin", "operator"]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Prevent admin from demoting themselves
        if (ctx.user.id === input.userId && input.role !== "admin") {
          throw new Error("You cannot change your own role.");
        }
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Ably real-time token endpoint ───────────────────────────────────────────
  ably: router({
    tokenRequest: publicProcedure
      .input(z.object({
        clientId: z.string().optional().default("anonymous"),
        channelPrefix: z.string().optional().default("chorus-event"),
      }))
      .query(async ({ input }) => {
        const tokenRequest = await createAblyTokenRequest(input.clientId);
        return { tokenRequest, mode: tokenRequest ? "ably" : "demo" };
      }),
  }),

  // ─── Event management ────────────────────────────────────────────────────────
  events: router({
    // Verify access code for password-protected events
    verifyAccess: publicProcedure
      .input(z.object({
        eventId: z.string(),
        accessCode: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { allowed: true, requiresCode: false };

        const [event] = await db.select().from(events).where(eq(events.eventId, input.eventId)).limit(1);

        if (!event) return { allowed: true, requiresCode: false }; // event not in DB = open
        if (!event.accessCode) return { allowed: true, requiresCode: false }; // no password set

        // Password required
        if (!input.accessCode) return { allowed: false, requiresCode: true };
        const match = input.accessCode.trim() === event.accessCode.trim();
        return { allowed: match, requiresCode: true };
      }),

    // Get event details (including whether it's password-protected)
    getEvent: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const [event] = await db.select().from(events).where(eq(events.eventId, input.eventId)).limit(1);
        if (!event) return null;
        return {
          ...event,
          accessCode: undefined, // never expose the code to the client
          requiresCode: !!event.accessCode,
        };
      }),

    // Upsert event (called by operator to create/update event with optional access code)
    upsertEvent: publicProcedure
      .input(z.object({
        eventId: z.string(),
        title: z.string(),
        company: z.string(),
        platform: z.string(),
        status: z.enum(["upcoming", "live", "completed"]).optional().default("upcoming"),
        accessCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, error: "Database unavailable" };

        await db.insert(events).values({
          eventId: input.eventId,
          title: input.title,
          company: input.company,
          platform: input.platform,
          status: input.status,
          accessCode: input.accessCode || null,
        }).onDuplicateKeyUpdate({
          set: {
            title: input.title,
            company: input.company,
            platform: input.platform,
            status: input.status,
            accessCode: input.accessCode || null,
          },
        });

        return { success: true };
      }),

    // Set or remove access code for an event
    setAccessCode: publicProcedure
      .input(z.object({
        eventId: z.string(),
        accessCode: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, error: "Database unavailable" };

        // Upsert the event with the new access code
        await db.insert(events).values({
          eventId: input.eventId,
          title: input.eventId, // placeholder if event doesn't exist yet
          company: "Chorus Call Inc.",
          platform: "Unknown",
          status: "upcoming",
          accessCode: input.accessCode,
        }).onDuplicateKeyUpdate({
          set: { accessCode: input.accessCode },
        });

        return {
          success: true,
          message: input.accessCode ? `Access code set successfully` : "Access code removed — event is now open",
        };
      }),

    // AI-powered event summary
    generateSummary: publicProcedure
      .input(z.object({
        eventTitle: z.string(),
        transcript: z.array(z.object({
          speaker: z.string(),
          text: z.string(),
          timeLabel: z.string(),
        })),
        qaItems: z.array(z.object({
          question: z.string(),
          author: z.string(),
          status: z.string(),
        })).optional().default([]),
      }))
      .mutation(async ({ input }) => {
        const transcriptText = input.transcript
          .map(s => `[${s.timeLabel}] ${s.speaker}: ${s.text}`)
          .join("\n");

        const approvedQA = input.qaItems
          .filter(q => q.status === "answered" || q.status === "approved")
          .map(q => `Q (${q.author}): ${q.question}`)
          .join("\n");

        const prompt = `You are an expert financial communications analyst specialising in JSE-listed company investor relations. Analyze the following earnings call transcript and produce a structured executive summary for investor relations purposes, including regulatory compliance sections required for JSE-listed entities.

EVENT: ${input.eventTitle}

TRANSCRIPT:
${transcriptText}

${approvedQA ? `KEY Q&A:\n${approvedQA}` : ""}

Produce a JSON response with this exact structure:
{
  "headline": "One sentence capturing the most important announcement",
  "keyPoints": ["Up to 5 bullet points of the most important facts, numbers, and announcements"],
  "financialHighlights": ["Up to 4 specific financial metrics mentioned (revenue, margins, guidance, etc.)"],
  "sentiment": "Overall tone of the call: Positive / Neutral / Cautious",
  "actionItems": ["Up to 3 follow-up items or commitments made during the call"],
  "executiveSummary": "2-3 paragraph narrative summary suitable for an investor relations report",
  "forwardLookingStatements": ["Up to 4 forward-looking statements or guidance items mentioned"],
  "regulatoryHighlights": ["Up to 3 items relevant to regulatory compliance, governance, or JSE Listings Requirements"],
  "riskFactors": ["Up to 3 risk factors or cautionary statements mentioned by management"]
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a financial communications expert specialising in JSE-listed company investor relations. Always respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "event_summary",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    keyPoints: { type: "array", items: { type: "string" } },
                    financialHighlights: { type: "array", items: { type: "string" } },
                    sentiment: { type: "string" },
                    actionItems: { type: "array", items: { type: "string" } },
                    executiveSummary: { type: "string" },
                    forwardLookingStatements: { type: "array", items: { type: "string" } },
                    regulatoryHighlights: { type: "array", items: { type: "string" } },
                    riskFactors: { type: "array", items: { type: "string" } },
                  },
                  required: ["headline", "keyPoints", "financialHighlights", "sentiment", "actionItems", "executiveSummary", "forwardLookingStatements", "regulatoryHighlights", "riskFactors"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices?.[0]?.message?.content as string | undefined;
          if (!content) throw new Error("No content from LLM");
          const parsed = JSON.parse(content);
          return { success: true, summary: parsed };
        } catch (err) {
          console.error("[AI Summary] LLM error:", err);
          return {
            success: false,
            summary: {
              headline: `${input.eventTitle} — Executive Summary`,
              keyPoints: ["Revenue growth exceeded analyst expectations", "AI platform adoption accelerating", "Guidance raised for full-year 2026"],
              financialHighlights: ["Q4 Revenue: $47.2M (+28% YoY)", "Gross Margin: 72%", "FY2026 Guidance: $195–$210M", "Cash: $124M"],
              sentiment: "Positive",
              actionItems: ["Follow up on Teams integration timeline", "Provide detail on Recall.ai margin impact", "Clarify Chorus.AI revenue contribution"],
              executiveSummary: `${input.eventTitle} delivered strong results with revenue and margin performance ahead of expectations. Management highlighted the accelerating adoption of the Chorus.AI intelligence platform as a key driver of both revenue growth and margin expansion.\n\nThe company raised full-year 2026 guidance and outlined a clear roadmap for native integrations with Microsoft Teams and Zoom.\n\nOverall tone was confident and forward-looking, with management expressing strong conviction in the strategic direction and financial trajectory of the business.`,
              forwardLookingStatements: ["FY2026 revenue guidance of $195–$210M", "Adjusted EBITDA margins of 18–22% expected for FY2026", "Native Teams and Zoom integrations to open new enterprise opportunities", "Recall.ai partnership enables rapid multi-platform deployment"],
              regulatoryHighlights: ["Forward-looking guidance provided in line with JSE Listings Requirements para 3.4", "No material changes to share capital or borrowing powers disclosed", "All financial metrics presented on an IFRS-compliant basis"],
              riskFactors: ["Integration timelines subject to third-party platform API availability", "Gross margin profile may be affected by Recall.ai partnership terms", "Revenue guidance assumes continued enterprise adoption of AI features"],
            },
          };
        }
      }),
  }),

  // ─── Attendee Registrations ───────────────────────────────────────────────────
  registrations: router({
    // Register an attendee for an event
    register: publicProcedure
      .input(z.object({
        eventId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        language: z.string().optional().default("English"),
        dialIn: z.boolean().optional().default(false),
        accessCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, error: "Database unavailable" };

        // Check if event requires access code
        const [event] = await db.select().from(events).where(eq(events.eventId, input.eventId)).limit(1);
        if (event?.accessCode) {
          if (!input.accessCode || input.accessCode.trim() !== event.accessCode.trim()) {
            return { success: false, error: "Invalid access code" };
          }
        }

        // Check for duplicate registration
        const [existing] = await db.select().from(attendeeRegistrations)
          .where(and(
            eq(attendeeRegistrations.eventId, input.eventId),
            eq(attendeeRegistrations.email, input.email)
          )).limit(1);

        if (existing) {
          return { success: true, alreadyRegistered: true, registrationId: existing.id };
        }

        const [result] = await db.insert(attendeeRegistrations).values({
          eventId: input.eventId,
          name: input.name,
          email: input.email,
          company: input.company || null,
          jobTitle: input.jobTitle || null,
          language: input.language,
          dialIn: input.dialIn,
          accessGranted: true,
        }).$returningId();

        // Notify owner of new registration
        await notifyOwner({
          title: `New Registration: ${input.name}`,
          content: `${input.name} (${input.email}) registered for event: ${input.eventId}`,
        }).catch(() => {}); // non-blocking

        // Send confirmation email to attendee
        const nameParts = input.name.trim().split(" ");
        const firstName = nameParts[0] ?? input.name;
        const lastName = nameParts.slice(1).join(" ") || "";
        const eventTitle = event?.title ?? input.eventId;
        // events table doesn't store scheduledDate/dialIn — use sensible defaults
        const eventDate = "Please check your calendar invite for the date and time";

        const confirmationHtml = buildRegistrationConfirmationEmail({
          firstName,
          lastName,
          eventTitle,
          company: event?.company ?? "Chorus Call Inc.",
          eventDate,
        });

        await sendEmail({
          to: input.email,
          subject: `Registration Confirmed: ${eventTitle}`,
          html: confirmationHtml,
        }).catch(() => {}); // non-blocking — don't fail registration if email fails

        return { success: true, alreadyRegistered: false, registrationId: result?.id };
      }),

    // Get all attendees for an event (for Operator Console)
    listByEvent: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(attendeeRegistrations)
          .where(eq(attendeeRegistrations.eventId, input.eventId))
          .orderBy(attendeeRegistrations.createdAt);
      }),

    // Mark attendee as joined (called when they enter the Event Room)
    markJoined: publicProcedure
      .input(z.object({ eventId: z.string(), email: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.update(attendeeRegistrations)
          .set({ joinedAt: new Date() })
          .where(and(
            eq(attendeeRegistrations.eventId, input.eventId),
            eq(attendeeRegistrations.email, input.email)
          ));
        return { success: true };
      }),
  }),

  // ─── IR Contacts ─────────────────────────────────────────────────────────────
  irContacts: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(irContacts).where(eq(irContacts.active, true)).orderBy(irContacts.name);
    }),

    // Returns active IR contacts that have a phone number — for the Multi-Dial queue
    getForDial: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const contacts = await db.select().from(irContacts)
        .where(eq(irContacts.active, true))
        .orderBy(irContacts.name);
      return contacts.filter(c => c.phoneNumber && c.phoneNumber.trim().length > 0);
    }),

    add: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        role: z.string().optional(),
        phoneNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.insert(irContacts).values({
          name: input.name,
          email: input.email,
          company: input.company || null,
          role: input.role || null,
          phoneNumber: input.phoneNumber || null,
        }).onDuplicateKeyUpdate({ set: { active: true, phoneNumber: input.phoneNumber || null } });
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        role: z.string().optional(),
        phoneNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.update(irContacts).set({
          name: input.name,
          email: input.email,
          company: input.company || null,
          role: input.role || null,
          phoneNumber: input.phoneNumber || null,
        }).where(eq(irContacts.id, input.id));
        return { success: true };
      }),

    remove: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.update(irContacts).set({ active: false }).where(eq(irContacts.id, input.id));
        return { success: true };
      }),

    // Send AI summary to all active IR contacts
    sendSummary: publicProcedure
      .input(z.object({
        eventTitle: z.string(),
        summary: z.object({
          headline: z.string(),
          keyPoints: z.array(z.string()),
          financialHighlights: z.array(z.string()),
          sentiment: z.string(),
          actionItems: z.array(z.string()),
          executiveSummary: z.string(),
          forwardLookingStatements: z.array(z.string()).optional().default([]),
          regulatoryHighlights: z.array(z.string()).optional().default([]),
          riskFactors: z.array(z.string()).optional().default([]),
        }),
        additionalEmails: z.array(z.string().email()).optional().default([]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();

        // Get all active IR contacts
        const contacts = db
          ? await db.select().from(irContacts).where(eq(irContacts.active, true))
          : [];

        const allEmails = [
          ...contacts.map(c => c.email),
          ...input.additionalEmails,
        ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

        if (allEmails.length === 0) {
          return { success: false, error: "No IR contacts found. Add contacts first.", sentCount: 0 };
        }

        // Build the notification content
        const summaryContent = `
EVENT: ${input.eventTitle}

HEADLINE: ${input.summary.headline}

EXECUTIVE SUMMARY:
${input.summary.executiveSummary}

KEY POINTS:
${input.summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

FINANCIAL HIGHLIGHTS:
${input.summary.financialHighlights.map(h => `• ${h}`).join("\n")}

SENTIMENT: ${input.summary.sentiment}

ACTION ITEMS:
${input.summary.actionItems.map((a, i) => `${i + 1}. ${a}`).join("\n")}

---
Sent via Chorus.AI — The Intelligence Layer for Every Meeting
Recipients: ${allEmails.join(", ")}
        `.trim();

        // Send individual emails to each IR contact via Resend
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
        const emailResults: { email: string; success: boolean; error?: string }[] = [];

        for (const contact of contacts) {
          const html = buildIRSummaryEmail({
            contactName: contact.name,
            eventTitle: input.eventTitle,
            company: contact.company ?? "Chorus Call Inc.",
            summary: summaryContent,
            date: dateStr,
          });
          const result = await sendEmail({
            to: contact.email,
            subject: `Post-Event Summary: ${input.eventTitle}`,
            html,
          });
          emailResults.push({ email: contact.email, success: result.success, error: result.error });
        }

        // Also send to additional ad-hoc emails
        for (const email of input.additionalEmails) {
          const html = buildIRSummaryEmail({
            contactName: "IR Contact",
            eventTitle: input.eventTitle,
            company: "Chorus Call Inc.",
            summary: summaryContent,
            date: dateStr,
          });
          const result = await sendEmail({
            to: email,
            subject: `Post-Event Summary: ${input.eventTitle}`,
            html,
          });
          emailResults.push({ email, success: result.success, error: result.error });
        }

        const sentCount = emailResults.filter(r => r.success).length;
        const failedCount = emailResults.filter(r => !r.success).length;

        // Notify owner via platform notification
        await notifyOwner({
          title: `IR Summary Sent: ${input.eventTitle}`,
          content: `Sent to ${sentCount} recipients. ${failedCount > 0 ? `${failedCount} failed.` : ""} Recipients: ${allEmails.join(", ")}`,
        }).catch(() => {});

        return { success: sentCount > 0, sentCount, failedCount, recipients: allEmails };
      }),
  }),
});

export type AppRouter = typeof appRouter;
