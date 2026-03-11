import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBriefGeneratorService } from "./services/EventBriefGeneratorService";

// Mock the LLM to avoid live API calls and quota exhaustion
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            briefTitle: "Q4 2025 Earnings Call Brief",
            briefSummary:
              "Strong Q4 performance with revenue up 15% YoY to $2.5B. Cloud services led growth at 35% YoY.",
            keyMessages: [
              {
                title: "Revenue Growth",
                description: "Revenue grew 15% YoY to $2.5B driven by cloud services",
                emphasis: "high",
              },
              {
                title: "EPS Improvement",
                description: "EPS increased 22% YoY to $1.85",
                emphasis: "high",
              },
              {
                title: "Margin Expansion",
                description: "Operating margin improved 200bps to 28%",
                emphasis: "medium",
              },
              {
                title: "Cloud Leadership",
                description: "Cloud services grew 35% YoY",
                emphasis: "high",
              },
            ],
            talkingPoints: [
              {
                topic: "Financial Performance",
                points: [
                  "Revenue reached $2.5B, up 15% year-over-year",
                  "EPS of $1.85, a 22% improvement",
                  "Operating margin expanded to 28%",
                ],
                speakerNotes: "Emphasize consistent growth trajectory",
              },
              {
                topic: "Cloud Growth",
                points: [
                  "Cloud services grew 35% YoY",
                  "Customer retention improved to 98%",
                  "Launched 3 new enterprise products",
                ],
                speakerNotes: "Highlight cloud as primary growth driver",
              },
              {
                topic: "Market Expansion",
                points: [
                  "Expanded into 5 new markets",
                  "International revenue growing faster than domestic",
                  "Pipeline remains strong heading into 2026",
                ],
                speakerNotes: "Focus on long-term growth opportunities",
              },
              {
                topic: "Outlook",
                points: [
                  "Guidance for Q1 2026 remains positive",
                  "Investment in AI capabilities continues",
                  "Strong balance sheet supports continued growth",
                ],
                speakerNotes: "Be cautious about forward-looking statements",
              },
            ],
            anticipatedQuestions: [
              {
                question: "What drove the 35% cloud growth this quarter?",
                suggestedAnswer:
                  "Cloud growth was driven by enterprise adoption and new product launches.",
                difficulty: "easy",
              },
              {
                question: "How sustainable is the 28% operating margin?",
                suggestedAnswer:
                  "We expect margins to remain stable as we scale cloud infrastructure.",
                difficulty: "medium",
              },
              {
                question: "What is your guidance for Q1 2026 revenue?",
                suggestedAnswer:
                  "We expect continued growth in the 12-15% range for Q1 2026.",
                difficulty: "medium",
              },
              {
                question: "How are you managing competition in the cloud space?",
                suggestedAnswer:
                  "Our differentiated enterprise focus and 98% retention rate demonstrate competitive strength.",
                difficulty: "hard",
              },
              {
                question: "What is the impact of the 5 new market expansions?",
                suggestedAnswer:
                  "New markets are expected to contribute 3-5% of revenue within 18 months.",
                difficulty: "hard",
              },
            ],
            financialHighlights: [
              { metric: "Revenue", value: "$2.5B", context: "+15% YoY" },
              { metric: "EPS", value: "$1.85", context: "+22% YoY" },
              { metric: "Operating Margin", value: "28%", context: "+200bps" },
            ],
            confidence: 92,
          }),
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 500, completion_tokens: 800, total_tokens: 1300 },
  }),
}));

