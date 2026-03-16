/**
 * Alert Management Database Helpers
 * Round 63 Features: Alert Suppression, Root Cause Analysis, Custom Thresholds
 */
import { db } from "./db";
import {
  alertSuppressionRules,
  alertThresholds,
  rootCauseAnalysis,
  networkAnomalies,
} from "@/drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Alert Suppression Rules Helpers
 */
export async function createSuppressionRule(
  kioskId: string,
  eventId: string,
  ruleName: string,
  anomalyType: string,
  suppressionType: "time_based" | "condition_based" | "threshold_based",
  createdBy: number,
  options?: {
    startTime?: Date;
    endTime?: Date;
    conditions?: Record<string, any>;
  }
) {
  const result = await db.insert(alertSuppressionRules).values({
    kioskId,
    eventId,
    ruleName,
    anomalyType,
    suppressionType,
    startTime: options?.startTime,
    endTime: options?.endTime,
    conditions: options?.conditions,
    createdBy,
  });
  return result;
}

export async function getSuppressionRules(kioskId: string, eventId: string) {
  return db
    .select()
    .from(alertSuppressionRules)
    .where(
      and(
        eq(alertSuppressionRules.kioskId, kioskId),
        eq(alertSuppressionRules.eventId, eventId),
        eq(alertSuppressionRules.isActive, true)
      )
    );
}

export async function updateSuppressionRule(
  ruleId: number,
  updates: Partial<{
    ruleName: string;
    startTime: Date;
    endTime: Date;
    conditions: Record<string, any>;
    isActive: boolean;
  }>
) {
  return db
    .update(alertSuppressionRules)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(alertSuppressionRules.id, ruleId));
}

export async function deleteSuppressionRule(ruleId: number) {
  return db
    .update(alertSuppressionRules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(alertSuppressionRules.id, ruleId));
}

