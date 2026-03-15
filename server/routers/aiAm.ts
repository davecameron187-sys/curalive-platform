// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { db } from "../db";
import { complianceViolations, alertHistory, alertPreferences, complianceDetectionStats } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import { detectViolation, createViolationAlert, acknowledgeViolation, getEventViolations, getUnacknowledgedViolations } from "../_core/compliance";
import { getAblyClient } from "../_core/ably";

/**
 * AI Automated Moderator (AI-AM) Router
 * Handles compliance violation detection, alerting, and operator management
 */
export const aiAmRouter = router({
  /**
   * Detect violations in a transcript segment and create alert if detected.
   * Called in real-time as transcripts are received from Recall.ai
   */
  detectAndAlert: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        conferenceId: z.string().optional(),
        transcriptExcerpt: z.string(),
        speakerName: z.string().optional(),
        speakerRole: z.string().optional(),
        startTimeMs: z.number().optional(),
        endTimeMs: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Detect violation using GPT-4
        const violation = await detectViolation(
          input.transcriptExcerpt,
          input.speakerName,
          input.speakerRole
        );

        if (!violation) {
          return { detected: false, violationId: null };
        }

        // Create alert in database
        const result = await createViolationAlert(
          input.eventId,
          input.conferenceId,
          violation,
          input.speakerName,
          input.speakerRole,
          input.transcriptExcerpt,
          input.startTimeMs,
          input.endTimeMs
        );

        const violationId = Number(result.insertId);

        // Broadcast alert via Ably in real-time
        const ably = getAblyClient();
        const channel = ably.channels.get(`aiAm:alerts:${input.eventId}`);
        await channel.publish("violation_detected", {
          violationId,
          eventId: input.eventId,
          violationType: violation.violationType,
          severity: violation.severity,
          confidenceScore: violation.confidenceScore,
          speakerName: input.speakerName,
          speakerRole: input.speakerRole,
          transcriptExcerpt: input.transcriptExcerpt,
          startTimeMs: input.startTimeMs,
          detectedAt: new Date().toISOString(),
        });

        return {
          detected: true,
          violationId,
          violation,
        };
      } catch (error) {
        console.error("[AI-AM] Detection error:", error);
        throw error;
      }
    }),

  /**
   * Get all violations for an event with optional filtering
   */
  getViolations: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        violationType: z.string().optional(),
        acknowledged: z.boolean().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const query = db.query.complianceViolations.findMany({
          where: eq(complianceViolations.eventId, input.eventId),
          orderBy: [desc(complianceViolations.severity), desc(complianceViolations.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        // Apply filters
        const conditions = [eq(complianceViolations.eventId, input.eventId)];

        if (input.severity) {
          conditions.push(eq(complianceViolations.severity, input.severity));
        }

        if (input.violationType) {
          conditions.push(eq(complianceViolations.violationType, input.violationType as any));
        }

        if (input.acknowledged !== undefined) {
          conditions.push(eq(complianceViolations.acknowledged, input.acknowledged));
        }

        const violations = await db.query.complianceViolations.findMany({
          where: and(...conditions),
          orderBy: [desc(complianceViolations.severity), desc(complianceViolations.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        return violations;
      } catch (error) {
        console.error("[AI-AM] Query error:", error);
        return [];
      }
    }),

  /**
   * Get unacknowledged violations for an event (high priority)
   */
  getUnacknowledgedViolations: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getUnacknowledgedViolations(input.eventId);
      } catch (error) {
        console.error("[AI-AM] Query error:", error);
        return [];
      }
    }),

  /**
   * Acknowledge a violation alert (mark as reviewed by operator)
   */
  acknowledgeViolation: protectedProcedure
    .input(
      z.object({
        violationId: z.number(),
        eventId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await acknowledgeViolation(input.violationId, ctx.user.id, input.notes);

        // Broadcast acknowledgment via Ably
        const ably = getAblyClient();
        const channel = ably.channels.get(`aiAm:alerts:${input.eventId}`);
        await channel.publish("violation_acknowledged", {
          violationId: input.violationId,
          acknowledgedBy: ctx.user.name,
          acknowledgedAt: new Date().toISOString(),
          notes: input.notes,
        });

        return { success: true };
      } catch (error) {
        console.error("[AI-AM] Acknowledgment error:", error);
        throw error;
      }
    }),

  /**
   * Get operator alert preferences
   */
  getAlertPreferences: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const prefs = await db.query.alertPreferences.findFirst({
          where: and(
            eq(alertPreferences.operatorId, ctx.user.id),
            input.eventId ? eq(alertPreferences.eventId, input.eventId) : undefined
          ),
        });

        return (
          prefs || {
            enableAlerts: true,
            notificationMethod: "in_app",
            minSeverity: "medium",
            enabledViolationTypes: ["abuse", "forward_looking", "price_sensitive"],
          }
        );
      } catch (error) {
        console.error("[AI-AM] Preferences query error:", error);
        return null;
      }
    }),

  /**
   * Update operator alert preferences
   */
  updateAlertPreferences: protectedProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
        enableAlerts: z.boolean().optional(),
        notificationMethod: z.enum(["in_app", "email", "sms", "all"]).optional(),
        minSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
        enabledViolationTypes: z.array(z.string()).optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await db.query.alertPreferences.findFirst({
          where: and(
            eq(alertPreferences.operatorId, ctx.user.id),
            input.eventId ? eq(alertPreferences.eventId, input.eventId) : undefined
          ),
        });

        if (existing) {
          await db
            .update(alertPreferences)
            .set({
              enableAlerts: input.enableAlerts ?? existing.enableAlerts,
              notificationMethod: input.notificationMethod ?? existing.notificationMethod,
              minSeverity: input.minSeverity ?? existing.minSeverity,
              enabledViolationTypes: input.enabledViolationTypes
                ? JSON.stringify(input.enabledViolationTypes)
                : existing.enabledViolationTypes,
              quietHoursStart: input.quietHoursStart ?? existing.quietHoursStart,
              quietHoursEnd: input.quietHoursEnd ?? existing.quietHoursEnd,
              timezone: input.timezone ?? existing.timezone,
            })
            .where(eq(alertPreferences.id, existing.id));
        } else {
          await db.insert(alertPreferences).values({
            operatorId: ctx.user.id,
            eventId: input.eventId || null,
            enableAlerts: input.enableAlerts ?? true,
            notificationMethod: input.notificationMethod ?? "in_app",
            minSeverity: input.minSeverity ?? "medium",
            enabledViolationTypes: input.enabledViolationTypes
              ? JSON.stringify(input.enabledViolationTypes)
              : JSON.stringify(["abuse", "forward_looking", "price_sensitive"]),
            quietHoursStart: input.quietHoursStart || null,
            quietHoursEnd: input.quietHoursEnd || null,
            timezone: input.timezone || "UTC",
          });
        }

        return { success: true };
      } catch (error) {
        console.error("[AI-AM] Preferences update error:", error);
        throw error;
      }
    }),

  /**
   * Get compliance detection statistics for an event
   */
  getStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        const stats = await db.query.complianceDetectionStats.findFirst({
          where: eq(complianceDetectionStats.eventId, input.eventId),
          orderBy: [desc(complianceDetectionStats.recordedAt)],
        });

        if (!stats) {
          // Calculate stats from violations
          const violations = await getEventViolations(input.eventId);

          const byType: Record<string, number> = {};
          const bySeverity: Record<string, number> = {};
          let totalConfidence = 0;

          violations.forEach((v) => {
            byType[v.violationType] = (byType[v.violationType] || 0) + 1;
            bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
            totalConfidence += v.confidenceScore;
          });

          return {
            totalViolationsDetected: violations.length,
            violationsByType: byType,
            violationsBySeverity: bySeverity,
            avgConfidenceScore: violations.length > 0 ? totalConfidence / violations.length : 0,
          };
        }

        return {
          totalViolationsDetected: stats.totalViolationsDetected,
          violationsByType: stats.violationsByType ? JSON.parse(stats.violationsByType) : {},
          violationsBySeverity: stats.violationsBySeverity ? JSON.parse(stats.violationsBySeverity) : {},
          avgConfidenceScore: stats.avgConfidenceScore ? Number(stats.avgConfidenceScore) : 0,
          avgDetectionLatencyMs: stats.avgDetectionLatencyMs,
          falsePositiveRate: stats.falsePositiveRate ? Number(stats.falsePositiveRate) : 0,
        };
      } catch (error) {
        console.error("[AI-AM] Stats query error:", error);
        return null;
      }
    }),

  /**
   * Search violations by text
   */
  searchViolations: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        query: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        // Get all violations and filter by text match
        const violations = await getEventViolations(input.eventId, 1000);

        return violations
          .filter(
            (v) =>
              v.transcriptExcerpt.toLowerCase().includes(input.query.toLowerCase()) ||
              v.speakerName?.toLowerCase().includes(input.query.toLowerCase())
          )
          .slice(0, input.limit);
      } catch (error) {
        console.error("[AI-AM] Search error:", error);
        return [];
      }
    }),
});
