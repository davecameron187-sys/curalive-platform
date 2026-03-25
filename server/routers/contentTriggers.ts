import { protectedProcedure, router } from "../_core/trpc";
import { ContentGenerationTriggerService } from "../services/ContentGenerationTriggerService";
import { z } from "zod";

export const contentTriggersRouter = router({
  /**
   * Manually trigger content generation for an event
   * (Called when operator clicks "Generate AI Content" button or event auto-completes)
   */
  triggerEventCompletion: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        transcript: z.string(),
        sentimentData: z
          .object({
            overallSentiment: z.string(),
            averageScore: z.number(),
            keyMoments: z.array(z.string()),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await ContentGenerationTriggerService.triggerForEventCompletion(
        input.eventId,
        input.transcript,
        input.sentimentData,
        ctx.user.id
      );

      return {
        success: result.success,
        contentIds: result.contentIds,
        errors: result.errors,
        message: result.success
          ? `Generated ${result.contentIds.length} content items for review`
          : "Some content generation failed - see errors",
      };
    }),

  /**
   * Generate a specific content type for an event
   */
  generateContentType: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        contentType: z.enum([
          "event_summary",
          "press_release",
          "follow_up_email",
          "talking_points",
          "qa_analysis",
          "sentiment_report",
        ]),
        transcript: z.string(),
        sentimentData: z
          .object({
            overallSentiment: z.string(),
            averageScore: z.number(),
            keyMoments: z.array(z.string()),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const contentId = await ContentGenerationTriggerService.generateContent(
          {
            eventId: input.eventId,
            eventTitle: `Event ${input.eventId}`,
            transcript: input.transcript,
            sentimentData: input.sentimentData,
          },
          input.contentType,
          ctx.user.id
        );

        return {
          success: true,
          contentId,
          message: `Generated ${input.contentType} for review`,
        };
      } catch (error) {
        return {
          success: false,
          contentId: null,
          message: `Failed to generate content: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),

  /**
   * Get IR contacts for an event (for pre-filling recipients)
   */
  getIRContacts: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const contacts = await ContentGenerationTriggerService.getIRContactsForEvent(
        input.eventId
      );
      return contacts;
    }),

  /**
   * Batch regenerate content for an event (in case of updates)
   */
  regenerateAllContent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        transcript: z.string(),
        sentimentData: z
          .object({
            overallSentiment: z.string(),
            averageScore: z.number(),
            keyMoments: z.array(z.string()),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await ContentGenerationTriggerService.triggerForEventCompletion(
        input.eventId,
        input.transcript,
        input.sentimentData,
        ctx.user.id
      );

      return {
        success: result.success,
        contentIds: result.contentIds,
        errors: result.errors,
        message: result.success
          ? `Regenerated ${result.contentIds.length} content items`
          : "Some content regeneration failed",
      };
    }),
});
