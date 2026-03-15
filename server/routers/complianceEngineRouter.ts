// @ts-nocheck
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  runFullScan,
  getThreats,
  updateThreatStatus,
  getThreatStats,
  getComplianceDashboardData,
} from "../services/ComplianceEngineService";

export const complianceEngineRouter = router({
  dashboard: adminProcedure.query(async () => {
    return getComplianceDashboardData();
  }),

  runScan: adminProcedure.mutation(async () => {
    const result = await runFullScan();
    return result;
  }),

  threats: adminProcedure
    .input(z.object({
      status: z.enum(["detected", "investigating", "confirmed", "mitigated", "false_positive"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      type: z.enum(["fraud", "access_anomaly", "data_exfiltration", "policy_violation", "regulatory_breach", "predictive_warning"]).optional(),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      return getThreats(input ?? {});
    }),

  threatStats: adminProcedure.query(async () => {
    return getThreatStats();
  }),

  updateThreat: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["detected", "investigating", "confirmed", "mitigated", "false_positive"]),
    }))
    .mutation(async ({ input }) => {
      return updateThreatStatus(input.id, input.status);
    }),
});
