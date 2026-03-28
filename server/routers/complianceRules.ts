/**
 * Compliance Rules Router for tRPC
 * Handles CRUD operations for custom compliance rules
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { complianceRulesEngine, RuleType, RuleSeverity, type ComplianceRule } from "../compliance/rulesEngine";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createRuleSchema = z.object({
  eventId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000),
  ruleType: z.nativeEnum(RuleType),
  severity: z.nativeEnum(RuleSeverity),
  config: z.object({
    keywords: z.array(z.string()).optional(),
    caseSensitive: z.boolean().optional(),
    wholeWordOnly: z.boolean().optional(),
    pattern: z.string().optional(),
    flags: z.string().optional(),
    minSentiment: z.number().min(-1).max(1).optional(),
    maxSentiment: z.number().min(-1).max(1).optional(),
    customLogic: z.string().optional(),
  }),
  actions: z.object({
    autoHold: z.boolean().optional(),
    autoReject: z.boolean().optional(),
    flagForReview: z.boolean().optional(),
    notifyModerator: z.boolean().optional(),
    complianceScore: z.number().min(0).max(1).optional(),
  }),
  jurisdiction: z.string().optional(),
});

const updateRuleSchema = createRuleSchema.partial();

const evaluateQuestionSchema = z.object({
  questionId: z.number(),
  questionText: z.string(),
  sentimentScore: z.number().min(-1).max(1).optional(),
  eventId: z.string(),
});

// ============================================================================
// COMPLIANCE RULES ROUTER
// ============================================================================

export const complianceRulesRouter = router({
  /**
   * Create a new compliance rule
   */
  createRule: protectedProcedure
    .input(createRuleSchema)
    .mutation(async ({ input, ctx }) => {
      const rule: ComplianceRule = {
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventId: input.eventId,
        name: input.name,
        description: input.description,
        ruleType: input.ruleType,
        severity: input.severity,
        enabled: true,
        config: input.config,
        actions: input.actions,
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        jurisdiction: input.jurisdiction,
      };

      complianceRulesEngine.registerRule(rule);

      return {
        success: true,
        rule,
        message: `Compliance rule "${rule.name}" created successfully`,
      };
    }),

  /**
   * Update an existing compliance rule
   */
  updateRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        updates: updateRuleSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rules = complianceRulesEngine.getRulesForEvent(input.updates.eventId || "");
      const existingRule = rules.find((r) => r.id === input.ruleId);

      if (!existingRule) {
        throw new Error(`Compliance rule ${input.ruleId} not found`);
      }

      const updatedRule: ComplianceRule = {
        ...existingRule,
        ...input.updates,
        updatedAt: new Date(),
        version: existingRule.version + 1,
      };

      complianceRulesEngine.updateRule(updatedRule);

      return {
        success: true,
        rule: updatedRule,
        message: `Compliance rule "${updatedRule.name}" updated successfully`,
      };
    }),

  /**
   * Delete a compliance rule
   */
  deleteRule: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ input }) => {
      complianceRulesEngine.unregisterRule(input.ruleId);

      return {
        success: true,
        message: `Compliance rule deleted successfully`,
      };
    }),

  /**
   * Get all rules for an event
   */
  getRulesForEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const rules = complianceRulesEngine.getRulesForEvent(input.eventId);

      return {
        success: true,
        rules,
        count: rules.length,
      };
    }),

  /**
   * Evaluate a question against compliance rules
   */
  evaluateQuestion: protectedProcedure
    .input(evaluateQuestionSchema)
    .query(async ({ input }) => {
      // Load rules for the event
      const rules = complianceRulesEngine.getRulesForEvent(input.eventId);
      for (const rule of rules) {
        complianceRulesEngine.registerRule(rule);
      }

      const result = await complianceRulesEngine.evaluateQuestion(
        input.questionId,
        input.questionText,
        input.sentimentScore || 0.5
      );

      return {
        success: true,
        result,
      };
    }),

  /**
   * Get compliance rules statistics
   */
  getStatistics: protectedProcedure.query(async () => {
    const stats = complianceRulesEngine.getRuleStatistics();

    return {
      success: true,
      statistics: stats,
    };
  }),

  /**
   * Bulk import compliance rules
   */
  bulkImport: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        rules: z.array(createRuleSchema),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const importedRules: ComplianceRule[] = [];

      for (const ruleData of input.rules) {
        const rule: ComplianceRule = {
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          eventId: input.eventId,
          name: ruleData.name,
          description: ruleData.description,
          ruleType: ruleData.ruleType,
          severity: ruleData.severity,
          enabled: true,
          config: ruleData.config,
          actions: ruleData.actions,
          createdBy: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          jurisdiction: ruleData.jurisdiction,
        };

        complianceRulesEngine.registerRule(rule);
        importedRules.push(rule);
      }

      return {
        success: true,
        importedCount: importedRules.length,
        rules: importedRules,
        message: `${importedRules.length} compliance rules imported successfully`,
      };
    }),

  /**
   * Bulk export compliance rules
   */
  bulkExport: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const rules = complianceRulesEngine.getRulesForEvent(input.eventId);

      return {
        success: true,
        rules,
        count: rules.length,
        exportDate: new Date().toISOString(),
      };
    }),

  /**
   * Test a rule with sample text
   */
  testRule: protectedProcedure
    .input(
      z.object({
        ruleType: z.nativeEnum(RuleType),
        config: z.object({
          keywords: z.array(z.string()).optional(),
          caseSensitive: z.boolean().optional(),
          wholeWordOnly: z.boolean().optional(),
          pattern: z.string().optional(),
          flags: z.string().optional(),
          minSentiment: z.number().optional(),
          maxSentiment: z.number().optional(),
          customLogic: z.string().optional(),
        }),
        testText: z.string(),
        testSentiment: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      // Create temporary test rule
      const testRule: ComplianceRule = {
        id: "test-rule",
        eventId: "test",
        name: "Test Rule",
        description: "Temporary test rule",
        ruleType: input.ruleType,
        severity: RuleSeverity.MEDIUM,
        enabled: true,
        config: input.config,
        actions: {},
        createdBy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      const result = await complianceRulesEngine.evaluateQuestion(
        0,
        input.testText,
        input.testSentiment || 0.5
      );

      return {
        success: true,
        matched: result.ruleMatches.length > 0,
        result,
      };
    }),
});

export default complianceRulesRouter;
