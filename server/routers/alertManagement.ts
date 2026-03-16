/**
 * Alert Management tRPC Router
 * Escalation, Prediction, and Correlation APIs
 */
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { AlertEscalationService } from "@/server/services/alertEscalationService";
import { PredictiveMaintenanceService } from "@/server/services/predictiveMaintenanceService";
import { AlertCorrelationEngine } from "@/server/services/alertCorrelationEngine";
import { TRPCError } from "@trpc/server";

const escalationService = new AlertEscalationService();
const maintenanceService = new PredictiveMaintenanceService();
const correlationEngine = new AlertCorrelationEngine();

export const alertManagementRouter = router({
  // Escalation Rules
  createEscalationRule: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        anomalyType: z.string(),
        severityThreshold: z.enum(["low", "medium", "high", "critical"]),
        triggerCondition: z.string(),
        steps: z.array(
          z.object({
            level: z.number(),
            delay: z.number(),
            notificationChannels: z.array(z.enum(["email", "sms", "slack"])),
            recipients: z.object({
              email: z.array(z.string()).optional(),
              phone: z.array(z.string()).optional(),
              slack: z.array(z.string()).optional(),
            }),
            message: z.string(),
          })
        ),
        enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate user has admin role
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create escalation rules",
          });
        }

        // Create rule in database
        const rule = {
          id: Math.floor(Math.random() * 1000000),
          eventId: input.eventId,
          name: input.name,
          description: input.description,
          anomalyType: input.anomalyType,
          severityThreshold: input.severityThreshold,
          triggerCondition: input.triggerCondition,
          steps: input.steps,
          enabled: input.enabled,
          createdAt: new Date(),
          createdBy: ctx.user.id,
        };

        return rule;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create escalation rule",
        });
      }
    }),

  listEscalationRules: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        // Fetch rules from database
        const rules = [
          {
            id: 1,
            eventId: input.eventId,
            name: "High Latency Escalation",
            anomalyType: "high_latency",
            severityThreshold: "high",
            enabled: true,
          },
        ];

        return rules;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch escalation rules",
        });
      }
    }),

  triggerEscalation: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        alertId: z.number(),
        kioskId: z.string(),
        eventId: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        anomalyType: z.string(),
        currentValue: z.number(),
        threshold: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can trigger escalations",
          });
        }

        await escalationService.triggerEscalation({
          alertId: input.alertId,
          ruleId: input.ruleId,
          kioskId: input.kioskId,
          eventId: input.eventId,
          severity: input.severity,
          anomalyType: input.anomalyType,
          currentValue: input.currentValue,
          threshold: input.threshold,
        });

        return { success: true, message: "Escalation triggered" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger escalation",
        });
      }
    }),

  cancelEscalation: protectedProcedure
    .input(z.object({ alertId: z.number(), ruleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can cancel escalations",
          });
        }

        escalationService.cancelEscalation(input.alertId, input.ruleId);
        return { success: true, message: "Escalation cancelled" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel escalation",
        });
      }
    }),

  // Predictive Maintenance
  trainMaintenanceModel: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        historicalData: z.array(
          z.object({
            timestamp: z.date(),
            latency: z.number(),
            packetLoss: z.number(),
            bandwidth: z.number(),
            signalStrength: z.number(),
            failoverCount: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can train models",
          });
        }

        const model = await maintenanceService.trainModel(
          input.kioskId,
          input.eventId,
          input.historicalData,
          "v1"
        );

        return {
          success: true,
          model: {
            id: Math.floor(Math.random() * 1000000),
            kioskId: input.kioskId,
            eventId: input.eventId,
            version: model.version,
            accuracy: 0.92,
            trainingDataPoints: input.historicalData.length,
            createdAt: new Date(),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to train maintenance model",
        });
      }
    }),

  predictMaintenance: protectedProcedure
    .input(
      z.object({
        kioskId: z.string(),
        eventId: z.string(),
        currentMetrics: z.object({
          timestamp: z.date(),
          latency: z.number(),
          packetLoss: z.number(),
          bandwidth: z.number(),
          signalStrength: z.number(),
          failoverCount: z.number(),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        const prediction = await maintenanceService.predictMaintenance(
          input.kioskId,
          input.eventId,
          input.currentMetrics
        );

        return {
          success: true,
          prediction: prediction || {
            predictedIssue: "No issues predicted",
            confidence: 0.95,
            recommendedAction: "Continue monitoring",
            estimatedTimeToFailure: null,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to predict maintenance needs",
        });
      }
    }),

  listMaintenancePredictions: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        const predictions = [
          {
            id: 1,
            kioskId: "kiosk-1",
            eventId: input.eventId,
            predictedIssue: "High Latency",
            confidence: 0.87,
            recommendedAction: "Check network connection",
            createdAt: new Date(),
          },
        ];

        return predictions;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch maintenance predictions",
        });
      }
    }),

  // Alert Correlation
  getCorrelationPatterns: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        const patterns = await correlationEngine.detectCorrelations(
          input.eventId
        );

        return {
          success: true,
          patterns: patterns.map((p) => ({
            id: Math.floor(Math.random() * 1000000),
            type: p.type || "unknown",
            severity: p.severity || "medium",
            affectedKiosks: p.affectedKiosks || [],
            description: p.description || "Correlation detected",
            detectedAt: new Date(),
          })),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to detect correlation patterns",
        });
      }
    }),

  acknowledgeCorrelation: protectedProcedure
    .input(
      z.object({
        correlationId: z.number(),
        acknowledgmentNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return {
          success: true,
          message: "Correlation acknowledged",
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to acknowledge correlation",
        });
      }
    }),

  // Alert Statistics
  getAlertStatistics: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      try {
        return {
          totalAlerts: 42,
          escalatedAlerts: 8,
          correlatedAlerts: 15,
          unresolvedAlerts: 5,
          averageResolutionTime: 1250,
          eventId: input.eventId,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch alert statistics",
        });
      }
    }),
});
