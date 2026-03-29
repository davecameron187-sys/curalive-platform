import { z } from "zod";
import { publicProcedure, operatorProcedure, router } from "../_core/trpc";

export const sessionRouter = router({
  getLiveSession: publicProcedure.query(async () => {
    return null;
  }),

  getLiveQA: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return {
        pendingCount: 0,
        approvedCount: 0,
        pending: [],
        approved: [],
      };
    }),

  getLiveTranscript: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return [];
    }),

  getNotes: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return { notes: "" };
    }),

  approveQuestion: operatorProcedure
    .input(z.object({ questionId: z.string(), sessionId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, questionId: input.questionId };
    }),

  rejectQuestion: operatorProcedure
    .input(z.object({ questionId: z.string(), sessionId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, questionId: input.questionId };
    }),

  saveNotes: operatorProcedure
    .input(z.object({ sessionId: z.string(), notes: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  exportSession: operatorProcedure
    .input(z.object({ sessionId: z.string(), format: z.enum(["json", "pdf"]) }))
    .mutation(async ({ input }) => {
      const exportData = {
        sessionId: input.sessionId,
        exportedAt: new Date().toISOString(),
        format: input.format,
      };
      return {
        format: input.format,
        data: JSON.stringify(exportData, null, 2),
        filename: `session-${input.sessionId}-export.${input.format}`,
      };
    }),

  handoffSession: operatorProcedure
    .input(z.object({
      sessionId: z.string(),
      targetOperatorId: z.string(),
      handoffNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        sessionId: input.sessionId,
        targetOperatorId: input.targetOperatorId,
      };
    }),
});
