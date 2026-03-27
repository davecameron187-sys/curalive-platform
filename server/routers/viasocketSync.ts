import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

const VIASOCKET_WEBHOOK_URL = "https://flow.sokt.io/func/scri5FOg88XM";

/**
 * Helper function to send data to Viasocket webhook
 */
async function sendToViasocket(eventType: string, data: any) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
      source: "curalive",
    };

    const response = await fetch(VIASOCKET_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Viasocket] Failed to send ${eventType}:`, response.statusText);
      return false;
    }

    console.log(`[Viasocket] Successfully sent ${eventType} event`);
    return true;
  } catch (error) {
    console.error(`[Viasocket] Error sending ${eventType}:`, error);
    return false;
  }
}

export const viasocketSyncRouter = router({
  /**
   * Sync session event (start, pause, resume, end)
   */
  syncSessionEvent: publicProcedure
    .input(
      z.object({
        eventType: z.enum(["session.started", "session.paused", "session.resumed", "session.ended"]),
        sessionId: z.string(),
        eventId: z.string(),
        operatorId: z.string(),
        timestamp: z.date().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;
      return await sendToViasocket(input.eventType, {
        sessionId: input.sessionId,
        eventId: input.eventId,
        operatorId: input.operatorId,
        timestamp: input.timestamp || new Date(),
        metadata: input.metadata,
      });
    }),

  /**
   * Sync Q&A question submission
   */
  syncQuestionSubmitted: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        sessionId: z.string(),
        askerName: z.string(),
        questionText: z.string(),
        timestamp: z.date().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;
      return await sendToViasocket("qa.question.submitted", {
        questionId: input.questionId,
        sessionId: input.sessionId,
        askerName: input.askerName,
        questionText: input.questionText,
        timestamp: input.timestamp || new Date(),
        metadata: input.metadata,
      });
    }),

  /**
   * Sync Q&A question action (approve, reject, hold)
   */
  syncQuestionAction: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        sessionId: z.string(),
        action: z.enum(["approved", "rejected", "held"]),
        operatorId: z.string(),
        reason: z.string().optional(),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("qa.question.action", {
        questionId: input.questionId,
        sessionId: input.sessionId,
        action: input.action,
        operatorId: input.operatorId,
        reason: input.reason,
        timestamp: input.timestamp || new Date(),
      });
    }),

  /**
   * Sync operator note
   */
  syncOperatorNote: publicProcedure
    .input(
      z.object({
        noteId: z.string(),
        sessionId: z.string(),
        operatorId: z.string(),
        noteText: z.string(),
        timestamp: z.date().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("operator.note.created", {
        noteId: input.noteId,
        sessionId: input.sessionId,
        operatorId: input.operatorId,
        noteText: input.noteText,
        timestamp: input.timestamp || new Date(),
        tags: input.tags,
      });
    }),

  /**
   * Sync transcript segment
   */
  syncTranscriptSegment: publicProcedure
    .input(
      z.object({
        segmentId: z.string(),
        sessionId: z.string(),
        speaker: z.string(),
        text: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("transcript.segment", {
        segmentId: input.segmentId,
        sessionId: input.sessionId,
        speaker: input.speaker,
        text: input.text,
        startTime: input.startTime,
        endTime: input.endTime,
        timestamp: input.timestamp || new Date(),
      });
    }),

  /**
   * Sync intelligence signals (sentiment, compliance, engagement)
   */
  syncIntelligenceSignals: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        sentiment: z.object({
          score: z.number().min(0).max(1),
          trend: z.enum(["improving", "stable", "declining"]),
        }).optional(),
        compliance: z.object({
          riskLevel: z.enum(["low", "medium", "high"]),
          flags: z.array(z.string()),
        }).optional(),
        engagement: z.object({
          questionsCount: z.number(),
          upvotesCount: z.number(),
          participationRate: z.number().min(0).max(1),
        }).optional(),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("intelligence.signals", {
        sessionId: input.sessionId,
        sentiment: input.sentiment,
        compliance: input.compliance,
        engagement: input.engagement,
        timestamp: input.timestamp || new Date(),
      });
    }),

  /**
   * Sync session summary (end of session)
   */
  syncSessionSummary: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        eventId: z.string(),
        operatorId: z.string(),
        duration: z.number(), // in seconds
        totalQuestions: z.number(),
        approvedQuestions: z.number(),
        rejectedQuestions: z.number(),
        finalSentiment: z.number().optional(),
        complianceRisks: z.array(z.string()).optional(),
        transcriptUrl: z.string().optional(),
        recordingUrl: z.string().optional(),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("session.summary", {
        sessionId: input.sessionId,
        eventId: input.eventId,
        operatorId: input.operatorId,
        duration: input.duration,
        totalQuestions: input.totalQuestions,
        approvedQuestions: input.approvedQuestions,
        rejectedQuestions: input.rejectedQuestions,
        finalSentiment: input.finalSentiment,
        complianceRisks: input.complianceRisks,
        transcriptUrl: input.transcriptUrl,
        recordingUrl: input.recordingUrl,
        timestamp: input.timestamp || new Date(),
      });
    }),

  /**
   * Sync answer submission
   */
  syncAnswerSubmitted: publicProcedure
    .input(
      z.object({
        answerId: z.string(),
        questionId: z.string(),
        sessionId: z.string(),
        speakerId: z.string(),
        answerText: z.string(),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("qa.answer.submitted", {
        answerId: input.answerId,
        questionId: input.questionId,
        sessionId: input.sessionId,
        speakerId: input.speakerId,
        answerText: input.answerText,
        timestamp: input.timestamp || new Date(),
      });
    }),

  /**
   * Sync question upvote
   */
  syncQuestionUpvoted: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        sessionId: z.string(),
        upvoteCount: z.number(),
        timestamp: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendToViasocket("qa.question.upvoted", {
        questionId: input.questionId,
        sessionId: input.sessionId,
        upvoteCount: input.upvoteCount,
        timestamp: input.timestamp || new Date(),
      });
    }),

  /**
   * Test webhook connection
   */
  testConnection: publicProcedure.query(async () => {
    const result = await sendToViasocket("test.connection", {
      message: "CuraLive Viasocket integration test",
      timestamp: new Date(),
    });
    return { success: result, webhookUrl: VIASOCKET_WEBHOOK_URL };
  }),
});
