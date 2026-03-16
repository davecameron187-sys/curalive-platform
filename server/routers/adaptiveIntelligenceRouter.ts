// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { operatorCorrections, taggedMetrics, complianceVocabulary, adaptiveThresholds } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const DEFAULT_THRESHOLDS = {
  sentiment_positive: 70,
  sentiment_neutral: 50,
  compliance_high: 3,
  compliance_moderate: 1,
  engagement_high: 20,
  engagement_moderate: 5,
};

async function getAdaptiveThreshold(
  metricType: "sentiment" | "compliance" | "engagement",
  level: string,
  eventType?: string
): Promise<number> {
  const db = await getDb();
  const key = eventType ? `${metricType}_${level}_${eventType}` : `${metricType}_${level}`;
  const defaultKey = `${metricType}_${level}` as keyof typeof DEFAULT_THRESHOLDS;

  const [row] = await db
    .select()
    .from(adaptiveThresholds)
    .where(eq(adaptiveThresholds.thresholdKey, key))
    .limit(1);

  if (row && row.sampleCount! >= 3) {
    return row.learnedValue;
  }

  return DEFAULT_THRESHOLDS[defaultKey] ?? 50;
}

async function recalculateThreshold(
  metricType: "sentiment" | "compliance" | "engagement",
  level: string,
  eventType: string | null
) {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  const correctionTypeMap: Record<string, string[]> = {
    sentiment: ["sentiment_override"],
    compliance: ["compliance_dismiss"],
    engagement: ["severity_change"],
  };

  const types = correctionTypeMap[metricType] ?? [];
  if (types.length === 0) return;

  const placeholders = types.map(() => "?").join(",");
  let query = `SELECT AVG(corrected_value) as avg_corrected, COUNT(*) as cnt 
               FROM operator_corrections 
               WHERE correction_type IN (${placeholders}) AND corrected_value IS NOT NULL`;
  const params: any[] = [...types];

  if (eventType) {
    query += ` AND event_type = ?`;
    params.push(eventType);
  }

  const [rows] = await conn.execute(query, params);
  const row = (rows as any[])[0];

  if (!row || row.cnt < 1 || row.avg_corrected == null) return;

  const key = eventType ? `${metricType}_${level}_${eventType}` : `${metricType}_${level}`;
  const defaultKey = `${metricType}_${level}` as keyof typeof DEFAULT_THRESHOLDS;
  const defaultVal = DEFAULT_THRESHOLDS[defaultKey] ?? 50;

  const sampleCount = Number(row.cnt);
  const avgCorrected = Number(row.avg_corrected);
  const weight = Math.min(sampleCount / 10, 0.8);
  const learnedValue = Math.round(defaultVal * (1 - weight) + avgCorrected * weight);

  await conn.execute(
    `INSERT INTO adaptive_thresholds (threshold_key, event_type, metric_type, default_value, learned_value, sample_count, last_correction_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE learned_value = ?, sample_count = ?, last_correction_at = NOW()`,
    [key, eventType, metricType, defaultVal, learnedValue, sampleCount, learnedValue, sampleCount]
  );

  return { key, defaultVal, learnedValue, sampleCount, weight };
}

export { getAdaptiveThreshold };

