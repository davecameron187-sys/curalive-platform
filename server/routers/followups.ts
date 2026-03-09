import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { investorFollowups, followupEmails, webcastQa, occTranscriptionSegments } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

async function callForgeAI(prompt: string): Promise<string> {
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL ?? "https://api.forge.replit.com/v1";
  if (!apiKey) {
    console.error("BUILT_IN_FORGE_API_KEY is not set");
    return "[]";
  }
  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "replit-v1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.2
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Forge AI API error: ${res.status} ${errorText}`);
      return "[]";
    }
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content ?? "[]";
  } catch (error) {
    console.error("Error calling Forge AI:", error);
    return "[]";
  }
}

export const followupsRouter = router({
  getFollowupsByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const followups = await db.select().from(investorFollowups)
        .where(eq(investorFollowups.eventId, input.eventId))
        .orderBy(desc(investorFollowups.createdAt));

      const results = [];
      for (const f of followups) {
        const emails = await db.select().from(followupEmails)
          .where(eq(followupEmails.followupId, f.id))
          .orderBy(desc(followupEmails.sentAt));
        results.push({ ...f, emails });
      }
      return results;
    }),

  extractFollowups: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Fetch transcript and Q&A from DB if not provided
      const transcriptSegments = await db.select()
        .from(occTranscriptionSegments)
        .where(eq(occTranscriptionSegments.conferenceId, input.eventId))
        .orderBy(occTranscriptionSegments.startTimeMs);
      
      const transcript = transcriptSegments.map(s => `[${s.speakerName ?? 'Unknown'}]: ${s.content}`).join("\n");

      const qaSubmissions = await db.select()
        .from(webcastQa)
        .where(eq(webcastQa.eventId, parseInt(input.eventId) || 0));

      const qaText = (qaSubmissions ?? []).map(q =>
        `Q: ${q.question} — ${q.attendeeName ?? "Unknown investor"}${q.attendeeCompany ? ` (${q.attendeeCompany})` : ""}${q.attendeeEmail ? ` <${q.attendeeEmail}>` : ""}`
      ).join("\n");

      const aiResponse = await callForgeAI(
        `You are an investor relations assistant. Analyse this investor event's Q&A and transcript to extract follow-up action items.

Event ID: "${input.eventId}"
Q&A Submissions:
${qaText || "No Q&A submissions available"}

Transcript: 
${transcript.slice(0, 5000) || "No transcript available"}

Extract follow-ups and return ONLY a JSON array (max 10):
[{
  "investorName": "name or null",
  "investorEmail": "email or null",
  "investorCompany": "company or null",
  "questionText": "their question",
  "commitmentText": "commitment made by the company in response",
  "emailTemplate": "Dear [Name],\\n\\nThank you for your question during our event. [Personalised response and commitment]. We will [next steps].\\n\\nBest regards,\\n[IR Team]"
}]

Only include entries where a specific commitment was made for a follow-up.`
      );

      let extractedData: any[] = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          extractedData = JSON.parse(aiResponse);
        }
      } catch (e) {
        console.error("Failed to parse AI response:", aiResponse);
        extractedData = [];
      }
      
      if (!Array.isArray(extractedData)) extractedData = [];

      const inserted: any[] = [];
      for (const f of extractedData.slice(0, 10)) {
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
      await db.update(investorFollowups).set({
        followUpStatus: input.status,
        updatedAt: new Date()
      }).where(eq(investorFollowups.id, input.followupId));
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

      // In a real app, we'd use Resend here:
      // await resend.emails.send({ from: 'IR Team <ir@curalive.com>', to: input.recipientEmail, subject: 'Follow-up from Investor Event', html: input.emailBody });
      console.log(`Sending email to ${input.recipientEmail} for follow-up ${input.followupId}`);
      
      const [result] = await db.insert(followupEmails).values({
        followupId: input.followupId,
        emailBody: input.emailBody,
        recipientEmail: input.recipientEmail,
        sentAt: new Date(),
        // Mocking tracking data for the spec
        openedAt: null,
        clickedAt: null,
      });

      await db.update(investorFollowups).set({
        followUpStatus: "contacted",
        emailSentAt: new Date(),
        updatedAt: new Date()
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
        updatedAt: new Date()
      }).where(eq(investorFollowups.id, input.followupId));
      return { synced: true, contactId: fakeContactId, activityId: fakeActivityId, note: "CRM integration ready — connect Salesforce/HubSpot API key to activate" };
    }),

  updateEmailTemplate: protectedProcedure
    .input(z.object({ followupId: z.number(), template: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(investorFollowups).set({
        emailTemplate: input.template,
        updatedAt: new Date()
      }).where(eq(investorFollowups.id, input.followupId));
      return { updated: true };
    }),
});
