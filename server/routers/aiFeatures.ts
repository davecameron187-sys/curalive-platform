import { protectedProcedure, router } from "../_core/trpc";
import { QaAutoTriageService } from "../services/QaAutoTriageService";
import { SpeakingPaceCoachService } from "../services/SpeakingPaceCoachService";
import { ToxicityFilterService } from "../services/ToxicityFilterService";
import { z } from "zod";

/**
 * AI Features Router
 * Exposes Q&A Auto-Triage, Speaking-Pace Coach, and Toxicity Filter via tRPC
 */
export const aiFeaturesRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // Q&A Auto-Triage Procedures
  // ─────────────────────────────────────────────────────────────────────────

  qaAutoTriage: router({
    /**
     * Triage a single Q&A question
     */
    triageQuestion: protectedProcedure
      .input(
        z.object({
          qaId: z.number().int().positive(),
          question: z.string().min(1).max(5000),
          eventTitle: z.string().optional(),
          previousQuestions: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await QaAutoTriageService.triageQuestion(
          input.qaId,
          input.question,
          {
            eventTitle: input.eventTitle,
            previousQuestions: input.previousQuestions,
          }
        );

        return {
          classification: result.classification,
          confidence: result.confidence,
          reason: result.reason,
          suggestedCategory: result.suggestedCategory,
          isDuplicate: result.isDuplicate,
          isSensitive: result.isSensitive,
          sensitivityFlags: result.sensitivityFlags,
          triageScore: result.triageScore,
        };
      }),

    /**
     * Get triage result for a specific question
     */
    getResult: protectedProcedure
      .input(z.object({ qaId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const result = await QaAutoTriageService.getTriageResult(input.qaId);
        return result;
      }),

    /**
     * Get all triage results for an event
     */
    getEventResults: protectedProcedure
      .input(z.object({ eventId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const results = await QaAutoTriageService.getEventTriageResults(input.eventId);
        return results;
      }),

    /**
     * Get triage statistics for an event
     */
    getEventStats: protectedProcedure
      .input(z.object({ eventId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const stats = await QaAutoTriageService.getEventTriageStats(input.eventId);
        return stats;
      }),

    /**
     * Triage all pending questions for an event
     */
    triageEventQuestions: protectedProcedure
      .input(
        z.object({
          eventId: z.number().int().positive(),
          eventTitle: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await QaAutoTriageService.triageEventQuestions(
          input.eventId,
          input.eventTitle
        );
        return result;
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Speaking-Pace Coach Procedures
  // ─────────────────────────────────────────────────────────────────────────

  speakingPaceCoach: router({
    /**
     * Analyze speaking pace for a time window
     */
    analyzeWindowPace: protectedProcedure
      .input(
        z.object({
          conferenceId: z.number().int().positive(),
          participantId: z.number().int().positive().optional(),
          speakerName: z.string().min(1).max(255),
          speakerRole: z.enum(["moderator", "participant", "presenter"]),
          windowStartMs: z.number().int().nonnegative(),
          windowEndMs: z.number().int().positive(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await SpeakingPaceCoachService.analyzeWindowPace(
          input.conferenceId,
          input.participantId || null,
          input.speakerName,
          input.speakerRole,
          input.windowStartMs,
          input.windowEndMs
        );

        if (!result) {
          return null;
        }

        return {
          wpm: result.wpm,
          paceLabel: result.paceLabel,
          paceScore: result.paceScore,
          averagePauseMs: result.averagePauseMs,
          pauseScore: result.pauseScore,
          fillerWordCount: result.fillerWordCount,
          fillerScore: result.fillerScore,
          overallScore: result.overallScore,
          coachingTip: result.coachingTip,
          coachingLevel: result.coachingLevel,
        };
      }),

    /**
     * Get all pace analyses for a conference
     */
    getConferenceAnalyses: protectedProcedure
      .input(z.object({ conferenceId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const analyses = await SpeakingPaceCoachService.getConferencePaceAnalyses(
          input.conferenceId
        );
        return analyses;
      }),

    /**
     * Get pace analyses for a specific speaker
     */
    getSpeakerAnalyses: protectedProcedure
      .input(
        z.object({
          conferenceId: z.number().int().positive(),
          speakerName: z.string().min(1).max(255),
        })
      )
      .query(async ({ input }) => {
        const analyses = await SpeakingPaceCoachService.getSpeakerPaceAnalyses(
          input.conferenceId,
          input.speakerName
        );
        return analyses;
      }),

    /**
     * Get latest pace analysis for a speaker
     */
    getLatestSpeakerPace: protectedProcedure
      .input(
        z.object({
          conferenceId: z.number().int().positive(),
          speakerName: z.string().min(1).max(255),
        })
      )
      .query(async ({ input }) => {
        const latest = await SpeakingPaceCoachService.getLatestSpeakerPace(
          input.conferenceId,
          input.speakerName
        );
        return latest;
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Toxicity & Compliance Filter Procedures
  // ─────────────────────────────────────────────────────────────────────────

  toxicityFilter: router({
    /**
     * Filter content for toxicity and compliance issues
     */
    filterContent: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1).max(5000),
          contentType: z.enum(["qa_question", "spoken_segment", "chat_message"]),
          eventTitle: z.string().optional(),
          qaId: z.number().int().positive().optional(),
          conferenceId: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await ToxicityFilterService.filterContent(
          input.content,
          input.contentType,
          {
            eventTitle: input.eventTitle,
            qaId: input.qaId,
            conferenceId: input.conferenceId,
          }
        );

        return {
          toxicityScore: result.toxicityScore,
          toxicityLabel: result.toxicityLabel,
          isFlagged: result.isFlagged,
          isPriceSensitive: result.isPriceSensitive,
          isConfidential: result.isConfidential,
          isLegalRisk: result.isLegalRisk,
          isAbusive: result.isAbusive,
          isSpam: result.isSpam,
          detectedIssues: result.detectedIssues,
          riskLevel: result.riskLevel,
          recommendedAction: result.recommendedAction,
          filterConfidence: result.filterConfidence,
        };
      }),

    /**
     * Filter a Q&A question and save result
     */
    filterQaQuestion: protectedProcedure
      .input(
        z.object({
          qaId: z.number().int().positive(),
          question: z.string().min(1).max(5000),
          conferenceId: z.number().int().positive().optional(),
          eventTitle: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await ToxicityFilterService.filterQaQuestion(
          input.qaId,
          input.question,
          input.conferenceId,
          input.eventTitle
        );

        return {
          toxicityScore: result.toxicityScore,
          toxicityLabel: result.toxicityLabel,
          isFlagged: result.isFlagged,
          isPriceSensitive: result.isPriceSensitive,
          isConfidential: result.isConfidential,
          isLegalRisk: result.isLegalRisk,
          isAbusive: result.isAbusive,
          isSpam: result.isSpam,
          detectedIssues: result.detectedIssues,
          riskLevel: result.riskLevel,
          recommendedAction: result.recommendedAction,
          filterConfidence: result.filterConfidence,
        };
      }),

    /**
     * Get filter result for a specific Q&A
     */
    getQaFilterResult: protectedProcedure
      .input(z.object({ qaId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const result = await ToxicityFilterService.getQaFilterResult(input.qaId);
        return result;
      }),

    /**
     * Get all flagged content for a conference
     */
    getFlaggedContent: protectedProcedure
      .input(z.object({ conferenceId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const flagged = await ToxicityFilterService.getFlaggedContent(input.conferenceId);
        return flagged;
      }),

    /**
     * Get filter statistics for a conference
     */
    getConferenceStats: protectedProcedure
      .input(z.object({ conferenceId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const stats = await ToxicityFilterService.getConferenceFilterStats(
          input.conferenceId
        );
        return stats;
      }),

    /**
     * Filter all pending Q&A questions for an event
     */
    filterEventQuestions: protectedProcedure
      .input(
        z.object({
          eventId: z.number().int().positive(),
          eventTitle: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await ToxicityFilterService.filterEventQuestions(
          input.eventId,
          input.eventTitle
        );
        return result;
      }),

    /**
     * Mark filter result as reviewed by moderator
     */
    markAsReviewed: protectedProcedure
      .input(
        z.object({
          filterId: z.number().int().positive(),
          action: z.enum(["approved", "rejected", "redacted", "escalated"]),
          notes: z.string().max(500).optional(),
          userId: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const success = await ToxicityFilterService.markAsReviewed(
          input.filterId,
          input.action,
          input.notes,
          input.userId || ctx.user?.id
        );
        return { success };
      }),
  }),
});
