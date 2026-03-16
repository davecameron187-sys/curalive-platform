/**
 * Advanced Reporting tRPC router — Round 56
 * Handles custom report configuration, generation, and scheduling
 */
import { z } from "zod";
import { router, protectedProcedure, operatorProcedure } from "../_core/trpc";
import {
  createReportConfig,
  getReportConfigById,
  getReportConfigsByEvent,
  getActiveReportConfigs,
  updateReportConfig,
  deleteReportConfig,
  createGeneratedReport,
  getGeneratedReportById,
  getGeneratedReportsByEvent,
  getGeneratedReportsByConfig,
  updateGeneratedReport,
  getReportsByDateRange,
} from "../db.round56";
import { getDb } from "../db";
import { occTranscriptSentiments, occTranscriptSummaries } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const MetricsSchema = z.enum(["sentiment", "transcription", "qa", "attendees", "engagement"]);
const DateRangeTypeSchema = z.enum(["last_7_days", "last_30_days", "custom"]);
const ExportFormatSchema = z.enum(["pdf", "csv", "json"]);
const ScheduleFrequencySchema = z.enum(["once", "daily", "weekly", "monthly"]);

export const reportingRouter = router({
  /**
   * Create a new report configuration.
   * Operator-only.
   */
  createReportConfig: operatorProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        metrics: z.array(MetricsSchema),
        dateRangeType: DateRangeTypeSchema.default("last_7_days"),
        customStartDate: z.date().optional(),
        customEndDate: z.date().optional(),
        exportFormats: z.array(ExportFormatSchema),
        scheduleFrequency: ScheduleFrequencySchema.default("once"),
        scheduleTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm
        recipientEmails: z.array(z.string().email()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const config = await createReportConfig({
        eventId: input.eventId,
        name: input.name,
        description: input.description,
        metrics: input.metrics,
        dateRangeType: input.dateRangeType,
        customStartDate: input.customStartDate,
        customEndDate: input.customEndDate,
        exportFormats: input.exportFormats,
        scheduleFrequency: input.scheduleFrequency,
        scheduleTime: input.scheduleTime,
        recipientEmails: input.recipientEmails,
        isActive: true,
        createdBy: ctx.user.id,
      });

      return config;
    }),

  /**
   * Get a report configuration by ID.
   * Operator-only.
   */
  getReportConfig: operatorProcedure
    .input(z.object({ configId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getReportConfigById(input.configId);
    }),

  /**
   * List all report configurations for an event.
   * Operator-only.
   */
  listReportConfigs: operatorProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getReportConfigsByEvent(input.eventId);
    }),

  /**
   * Update a report configuration.
   * Operator-only.
   */
  updateReportConfig: operatorProcedure
    .input(
      z.object({
        configId: z.number().int().positive(),
        name: z.string().optional(),
        description: z.string().optional(),
        metrics: z.array(MetricsSchema).optional(),
        dateRangeType: DateRangeTypeSchema.optional(),
        customStartDate: z.date().optional(),
        customEndDate: z.date().optional(),
        exportFormats: z.array(ExportFormatSchema).optional(),
        scheduleFrequency: ScheduleFrequencySchema.optional(),
        scheduleTime: z.string().optional(),
        recipientEmails: z.array(z.string().email()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const config = await updateReportConfig(input.configId, {
        name: input.name,
        description: input.description,
        metrics: input.metrics,
        dateRangeType: input.dateRangeType,
        customStartDate: input.customStartDate,
        customEndDate: input.customEndDate,
        exportFormats: input.exportFormats,
        scheduleFrequency: input.scheduleFrequency,
        scheduleTime: input.scheduleTime,
        recipientEmails: input.recipientEmails,
        isActive: input.isActive,
      });
      return config;
    }),

  /**
   * Delete a report configuration.
   * Operator-only.
   */
  deleteReportConfig: operatorProcedure
    .input(z.object({ configId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      return deleteReportConfig(input.configId);
    }),

  /**
   * Generate a custom report based on configuration.
   * Operator-only.
   */
  generateCustomReport: operatorProcedure
    .input(
      z.object({
        configId: z.number().int().positive(),
        eventId: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const config = await getReportConfigById(input.configId);
      if (!config) throw new Error("Report configuration not found");

      // Aggregate metrics based on configuration
      const reportData = await aggregateReportMetrics(input.eventId, input.startDate, input.endDate, config.metrics);

      const report = await createGeneratedReport({
        configId: input.configId,
        eventId: input.eventId,
        reportType: "custom",
        startDate: input.startDate,
        endDate: input.endDate,
        reportData,
        generatedBy: ctx.user.id,
      });

      return report;
    }),

  /**
   * Get a generated report by ID.
   * Operator-only.
   */
  getGeneratedReport: operatorProcedure
    .input(z.object({ reportId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getGeneratedReportById(input.reportId);
    }),

  /**
   * List all generated reports for an event.
   * Operator-only.
   */
  listGeneratedReports: operatorProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getGeneratedReportsByEvent(input.eventId);
    }),

  /**
   * List all generated reports for a configuration.
   * Operator-only.
   */
  listReportsByConfig: operatorProcedure
    .input(z.object({ configId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getGeneratedReportsByConfig(input.configId);
    }),

  /**
   * Get reports within a date range.
   * Operator-only.
   */
  getReportsByDateRange: operatorProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return getReportsByDateRange(input.eventId, input.startDate, input.endDate);
    }),
});

/**
 * Helper: Aggregate metrics for a custom report
 */
async function aggregateReportMetrics(
  eventId: string,
  startDate: Date,
  endDate: Date,
  metrics: string[]
) {
  const db = await getDb();
  if (!db) return {};

  const reportData: Record<string, unknown> = {};

  // Sentiment metrics
  if (metrics.includes("sentiment")) {
    const sentiments = await db
      .select()
      .from(occTranscriptSentiments)
      .where(
        and(
          gte(occTranscriptSentiments.createdAt, startDate),
          lte(occTranscriptSentiments.createdAt, endDate)
        )
      );

    if (sentiments.length > 0) {
      const avgScore = sentiments.reduce((sum, s) => sum + (s.overallScore || 0), 0) / sentiments.length;
      const emotionCounts = {
        joy: sentiments.filter((s) => s.emotion === "joy").length,
        sadness: sentiments.filter((s) => s.emotion === "sadness").length,
        anger: sentiments.filter((s) => s.emotion === "anger").length,
        fear: sentiments.filter((s) => s.emotion === "fear").length,
        surprise: sentiments.filter((s) => s.emotion === "surprise").length,
        disgust: sentiments.filter((s) => s.emotion === "disgust").length,
      };
      reportData.sentiment = {
        averageScore: avgScore,
        totalAnalyzed: sentiments.length,
        emotionBreakdown: emotionCounts,
      };
    }
  }

  // Summary metrics
  if (metrics.includes("transcription")) {
    const summaries = await db
      .select()
      .from(occTranscriptSummaries)
      .where(
        and(
          gte(occTranscriptSummaries.createdAt, startDate),
          lte(occTranscriptSummaries.createdAt, endDate)
        )
      );

    reportData.transcription = {
      totalSummaries: summaries.length,
      summaries: summaries.map((s) => ({
        id: s.id,
        summary: s.summaryText,
        keyPoints: s.keyPoints,
        actionItems: s.actionItems,
      })),
    };
  }

  return reportData;
}
