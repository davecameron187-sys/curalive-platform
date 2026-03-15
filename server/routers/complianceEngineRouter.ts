// @ts-nocheck
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  runFullScan,
  getThreats,
  updateThreatStatus,
  getThreatStats,
  getComplianceDashboardData,
} from "../services/ComplianceEngineService";

export const complianceEngineRouter = router({
  dashboard: protectedProcedure.query(async () => {
    return getComplianceDashboardData();
  }),

  runScan: protectedProcedure.mutation(async () => {
    const result = await runFullScan();
    return result;
  }),

  threats: protectedProcedure
    .input(z.object({
      status: z.enum(["detected", "investigating", "confirmed", "mitigated", "false_positive"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      type: z.enum(["fraud", "access_anomaly", "data_exfiltration", "policy_violation", "regulatory_breach", "predictive_warning"]).optional(),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      return getThreats(input ?? {});
    }),

  threatStats: protectedProcedure.query(async () => {
    return getThreatStats();
  }),

  updateThreat: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["detected", "investigating", "confirmed", "mitigated", "false_positive"]),
    }))
    .mutation(async ({ input }) => {
      return updateThreatStatus(input.id, input.status);
    }),
});
