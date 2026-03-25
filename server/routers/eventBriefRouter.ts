import { protectedProcedure, router } from "../_core/trpc";
import { EventBriefGeneratorService } from "../services/EventBriefGeneratorService";
import { z } from "zod";

/**
 * Event Brief Generator Router
 * Exposes AI Event Brief Generator via tRPC
 * Used by operators to generate event briefs from press releases
 */
export const eventBriefRouter = router({
  /**
   * Generate a brief from a press release
   */
  generateBrief: protectedProcedure
    .input(
      z.object({
        pressRelease: z.string().min(10).max(10000),
        pressReleaseTitle: z.string().max(255).optional(),
        conferenceId: z.number().int().positive(),
        eventId: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await EventBriefGeneratorService.generateAndSaveBrief(
        input.pressRelease,
        input.pressReleaseTitle,
        input.conferenceId,
        input.eventId,
        ctx.user?.id
      );

      return {
        id: result.id,
        briefTitle: result.brief.briefTitle,
        briefSummary: result.brief.briefSummary,
        keyMessages: result.brief.keyMessages,
        talkingPoints: result.brief.talkingPoints,
        anticipatedQuestions: result.brief.anticipatedQuestions,
        financialHighlights: result.brief.financialHighlights,
        generationConfidence: result.brief.generationConfidence,
      };
    }),

  /**
   * Get a saved brief
   */
  getBrief: protectedProcedure
    .input(z.object({ briefId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const brief = await EventBriefGeneratorService.getBrief(input.briefId);
      return brief;
    }),

  /**
   * Get all briefs for a conference
   */
  getConferenceBriefs: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const briefs = await EventBriefGeneratorService.getConferenceBriefs(
        input.conferenceId
      );
      return briefs;
    }),

  /**
   * Get approved briefs for a conference
   */
  getApprovedBriefs: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const briefs = await EventBriefGeneratorService.getApprovedBriefs(
        input.conferenceId
      );
      return briefs;
    }),

  /**
   * Approve a brief for use in event
   */
  approveBrief: protectedProcedure
    .input(
      z.object({
        briefId: z.number().int().positive(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await EventBriefGeneratorService.approveBrief(
        input.briefId,
        input.notes,
        ctx.user?.id
      );
      return result;
    }),

  /**
   * Mark brief as used in event
   */
  markBriefAsUsed: protectedProcedure
    .input(z.object({ briefId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const result = await EventBriefGeneratorService.markBriefAsUsed(input.briefId);
      return result;
    }),

  /**
   * Update brief with operator notes
   */
  updateBriefNotes: protectedProcedure
    .input(
      z.object({
        briefId: z.number().int().positive(),
        notes: z.string().max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await EventBriefGeneratorService.updateBriefNotes(
        input.briefId,
        input.notes
      );
      return result;
    }),

  /**
   * Delete a brief
   */
  deleteBrief: protectedProcedure
    .input(z.object({ briefId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const result = await EventBriefGeneratorService.deleteBrief(input.briefId);
      return result;
    }),

  /**
   * Get brief statistics for a conference
   */
  getConferenceBriefStats: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const stats = await EventBriefGeneratorService.getConferenceBriefStats(
        input.conferenceId
      );
      return stats;
    }),
});
