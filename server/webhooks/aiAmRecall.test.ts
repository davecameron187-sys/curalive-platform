/**
 * Integration tests for Recall.ai webhook → Phase 2 auto-muting flow
 * Tests the complete end-to-end flow from transcript detection to automatic speaker muting
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getMutingConfig,
  configureMutingSettings,
  trackSpeakerViolation,
  evaluateSpeakerForMuting,
  applyMuting,
  getSpeakerViolationCounts,
} from "../_core/aiAmPhase2AutoMuting";

describe("Recall.ai Webhook → Phase 2 Auto-Muting Integration", () => {
  const testEventId = "integration-test-event";
  const testMeetingId = "recall-meeting-123";
  const testSpeakerId = "speaker-recall-001";
  const testSpeakerName = "John Investor";

  beforeEach(async () => {
    // Configure muting for the test event
    await configureMutingSettings(testEventId, {
      enabled: true,
      softMuteThreshold: 2,
      hardMuteThreshold: 5,
      muteDuration: 30,
      autoUnmuteAfter: 5,
    });
  });

  describe("Transcript Segment → Violation Detection → Auto-Muting", () => {
    it("should track violation from Recall transcript segment", async () => {
      const trackEventId = `track-event-${Date.now()}`;
      await configureMutingSettings(trackEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });

      const trackSpeakerId = `track-speaker-${Date.now()}`;

      // Simulate Recall.ai webhook sending a transcript segment with violation
      const violationType = "forward_looking";
      const violationText =
        "We expect revenue to grow 50% next quarter based on our pipeline";

      // Track the violation (simulating what detectViolation + createViolationAlert does)
      await trackSpeakerViolation(
        trackEventId,
        trackSpeakerId,
        testSpeakerName,
        violationType
      );

      // Verify violation was recorded
      const violations = await getSpeakerViolationCounts(trackEventId);
      expect(violations).toHaveLength(1);
      expect(violations[0].speakerName).toBe(testSpeakerName);
      expect(violations[0].violationCount).toBe(1);
    });

    it("should evaluate speaker for muting after single violation", async () => {
      // First violation
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "forward_looking"
      );

      // Evaluate - should not mute yet (below soft threshold of 2)
      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );
      expect(evaluation.shouldMute).toBe(false);
    });

    it("should soft mute speaker after reaching soft threshold", async () => {
      // Add 2 violations to reach soft threshold
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "forward_looking"
      );
      await trackSpeakerViolation(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "price_sensitive"
      );

      // Evaluate - should soft mute (at threshold of 2)
      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );
      expect(evaluation.shouldMute).toBe(true);
      expect(evaluation.muteType).toBe("soft");

      // Apply the mute
      const muteResult = await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "soft",
        "system-auto"
      );
      expect(muteResult.success).toBe(true);
      expect(muteResult.message).toContain("SOFT");

      // Verify muting state
      const violations = await getSpeakerViolationCounts(testEventId);
      const speaker = violations.find((v) => v.speakerId === testSpeakerId);
      expect(speaker?.isMuted).toBe(true);
      expect(speaker?.muteType).toBe("soft");
    });

    it("should escalate to hard mute after exceeding hard threshold", async () => {
      // Add violations to exceed hard threshold (5)
      for (let i = 0; i < 5; i++) {
        await trackSpeakerViolation(
          testEventId,
          testSpeakerId,
          testSpeakerName,
          "forward_looking"
        );
      }

      // Evaluate - should hard mute
      const evaluation = await evaluateSpeakerForMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName
      );
      expect(evaluation.shouldMute).toBe(true);
      expect(evaluation.muteType).toBe("hard");

      // Apply the hard mute
      const muteResult = await applyMuting(
        testEventId,
        testSpeakerId,
        testSpeakerName,
        "hard",
        "system-auto"
      );
      expect(muteResult.success).toBe(true);
      expect(muteResult.message).toContain("HARD");

      // Verify hard muting state
      const violations = await getSpeakerViolationCounts(testEventId);
      const speaker = violations.find((v) => v.speakerId === testSpeakerId);
      expect(speaker?.isMuted).toBe(true);
      expect(speaker?.muteType).toBe("hard");
    });
  });

  describe("Multiple Speakers in Single Event", () => {
    it("should track violations independently for each speaker", async () => {
      const multiEventId = `multi-speaker-event-${Date.now()}`;
      await configureMutingSettings(multiEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });

      const speaker1Id = `speaker-1-${Date.now()}`;
      const speaker1Name = "John Investor";
      const speaker2Id = `speaker-2-${Date.now()}`;
      const speaker2Name = "Jane Analyst";

      // Speaker 1: 2 violations (soft mute threshold)
      await trackSpeakerViolation(
        multiEventId,
        speaker1Id,
        speaker1Name,
        "forward_looking"
      );
      await trackSpeakerViolation(
        multiEventId,
        speaker1Id,
        speaker1Name,
        "price_sensitive"
      );

      // Speaker 2: 1 violation (no mute)
      await trackSpeakerViolation(
        multiEventId,
        speaker2Id,
        speaker2Name,
        "forward_looking"
      );

      // Get violation counts
      const violations = await getSpeakerViolationCounts(multiEventId);
      expect(violations).toHaveLength(2);

      // Speaker 1 should be at soft mute threshold
      const speaker1 = violations.find((v) => v.speakerId === speaker1Id);
      expect(speaker1?.violationCount).toBe(2);

      // Speaker 2 should be below threshold
      const speaker2 = violations.find((v) => v.speakerId === speaker2Id);
      expect(speaker2?.violationCount).toBe(1);

      // Evaluate each speaker
      const eval1 = await evaluateSpeakerForMuting(
        multiEventId,
        speaker1Id,
        speaker1Name
      );
      expect(eval1.shouldMute).toBe(true);
      expect(eval1.muteType).toBe("soft");

      const eval2 = await evaluateSpeakerForMuting(
        multiEventId,
        speaker2Id,
        speaker2Name
      );
      expect(eval2.shouldMute).toBe(false);
    });
  });

  describe("Real-time Recall Webhook Simulation", () => {
    it("should process rapid-fire transcript segments and auto-mute", async () => {
      const rapidEventId = `rapid-fire-event-${Date.now()}`;
      await configureMutingSettings(rapidEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });

      // Simulate rapid Recall.ai webhook calls with violation segments
      const violationSegments = [
        {
          text: "We expect to grow 50% next quarter",
          type: "forward_looking",
        },
        {
          text: "Our stock price will likely increase based on this deal",
          type: "price_sensitive",
        },
        {
          text: "We have non-public information about the acquisition",
          type: "insider_info",
        },
        {
          text: "The board decided this morning to pursue the merger",
          type: "insider_info",
        },
        {
          text: "We're confident this will boost shareholder value significantly",
          type: "forward_looking",
        },
      ];

      // Process each segment
      for (let i = 0; i < violationSegments.length; i++) {
        const segment = violationSegments[i];

        // Track violation
        await trackSpeakerViolation(
          rapidEventId,
          testSpeakerId,
          testSpeakerName,
          segment.type
        );

        // Evaluate for muting
        const evaluation = await evaluateSpeakerForMuting(
          rapidEventId,
          testSpeakerId,
          testSpeakerName
        );

        // At 2 violations, should soft mute
        if (i === 1) {
          expect(evaluation.shouldMute).toBe(true);
          expect(evaluation.muteType).toBe("soft");

          // Apply soft mute
          const muteResult = await applyMuting(
            rapidEventId,
            testSpeakerId,
            testSpeakerName,
            "soft",
            "system-auto"
          );
          expect(muteResult.success).toBe(true);
        }

        // At 5 violations, should hard mute
        if (i === 4) {
          expect(evaluation.shouldMute).toBe(true);
          expect(evaluation.muteType).toBe("hard");

          // Apply hard mute
          const muteResult = await applyMuting(
            rapidEventId,
            testSpeakerId,
            testSpeakerName,
            "hard",
            "system-auto"
          );
          expect(muteResult.success).toBe(true);
        }
      }

      // Verify final state
      const violations = await getSpeakerViolationCounts(rapidEventId);
      const speaker = violations.find((v) => v.speakerId === testSpeakerId);
      expect(speaker?.violationCount).toBe(5);
      expect(speaker?.isMuted).toBe(true);
      expect(speaker?.muteType).toBe("hard");
    });
  });

  describe("Configuration and Threshold Management", () => {
    it("should respect custom threshold configuration", async () => {
      const customEventId = `custom-threshold-event-${Date.now()}`;
      const customSpeakerId = `custom-speaker-${Date.now()}`;

      // Configure with custom thresholds
      await configureMutingSettings(customEventId, {
        enabled: true,
        softMuteThreshold: 3, // Custom: 3 instead of 2
        hardMuteThreshold: 7, // Custom: 7 instead of 5
      });

      // Add 2 violations - should NOT mute (below custom threshold of 3)
      await trackSpeakerViolation(
        customEventId,
        customSpeakerId,
        testSpeakerName,
        "forward_looking"
      );
      await trackSpeakerViolation(
        customEventId,
        customSpeakerId,
        testSpeakerName,
        "price_sensitive"
      );

      const eval1 = await evaluateSpeakerForMuting(
        customEventId,
        customSpeakerId,
        testSpeakerName
      );
      expect(eval1.shouldMute).toBe(false);

      // Add 3rd violation - should soft mute (at custom threshold of 3)
      await trackSpeakerViolation(
        customEventId,
        customSpeakerId,
        testSpeakerName,
        "insider_info"
      );

      const eval2 = await evaluateSpeakerForMuting(
        customEventId,
        customSpeakerId,
        testSpeakerName
      );
      expect(eval2.shouldMute).toBe(true);
      expect(eval2.muteType).toBe("soft");
    });

    it("should disable muting when configuration is disabled", async () => {
      const disabledEventId = `disabled-muting-event-${Date.now()}`;
      const disabledSpeakerId = `disabled-speaker-${Date.now()}`;

      // Configure with muting disabled
      await configureMutingSettings(disabledEventId, {
        enabled: false,
      });

      // Add many violations
      for (let i = 0; i < 10; i++) {
        await trackSpeakerViolation(
          disabledEventId,
          disabledSpeakerId,
          testSpeakerName,
          "forward_looking"
        );
      }

      // Should never mute
      const evaluation = await evaluateSpeakerForMuting(
        disabledEventId,
        disabledSpeakerId,
        testSpeakerName
      );
      expect(evaluation.shouldMute).toBe(false);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing speaker name gracefully", async () => {
      const unknownEventId = `unknown-speaker-event-${Date.now()}`;
      await configureMutingSettings(unknownEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });

      const unknownSpeakerId = `unknown-speaker-${Date.now()}`;
      const unknownSpeakerName = "Unknown Speaker";

      // Track violation for unknown speaker
      await trackSpeakerViolation(
        unknownEventId,
        unknownSpeakerId,
        unknownSpeakerName,
        "forward_looking"
      );

      // Should still work
      const violations = await getSpeakerViolationCounts(unknownEventId);
      expect(violations.some((v) => v.speakerId === unknownSpeakerId)).toBe(
        true
      );
    });

    it("should handle concurrent violations from same speaker", async () => {
      const concurrentEventId = `concurrent-event-${Date.now()}`;
      const concurrentSpeakerId = `concurrent-speaker-${Date.now()}`;
      await configureMutingSettings(concurrentEventId, {
        enabled: true,
        softMuteThreshold: 2,
        hardMuteThreshold: 5,
      });

      // Simulate rapid violations from the same speaker
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          trackSpeakerViolation(
            concurrentEventId,
            concurrentSpeakerId,
            testSpeakerName,
            "forward_looking"
          )
        );
      }

      await Promise.all(promises);

      // Should have 5 violations
      const violations = await getSpeakerViolationCounts(concurrentEventId);
      const speaker = violations.find((v) => v.speakerId === concurrentSpeakerId);
      expect(speaker?.violationCount).toBe(5);
    });
  });
});
