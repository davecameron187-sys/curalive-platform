// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { evolutionAuditLog, capabilityRoadmap, aiToolProposals } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { invokeLLM } from "../_core/llm";

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export async function logEvolutionAction(
  actionType: string,
  proposalId: number | null,
  proposalTitle: string,
  details: any
) {
  const db = await getDb();

  const [lastEntry] = await db.select({ blockchainHash: evolutionAuditLog.blockchainHash })
    .from(evolutionAuditLog).orderBy(desc(evolutionAuditLog.createdAt)).limit(1);

  const previousHash = lastEntry?.blockchainHash ?? "GENESIS";
  const blockchainHash = sha256(JSON.stringify({ actionType, proposalId, proposalTitle, details, previousHash, timestamp: Date.now() }));

  await db.insert(evolutionAuditLog).values({
    actionType: actionType as any,
    proposalId,
    proposalTitle,
    details,
    blockchainHash,
    previousHash,
  });

  return { blockchainHash, previousHash };
}

export async function shadowTestProposal(proposalId: number) {
  const db = await getDb();

  const [proposal] = await db.select().from(aiToolProposals).where(eq(aiToolProposals.id, proposalId)).limit(1);
  if (!proposal) throw new Error("Proposal not found");

  await logEvolutionAction("shadow_test_started", proposalId, proposal.title, { status: "testing" });

  try {
    const [archiveRows] = await rawSql(
      `SELECT id, client_name, event_name, event_type, transcript_text, sentiment_avg
       FROM archive_events WHERE status = 'completed' ORDER BY created_at DESC LIMIT 10`
    );
    const testEvents = archiveRows as any[];

    if (testEvents.length < 3) {
      await logEvolutionAction("shadow_test_failed", proposalId, proposal.title, {
        reason: "Insufficient historical data — need at least 3 completed events",
        eventsAvailable: testEvents.length,
      });
      return { passed: false, reason: "Insufficient historical data for shadow testing" };
    }

    const testResults = [];
    for (const event of testEvents.slice(0, 10)) {
      const resp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: proposal.promptTemplate ?? `You are a specialised AI tool: "${proposal.title}". ${proposal.description}. Analyse the following transcript and produce actionable output.`,
          },
          { role: "user", content: `Event: ${event.event_name} (${event.client_name})\n\n${(event.transcript_text ?? "").slice(0, 4000)}` },
        ],
        model: "gpt-4o-mini",
      });
      const output = resp.choices?.[0]?.message?.content?.trim() ?? "";
      const qualityScore = output.length > 100 ? Math.min(1, output.length / 1000) : 0.2;
      testResults.push({ eventId: event.id, eventName: event.event_name, outputLength: output.length, qualityScore });
    }

    const avgQuality = testResults.reduce((s, r) => s + r.qualityScore, 0) / testResults.length;
    const passed = avgQuality >= 0.4 && testResults.length >= 3;

    await logEvolutionAction(
      passed ? "shadow_test_passed" : "shadow_test_failed",
      proposalId, proposal.title,
      { avgQuality, testCount: testResults.length, results: testResults }
    );

    if (passed) {
      await db.update(aiToolProposals).set({ status: "approved" }).where(eq(aiToolProposals.id, proposalId));
      await logEvolutionAction("tool_deployed", proposalId, proposal.title, { avgQuality });
    }

    return { passed, avgQuality, testCount: testResults.length, results: testResults };
  } catch (err) {
    await logEvolutionAction("shadow_test_failed", proposalId, proposal.title, { error: String(err) });
    throw err;
  }
}

export async function generateCapabilityRoadmap() {
  const db = await getDb();

  const proposals = await db.select().from(aiToolProposals).orderBy(desc(aiToolProposals.evidenceCount)).limit(20);

  const resp = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are CuraLive's Capability Roadmap Planner. Based on the tool proposals and their evidence scores, predict which capabilities will be needed in 30, 60, and 90 days.

Return ONLY valid JSON array:
[{
  "timeframe": "30_days|60_days|90_days",
  "capability": "Specific capability name",
  "rationale": "Why this will be needed",
  "gapScore": <0-1>,
  "priority": "low|medium|high|critical"
}]`
      },
      {
        role: "user",
        content: `Current proposals:\n${JSON.stringify(proposals.map(p => ({
          title: p.title, category: p.category, evidence: p.evidenceCount,
          impact: p.estimatedImpact, status: p.status, confidence: p.avgConfidence,
        })), null, 2)}`
      },
    ],
    model: "gpt-4o-mini",
  });

  const raw = (resp.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const roadmapItems = JSON.parse(cleaned);

  await db.delete(capabilityRoadmap).where(sql`1=1`);

  for (const item of roadmapItems) {
    await db.insert(capabilityRoadmap).values({
      timeframe: item.timeframe ?? "30_days",
      capability: item.capability ?? "Unknown",
      rationale: item.rationale ?? "",
      gapScore: item.gapScore ?? 0.5,
      priority: item.priority ?? "medium",
      status: "predicted",
    });
  }

  await logEvolutionAction("roadmap_updated", null, "Capability Roadmap", {
    itemCount: roadmapItems.length,
    timeframes: { "30_days": roadmapItems.filter((i: any) => i.timeframe === "30_days").length, "60_days": roadmapItems.filter((i: any) => i.timeframe === "60_days").length, "90_days": roadmapItems.filter((i: any) => i.timeframe === "90_days").length },
  });

  return roadmapItems;
}

export const evolutionAuditRouter = router({
  getAuditLog: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(evolutionAuditLog).orderBy(desc(evolutionAuditLog.createdAt)).limit(100);
  }),

  verifyChain: publicProcedure.query(async () => {
    const db = await getDb();
    const entries = await db.select().from(evolutionAuditLog).orderBy(evolutionAuditLog.createdAt).limit(1000);

    let valid = true;
    let brokenAt: number | null = null;
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].previousHash !== entries[i - 1].blockchainHash) {
        valid = false;
        brokenAt = entries[i].id;
        break;
      }
    }

    return { valid, totalEntries: entries.length, brokenAt };
  }),

  shadowTest: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(async ({ input }) => {
      return shadowTestProposal(input.proposalId);
    }),

  getRoadmap: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(capabilityRoadmap).orderBy(capabilityRoadmap.timeframe, desc(capabilityRoadmap.gapScore));
  }),

  generateRoadmap: publicProcedure.mutation(async () => {
    return generateCapabilityRoadmap();
  }),
});
