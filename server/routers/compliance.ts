import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { complianceFlags, complianceAuditLog } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

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

async function logAudit(db: any, eventId: string | null, action: any, userId: number | null, details: string) {
  try {
    await db.insert(complianceAuditLog).values({ eventId, action, userId, details });
  } catch {}
}

export const complianceRouter = router({
  getFlaggedStatements: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(complianceFlags)
        .where(eq(complianceFlags.eventId, input.eventId))
        .orderBy(complianceFlags.createdAt);
    }),

  scanTranscript: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      transcript: z.string().optional(),
      eventTitle: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const transcript = input.transcript ?? "No transcript available.";
      const title = input.eventTitle ?? "CuraLive Event";

      const aiResponse = await callForgeAI(
        `You are a JSE/IFRS/SEC compliance expert reviewing an investor event transcript. Identify ALL material statements that may require regulatory attention.

Event: "${title}"
Transcript excerpt: ${transcript.slice(0, 3000)}

Return a JSON array of flagged statements (maximum 8):
[{
  "statement": "exact quote or paraphrase from transcript",
  "speaker": "speaker name or role if identifiable",
  "timestamp": "HH:MM if visible",
  "riskLevel": "low|medium|high",
  "flagReason": "specific regulatory concern (e.g. forward-looking statement without safe harbour, undisclosed material fact, selective disclosure)"
}]

Focus on: earnings guidance, forward-looking statements, material facts, selective disclosure, undisclosed M&A, risk omissions.`
      );

      let flagged: any[] = [];
      try { flagged = JSON.parse(aiResponse); } catch { flagged = []; }
      if (!Array.isArray(flagged)) flagged = [];

      const inserted: number[] = [];
      for (const f of flagged.slice(0, 8)) {
        const [result] = await db.insert(complianceFlags).values({
          eventId: input.eventId,
          statementText: f.statement ?? "Unknown statement",
          timestamp: f.timestamp ?? null,
          speakerName: f.speaker ?? null,
          riskLevel: (["low", "medium", "high"].includes(f.riskLevel) ? f.riskLevel : "low") as any,
          flagReason: f.flagReason ?? null,
          complianceStatus: "flagged",
        });
        inserted.push((result as any).insertId);
      }

      await logAudit(db, input.eventId, "flagged", ctx.user.id, `Scanned transcript — ${inserted.length} statements flagged`);
      return { flaggedCount: inserted.length };
    }),

  reviewStatement: protectedProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(complianceFlags).set({
        complianceStatus: "reviewed",
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
      }).where(eq(complianceFlags.id, input.flagId));
      await logAudit(db, null, "reviewed", ctx.user.id, `Flag ID ${input.flagId} reviewed`);
      return { reviewed: true };
    }),

  approveStatement: protectedProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(complianceFlags).set({
        complianceStatus: "approved",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      }).where(eq(complianceFlags.id, input.flagId));
      await logAudit(db, null, "approved", ctx.user.id, `Flag ID ${input.flagId} approved`);
      return { approved: true };
    }),

  generateComplianceCertificate: protectedProcedure
    .input(z.object({ eventId: z.string(), eventTitle: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const flags = await db.select().from(complianceFlags)
        .where(eq(complianceFlags.eventId, input.eventId));
      await logAudit(db, input.eventId, "certificate_generated", ctx.user.id, `Certificate generated for ${input.eventTitle ?? input.eventId}`);
      const cert = {
        generatedAt: new Date().toISOString(),
        eventId: input.eventId,
        eventTitle: input.eventTitle ?? input.eventId,
        generatedBy: ctx.user.id,
        totalFlags: flags.length,
        approved: flags.filter(f => f.complianceStatus === "approved").length,
        reviewed: flags.filter(f => f.complianceStatus === "reviewed").length,
        pending: flags.filter(f => f.complianceStatus === "flagged").length,
        statements: flags.map(f => ({
          statement: f.statementText,
          speaker: f.speakerName,
          riskLevel: f.riskLevel,
          status: f.complianceStatus,
          approvedAt: f.approvedAt,
        })),
      };
      return { certificate: cert };
    }),

  getAuditLog: protectedProcedure
    .input(z.object({ eventId: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(complianceAuditLog)
        .orderBy(desc(complianceAuditLog.createdAt))
        .limit(input.limit);
      if (input.eventId) return rows.filter(r => !r.eventId || r.eventId === input.eventId);
      return rows;
    }),
});
