// @ts-nocheck
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { autonomousInterventions, agenticAnalyses } from "../../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// ─── Intervention rules ───────────────────────────────────────────────────────
// Each rule defines: when it fires, what it does, and which bundle handles it.

export const INTERVENTION_RULES = [
  {
    id: "sentiment_drop",
    name: "Sentiment Drop Alert",
    description: "Fires when live sentiment score falls below 70%",
    threshold: 70,
    metric: "sentiment_score",
    severity: "warning" as const,
    bundle: "Investor Relations",
    action: "Agentic IR agent queues an audience poll and surfaces 3 re-engagement talking points for the presenter",
    icon: "TrendingDown",
    color: "amber",
  },
  {
    id: "qa_queue_overload",
    name: "Q&A Queue Overload",
    description: "Fires when pending Q&A queue exceeds 10 questions",
    threshold: 10,
    metric: "qa_queue_size",
    severity: "warning" as const,
    bundle: "Operations & Efficiency",
    action: "Auto-triage agent re-ranks queue by investor tier and flags top 3 for immediate moderator attention",
    icon: "MessageSquare",
    color: "blue",
  },
  {
    id: "compliance_risk",
    name: "Compliance Risk Detected",
    description: "Fires when a material statement triggers compliance flagging",
    threshold: 0.75,
    metric: "compliance_risk_score",
    severity: "critical" as const,
    bundle: "Compliance & Risk",
    action: "Compliance agent auto-redacts statement, creates timestamped FINRA audit log entry, and alerts legal team",
    icon: "ShieldAlert",
    color: "red",
  },
  {
    id: "sentiment_spike",
    name: "Positive Sentiment Spike",
    description: "Fires when sentiment rises by more than 15 points in 2 minutes",
    threshold: 15,
    metric: "sentiment_delta",
    severity: "info" as const,
    bundle: "Content & Marketing",
    action: "Social agent captures highlight clip and queues LinkedIn post draft for post-event distribution",
    icon: "TrendingUp",
    color: "emerald",
  },
  {
    id: "engagement_low",
    name: "Low Participant Engagement",
    description: "Fires when fewer than 60% of participants are in an active state",
    threshold: 60,
    metric: "active_participant_pct",
    severity: "warning" as const,
    bundle: "Operations & Efficiency",
    action: "Operations agent launches a live poll and notifies the moderator to request verbal engagement from key investors",
    icon: "Users",
    color: "blue",
  },
  {
    id: "high_score_briefing",
    name: "High-Value Event Detected",
    description: "Fires when Brain confidence score exceeds 85% — signals peak-value event",
    threshold: 0.85,
    metric: "brain_confidence_score",
    severity: "info" as const,
    bundle: "Premium All-Access",
    action: "Executive agent generates a real-time ROI briefing and activates all Premium bundle features automatically",
    icon: "Sparkles",
    color: "violet",
  },
];

// ─── Router ───────────────────────────────────────────────────────────────────

export const autonomousInterventionRouter = router({

  getRules: publicProcedure.query(() => {
    return INTERVENTION_RULES;
  }),

  getActive: publicProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        const rows = await db
          .select()
          .from(autonomousInterventions)
          .where(eq(autonomousInterventions.acknowledged, false))
          .orderBy(desc(autonomousInterventions.createdAt))
          .limit(20);
        return rows;
      } catch {
        return [];
      }
    }),

  getHistory: publicProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        const rows = await db
          .select()
          .from(autonomousInterventions)
          .orderBy(desc(autonomousInterventions.createdAt))
          .limit(input.limit);
        return rows;
      } catch {
        return [];
      }
    }),

  trigger: publicProcedure
    .input(z.object({
      ruleId: z.string(),
      eventId: z.string().optional(),
      conferenceId: z.string().optional(),
      triggerValue: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const rule = INTERVENTION_RULES.find(r => r.id === input.ruleId);
      if (!rule) throw new Error("Unknown rule");

      try {
        const db = await getDb();
        const [inserted] = await db.insert(autonomousInterventions).values({
          eventId: input.eventId ?? null,
          conferenceId: input.conferenceId ?? null,
          ruleId: rule.id,
          ruleName: rule.name,
          triggerValue: input.triggerValue ?? rule.threshold,
          threshold: rule.threshold,
          severity: rule.severity,
          bundleTriggered: rule.bundle,
          actionTaken: rule.action,
          acknowledged: false,
        }).returning();
        return { success: true, id: inserted?.id ?? null };
      } catch {
        return { success: false };
      }
    }),

  acknowledge: publicProcedure
    .input(z.object({ id: z.number(), outcome: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        await db
          .update(autonomousInterventions)
          .set({ acknowledged: true, acknowledgedAt: new Date(), outcome: input.outcome ?? null })
          .where(eq(autonomousInterventions.id, input.id));
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  getStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      const all = await db.select().from(autonomousInterventions);
      const total = all.length;
      const acknowledged = all.filter(r => r.acknowledged).length;
      const critical = all.filter(r => r.severity === "critical").length;
      const byRule: Record<string, number> = {};
      for (const row of all) {
        byRule[row.ruleId] = (byRule[row.ruleId] ?? 0) + 1;
      }
      return { total, acknowledged, pending: total - acknowledged, critical, byRule };
    } catch {
      return { total: 0, acknowledged: 0, pending: 0, critical: 0, byRule: {} };
    }
  }),

  getMemoryForBrain: publicProcedure
    .input(z.object({ bundleLetter: z.string(), q1Role: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        const past = await db
          .select()
          .from(agenticAnalyses)
          .where(eq(agenticAnalyses.bundleLetter, input.bundleLetter))
          .orderBy(desc(agenticAnalyses.createdAt))
          .limit(20);

        if (past.length === 0) return null;

        const avgScore = past.reduce((s, r) => s + r.score, 0) / past.length;
        const maxScore = Math.max(...past.map(r => r.score));
        const topRoles = past.map(r => r.q1Role).reduce((acc: Record<string, number>, r) => {
          acc[r] = (acc[r] ?? 0) + 1; return acc;
        }, {});
        const topChallenge = past.map(r => r.q2Challenge).reduce((acc: Record<string, number>, c) => {
          acc[c] = (acc[c] ?? 0) + 1; return acc;
        }, {});
        const topEvent = past.map(r => r.q3EventType).reduce((acc: Record<string, number>, e) => {
          acc[e] = (acc[e] ?? 0) + 1; return acc;
        }, {});

        const dominantChallenge = Object.entries(topChallenge).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "engagement";
        const dominantEvent = Object.entries(topEvent).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "earnings";

        return {
          analysisCount: past.length,
          avgScore: parseFloat(avgScore.toFixed(3)),
          peakScore: maxScore,
          dominantChallenge,
          dominantEvent,
          lastRun: past[0]?.createdAt ?? null,
          insight: `This bundle has been analysed ${past.length} time${past.length > 1 ? "s" : ""}. Average confidence: ${Math.round(avgScore * 100)}%. Peak: ${Math.round(maxScore * 100)}%. Most common challenge: ${dominantChallenge.replace("_", " ")}. Most common event: ${dominantEvent.replace("_", " ")}.`,
        };
      } catch {
        return null;
      }
    }),
});
