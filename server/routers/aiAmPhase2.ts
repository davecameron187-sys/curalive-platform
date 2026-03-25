// @ts-nocheck
/**
 * tRPC Router for AI Automated Moderator Phase 2: Auto-Muting
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getMutingConfig,
  evaluateSpeakerForMuting,
  applyMuting,
  removeMuting,
  getSpeakerViolationCounts,
  evaluateAllSpeakersForMuting,
  configureMutingSettings,
  getMutingStatistics,
  MutingConfig,
} from "../_core/aiAmPhase2AutoMuting";

export const aiAmPhase2Router = router({
  /**
   * Get current muting configuration for an event
   */
  getMutingConfig: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const config = await getMutingConfig(input.eventId);
      return config || null;
    }),

  /**
   * Configure muting settings for an event
   */
  configureMuting: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        enabled: z.boolean().optional(),
        softMuteThreshold: z.number().min(1).optional(),
        hardMuteThreshold: z.number().min(1).optional(),
        muteDuration: z.number().min(0).optional(),
        autoUnmuteAfter: z.number().optional(),
        violationTypes: z.array(z.string()).optional(),
        excludedSpeakers: z.array(z.string()).optional(),
        operatorOverride: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify operator has permission to configure muting
      if (ctx.user.role !== "admin" && ctx.user.role !== "operator") {
        throw new Error("Insufficient permissions");
      }

      const config = await configureMutingSettings(input.eventId, {
        enabled: input.enabled,
        softMuteThreshold: input.softMuteThreshold,
        hardMuteThreshold: input.hardMuteThreshold,
        muteDuration: input.muteDuration,
        autoUnmuteAfter: input.autoUnmuteAfter,
        violationTypes: input.violationTypes,
        excludedSpeakers: input.excludedSpeakers,
        operatorOverride: input.operatorOverride,
      });

      console.log(`[AI-AM Phase 2] Muting configured for event ${input.eventId}`, config);

      return config;
    }),

  /**
   * Evaluate a specific speaker for muting
   */
  evaluateSpeaker: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        speakerId: z.string(),
        speakerName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const evaluation = await evaluateSpeakerForMuting(
        input.eventId,
        input.speakerId,
        input.speakerName
      );
      return evaluation;
    }),

  /**
   * Evaluate all speakers in an event for muting
   */
  evaluateAllSpeakers: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const evaluations = await evaluateAllSpeakersForMuting(input.eventId);
      return evaluations;
    }),

  /**
   * Apply muting to a speaker
   */
  applyMute: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        speakerId: z.string(),
        speakerName: z.string(),
        muteType: z.enum(["soft", "hard"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify operator has permission
      if (ctx.user.role !== "admin" && ctx.user.role !== "operator") {
        throw new Error("Insufficient permissions");
      }

      const result = await applyMuting(
        input.eventId,
        input.speakerId,
        input.speakerName,
        input.muteType,
        ctx.user.id.toString()
      );

      console.log(`[AI-AM Phase 2] Mute applied by operator ${ctx.user.id}`, result);

      return result;
    }),

  /**
   * Remove muting from a speaker
   */
  removeMute: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        speakerId: z.string(),
        speakerName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify operator has permission
      if (ctx.user.role !== "admin" && ctx.user.role !== "operator") {
        throw new Error("Insufficient permissions");
      }

      const result = await removeMuting(
        input.eventId,
        input.speakerId,
        input.speakerName,
        ctx.user.id.toString()
      );

      console.log(`[AI-AM Phase 2] Mute removed by operator ${ctx.user.id}`, result);

      return result;
    }),

  /**
   * Get speaker violation counts for an event
   */
  getSpeakerViolations: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const violations = await getSpeakerViolationCounts(input.eventId);
      return violations;
    }),

  /**
   * Get muting statistics for an event
   */
  getMutingStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const stats = await getMutingStatistics(input.eventId);
      return stats;
    }),
});

export default aiAmPhase2Router;
