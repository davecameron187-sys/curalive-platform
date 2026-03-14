import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { complianceFlags, complianceAuditLog, complianceCertificates } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateComplianceCertificatePdf } from "../compliancePdf";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import { soc2Controls, iso27001Controls } from "../../drizzle/schema";

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

  rejectStatement: protectedProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(complianceFlags).set({
        complianceStatus: "disclosed", // Using "disclosed" as a placeholder for rejected/handled status based on existing enum
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
      }).where(eq(complianceFlags.id, input.flagId));
      await logAudit(db, null, "disclosed", ctx.user.id, `Flag ID ${input.flagId} marked as disclosed/handled`);
      return { rejected: true };
    }),

  generateComplianceCertificate: protectedProcedure
    .input(z.object({ eventId: z.string(), eventTitle: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const flags = await db.select().from(complianceFlags)
        .where(eq(complianceFlags.eventId, input.eventId));

      const certId = `CERT-${input.eventId}-${Date.now()}`;

      // Generate real PDF and upload to S3
      let pdfUrl = `/api/compliance/certificates/${certId}.pdf`;
      try {
        const pdfBuffer = await generateComplianceCertificatePdf({
          eventId: input.eventId,
          eventTitle: input.eventTitle ?? input.eventId,
          eventDate: new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }),
          companyName: "Chorus Call Inc.",
          certType: "REGULATORY",
          certId,
          issuedAt: new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" }),
          reviewedBy: ctx.user.name ?? String(ctx.user.id),
          flaggedStatements: flags.length,
          approvedStatements: flags.filter(f => f.complianceStatus === "approved").length,
        });
        const s3Key = `compliance-certs/${certId}.pdf`;
        const uploaded = await storagePut(s3Key, pdfBuffer, "application/pdf");
        pdfUrl = uploaded.url;
      } catch (pdfErr) {
        console.error("[Compliance] PDF generation failed, using fallback URL:", pdfErr);
      }

      await db.insert(complianceCertificates).values({
        eventId: input.eventId,
        certificateId: certId,
        pdfUrl,
        generatedBy: ctx.user.id,
        generatedAt: new Date(),
      });

      await logAudit(db, input.eventId, "certificate_generated", ctx.user.id, `Certificate generated for ${input.eventTitle ?? input.eventId}`);
      const cert = {
        generatedAt: new Date().toISOString(),
        eventId: input.eventId,
        certificateId: certId,
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

  generateGapAnalysis: protectedProcedure
    .input(z.object({ frameworks: z.array(z.enum(["SOC2", "ISO27001", "BOTH"])).default(["BOTH"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch real control data from DB
      const soc2Rows = await db.select().from(soc2Controls);
      const iso27001Rows = await db.select().from(iso27001Controls);

      const soc2Stats = {
        total: soc2Rows.length,
        compliant: soc2Rows.filter(r => r.status === "compliant").length,
        partial: soc2Rows.filter(r => r.status === "partial").length,
        nonCompliant: soc2Rows.filter(r => r.status === "non_compliant").length,
        gaps: soc2Rows.filter(r => r.status === "non_compliant" || r.status === "partial"),
      };

      const iso27001Stats = {
        total: iso27001Rows.length,
        compliant: iso27001Rows.filter(r => r.status === "compliant").length,
        partial: iso27001Rows.filter(r => r.status === "partial").length,
        nonCompliant: iso27001Rows.filter(r => r.status === "non_compliant").length,
        gaps: iso27001Rows.filter(r => r.status === "non_compliant" || r.status === "partial"),
      };

      const soc2Score = soc2Stats.total > 0 ? Math.round(((soc2Stats.compliant + soc2Stats.partial * 0.5) / soc2Stats.total) * 100) : 0;
      const iso27001Score = iso27001Stats.total > 0 ? Math.round(((iso27001Stats.compliant + iso27001Stats.partial * 0.5) / iso27001Stats.total) * 100) : 0;

      // Build gap summary for LLM
      const soc2GapSummary = soc2Stats.gaps.slice(0, 15).map(g =>
        `[${g.status.toUpperCase()}] ${g.category} — ${g.name}`
      ).join("\n");

      const iso27001GapSummary = iso27001Stats.gaps.slice(0, 15).map(g =>
        `[${g.status.toUpperCase()}] ${g.clause} — ${g.name}`
      ).join("\n");

      // Ask LLM for prioritised remediation roadmap
      let roadmap: any[] = [];
      try {
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a compliance expert specialising in SOC 2 Type II and ISO 27001. Generate a concise, prioritised remediation roadmap based on the gap data provided. Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: `Generate a prioritised remediation roadmap for the following compliance gaps.

SOC 2 Score: ${soc2Score}% (${soc2Stats.nonCompliant} non-compliant, ${soc2Stats.partial} partial out of ${soc2Stats.total} controls)
Top SOC 2 Gaps:
${soc2GapSummary || "No gaps identified"}

ISO 27001 Score: ${iso27001Score}% (${iso27001Stats.nonCompliant} non-compliant, ${iso27001Stats.partial} partial out of ${iso27001Stats.total} controls)
Top ISO 27001 Gaps:
${iso27001GapSummary || "No gaps identified"}

Return a JSON array of up to 8 remediation items:
[{
  "priority": "critical|high|medium|low",
  "framework": "SOC2|ISO27001|BOTH",
  "title": "short action title",
  "description": "what needs to be done",
  "estimatedEffort": "1 week|2 weeks|1 month|3 months",
  "impact": "what compliance improvement this achieves"
}]`,
            },
          ],
        });
        const raw = llmResponse?.choices?.[0]?.message?.content ?? "[]";
        const jsonMatch = raw.match(/\[.*\]/s);
        if (jsonMatch) roadmap = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("[GapAnalysis] LLM call failed:", err);
      }

      return {
        generatedAt: new Date().toISOString(),
        soc2: {
          score: soc2Score,
          total: soc2Stats.total,
          compliant: soc2Stats.compliant,
          partial: soc2Stats.partial,
          nonCompliant: soc2Stats.nonCompliant,
          topGaps: soc2Stats.gaps.slice(0, 10).map(g => ({
            id: g.id,
            name: g.name,
            category: g.category,
            status: g.status,
          })),
        },
        iso27001: {
          score: iso27001Score,
          total: iso27001Stats.total,
          compliant: iso27001Stats.compliant,
          partial: iso27001Stats.partial,
          nonCompliant: iso27001Stats.nonCompliant,
          topGaps: iso27001Stats.gaps.slice(0, 10).map(g => ({
            id: g.id,
            name: g.name,
            clause: g.clause,
            status: g.status,
          })),
        },
        roadmap,
      };
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
