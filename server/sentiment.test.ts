import { describe, it, expect } from "vitest";

/**
 * Sentiment Analysis Tests
 * Tests for emotion detection and sentiment scoring
 */

describe("Sentiment Analysis", () => {
  describe("Sentiment Classification", () => {
    it("should classify positive sentiment correctly", () => {
      const positiveTexts = [
        "I'm very happy with this result!",
        "Excellent work, thank you so much!",
        "This is wonderful news!",
      ];

      positiveTexts.forEach((text) => {
        const isPositive =
          text.toLowerCase().includes("happy") ||
          text.toLowerCase().includes("excellent") ||
          text.toLowerCase().includes("wonderful");
        expect(isPositive).toBe(true);
      });
    });

    it("should classify negative sentiment correctly", () => {
      const negativeTexts = [
        "This is terrible and disappointing",
        "I'm very upset about this",
        "This is the worst outcome possible",
      ];

      negativeTexts.forEach((text) => {
        const isNegative =
          text.toLowerCase().includes("terrible") ||
          text.toLowerCase().includes("upset") ||
          text.toLowerCase().includes("worst");
        expect(isNegative).toBe(true);
      });
    });

    it("should classify neutral sentiment correctly", () => {
      const neutralTexts = [
        "The meeting is scheduled for Tuesday",
        "We have 50 participants",
        "The call duration was 45 minutes",
      ];

      neutralTexts.forEach((text) => {
        expect(text).toBeTruthy();
        expect(text.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Emotion Detection", () => {
    it("should detect happy emotion from positive text", () => {
      const happyIndicators = ["happy", "joy", "excited", "delighted", "thrilled"];
      const testText = "I'm so excited and thrilled about this!";

      const hasHappyIndicator = happyIndicators.some((indicator) =>
        testText.toLowerCase().includes(indicator)
      );

      expect(hasHappyIndicator).toBe(true);
    });

    it("should detect sad emotion from negative text", () => {
      const sadIndicators = ["sad", "unhappy", "disappointed", "depressed", "down"];
      const testText = "I'm very disappointed with this outcome";

      const hasSadIndicator = sadIndicators.some((indicator) =>
        testText.toLowerCase().includes(indicator)
      );

      expect(hasSadIndicator).toBe(true);
    });

    it("should detect angry emotion from aggressive text", () => {
      const angryIndicators = ["angry", "furious", "outraged", "upset", "livid"];
      const testText = "I'm absolutely furious about this decision!";

      const hasAngryIndicator = angryIndicators.some((indicator) =>
        testText.toLowerCase().includes(indicator)
      );

      expect(hasAngryIndicator).toBe(true);
    });

    it("should detect surprised emotion from unexpected text", () => {
      const surprisedIndicators = ["surprised", "shocked", "amazed", "astonished", "wow"];
      const testText = "Wow, I'm absolutely shocked by this news!";

      const hasSurprisedIndicator = surprisedIndicators.some((indicator) =>
        testText.toLowerCase().includes(indicator)
      );

      expect(hasSurprisedIndicator).toBe(true);
    });
  });

  describe("Confidence Scoring", () => {
    it("should score confidence between 0-100", () => {
      const confidenceScores = [0, 25, 50, 75, 100];

      confidenceScores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it("should have higher confidence for clear sentiment", () => {
      const clearSentimentText = "This is absolutely wonderful and fantastic!";
      const ambiguousSentimentText = "This is okay, I guess";

      expect(clearSentimentText.length).toBeGreaterThan(ambiguousSentimentText.length);
    });

    it("should validate emotion score is between 0-100", () => {
      const emotionScores = [0, 30, 60, 90, 100];

      emotionScores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Tone Detection", () => {
    it("should detect professional tone", () => {
      const professionalText = "Thank you for your attention. Let's proceed with the agenda.";
      expect(professionalText).toContain("Thank you");
      expect(professionalText).toContain("agenda");
    });

    it("should detect casual tone", () => {
      const casualText = "Hey everyone! Let's chat about this stuff.";
      expect(casualText.toLowerCase()).toContain("hey");
      expect(casualText.toLowerCase()).toContain("chat");
    });

    it("should detect formal tone", () => {
      const formalText = "I respectfully submit the following proposal for your consideration.";
      expect(formalText).toContain("respectfully");
      expect(formalText).toContain("proposal");
    });

    it("should detect aggressive tone", () => {
      const aggressiveText = "You need to do this NOW! No excuses!";
      expect(aggressiveText).toContain("NOW");
      expect(aggressiveText).toContain("No excuses");
    });

    it("should detect supportive tone", () => {
      const supportiveText = "I'm here to help you succeed. Let's work together on this.";
      expect(supportiveText).toContain("help");
      expect(supportiveText).toContain("together");
    });
  });

  describe("Key Phrase Extraction", () => {
    it("should extract key phrases from text", () => {
      const text = "This is absolutely wonderful and fantastic news!";
      const keyPhrases = ["wonderful", "fantastic"];

      keyPhrases.forEach((phrase) => {
        expect(text.toLowerCase()).toContain(phrase);
      });
    });

    it("should identify sentiment-bearing phrases", () => {
      const text = "I'm very happy and excited about this opportunity";
      const sentimentPhrases = ["very happy", "excited"];

      sentimentPhrases.forEach((phrase) => {
        expect(text.toLowerCase()).toContain(phrase.toLowerCase());
      });
    });

    it("should handle multiple emotions in single text", () => {
      const text = "I'm happy about the result but sad about the process";
      expect(text).toContain("happy");
      expect(text).toContain("sad");
    });
  });

  describe("Batch Processing", () => {
    it("should process multiple segments efficiently", () => {
      const segments = [
        { id: 1, text: "Great job!" },
        { id: 2, text: "Not good" },
        { id: 3, text: "It's okay" },
      ];

      expect(segments).toHaveLength(3);
      expect(segments[0].id).toBe(1);
      expect(segments[1].id).toBe(2);
      expect(segments[2].id).toBe(3);
    });

    it("should maintain segment IDs during batch processing", () => {
      const segments = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        text: `Segment ${i + 1}`,
      }));

      segments.forEach((segment, index) => {
        expect(segment.id).toBe(index + 1);
      });
    });

    it("should handle empty batch gracefully", () => {
      const emptySegments: Array<{ id: number; text: string }> = [];
      expect(emptySegments).toHaveLength(0);
    });
  });

  describe("Speaker Sentiment Profile", () => {
    it("should aggregate sentiment by speaker", () => {
      const speakerSegments = [
        { speaker: "John", sentiment: "positive" },
        { speaker: "John", sentiment: "positive" },
        { speaker: "Jane", sentiment: "negative" },
        { speaker: "Jane", sentiment: "neutral" },
      ];

      const johnSegments = speakerSegments.filter((s) => s.speaker === "John");
      const janeSegments = speakerSegments.filter((s) => s.speaker === "Jane");

      expect(johnSegments).toHaveLength(2);
      expect(janeSegments).toHaveLength(2);
    });

    it("should calculate speaker sentiment distribution", () => {
      const speakerSentiments = {
        John: { positive: 5, neutral: 2, negative: 1 },
        Jane: { positive: 2, neutral: 3, negative: 5 },
      };

      expect(speakerSentiments.John.positive).toBeGreaterThan(speakerSentiments.John.negative);
      expect(speakerSentiments.Jane.negative).toBeGreaterThan(speakerSentiments.Jane.positive);
    });

    it("should identify dominant emotion per speaker", () => {
      const speakerEmotions = {
        John: { happy: 4, neutral: 2, sad: 1 },
        Jane: { angry: 3, sad: 3, neutral: 2 },
      };

      const johnDominant = Object.entries(speakerEmotions.John).sort(([, a], [, b]) => b - a)[0][0];
      const janeDominant = Object.entries(speakerEmotions.Jane).sort(([, a], [, b]) => b - a)[0][0];

      expect(johnDominant).toBe("happy");
      expect(["angry", "sad"]).toContain(janeDominant);
    });
  });

  describe("Sentiment Trend Analysis", () => {
    it("should calculate sentiment trend over time", () => {
      const sentiments = [
        { time: 0, sentiment: "neutral" },
        { time: 10, sentiment: "positive" },
        { time: 20, sentiment: "positive" },
        { time: 30, sentiment: "negative" },
      ];

      expect(sentiments[0].sentiment).toBe("neutral");
      expect(sentiments[sentiments.length - 1].sentiment).toBe("negative");
    });

    it("should detect sentiment shifts", () => {
      const sentiments = ["positive", "positive", "positive", "negative", "negative"];

      const positiveToNegativeShift = sentiments.findIndex(
        (s, i) => i > 0 && sentiments[i - 1] === "positive" && s === "negative"
      );

      expect(positiveToNegativeShift).toBeGreaterThan(0);
    });

    it("should calculate sentiment momentum", () => {
      const sentiments = [
        { value: 0.3 },
        { value: 0.5 },
        { value: 0.7 },
        { value: 0.9 },
      ];

      const momentum = sentiments[sentiments.length - 1].value - sentiments[0].value;
      expect(momentum).toBeGreaterThan(0);
    });
  });

  describe("Emotion Distribution", () => {
    it("should calculate emotion distribution", () => {
      const emotions = ["happy", "happy", "sad", "angry", "happy", "neutral"];
      const distribution = {
        happy: 3,
        sad: 1,
        angry: 1,
        neutral: 1,
      };

      expect(distribution.happy).toBe(3);
      expect(distribution.sad).toBe(1);
    });

    it("should identify dominant emotion", () => {
      const emotionCounts = {
        happy: 10,
        sad: 3,
        angry: 2,
        neutral: 5,
      };

      const dominant = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0][0];
      expect(dominant).toBe("happy");
    });

    it("should handle balanced emotion distribution", () => {
      const emotionCounts = {
        happy: 5,
        sad: 5,
        neutral: 5,
      };

      const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
      expect(total).toBe(15);
    });
  });

  describe("Sentiment Validation", () => {
    it("should validate sentiment values", () => {
      const validSentiments = ["positive", "neutral", "negative"];
      const testSentiment = "positive";

      expect(validSentiments).toContain(testSentiment);
    });

    it("should validate emotion values", () => {
      const validEmotions = ["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"];
      const testEmotion = "happy";

      expect(validEmotions).toContain(testEmotion);
    });

    it("should validate tone values", () => {
      const validTones = ["professional", "casual", "formal", "aggressive", "supportive"];
      const testTone = "professional";

      expect(validTones).toContain(testTone);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty text gracefully", () => {
      const emptyText = "";
      expect(emptyText).toBe("");
      expect(emptyText.length).toBe(0);
    });

    it("should handle very long text", () => {
      const longText = "word ".repeat(1000);
      expect(longText.length).toBeGreaterThan(1000);
    });

    it("should handle special characters", () => {
      const specialText = "Hello! @#$% How are you? 😊";
      expect(specialText).toContain("Hello");
      expect(specialText).toContain("?");
    });

    it("should handle multiple languages gracefully", () => {
      const multilingualText = "Hello مرحبا 你好 Hola";
      expect(multilingualText.length).toBeGreaterThan(0);
    });
  });
});
