import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TranscriptEditorService } from "../services/TranscriptEditorService";

export const transcriptEditorRouter = router({
  /**
   * Create a new transcript edit
   */
  createEdit: protectedProcedure
    .input(
      z.object({
        conferenceId: z.number().int().positive(),
        transcriptionSegmentId: z.number().int().positive(),
        originalText: z.string().min(1).max(5000),
        correctedText: z.string().min(1).max(5000),
        editType: z.enum(["correction", "clarification", "redaction", "speaker_correction"]),
        reason: z.string().optional(),
        confidence: z.number().int().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await TranscriptEditorService.createEdit(
        input.conferenceId,
        ctx.user.id,
        ctx.user.name || "Unknown",
        {
          transcriptionSegmentId: input.transcriptionSegmentId,
          originalText: input.originalText,
          correctedText: input.correctedText,
          editType: input.editType,
          reason: input.reason,
          confidence: input.confidence,
        }
      );

      return {
        success: true,
        editId: (result as any).insertId,
      };
    }),

  /**
   * Get all edits for a conference
   */
  getConferenceEdits: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const edits = await TranscriptEditorService.getConferenceEdits(input.conferenceId);
      return edits;
    }),

  /**
   * Get pending edits requiring approval
   */
  getPendingEdits: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const pending = await TranscriptEditorService.getPendingEdits(input.conferenceId);
      return pending;
    }),

  /**
   * Approve or reject an edit
   */
  approveEdit: protectedProcedure
    .input(
      z.object({
        editId: z.number().int().positive(),
        conferenceId: z.number().int().positive(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await TranscriptEditorService.approveEdit(
        input.editId,
        input.conferenceId,
        {
          editId: input.editId,
          approved: input.approved,
          approverName: ctx.user.name || "Unknown",
          approverId: ctx.user.id,
        }
      );

      return {
        success: true,
      };
    }),

  /**
   * Create a version snapshot
   */
  createVersion: protectedProcedure
    .input(
      z.object({
        conferenceId: z.number().int().positive(),
        changeDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await TranscriptEditorService.createVersion(
        input.conferenceId,
        ctx.user.id,
        ctx.user.name || "Unknown",
        input.changeDescription
      );

      return {
        success: true,
        versionId: (result as any).insertId,
      };
    }),

  /**
   * Get all versions for a conference
   */
  getConferenceVersions: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const versions = await TranscriptEditorService.getConferenceVersions(input.conferenceId);
      return versions;
    }),

  /**
   * Publish a transcript version
   */
  publishVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.number().int().positive(),
        conferenceId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await TranscriptEditorService.publishVersion(
        input.versionId,
        input.conferenceId,
        ctx.user.id,
        ctx.user.name || "Unknown"
      );

      return {
        success: true,
      };
    }),

  /**
   * Revert to a previous version
   */
  revertToVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.number().int().positive(),
        conferenceId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await TranscriptEditorService.revertToVersion(
        input.versionId,
        input.conferenceId,
        ctx.user.id,
        ctx.user.name || "Unknown"
      );

      return {
        success: true,
        newVersionId: (result as any).insertId,
      };
    }),

  /**
   * Get full transcript with all approved edits
   */
  getFullTranscript: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const transcript = await TranscriptEditorService.getFullTranscriptWithEdits(
        input.conferenceId
      );
      return { transcript };
    }),

  /**
   * Get edit statistics
   */
  getEditStatistics: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const stats = await TranscriptEditorService.getEditStatistics(input.conferenceId);
      return stats;
    }),

  /**
   * Get audit log
   */
  getAuditLog: protectedProcedure
    .input(z.object({ conferenceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const logs = await TranscriptEditorService.getAuditLog(input.conferenceId);
      return logs;
    }),

  /**
   * Generate AI correction suggestions
   */
  generateCorrectionSuggestions: protectedProcedure
    .input(
      z.object({
        originalText: z.string().min(1).max(5000),
        context: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const suggestions = await TranscriptEditorService.generateCorrectionSuggestions(
        input.originalText,
        input.context
      );
      return { suggestions };
    }),

  /**
   * Export transcript in various formats
   */
  exportTranscript: protectedProcedure
    .input(
      z.object({
        conferenceId: z.number().int().positive(),
        format: z.enum(["txt", "md", "json"]).default("txt"),
      })
    )
    .query(async ({ input }) => {
      const transcript = await TranscriptEditorService.exportTranscript(
        input.conferenceId,
        input.format
      );
      return { transcript };
    }),
});
