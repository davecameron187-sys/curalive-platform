import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { aiGeneratedContent } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { sendEmail } from "../_core/email";
import { invokeLLM } from "../_core/llm";

export const aiDashboardRouter = router({
  /**
   * Get all AI-generated content for an event
   */
  getEventContent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        status: z.enum(["generated", "approved", "rejected", "sent"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const query = db
        .select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.eventId, input.eventId));

      if (input.status) {
        const results = await query;
        return results.filter((c) => c.status === input.status);
      }

      return await query;
    }),

  /**
   * Get a single AI content item for review
   */
  getContent: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [content] = await db
        .select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.id, input.contentId))
        .limit(1);

      return content || null;
    }),

  /**
   * Update AI content (operator edits before approval)
   */
  updateContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        editedContent: z.string(),
        recipients: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(aiGeneratedContent)
        .set({
          editedContent: input.editedContent,
          recipients: input.recipients as any,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedContent.id, input.contentId));

      return { success: true };
    }),

  /**
   * Approve and send AI content to recipients
   */
  approveAndSend: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        recipients: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get the content
      const [content] = await db
        .select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.id, input.contentId))
        .limit(1);

      if (!content) throw new Error("Content not found");

      const contentToSend = content.editedContent || content.content;

      // Send emails to all recipients
      const sentTo: string[] = [];
      const errors: string[] = [];

      for (const recipient of input.recipients) {
        try {
          await sendEmail({
            to: recipient,
            subject: content.title,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${contentToSend}</div>`,
          });
          sentTo.push(recipient);
        } catch (error) {
          errors.push(`Failed to send to ${recipient}: ${error}`);
        }
      }

      // Update content status
      await db
        .update(aiGeneratedContent)
        .set({
          status: "sent",
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          sentAt: new Date(),
          sentTo: sentTo as any,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedContent.id, input.contentId));

      return {
        success: sentTo.length > 0,
        sentTo,
        errors,
        failedCount: errors.length,
      };
    }),

  /**
   * Approve AI content without sending (for later manual send)
   */
  approveContent: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(aiGeneratedContent)
        .set({
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedContent.id, input.contentId));

      return { success: true };
    }),

  /**
   * Reject AI content with reason
   */
  rejectContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(aiGeneratedContent)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedContent.id, input.contentId));

      return { success: true };
    }),

  /**
   * Generate AI content (event summary, press release, etc.)
   */
  generateContent: protectedProcedure
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
        context: z.string(), // Transcript, sentiment data, etc.
        recipients: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Generate content using LLM
      const prompt = buildPromptForContentType(input.contentType, input.context);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert at generating professional business content for investor relations and corporate communications.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const generatedContent =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

      // Store in database
      const result = await db.insert(aiGeneratedContent).values({
        eventId: input.eventId,
        contentType: input.contentType,
        title: getTitleForContentType(input.contentType),
        content: generatedContent,
        status: "generated",
        recipients: input.recipients as any,
        generatedAt: new Date(),
        generatedBy: ctx.user.id,
      });

      return {
        contentId: result[0],
        content: generatedContent,
        title: getTitleForContentType(input.contentType),
      };
    }),

  /**
   * Get dashboard statistics
   */
  getStats: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const contents = await db
        .select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.eventId, input.eventId));

      return {
        total: contents.length,
        generated: contents.filter((c) => c.status === "generated").length,
        approved: contents.filter((c) => c.status === "approved").length,
        rejected: contents.filter((c) => c.status === "rejected").length,
        sent: contents.filter((c) => c.status === "sent").length,
      };
    }),
});

/**
 * Helper: Build LLM prompt based on content type
 */
function buildPromptForContentType(
  contentType: string,
  context: string
): string {
  const prompts: Record<string, string> = {
    event_summary: `Based on the following event transcript and data, generate a concise 2-3 paragraph executive summary suitable for distribution to investors. Include key announcements, Q&A highlights, and sentiment overview.\n\nContext:\n${context}`,

    press_release: `Based on the following event transcript, generate a professional press release (200-300 words) suitable for distribution to media and investors. Include headline, key announcements, quotes, and boilerplate.\n\nContext:\n${context}`,

    follow_up_email: `Based on the following event transcript and attendee data, generate a personalized follow-up email template for IR contacts. Include event highlights, next steps, and call-to-action.\n\nContext:\n${context}`,

    talking_points: `Based on the following event transcript, generate 5-7 key talking points suitable for investor relations follow-up calls. Include financial highlights, strategic messages, and Q&A insights.\n\nContext:\n${context}`,

    qa_analysis: `Based on the following Q&A session transcript, generate a structured analysis including: top questions asked, sentiment of questions, gaps in coverage, and recommended follow-up topics.\n\nContext:\n${context}`,

    sentiment_report: `Based on the following sentiment analysis data and transcript, generate a brief sentiment report including: overall sentiment score, key emotional moments, audience engagement insights, and recommendations.\n\nContext:\n${context}`,
  };

  return (
    prompts[contentType] ||
    `Generate professional business content based on:\n${context}`
  );
}

/**
 * Helper: Get title for content type
 */
function getTitleForContentType(contentType: string): string {
  const titles: Record<string, string> = {
    event_summary: "Event Summary",
    press_release: "Press Release",
    follow_up_email: "Follow-Up Email",
    talking_points: "Talking Points",
    qa_analysis: "Q&A Analysis",
    sentiment_report: "Sentiment Report",
  };

  return titles[contentType] || "AI Generated Content";
}
