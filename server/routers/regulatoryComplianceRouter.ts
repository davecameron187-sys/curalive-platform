import { router, operatorProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { regulatoryComplianceMonitors, regulatoryFlags, disclosureTriggers, jurisdictionProfiles, complianceActionItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export const regulatoryComplianceRouter = router({
  getOrCreateMonitor: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const existing = await db.select().from(regulatoryComplianceMonitors).where(eq(regulatoryComplianceMonitors.sessionId, input.sessionId)).limit(1);
      if (existing.length > 0) return existing[0];

      const [created] = await db.insert(regulatoryComplianceMonitors).values({
        sessionId: input.sessionId,
        eventId: 0,
      }).returning();
      return created;
    }),

  getSessionRegulatoryFlags: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const monitor = await db.select().from(regulatoryComplianceMonitors).where(eq(regulatoryComplianceMonitors.sessionId, input.sessionId)).limit(1);
      if (monitor.length === 0) return { flags: [] };

      const flags = await db.select().from(regulatoryFlags).where(eq(regulatoryFlags.monitorId, monitor[0].id));
      return { flags };
    }),

  getEventComplianceSummary: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const monitor = await db.select().from(regulatoryComplianceMonitors).where(eq(regulatoryComplianceMonitors.sessionId, input.sessionId)).limit(1);
      if (monitor.length === 0) return {
        totalFlagsDetected: 0,
        highSeverityFlags: 0,
        mediumSeverityFlags: 0,
        lowSeverityFlags: 0,
        disclosureTriggersDetected: 0,
        complianceRiskLevel: 'low' as const,
        recommendedActions: [] as string[],
      };

      const flags = await db.select().from(regulatoryFlags).where(eq(regulatoryFlags.monitorId, monitor[0].id));
      const disclosures = await db.select().from(disclosureTriggers).where(eq(disclosureTriggers.monitorId, monitor[0].id));

      const highCount = flags.filter(f => f.severity === 'high').length;
      const mediumCount = flags.filter(f => f.severity === 'medium').length;
      const lowCount = flags.filter(f => f.severity === 'low').length;

      return {
        totalFlagsDetected: flags.length,
        highSeverityFlags: highCount,
        mediumSeverityFlags: mediumCount,
        lowSeverityFlags: lowCount,
        disclosureTriggersDetected: disclosures.length,
        complianceRiskLevel: highCount > 0 ? 'high' as const : mediumCount > 0 ? 'medium' as const : 'low' as const,
        recommendedActions: [
          'Review flagged statements with legal team',
          'Prepare disclosure draft if triggers detected',
          'Document all compliance decisions',
        ],
      };
    }),

  getJurisdictionRules: operatorProcedure
    .input(z.object({ jurisdiction: z.string() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const results = await db.select().from(jurisdictionProfiles).where(eq(jurisdictionProfiles.code, input.jurisdiction)).limit(1);
      return results[0] ?? {
        code: input.jurisdiction,
        name: input.jurisdiction,
        ruleSetVersion: 'v1.0',
        applicableRules: '',
      };
    }),

  getJurisdictionProfiles: operatorProcedure
    .query(async () => {
      const db = await requireDb();
      const jurisdictions = await db.select().from(jurisdictionProfiles);
      return { jurisdictions };
    }),

  addRegulatoryFlag: operatorProcedure
    .input(z.object({
      monitorId: z.number(),
      flagType: z.string(),
      jurisdiction: z.string(),
      ruleSet: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      statement: z.string(),
      speaker: z.string(),
      ruleBasis: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [created] = await db.insert(regulatoryFlags).values({
        monitorId: input.monitorId,
        flagType: input.flagType,
        jurisdiction: input.jurisdiction,
        ruleSet: input.ruleSet,
        severity: input.severity,
        statement: input.statement,
        speaker: input.speaker,
        ruleBasis: input.ruleBasis,
      }).returning();
      return created;
    }),

  addDisclosureTrigger: operatorProcedure
    .input(z.object({
      monitorId: z.number(),
      filingType: z.string(),
      triggerReason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [created] = await db.insert(disclosureTriggers).values({
        monitorId: input.monitorId,
        filingType: input.filingType,
        triggerReason: input.triggerReason,
        status: 'draft',
      }).returning();
      return created;
    }),

  updateDisclosureStatus: operatorProcedure
    .input(z.object({
      disclosureId: z.number(),
      status: z.enum(['draft', 'pending_review', 'submitted']),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [updated] = await db.update(disclosureTriggers)
        .set({ status: input.status })
        .where(eq(disclosureTriggers.id, input.disclosureId))
        .returning();
      return updated;
    }),

  createComplianceAction: operatorProcedure
    .input(z.object({
      monitorId: z.number(),
      actionType: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      owner: z.string(),
      dueDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [created] = await db.insert(complianceActionItems).values({
        monitorId: input.monitorId,
        actionType: input.actionType,
        description: input.description,
        priority: input.priority,
        owner: input.owner,
        dueDate: new Date(input.dueDate),
        status: 'pending',
      }).returning();
      return created;
    }),
});
