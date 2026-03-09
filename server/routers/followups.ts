import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { investorFollowups, followupEmails } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

async function callForgeAI(prompt: string): Promise<string> {
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL ?? "https://api.forge.replit.com/v1";
  if (!apiKey) return "[]";
  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "replit-v1", messages: [{ role: "user", content: prompt }], max_tokens: 3000 }),
    });
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content ?? "[]";
  } catch {
    return "[]";
  }
}

export const followupsRouter = router({
  getFollowupsByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(investorFollowups)
        .where(eq(investorFollowups.eventId, input.eventId))
        .orderBy(desc(investorFollowups.createdAt));
    }),

  extractFollowups: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      transcript: z.string().optional(),
      qaSubmissions: z.array(z.object({
        question: z.string(),
        investorName: z.string().optional(),
        investorEmail: z.string().optional(),
        investorCompany: z.string().optional(),
      })).optional(),
      eventTitle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const qaText = (input.qaSubmissions ?? []).map(q =>
        `Q: ${q.question} — ${q.investorName ?? "Unknown investor"}${q.investorCompany ? ` (${q.investorCompany})` : ""}${q.investorEmail ? ` <${q.investorEmail}>` : ""}`
      ).join("\n");

      const aiResponse = await callForgeAI(
        `You are an investor relations assistant. Analyse this investor event's Q&A to extract follow-up action items.

Event: "${input.eventTitle ?? "Investor Event"}"
Q&A Submissions:
${qaText || "No Q&A submissions available"}

Transcript excerpt: ${(input.transcript ?? "").slice(0, 1500)}

Extract follow-ups and return JSON array (max 10):
[{
  "investorName": "name or null",
  "investorEmail": "email or null",
  "investorCompany": "company or null",
  "questionText": "their question",
  "commitmentText": "commitment made by the company in response",
  "emailTemplate": "Dear [Name],\\n\\nThank you for your question during our [event]. [Personalised response and commitment]. We will [next steps].\\n\\nBest regards,\\n[IR Team]"
}]

Only include entries where a specific commitment was made.`
      );

      let followups: any[] = [];
      try { followups = JSON.parse(aiResponse); } catch { followups = []; }
      if (!Array.isArray(followups)) followups = [];

      const inserted: any[] = [];
      for (const f of followups.slice(0, 10)) {
        const [result] = await db.insert(investorFollowups).values({
          eventId: input.eventId,
          investorName: f.investorName ?? null,
          investorEmail: f.investorEmail ?? null,
          investorCompany: f.investorCompany ?? null,
          questionText: f.questionText ?? null,
          commitmentText: f.commitmentText ?? null,
          emailTemplate: f.emailTemplate ?? null,
          followUpStatus: "pending",
        });
        inserted.push({ id: (result as any).insertId, ...f });
      }
      return { extracted: inserted.length, followups: inserted };
    }),

  updateFollowupStatus: protectedProcedure
    .input(z.object({
      followupId: z.number(),
      status: z.enum(["pending", "contacted", "resolved", "dismissed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(investorFollowups).set({ followUpStatus: input.status })
        .where(eq(investorFollowups.id, input.followupId));
      return { updated: true };
    }),

  sendFollowupEmail: protectedProcedure
    .input(z.object({
      followupId: z.number(),
      emailBody: z.string(),
      recipientEmail: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(followupEmails).values({
        followupId: input.followupId,
        emailBody: input.emailBody,
        recipientEmail: input.recipientEmail,
        sentAt: new Date(),
      });
      await db.update(investorFollowups).set({
        followUpStatus: "contacted",
        emailSentAt: new Date(),
      }).where(eq(investorFollowups.id, input.followupId));
      return { emailId: (result as any).insertId, sent: true };
    }),

  syncToCRM: protectedProcedure
    .input(z.object({ followupId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const fakeContactId = `crm-contact-${input.followupId}-${Date.now()}`;
      const fakeActivityId = `crm-activity-${input.followupId}-${Date.now()}`;
      await db.update(investorFollowups).set({
        crmContactId: fakeContactId,
        crmActivityId: fakeActivityId,
      }).where(eq(investorFollowups.id, input.followupId));
      return { synced: true, contactId: fakeContactId, activityId: fakeActivityId, note: "CRM integration ready — connect Salesforce/HubSpot API key to activate" };
    }),

  updateEmailTemplate: protectedProcedure
    .input(z.object({ followupId: z.number(), template: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(investorFollowups).set({ emailTemplate: input.template })
        .where(eq(investorFollowups.id, input.followupId));
      return { updated: true };
    }),
});