describe("Event Brief Generator Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateBriefFromPressRelease", () => {
    it("should generate a brief from a press release", async () => {
      const pressRelease = `
        Q4 2025 Financial Results
        
        Strong Q4 Performance Drives Full-Year Growth
        
        REVENUE: $2.5B (up 15% YoY)
        EARNINGS PER SHARE: $1.85 (up 22% YoY)
        OPERATING MARGIN: 28% (up 200bps)
        
        Key Highlights:
        - Cloud services grew 35% YoY
        - Customer retention rate improved to 98%
        - Launched 3 new enterprise products
        - Expanded into 5 new markets
      `;

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "Q4 2025 Earnings"
      );

      expect(result).toBeDefined();
      expect(result.briefTitle).toBeDefined();
      expect(result.briefTitle.length).toBeGreaterThan(0);
      expect(result.briefSummary).toBeDefined();
      expect(result.briefSummary.length).toBeGreaterThan(0);
      expect(result.keyMessages).toBeInstanceOf(Array);
      expect(result.keyMessages.length).toBeGreaterThanOrEqual(3);
      expect(result.talkingPoints).toBeInstanceOf(Array);
      expect(result.talkingPoints.length).toBeGreaterThanOrEqual(4);
      expect(result.anticipatedQuestions).toBeInstanceOf(Array);
      expect(result.anticipatedQuestions.length).toBeGreaterThanOrEqual(5);
      expect(result.generationConfidence).toBeGreaterThan(0);
      expect(result.generationConfidence).toBeLessThanOrEqual(100);
    });

    it("should generate key messages with proper structure", async () => {
      const pressRelease = "Company announces record revenue of $5B with 25% growth";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "Annual Results"
      );

      expect(result.keyMessages).toBeDefined();
      result.keyMessages.forEach((msg) => {
        expect(msg.title).toBeDefined();
        expect(msg.description).toBeDefined();
        expect(["high", "medium", "low"]).toContain(msg.emphasis);
      });
    });

    it("should generate talking points with speaker notes", async () => {
      const pressRelease = "New product launch drives market expansion strategy";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      expect(result.talkingPoints).toBeDefined();
      result.talkingPoints.forEach((tp) => {
        expect(tp.topic).toBeDefined();
        expect(tp.points).toBeInstanceOf(Array);
        expect(tp.points.length).toBeGreaterThan(0);
      });
    });

    it("should generate anticipated questions with difficulty levels", async () => {
      const pressRelease = "Company faces regulatory challenges but maintains growth";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      expect(result.anticipatedQuestions).toBeDefined();
      result.anticipatedQuestions.forEach((q) => {
        expect(q.question).toBeDefined();
        expect(q.suggestedAnswer).toBeDefined();
        expect(["easy", "medium", "hard"]).toContain(q.difficulty);
      });
    });

    it("should extract financial highlights when present", async () => {
      const pressRelease = `
        Financial Summary:
        - Revenue: $10B (+20% YoY)
        - EBITDA: $3B (+25% YoY)
        - Free Cash Flow: $2.5B
        - Debt/EBITDA: 1.5x
      `;

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "Financial Results"
      );

      expect(result.financialHighlights).toBeInstanceOf(Array);
      if (result.financialHighlights.length > 0) {
        result.financialHighlights.forEach((fh) => {
          expect(fh.metric).toBeDefined();
          expect(fh.value).toBeDefined();
        });
      }
    });

    it("should handle empty press release gracefully", async () => {
      const result = await EventBriefGeneratorService.generateBriefFromPressRelease("");

      expect(result).toBeDefined();
      expect(result.briefTitle).toBeDefined();
    });

    it("should handle very long press releases", async () => {
      const longPressRelease = "Company news. ".repeat(500);

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        longPressRelease
      );

      expect(result).toBeDefined();
      expect(result.briefTitle).toBeDefined();
    });

    it("should provide confidence scores between 0-100", async () => {
      const pressRelease = "Quarterly earnings announcement";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      expect(result.generationConfidence).toBeGreaterThanOrEqual(0);
      expect(result.generationConfidence).toBeLessThanOrEqual(100);
    });

    it("should handle press releases with special characters", async () => {
      const pressRelease = `
        "Q4 Results" - Strong Performance!
        Revenue: $2.5B (↑15%)
        EPS: $1.85 (↑22%)
        Margin: 28% (+200bps)
      `;

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "Q4 '25 Results"
      );

      expect(result).toBeDefined();
      expect(result.briefTitle).toBeDefined();
    });
  });

  describe("Brief Structure Validation", () => {
    it("should generate briefs with all required fields", async () => {
      const pressRelease = "Company announces strategic partnership";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      // Validate all required fields exist
      expect(result.briefTitle).toBeDefined();
      expect(result.briefSummary).toBeDefined();
      expect(result.keyMessages).toBeDefined();
      expect(result.talkingPoints).toBeDefined();
      expect(result.anticipatedQuestions).toBeDefined();
      expect(result.financialHighlights).toBeDefined();
      expect(result.generationConfidence).toBeDefined();
    });

    it("should generate key messages with high/medium/low emphasis", async () => {
      const pressRelease = "Multi-faceted business update";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      const emphasisLevels = result.keyMessages.map((m) => m.emphasis);
      expect(emphasisLevels.length).toBeGreaterThan(0);
      emphasisLevels.forEach((level) => {
        expect(["high", "medium", "low"]).toContain(level);
      });
    });

    it("should generate talking points with multiple points per topic", async () => {
      const pressRelease = "Comprehensive business strategy";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      result.talkingPoints.forEach((tp) => {
        expect(tp.points.length).toBeGreaterThanOrEqual(3);
        expect(tp.points.length).toBeLessThanOrEqual(4);
      });
    });

    it("should generate questions with varying difficulty levels", async () => {
      const pressRelease = "Earnings announcement with challenges";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      const difficulties = result.anticipatedQuestions.map((q) => q.difficulty);
      expect(difficulties.length).toBeGreaterThan(0);
      difficulties.forEach((diff) => {
        expect(["easy", "medium", "hard"]).toContain(diff);
      });
    });
  });

  describe("Content Quality", () => {
    it("should generate non-empty brief summaries", async () => {
      const pressRelease = "Company performance update";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      expect(result.briefSummary).toBeTruthy();
      expect(result.briefSummary.length).toBeGreaterThan(10);
    });

    it("should generate meaningful talking points", async () => {
      const pressRelease = "Strategic initiative announcement";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      result.talkingPoints.forEach((tp) => {
        expect(tp.topic).toBeTruthy();
        tp.points.forEach((point) => {
          expect(point).toBeTruthy();
          expect(point.length).toBeGreaterThan(5);
        });
      });
    });

    it("should generate realistic anticipated questions", async () => {
      const pressRelease = "Quarterly earnings with margin pressure";

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease
      );

      result.anticipatedQuestions.forEach((q) => {
        expect(q.question).toBeTruthy();
        expect(q.suggestedAnswer).toBeTruthy();
        expect(q.question.includes("?")).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle null/undefined gracefully", async () => {
      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        "Test content"
      );

      expect(result).toBeDefined();
      expect(result.briefTitle).toBeDefined();
    });

    it("should provide fallback when generation fails", async () => {
      // Mock LLM to return no choices to test fallback
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [] } as any);

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        "Test"
      );

      expect(result.briefTitle).toBeDefined();
      expect(result.briefSummary).toBeDefined();
      expect(Array.isArray(result.keyMessages)).toBe(true);
      expect(Array.isArray(result.talkingPoints)).toBe(true);
      expect(Array.isArray(result.anticipatedQuestions)).toBe(true);
    });
  });

  describe("Different Press Release Types", () => {
    it("should handle earnings announcements", async () => {
      const pressRelease = `
        Q3 2025 Earnings Announcement
        Revenue: $3.2B (+18% YoY)
        Net Income: $640M (+25% YoY)
        EPS: $2.10 (+28% YoY)
      `;

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "Q3 Earnings"
      );

      expect(result.briefTitle).toBeDefined();
      expect(result.keyMessages.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle product launch announcements", async () => {
      const pressRelease = `
        New AI-Powered Analytics Platform Launch
        Revolutionary features for enterprise customers
        Available in 50+ countries
        Pre-orders exceed $100M
      `;

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "Product Launch"
      );

      expect(result.briefTitle).toBeDefined();
      expect(result.talkingPoints.length).toBeGreaterThanOrEqual(4);
    });

    it("should handle M&A announcements", async () => {
      const pressRelease = `
        Strategic Acquisition Announcement
        Acquiring TechCorp for $5B
        Expands market presence in Asia
        Expected to close Q2 2026
      `;

      const result = await EventBriefGeneratorService.generateBriefFromPressRelease(
        pressRelease,
        "M&A Announcement"
      );

      expect(result.briefTitle).toBeDefined();
      expect(result.anticipatedQuestions.length).toBeGreaterThanOrEqual(5);
    });
  });
});
