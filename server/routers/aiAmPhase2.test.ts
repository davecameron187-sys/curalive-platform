/**
 * Vitest tests for AI Automated Moderator Phase 2: Auto-Muting System
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getMutingConfig,
  configureMutingSettings,
  evaluateSpeakerForMuting,
  trackSpeakerViolation,
  getSpeakerViolationCounts,
  applyMuting,
  removeMuting,
  getMutingStatistics,
} from "../_core/aiAmPhase2AutoMuting";

describe("AI-AM Phase 2: Auto-Muting System", () => {
  let testEventId = "test-event-123";
  const testSpeakerId = "speaker-001";
  const testSpeakerName = "John Doe";

  beforeEach(async () => {
    // Use unique event ID for each test to avoid state pollution
    testEventId = `test-event-${Date.now()}-${Math.random()}`;
  });

  describe("Muting Configuration", () => {
    it("should configure muting settings for an event", async () => {
      const config = await configureMutingSettings(testEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
        muteDuration: 30,
        autoUnmuteAfter: 5,
      });

      expect(config.eventId).toBe(testEventId);
      expect(config.enabled).toBe(true);
      expect(config.softMuteThreshold).toBe(2);
      expect(config.hardMuteThreshold).toBe(5);
    });

    it("should retrieve muting configuration", async () => {
      await configureMutingSettings(testEventId, {
        enabled: true,
        softMuteThreshold: 3,
      });

      const config = await getMutingConfig(testEventId);
      expect(config).not.toBeNull();
      expect(config?.softMuteThreshold).toBe(3);
    });

    it("should return null for unconfigured event", async () => {
      const config = await getMutingConfig("non-existent-event");
      expect(config).toBeNull();
    });

    it("should disable muting when enabled is false", async () => {
      await configureMutingSettings(testEventId, { enabled: false });

      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );

      expect(evaluation.shouldMute).toBe(false);
    });
  });

  describe("Speaker Violation Tracking", () => {
    it("should track speaker violations", async () => {
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );

      const violations = await getSpeakerViolationCounts(testEventId);
      expect(violations).toHaveLength(1);
      expect(violations[0].speakerId).toBe(testSpeakerId);
      expect(violations[0].violationCount).toBe(1);
    });

    it("should increment violation count for repeated violations", async () => {
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "harassment"
      );
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "profanity"
      );

      const violations = await getSpeakerViolationCounts(testEventId);
      expect(violations[0].violationCount).toBe(3);
    });

    it("should track multiple speakers separately", async () => {
      const speaker2Id = "speaker-002";
      const speaker2Name = "Jane Smith";

      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );
      await trackSpeakerViolation(
        testEventId,
        speaker2Id,
        speaker2Name,
        "harassment"
      );

      const violations = await getSpeakerViolationCounts(testEventId);
      expect(violations).toHaveLength(2);
      expect(violations[0].violationCount).toBe(1);
      expect(violations[1].violationCount).toBe(1);
    });

    it("should update last violation time", async () => {
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );

      const violations = await getSpeakerViolationCounts(testEventId);
      expect(violations[0].lastViolationTime).toBeInstanceOf(Date);
    });
  });

  describe("Speaker Evaluation for Muting", () => {
    beforeEach(async () => {
      await configureMutingSettings(testEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });
    });

    it("should not mute speaker below soft threshold", async () => {
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );

      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );

      expect(evaluation.shouldMute).toBe(false);
    });

    it("should soft mute speaker at soft threshold", async () => {
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "harassment"
      );

      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );

      expect(evaluation.shouldMute).toBe(true);
      expect(evaluation.muteType).toBe("soft");
    });

    it("should hard mute speaker at hard threshold", async () => {
      // Add 5 violations
      for (let i = 0; i < 5; i++) {
        await trackSpeakerViolation(
          testEventId,
          testSpeakerId,
          testSpeakerName,
          "abuse"
        );
      }

      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );

      expect(evaluation.shouldMute).toBe(true);
      expect(evaluation.muteType).toBe("hard");
    });

    it("should exclude speakers from muting", async () => {
      await configureMutingSettings(testEventId, {
        excludedSpeakers: [testSpeakerId],
      });

      // Add violations above threshold
      for (let i = 0; i < 5; i++) {
        await trackSpeakerViolation(
          testEventId,
          testSpeakerId,
          testSpeakerName,
          "abuse"
        );
      }

      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );

      expect(evaluation.shouldMute).toBe(false);
    });
  });

  describe("Muting Actions", () => {
    beforeEach(async () => {
      await configureMutingSettings(testEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });
    });

    it("should apply soft mute to speaker", async () => {
      const result = await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "operator-001"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("SOFT");
      expect(result.muteStartTime).toBeInstanceOf(Date);
    });

    it("should apply hard mute to speaker", async () => {
      const result = await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "hard",
        "operator-001"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("HARD");
    });

    it("should remove mute from speaker", async () => {
      await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "operator-001"
      );

      const result = await removeMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "operator-001"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("removed");
    });

    it("should track muting state", async () => {
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );

      await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "operator-001"
      );

      const violations = await getSpeakerViolationCounts(testEventId);
      const speaker = violations.find((v) => v.speakerId === testSpeakerId);

      expect(speaker).toBeDefined();
      expect(speaker?.isMuted).toBe(true);
      expect(speaker?.muteType).toBe("soft");
    });
  });

  describe("Muting Statistics", () => {
    beforeEach(async () => {
      await configureMutingSettings(testEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });
    });

    it("should calculate muting statistics", async () => {
      const speaker2Id = "speaker-002";
      const speaker2Name = "Jane Smith";

      // Add violations for speaker 1
      for (let i = 0; i < 3; i++) {
        await trackSpeakerViolation(
          testEventId,
          testSpeakerId,
          testSpeakerName,
          "abuse"
        );
      }

      // Add violations for speaker 2
      for (let i = 0; i < 6; i++) {
        await trackSpeakerViolation(
          testEventId,
          speaker2Id,
          speaker2Name,
          "abuse"
        );
      }

      // Apply mutes
      await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "operator-001"
      );
      await applyMuting(
        testEventId,
        speaker2Id,
        speaker2Name,
        "hard",
        "operator-001"
      );

      const stats = await getMutingStatistics(testEventId);

      expect(stats.totalSpeakers).toBe(2);
      expect(stats.speakersWithViolations).toBe(2);
      expect(stats.softMutedCount).toBe(1);
      expect(stats.hardMutedCount).toBe(1);
      expect(stats.totalMutingActions).toBe(2);
      expect(stats.averageViolationsPerSpeaker).toBe(4.5);
    });

    it("should report zero statistics for empty event", async () => {
      const emptyEventId = `empty-event-${Date.now()}-${Math.random()}`;
      const stats = await getMutingStatistics(emptyEventId);

      expect(stats.totalSpeakers).toBe(0);
      expect(stats.speakersWithViolations).toBe(0);
      expect(stats.softMutedCount).toBe(0);
      expect(stats.hardMutedCount).toBe(0);
      expect(stats.totalMutingActions).toBe(0);
      expect(stats.averageViolationsPerSpeaker).toBe(0);
    });
  });

  describe("Muting Workflow", () => {
    it("should handle complete soft mute workflow", async () => {
      const eventId = "workflow-test-1";
      // 1. Configure muting
      const config = await configureMutingSettings(eventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });
      expect(config).not.toBeNull();

      // 2. Track violations
      await trackSpeakerViolation(
        eventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );
      await trackSpeakerViolation(
        eventId,
        testSpeakerId,
        testSpeakerName,
        "harassment"
      );

      // 3. Evaluate for muting
      const evaluation = await evaluateSpeakerForMuting(
        eventId,
        testSpeakerId,
        testSpeakerName
      );
      expect(evaluation.shouldMute).toBe(true);
      expect(evaluation.muteType).toBe("soft");

      // 4. Apply mute
      const muteResult = await applyMuting(
        eventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "operator-001"
      );
      expect(muteResult.success).toBe(true);

      // 5. Verify muting state
      const violations = await getSpeakerViolationCounts(eventId);
      expect(violations[0].isMuted).toBe(true);

      // 6. Operator override (unmute)
      const unmuteResult = await removeMuting(
        eventId,
        testSpeakerId,
        testSpeakerName,
        "operator-001"
      );
      expect(unmuteResult.success).toBe(true);

      // 7. Verify unmuted state
      const finalViolations = await getSpeakerViolationCounts(eventId);
      expect(finalViolations[0].isMuted).toBe(false);
    });

    it("should handle escalation from soft to hard mute", async () => {
      const eventId = "workflow-test-2";
      const config = await configureMutingSettings(eventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });
      expect(config).not.toBeNull();

      // Add 2 violations and apply soft mute
      await trackSpeakerViolation(
        eventId,
        testSpeakerId,
        testSpeakerName,
        "abuse"
      );
      await trackSpeakerViolation(
        eventId,
        testSpeakerId,
        testSpeakerName,
        "harassment"
      );

      const softEval = await evaluateSpeakerForMuting(
        eventId,
        testSpeakerId,
        testSpeakerName
      );
      expect(softEval.shouldMute).toBe(true);
      expect(softEval.muteType).toBe("soft");

      // Add more violations to reach hard threshold
      for (let i = 0; i < 3; i++) {
        await trackSpeakerViolation(
          eventId,
          testSpeakerId,
          testSpeakerName,
          "abuse"
        );
      }

      const hardEval = await evaluateSpeakerForMuting(
        eventId,
        testSpeakerId,
        testSpeakerName
      );
      expect(hardEval.shouldMute).toBe(true);
      expect(hardEval.muteType).toBe("hard");
    });
  });

  describe("Error Handling", () => {
    it("should handle muting when configuration is missing", async () => {
      const unconfiguredEventId = `unconfigured-${Date.now()}-${Math.random()}`;
      const result = await applyMuting(
        unconfiguredEventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "operator-001"
      );

      // Should fail gracefully when config is missing
      expect(result.success).toBe(false);
      expect(result.message).toContain("configuration");
    });

    it("should handle evaluation when configuration is missing", async () => {
      const unconfiguredEventId = `unconfigured-${Date.now()}-${Math.random()}`;
      const evaluation = await evaluateSpeakerForMuting(
        unconfiguredEventId,
        testSpeakerId,
        testSpeakerName
      );

      expect(evaluation.shouldMute).toBe(false);
    });
  });
});
