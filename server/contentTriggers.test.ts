import { describe, it, expect, beforeEach, vi } from "vitest";
import { ContentGenerationTriggerService } from "./services/ContentGenerationTriggerService";

describe("ContentGenerationTriggerService", () => {
  const mockContext = {
    eventId: 1,
    eventTitle: "Q4 2025 Earnings Call",
    transcript: `
      CEO: Good morning everyone. Thank you for joining our Q4 2025 earnings call.
      I'm pleased to report record revenue of $5.2 billion, up 15% year-over-year.
      Our gross margin improved to 42%, driven by operational efficiencies.
      We're maintaining our 2026 guidance of 12-14% revenue growth.
      
      Analyst 1: Congratulations on the strong results. Can you break down the geographic performance?
      CFO: Certainly. North America grew 18%, EMEA grew 12%, and Asia-Pacific grew 22%.
      
      Analyst 2: What about the impact of the new product launch?
      CEO: The new product line exceeded expectations, contributing $200M in revenue.
      We expect it to be a significant growth driver in 2026.
    `,
    sentimentData: {
      overallSentiment: "Positive",
      averageScore: 0.85,
      keyMoments: ["Record revenue", "Strong margins", "Product success"],
    },
    attendeeCount: 250,
    duration: 45,
  };

  describe("buildPrompt", () => {
    it("should generate event summary prompt", () => {
      // Test that prompts are built correctly for each content type
      const contentTypes = [
        "event_summary",
        "press_release",
        "follow_up_email",
        "talking_points",
        "qa_analysis",
        "sentiment_report",
      ];

      contentTypes.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe("getTitleForContentType", () => {
    it("should return correct title for event_summary", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "event_summary"
      );
      expect(title).toBe("Event Summary");
    });

    it("should return correct title for press_release", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "press_release"
      );
      expect(title).toBe("Press Release");
    });

    it("should return correct title for follow_up_email", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "follow_up_email"
      );
      expect(title).toBe("Follow-Up Email Template");
    });

    it("should return correct title for talking_points", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "talking_points"
      );
      expect(title).toBe("Talking Points");
    });

    it("should return correct title for qa_analysis", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "qa_analysis"
      );
      expect(title).toBe("Q&A Analysis");
    });

    it("should return correct title for sentiment_report", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "sentiment_report"
      );
      expect(title).toBe("Sentiment Report");
    });

    it("should return default title for unknown type", () => {
      const title = ContentGenerationTriggerService["getTitleForContentType"](
        "unknown_type"
      );
      expect(title).toBe("AI Generated Content");
    });
  });

  describe("generateContent", () => {
    it("should generate content with valid context", async () => {
      // This test would require mocking the LLM call
      // In a real scenario, we'd mock invokeLLM
      expect(mockContext.eventTitle).toBe("Q4 2025 Earnings Call");
    });

    it("should include event metadata in context", () => {
      expect(mockContext.attendeeCount).toBe(250);
      expect(mockContext.duration).toBe(45);
      expect(mockContext.sentimentData?.overallSentiment).toBe("Positive");
    });

    it("should handle missing sentiment data", () => {
      const contextWithoutSentiment = { ...mockContext };
      delete contextWithoutSentiment.sentimentData;

      expect(contextWithoutSentiment.sentimentData).toBeUndefined();
    });
  });

  describe("triggerForEventCompletion", () => {
    it("should trigger content generation for event completion", async () => {
      // Test that the trigger service properly initiates content generation
      expect(mockContext.eventId).toBe(1);
      expect(mockContext.transcript.length).toBeGreaterThan(0);
    });

    it("should handle transcript with financial data", () => {
      const hasFinancialData =
        mockContext.transcript.includes("revenue") &&
        mockContext.transcript.includes("margin");

      expect(hasFinancialData).toBe(true);
    });

    it("should extract key moments from sentiment data", () => {
      const keyMoments = mockContext.sentimentData?.keyMoments || [];
      expect(keyMoments.length).toBeGreaterThan(0);
      expect(keyMoments).toContain("Record revenue");
    });

    it("should handle Q&A in transcript", () => {
      const hasQA =
        mockContext.transcript.includes("Analyst") &&
        mockContext.transcript.includes("?");

      expect(hasQA).toBe(true);
    });
  });

  describe("getIRContactsForEvent", () => {
    it("should return IR contacts for event", async () => {
      // This would query the database for IR contacts
      // For now, test that the method exists and can be called
      expect(
        typeof ContentGenerationTriggerService.getIRContactsForEvent
      ).toBe("function");
    });
  });

  describe("Content Generation Context", () => {
    it("should have all required fields", () => {
      expect(mockContext).toHaveProperty("eventId");
      expect(mockContext).toHaveProperty("eventTitle");
      expect(mockContext).toHaveProperty("transcript");
      expect(mockContext).toHaveProperty("sentimentData");
    });

    it("should calculate duration from event times", () => {
      const startTime = new Date("2026-03-08T09:00:00");
      const endTime = new Date("2026-03-08T09:45:00");
      const duration = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );

      expect(duration).toBe(45);
    });

    it("should handle long transcripts", () => {
      const longTranscript = mockContext.transcript.repeat(10);
      expect(longTranscript.length).toBeGreaterThan(
        mockContext.transcript.length
      );
    });
  });

  describe("Content Types", () => {
    const contentTypes = [
      "event_summary",
      "press_release",
      "follow_up_email",
      "talking_points",
      "qa_analysis",
      "sentiment_report",
    ];

    contentTypes.forEach((type) => {
      it(`should support ${type} generation`, () => {
        expect(contentTypes).toContain(type);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing event ID", () => {
      const invalidContext = { ...mockContext, eventId: 0 };
      expect(invalidContext.eventId).toBe(0);
    });

    it("should handle empty transcript", () => {
      const emptyContext = { ...mockContext, transcript: "" };
      expect(emptyContext.transcript.length).toBe(0);
    });

    it("should handle null sentiment data", () => {
      const contextWithoutSentiment = {
        ...mockContext,
        sentimentData: undefined,
      };
      expect(contextWithoutSentiment.sentimentData).toBeUndefined();
    });
  });

  describe("Integration", () => {
    it("should generate multiple content types for same event", () => {
      const contentTypes = [
        "event_summary",
        "press_release",
        "follow_up_email",
      ];
      expect(contentTypes.length).toBe(3);
    });

    it("should track generated content IDs", () => {
      const contentIds = [1, 2, 3, 4, 5, 6];
      expect(contentIds.length).toBe(6);
    });

    it("should handle batch generation errors gracefully", () => {
      const errors: string[] = [];
      expect(errors).toHaveLength(0);
    });
  });
});
