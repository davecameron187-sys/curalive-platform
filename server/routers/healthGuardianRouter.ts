// @ts-nocheck
import { z } from "zod";
import { protectedProcedure, operatorProcedure, router } from "../_core/trpc";
import {
  getLastResults,
  getHealthHistory,
  getIncidents,
  getIncidentById,
  generateCustomerReport,
  getReportsForIncident,
  getOverallHealthScore,
  runAllChecks,
} from "../services/HealthGuardianService";

export const healthGuardianRouter = router({
  currentStatus: protectedProcedure.query(async () => {
    const results = getLastResults();
    const overall = await getOverallHealthScore();
    return { results, overall };
  }),

  runCheck: operatorProcedure.mutation(async () => {
    const results = await runAllChecks();
    const overall = await getOverallHealthScore();
    return { results, overall };
  }),

  history: protectedProcedure
    .input(z.object({ service: z.string().optional(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return getHealthHistory(input.service, input.limit);
    }),

  incidents: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return getIncidents(input.status, input.limit);
    }),

  incidentDetail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const incident = await getIncidentById(input.id);
      if (!incident) throw new Error("Incident not found");
      const reports = await getReportsForIncident(input.id);
      return { incident, reports };
    }),

  generateReport: operatorProcedure
    .input(z.object({ incidentId: z.number(), eventId: z.number().optional() }))
    .mutation(async ({ input }) => {
      return generateCustomerReport(input.incidentId, input.eventId);
    }),
});
