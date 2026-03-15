import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QaAutoTriageService } from "./services/QaAutoTriageService";
import { SpeakingPaceCoachService } from "./services/SpeakingPaceCoachService";
import { ToxicityFilterService } from "./services/ToxicityFilterService";

describe("AI Features - Q&A Auto-Triage, Speaking-Pace Coach, Toxicity Filter", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Q&A Auto-Triage Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe("QaAutoTriageService", () => {
    it("should classify an approved question correctly", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        1,
        "What are your plans for Q3 revenue growth?",
        { eventTitle: "Q4 Earnings Call" }
      );

      expect(result).toBeDefined();
      expect(result.classification).toBe("approved");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.triageScore).toBeGreaterThan(0);
      expect(result.reason).toBeDefined();
    });

    it("should detect price-sensitive questions", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        2,
        "What is your target stock price for next quarter?",
        { eventTitle: "Investor Day" }
      );

      expect(result).toBeDefined();
      expect(result.isSensitive).toBe(true);
      expect(result.sensitivityFlags).toContain("price_sensitive");
    });

    it("should detect off-topic questions", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        3,
        "What's your favorite pizza topping?",
        { eventTitle: "Board Meeting" }
      );

      expect(result).toBeDefined();
      expect(result.classification).toBe("off_topic");
    });

    it("should detect duplicate questions", async () => {
      const previousQuestions = [
        "What is your market share in Europe?",
        "How will you expand in Asia?",
      ];

      const result = await QaAutoTriageService.triageQuestion(
        4,
        "What is your market share in Europe?",
        { previousQuestions }
      );

      expect(result).toBeDefined();
      expect(result.isDuplicate).toBe(true);
    });

    it("should detect spam content", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        5,
        "BUY NOW! Click here for amazing deals on crypto!",
        { eventTitle: "Earnings Call" }
      );

      expect(result).toBeDefined();
      expect(result.classification).toBe("spam");
    });

    it("should handle unclear questions", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        6,
        "Blah blah something something?",
        { eventTitle: "Conference" }
      );

      expect(result).toBeDefined();
      expect(result.classification).toBe("unclear");
    });

    it("should provide confidence scores between 0-100", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        7,
        "Tell us about your product roadmap",
        { eventTitle: "Product Launch" }
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.triageScore).toBeGreaterThanOrEqual(0);
      expect(result.triageScore).toBeLessThanOrEqual(100);
    });

    it("should handle multiple sensitivity flags", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        8,
        "What are your undisclosed acquisition targets and their valuation?",
        { eventTitle: "Board Meeting" }
      );

      expect(result).toBeDefined();
      expect(result.isSensitive).toBe(true);
      expect(result.sensitivityFlags.length).toBeGreaterThan(0);
    });

    it("should fallback gracefully on error", async () => {
      // This should not throw and return a safe default
      const result = await QaAutoTriageService.triageQuestion(
        9,
        "Test question",
        { eventTitle: "Test Event" }
      );

      expect(result).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Speaking-Pace Coach Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe("SpeakingPaceCoachService", () => {
    it("should calculate ideal pace score for 130 WPM", () => {
      // Test the pace score calculation
      // 130 WPM should be close to 100 (ideal range 120-150)
      const paceScore = (SpeakingPaceCoachService as any).calculatePaceScore(130);
      expect(paceScore).toBeGreaterThan(90);
    });

    it("should penalize too-slow speaking (80 WPM)", () => {
      const paceScore = (SpeakingPaceCoachService as any).calculatePaceScore(80);
      expect(paceScore).toBeLessThan(70);
    });

    it("should penalize too-fast speaking (180 WPM)", () => {
      const paceScore = (SpeakingPaceCoachService as any).calculatePaceScore(180);
      expect(paceScore).toBeLessThan(70);
    });

    it("should calculate ideal pause score for 500ms", () => {
      const pauseScore = (SpeakingPaceCoachService as any).calculatePauseScore(500);
      expect(pauseScore).toBeGreaterThan(90);
    });

    it("should penalize too-short pauses (100ms)", () => {
      const pauseScore = (SpeakingPaceCoachService as any).calculatePauseScore(100);
      expect(pauseScore).toBeLessThan(50);
    });

    it("should penalize too-long pauses (1500ms)", () => {
      const pauseScore = (SpeakingPaceCoachService as any).calculatePauseScore(1500);
      expect(pauseScore).toBeLessThan(50);
    });

    it("should calculate filler score with no fillers", () => {
      const fillerScore = (SpeakingPaceCoachService as any).calculateFillerScore(0, 5);
      expect(fillerScore).toBe(100);
    });

    it("should penalize excessive filler words", () => {
      const fillerScore = (SpeakingPaceCoachService as any).calculateFillerScore(30, 5); // 6 fillers per minute
      expect(fillerScore).toBeLessThan(70);
    });

    it("should get correct pace label for 100 WPM (too_slow)", () => {
      const label = (SpeakingPaceCoachService as any).getPaceLabel(100);
      expect(label).toBe("too_slow");
    });

    it("should get correct pace label for 130 WPM (normal)", () => {
      const label = (SpeakingPaceCoachService as any).getPaceLabel(130);
      expect(label).toBe("normal");
    });

    it("should get correct pace label for 180 WPM (too_fast)", () => {
      const label = (SpeakingPaceCoachService as any).getPaceLabel(180);
      expect(label).toBe("too_fast");
    });

    it("should get correct coaching level for excellent score", () => {
      const level = (SpeakingPaceCoachService as any).getCoachingLevel(90);
      expect(level).toBe("excellent");
    });

    it("should get correct coaching level for good score", () => {
      const level = (SpeakingPaceCoachService as any).getCoachingLevel(75);
      expect(level).toBe("good");
    });

    it("should get correct coaching level for needs_improvement score", () => {
      const level = (SpeakingPaceCoachService as any).getCoachingLevel(60);
      expect(level).toBe("needs_improvement");
    });

    it("should get correct coaching level for critical score", () => {
      const level = (SpeakingPaceCoachService as any).getCoachingLevel(30);
      expect(level).toBe("critical");
    });

    it("should generate coaching tip for slow speech", () => {
      const tip = (SpeakingPaceCoachService as any).generateCoachingTip(80, 500, 2, 5);
      expect(tip).toContain("slow");
    });

    it("should generate coaching tip for fast speech", () => {
      const tip = (SpeakingPaceCoachService as any).generateCoachingTip(180, 500, 2, 5);
      expect(tip).toContain("fast");
    });

    it("should generate coaching tip for excessive fillers", () => {
      const tip = (SpeakingPaceCoachService as any).generateCoachingTip(130, 500, 30, 5);
      expect(tip).toContain("filler");
    });

    it("should generate positive tip for excellent delivery", () => {
      const tip = (SpeakingPaceCoachService as any).generateCoachingTip(130, 500, 2, 5);
      expect(tip).toContain("Great");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Toxicity Filter Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe("ToxicityFilterService", () => {
    it("should classify safe content as safe", async () => {
      const result = await ToxicityFilterService.filterContent(
        "What is your strategy for sustainable growth?",
        "qa_question",
        { eventTitle: "Investor Day" }
      );

      expect(result).toBeDefined();
      expect(result.riskLevel).toBe("safe");
      expect(result.isFlagged).toBe(false);
      expect(result.toxicityScore).toBeLessThan(30);
    });

    it("should detect price-sensitive content", async () => {
      const result = await ToxicityFilterService.filterContent(
        "What is your target stock price and earnings per share projection?",
        "qa_question",
        { eventTitle: "Earnings Call" }
      );

      expect(result).toBeDefined();
      expect(result.isPriceSensitive).toBe(true);
    });

    it("should detect confidential information", async () => {
      const result = await ToxicityFilterService.filterContent(
        "When will you announce the acquisition we discussed in the board meeting?",
        "qa_question",
        { eventTitle: "Board Meeting" }
      );

      expect(result).toBeDefined();
      expect(result.isConfidential).toBe(true);
    });

    it("should detect legal risks", async () => {
      const result = await ToxicityFilterService.filterContent(
        "How will the pending litigation affect your financial results?",
        "qa_question",
        { eventTitle: "Investor Call" }
      );

      expect(result).toBeDefined();
      expect(result.isLegalRisk).toBe(true);
    });

    it("should detect abusive content", async () => {
      const result = await ToxicityFilterService.filterContent(
        "You are all incompetent fools!",
        "qa_question",
        { eventTitle: "Conference" }
      );

      expect(result).toBeDefined();
      expect(result.isAbusive).toBe(true);
      expect(result.isFlagged).toBe(true);
    });

    it("should detect spam content", async () => {
      const result = await ToxicityFilterService.filterContent(
        "BUY CRYPTO NOW! Click here for free money!",
        "qa_question",
        { eventTitle: "Earnings Call" }
      );

      expect(result).toBeDefined();
      expect(result.isSpam).toBe(true);
    });

    it("should provide confidence scores between 0-100", async () => {
      const result = await ToxicityFilterService.filterContent(
        "What are your expansion plans?",
        "qa_question"
      );

      expect(result.filterConfidence).toBeGreaterThanOrEqual(0);
      expect(result.filterConfidence).toBeLessThanOrEqual(100);
      expect(result.toxicityScore).toBeGreaterThanOrEqual(0);
      expect(result.toxicityScore).toBeLessThanOrEqual(100);
    });

    it("should flag content with multiple issues", async () => {
      const result = await ToxicityFilterService.filterContent(
        "You idiots! When will you announce the secret acquisition at $X price?",
        "qa_question",
        { eventTitle: "Board Call" }
      );

      expect(result).toBeDefined();
      expect(result.isFlagged).toBe(true);
      expect(result.detectedIssues.length).toBeGreaterThan(0);
    });

    it("should recommend appropriate actions", async () => {
      const result = await ToxicityFilterService.filterContent(
        "What is your market strategy?",
        "qa_question"
      );

      expect(result.recommendedAction).toBeDefined();
      expect(["approve", "review", "flag_moderator", "block", "redact"]).toContain(
        result.recommendedAction
      );
    });

    it("should handle different content types", async () => {
      const qaResult = await ToxicityFilterService.filterContent(
        "Safe question",
        "qa_question"
      );
      const segmentResult = await ToxicityFilterService.filterContent(
        "Safe spoken content",
        "spoken_segment"
      );
      const chatResult = await ToxicityFilterService.filterContent(
        "Safe chat message",
        "chat_message"
      );

      expect(qaResult).toBeDefined();
      expect(segmentResult).toBeDefined();
      expect(chatResult).toBeDefined();
    });

    it("should fallback gracefully on error", async () => {
      const result = await ToxicityFilterService.filterContent(
        "Test content",
        "qa_question"
      );

      expect(result).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.recommendedAction).toBeDefined();
    });

    it("should detect multiple types of issues in one content", async () => {
      const result = await ToxicityFilterService.filterContent(
        "You're terrible! Also, what's the secret valuation of the acquisition?",
        "qa_question"
      );

      expect(result).toBeDefined();
      expect(result.detectedIssues.length).toBeGreaterThanOrEqual(1);
      const issueTypes = result.detectedIssues.map((i) => i.type);
      expect(issueTypes.length).toBeGreaterThan(0);
    });

    it("should assign severity levels to detected issues", async () => {
      const result = await ToxicityFilterService.filterContent(
        "Abusive content with price-sensitive data",
        "qa_question"
      );

      expect(result).toBeDefined();
      result.detectedIssues.forEach((issue) => {
        expect(["low", "medium", "high"]).toContain(issue.severity);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Integration Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe("Integration - All Three Features", () => {
    it("should handle a complex question with all three services", async () => {
      const question = "What are your undisclosed acquisition targets at $X price?";

      // Test Q&A Triage
      const triageResult = await QaAutoTriageService.triageQuestion(
        100,
        question,
        { eventTitle: "Board Meeting" }
      );
      expect(triageResult).toBeDefined();
      expect(triageResult.isSensitive).toBe(true);

      // Test Toxicity Filter
      const filterResult = await ToxicityFilterService.filterContent(
        question,
        "qa_question",
        { eventTitle: "Board Meeting" }
      );
      expect(filterResult).toBeDefined();
      expect(filterResult.isPriceSensitive).toBe(true);
      expect(filterResult.isConfidential).toBe(true);

      // Both should flag this as problematic
      expect(triageResult.isSensitive).toBe(true);
      expect(filterResult.isFlagged).toBe(true);
    });

    it("should handle a safe question with all three services", async () => {
      const question = "What is your vision for the next five years?";

      // Test Q&A Triage
      const triageResult = await QaAutoTriageService.triageQuestion(
        101,
        question,
        { eventTitle: "Investor Day" }
      );
      expect(triageResult.classification).toBe("approved");

      // Test Toxicity Filter
      const filterResult = await ToxicityFilterService.filterContent(
        question,
        "qa_question",
        { eventTitle: "Investor Day" }
      );
      expect(filterResult.riskLevel).toBe("safe");
      expect(filterResult.isFlagged).toBe(false);
    });

    it("should handle speaking pace analysis with realistic metrics", () => {
      // Test with various WPM values
      const wpmValues = [80, 120, 130, 150, 180];

      wpmValues.forEach((wpm) => {
        const paceScore = (SpeakingPaceCoachService as any).calculatePaceScore(wpm);
        const label = (SpeakingPaceCoachService as any).getPaceLabel(wpm);

        expect(paceScore).toBeGreaterThanOrEqual(0);
        expect(paceScore).toBeLessThanOrEqual(100);
        expect(["too_slow", "slow", "normal", "fast", "too_fast"]).toContain(label);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error Handling Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe("Error Handling", () => {
    it("QaAutoTriageService should handle empty questions", async () => {
      const result = await QaAutoTriageService.triageQuestion(
        200,
        "",
        { eventTitle: "Test" }
      );

      expect(result).toBeDefined();
      expect(result.classification).toBeDefined();
    });

    it("ToxicityFilterService should handle very long content", async () => {
      const longContent = "test ".repeat(1000);
      const result = await ToxicityFilterService.filterContent(
        longContent,
        "qa_question"
      );

      expect(result).toBeDefined();
      expect(result.riskLevel).toBeDefined();
    });

    it("SpeakingPaceCoachService should handle edge case WPM values", () => {
      const edgeCases = [0, 1, 50, 200, 300, 500];

      edgeCases.forEach((wpm) => {
        const paceScore = (SpeakingPaceCoachService as any).calculatePaceScore(wpm);
        expect(paceScore).toBeGreaterThanOrEqual(0);
        expect(paceScore).toBeLessThanOrEqual(100);
      });
    });

    it("SpeakingPaceCoachService should handle edge case pause values", () => {
      const edgeCases = [0, 100, 500, 1000, 2000, 3000];

      edgeCases.forEach((pauseMs) => {
        const pauseScore = (SpeakingPaceCoachService as any).calculatePauseScore(pauseMs);
        expect(pauseScore).toBeGreaterThanOrEqual(0);
        expect(pauseScore).toBeLessThanOrEqual(100);
      });
    });
  });
});