export const adaptiveIntelligenceRouter = router({
  submitCorrection: publicProcedure
    .input(z.object({
      eventId: z.string(),
      eventTitle: z.string().optional(),
      metricId: z.number().optional(),
      correctionType: z.enum(["sentiment_override", "compliance_dismiss", "compliance_add", "severity_change", "threshold_adjust"]),
      originalValue: z.number().optional(),
      correctedValue: z.number().optional(),
      originalLabel: z.string().optional(),
      correctedLabel: z.string().optional(),
      reason: z.string().optional(),
      eventType: z.string().optional(),
      clientName: z.string().optional(),
      dismissedKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      await db.insert(operatorCorrections).values({
        eventId: input.eventId,
        eventTitle: input.eventTitle ?? null,
        metricId: input.metricId ?? null,
        correctionType: input.correctionType,
        originalValue: input.originalValue ?? null,
        correctedValue: input.correctedValue ?? null,
        originalLabel: input.originalLabel ?? null,
        correctedLabel: input.correctedLabel ?? null,
        reason: input.reason ?? null,
        eventType: input.eventType ?? null,
        clientName: input.clientName ?? null,
      });

      if (input.metricId && input.correctedValue != null) {
        await db.update(taggedMetrics)
          .set({
            metricValue: input.correctedValue,
            label: input.correctedLabel ?? undefined,
            source: "operator-corrected",
          })
          .where(eq(taggedMetrics.id, input.metricId));
      }

      if (input.correctionType === "compliance_dismiss" && input.dismissedKeywords) {
        const conn = (db as any).session?.client ?? (db as any).$client;
        for (const keyword of input.dismissedKeywords) {
          await conn.execute(
            `UPDATE compliance_vocabulary 
             SET times_dismissed = times_dismissed + 1, 
                 effective_weight = GREATEST(0.1, severity_weight * (1 - (times_dismissed + 1) / (times_flagged + times_dismissed + 2)))
             WHERE keyword = ?`,
            [keyword.toLowerCase().trim()]
          );
        }
      }

      if (input.correctionType === "compliance_add" && input.correctedLabel) {
        const conn = (db as any).session?.client ?? (db as any).$client;
        await conn.execute(
          `INSERT INTO compliance_vocabulary (keyword, source, severity_weight, effective_weight, added_by)
           VALUES (?, 'operator', 1.0, 1.0, 'operator')
           ON DUPLICATE KEY UPDATE times_flagged = times_flagged + 1, active = 1`,
          [input.correctedLabel.toLowerCase().trim()]
        );
      }

      let thresholdUpdate = null;
      if (input.correctionType === "sentiment_override" && input.correctedValue != null) {
        thresholdUpdate = await recalculateThreshold("sentiment", "positive", input.eventType ?? null);
      } else if (input.correctionType === "compliance_dismiss") {
        thresholdUpdate = await recalculateThreshold("compliance", "high", input.eventType ?? null);
      }

      return {
        success: true,
        message: "Correction recorded. The AI will use this to improve future analysis.",
        thresholdUpdate,
      };
    }),

  getCorrections: publicProcedure
    .input(z.object({
      eventId: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = input.eventId ? eq(operatorCorrections.eventId, input.eventId) : undefined;
      return db.select()
        .from(operatorCorrections)
        .where(conditions)
        .orderBy(desc(operatorCorrections.createdAt))
        .limit(input.limit);
    }),

  getAdaptiveThresholds: publicProcedure.query(async () => {
    const db = await getDb();
    const thresholds = await db.select().from(adaptiveThresholds).orderBy(adaptiveThresholds.thresholdKey);

    return {
      defaults: DEFAULT_THRESHOLDS,
      learned: thresholds,
      summary: thresholds.map(t => ({
        key: t.thresholdKey,
        default: t.defaultValue,
        learned: t.learnedValue,
        samples: t.sampleCount,
        drift: t.learnedValue - t.defaultValue,
        driftPercent: ((t.learnedValue - t.defaultValue) / t.defaultValue * 100).toFixed(1) + "%",
      })),
    };
  }),

  getComplianceVocabulary: publicProcedure.query(async () => {
    const db = await getDb();
    return db.select()
      .from(complianceVocabulary)
      .orderBy(desc(complianceVocabulary.effectiveWeight));
  }),

  addComplianceKeyword: publicProcedure
    .input(z.object({
      keyword: z.string().min(2).max(100),
      sector: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const conn = (db as any).session?.client ?? (db as any).$client;
      await conn.execute(
        `INSERT INTO compliance_vocabulary (keyword, source, severity_weight, effective_weight, sector, added_by)
         VALUES (?, 'operator', 1.0, 1.0, ?, 'operator')
         ON DUPLICATE KEY UPDATE active = 1, source = 'operator'`,
        [input.keyword.toLowerCase().trim(), input.sector ?? null]
      );
      return { success: true, message: `"${input.keyword}" added to compliance vocabulary.` };
    }),

  toggleComplianceKeyword: publicProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(complianceVocabulary)
        .set({ active: input.active ? 1 : 0 })
        .where(eq(complianceVocabulary.id, input.id));
      return { success: true };
    }),

  getLearningStats: publicProcedure.query(async () => {
    const db = await getDb();
    const conn = (db as any).session?.client ?? (db as any).$client;

    const [correctionRows] = await conn.execute(
      `SELECT correction_type, COUNT(*) as cnt FROM operator_corrections GROUP BY correction_type`
    );
    const [totalRow] = await conn.execute(
      `SELECT COUNT(*) as total FROM operator_corrections`
    );
    const [vocabRow] = await conn.execute(
      `SELECT 
         COUNT(*) as total_keywords,
         SUM(CASE WHEN source = 'operator' THEN 1 ELSE 0 END) as operator_added,
         SUM(CASE WHEN source = 'learned' THEN 1 ELSE 0 END) as ai_learned,
         SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as deactivated
       FROM compliance_vocabulary`
    );
    const [thresholdRow] = await conn.execute(
      `SELECT COUNT(*) as adapted FROM adaptive_thresholds WHERE sample_count >= 3`
    );

    const correctionsByType: Record<string, number> = {};
    for (const r of correctionRows as any[]) {
      correctionsByType[r.correction_type] = Number(r.cnt);
    }

    const vocab = (vocabRow as any[])[0] ?? {};
    const totalCorrections = Number((totalRow as any[])[0]?.total ?? 0);
    const adaptedThresholds = Number((thresholdRow as any[])[0]?.adapted ?? 0);

    return {
      totalCorrections,
      correctionsByType,
      vocabularyStats: {
        totalKeywords: Number(vocab.total_keywords ?? 0),
        operatorAdded: Number(vocab.operator_added ?? 0),
        aiLearned: Number(vocab.ai_learned ?? 0),
        deactivated: Number(vocab.deactivated ?? 0),
      },
      adaptedThresholds,
      maturityLevel: totalCorrections === 0 ? "Initialising" :
        totalCorrections < 10 ? "Learning" :
        totalCorrections < 50 ? "Adapting" :
        totalCorrections < 200 ? "Calibrated" : "Self-Evolving",
      maturityScore: Math.min(100, Math.round(
        (totalCorrections * 2) +
        (Number(vocab.operator_added ?? 0) * 5) +
        (adaptedThresholds * 10)
      )),
    };
  }),
});
