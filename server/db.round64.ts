/**
 * Round 64 Database Helpers
 * Alert Escalation, Predictive Maintenance, Alert Correlation
 */
import { db } from "@/server/_core";
import {
  alertEscalationRules,
  maintenancePredictions,
  alertCorrelations,
} from "@/drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Alert Escalation Rules
 */
export async function createEscalationRule(
  kioskId: string,
  eventId: string,
  ruleName: string,
  triggerCondition: string,
  escalationSteps: any[],
  userId: number
) {
  const result = await db.insert(alertEscalationRules).values({
    kioskId,
    eventId,
    ruleName,
    triggerCondition,
    escalationSteps: JSON.stringify(escalationSteps),
    createdBy: userId,
    isActive: true,
    createdAt: new Date(),
  });
  return result;
}

export async function getEscalationRules(kioskId: string, eventId: string) {
  return db
    .select()
    .from(alertEscalationRules)
    .where(
      and(
        eq(alertEscalationRules.kioskId, kioskId),
        eq(alertEscalationRules.eventId, eventId),
        eq(alertEscalationRules.isActive, true)
      )
    );
}

export async function updateEscalationRule(
  ruleId: number,
  updates: Record<string, any>
) {
  return db
    .update(alertEscalationRules)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(alertEscalationRules.id, ruleId));
}

export async function deleteEscalationRule(ruleId: number) {
  return db
    .update(alertEscalationRules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(alertEscalationRules.id, ruleId));
}

export async function triggerEscalation(
  ruleId: number,
  alertId: number,
  currentStep: number
) {
  const rule = await db
    .select()
    .from(alertEscalationRules)
    .where(eq(alertEscalationRules.id, ruleId))
    .limit(1);

  if (!rule.length) return null;

  const steps = JSON.parse(rule[0].escalationSteps);
  return steps[currentStep] || null;
}

/**
 * Predictive Maintenance
 */
export async function createMaintenancePrediction(
  kioskId: string,
  eventId: string,
  predictedIssue: string,
  confidence: number,
  predictedTime: Date,
  recommendedAction: string,
  modelVersion: string
) {
  const result = await db.insert(maintenancePredictions).values({
    kioskId,
    eventId,
    predictedIssue,
    confidence,
    predictedTime,
    recommendedAction,
    modelVersion,
    status: "pending",
    createdAt: new Date(),
  });
  return result;
}

export async function getPendingPredictions(kioskId: string, eventId: string) {
  return db
    .select()
    .from(maintenancePredictions)
    .where(
      and(
        eq(maintenancePredictions.kioskId, kioskId),
        eq(maintenancePredictions.eventId, eventId),
        eq(maintenancePredictions.status, "pending")
      )
    )
    .orderBy(desc(maintenancePredictions.confidence));
}

export async function updatePredictionStatus(
  predictionId: number,
  status: "pending" | "scheduled" | "completed" | "dismissed",
  notes?: string
) {
  return db
    .update(maintenancePredictions)
    .set({ status, notes, updatedAt: new Date() })
    .where(eq(maintenancePredictions.id, predictionId));
}

export async function getMaintenanceHistory(
  kioskId: string,
  eventId: string,
  limit: number = 20
) {
  return db
    .select()
    .from(maintenancePredictions)
    .where(
      and(
        eq(maintenancePredictions.kioskId, kioskId),
        eq(maintenancePredictions.eventId, eventId)
      )
    )
    .orderBy(desc(maintenancePredictions.createdAt))
    .limit(limit);
}

export async function calculatePredictionAccuracy(
  modelVersion: string,
  timeWindow: { start: Date; end: Date }
) {
  const predictions = await db
    .select()
    .from(maintenancePredictions)
    .where(
      and(
        eq(maintenancePredictions.modelVersion, modelVersion),
        gte(maintenancePredictions.createdAt, timeWindow.start),
        lte(maintenancePredictions.createdAt, timeWindow.end)
      )
    );

  const completed = predictions.filter((p) => p.status === "completed");
  const accuracy =
    predictions.length > 0 ? (completed.length / predictions.length) * 100 : 0;

  return { total: predictions.length, completed: completed.length, accuracy };
}

/**
 * Alert Correlations
 */
export async function createAlertCorrelation(
  kioskIds: string[],
  eventId: string,
  correlationType: string,
  severity: "low" | "medium" | "high" | "critical",
  description: string,
  relatedAlerts: number[]
) {
  const result = await db.insert(alertCorrelations).values({
    kioskIds: JSON.stringify(kioskIds),
    eventId,
    correlationType,
    severity,
    description,
    relatedAlerts: JSON.stringify(relatedAlerts),
    status: "active",
    createdAt: new Date(),
  });
  return result;
}

export async function getActiveCorrelations(eventId: string) {
  return db
    .select()
    .from(alertCorrelations)
    .where(
      and(
        eq(alertCorrelations.eventId, eventId),
        eq(alertCorrelations.status, "active")
      )
    )
    .orderBy(desc(alertCorrelations.severity));
}

export async function getCorrelationsByKiosk(kioskId: string, eventId: string) {
  const correlations = await db
    .select()
    .from(alertCorrelations)
    .where(eq(alertCorrelations.eventId, eventId));

  return correlations.filter((c) => {
    const kioskIds = JSON.parse(c.kioskIds);
    return kioskIds.includes(kioskId);
  });
}

export async function resolveCorrelation(
  correlationId: number,
  resolution: string
) {
  return db
    .update(alertCorrelations)
    .set({ status: "resolved", resolution, updatedAt: new Date() })
    .where(eq(alertCorrelations.id, correlationId));
}

export async function getCorrelationStatistics(eventId: string) {
  const correlations = await db
    .select()
    .from(alertCorrelations)
    .where(eq(alertCorrelations.eventId, eventId));

  const bySeverity = {
    critical: correlations.filter((c) => c.severity === "critical").length,
    high: correlations.filter((c) => c.severity === "high").length,
    medium: correlations.filter((c) => c.severity === "medium").length,
    low: correlations.filter((c) => c.severity === "low").length,
  };

  const byType = correlations.reduce(
    (acc, c) => {
      acc[c.correlationType] = (acc[c.correlationType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const resolved = correlations.filter((c) => c.status === "resolved").length;
  const active = correlations.filter((c) => c.status === "active").length;

  return {
    total: correlations.length,
    bySeverity,
    byType,
    resolved,
    active,
    resolutionRate: correlations.length > 0 ? (resolved / correlations.length) * 100 : 0,
  };
}

export async function detectSystemicIssues(eventId: string, threshold: number = 3) {
  const correlations = await db
    .select()
    .from(alertCorrelations)
    .where(
      and(
        eq(alertCorrelations.eventId, eventId),
        eq(alertCorrelations.status, "active")
      )
    );

  const kioskIssueCount: Record<string, number> = {};

  correlations.forEach((c) => {
    const kioskIds = JSON.parse(c.kioskIds);
    kioskIds.forEach((id: string) => {
      kioskIssueCount[id] = (kioskIssueCount[id] || 0) + 1;
    });
  });

  return Object.entries(kioskIssueCount)
    .filter(([_, count]) => count >= threshold)
    .map(([kioskId, count]) => ({
      kioskId,
      issueCount: count,
      severity: count >= 5 ? "critical" : count >= 3 ? "high" : "medium",
    }));
}