export async function shouldSuppressAlert(
  kioskId: string,
  eventId: string,
  anomalyType: string,
  metricValue?: number
): Promise<boolean> {
  const rules = await getSuppressionRules(kioskId, eventId);

  for (const rule of rules) {
    if (rule.anomalyType !== anomalyType) continue;

    if (rule.suppressionType === "time_based") {
      const now = new Date();
      if (rule.startTime && rule.endTime) {
        if (now >= rule.startTime && now <= rule.endTime) {
          return true;
        }
      }
    }

    if (rule.suppressionType === "condition_based" && rule.conditions) {
      // Evaluate conditions (simplified logic)
      return true;
    }

    if (rule.suppressionType === "threshold_based" && metricValue !== undefined) {
      const conditions = rule.conditions as any;
      if (
        conditions?.maxValue &&
        metricValue <= conditions.maxValue
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Alert Thresholds Helpers
 */
export async function createAlertThreshold(
  kioskId: string,
  eventId: string,
  metricType: string,
  warningThreshold: number,
  criticalThreshold: number,
  unit: string,
  createdBy: number
) {
  return db.insert(alertThresholds).values({
    kioskId,
    eventId,
    metricType,
    warningThreshold,
    criticalThreshold,
    unit,
    createdBy,
  });
}

export async function getAlertThresholds(kioskId: string, eventId: string) {
  return db
    .select()
    .from(alertThresholds)
    .where(
      and(
        eq(alertThresholds.kioskId, kioskId),
        eq(alertThresholds.eventId, eventId),
        eq(alertThresholds.isEnabled, true)
      )
    );
}

export async function getThresholdForMetric(
  kioskId: string,
  eventId: string,
  metricType: string
) {
  const result = await db
    .select()
    .from(alertThresholds)
    .where(
      and(
        eq(alertThresholds.kioskId, kioskId),
        eq(alertThresholds.eventId, eventId),
        eq(alertThresholds.metricType, metricType),
        eq(alertThresholds.isEnabled, true)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function updateAlertThreshold(
  thresholdId: number,
  updates: Partial<{
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
    isEnabled: boolean;
  }>
) {
  return db
    .update(alertThresholds)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(alertThresholds.id, thresholdId));
}

export async function deleteAlertThreshold(thresholdId: number) {
  return db
    .update(alertThresholds)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(eq(alertThresholds.id, thresholdId));
}

/**
 * Root Cause Analysis Helpers
 */
export async function createRootCauseAnalysis(
  anomalyId: number,
  kioskId: string,
  eventId: string,
  rootCause: string,
  confidence: number,
  relatedEvents?: string[],
  remediation?: string
) {
  return db.insert(rootCauseAnalysis).values({
    anomalyId,
    kioskId,
    eventId,
    rootCause,
    confidence,
    relatedEvents: relatedEvents || [],
    remediation,
  });
}

export async function getRootCauseAnalysis(anomalyId: number) {
  const result = await db
    .select()
    .from(rootCauseAnalysis)
    .where(eq(rootCauseAnalysis.anomalyId, anomalyId))
    .limit(1);

  return result[0] || null;
}

export async function getRecentRootCauseAnalyses(
  kioskId: string,
  eventId: string,
  limit: number = 10
) {
  return db
    .select()
    .from(rootCauseAnalysis)
    .where(
      and(
        eq(rootCauseAnalysis.kioskId, kioskId),
        eq(rootCauseAnalysis.eventId, eventId)
      )
    )
    .orderBy(desc(rootCauseAnalysis.createdAt))
    .limit(limit);
}

export async function verifyRootCauseAnalysis(
  analysisId: number,
  verifiedBy: number
) {
  return db
    .update(rootCauseAnalysis)
    .set({
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(rootCauseAnalysis.id, analysisId));
}

export async function getVerifiedRootCauses(
  kioskId: string,
  eventId: string
) {
  return db
    .select()
    .from(rootCauseAnalysis)
    .where(
      and(
        eq(rootCauseAnalysis.kioskId, kioskId),
        eq(rootCauseAnalysis.eventId, eventId),
        eq(rootCauseAnalysis.isVerified, true)
      )
    )
    .orderBy(desc(rootCauseAnalysis.confidence));
}

/**
 * Alert Severity Assessment
 */
export async function assessAlertSeverity(
  kioskId: string,
  eventId: string,
  metricType: string,
  metricValue: number
): Promise<"low" | "medium" | "high" | "critical"> {
  const threshold = await getThresholdForMetric(
    kioskId,
    eventId,
    metricType
  );

  if (!threshold) {
    return "medium"; // Default severity if no threshold
  }

  if (metricValue >= threshold.criticalThreshold) {
    return "critical";
  } else if (metricValue >= threshold.warningThreshold) {
    return "high";
  } else if (metricValue >= threshold.warningThreshold * 0.7) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Get Alert Statistics
 */
export async function getAlertStatistics(
  kioskId: string,
  eventId: string,
  timeRange: { startTime: Date; endTime: Date }
) {
  const anomalies = await db
    .select()
    .from(networkAnomalies)
    .where(
      and(
        eq(networkAnomalies.kioskId, kioskId),
        eq(networkAnomalies.eventId, eventId),
        gte(networkAnomalies.detectedAt, timeRange.startTime),
        lte(networkAnomalies.detectedAt, timeRange.endTime)
      )
    );

  const bySeverity = {
    low: anomalies.filter((a) => a.severity === "low").length,
    medium: anomalies.filter((a) => a.severity === "medium").length,
    high: anomalies.filter((a) => a.severity === "high").length,
    critical: anomalies.filter((a) => a.severity === "critical").length,
  };

  const byType = anomalies.reduce(
    (acc, a) => {
      acc[a.anomalyType] = (acc[a.anomalyType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const resolved = anomalies.filter((a) => a.isResolved).length;
  const unresolved = anomalies.length - resolved;

  return {
    total: anomalies.length,
    bySeverity,
    byType,
    resolved,
    unresolved,
    resolutionRate: anomalies.length > 0 ? (resolved / anomalies.length) * 100 : 0,
  };
}
