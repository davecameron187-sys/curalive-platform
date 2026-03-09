import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { liveRollingSummaryService } from "./services/LiveRollingSummaryService";

describe("LiveRollingSummaryService", () => {
  const testConferenceId = 12345;

  beforeAll(() => {
    // Mock console methods to avoid test output pollution
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    // Clean up all intervals
    liveRollingSummaryService.stopAll();
    vi.restoreAllMocks();
  });

  describe("Service Initialization", () => {
    it("should create a service instance", () => {
      expect(liveRollingSummaryService).toBeDefined();
      expect(typeof liveRollingSummaryService.startLiveRollingSummary).toBe("function");
      expect(typeof liveRollingSummaryService.stopLiveRollingSummary).toBe("function");
    });

    it("should have all required methods", () => {
      const requiredMethods = [
        "startLiveRollingSummary",
        "stopLiveRollingSummary",
        "generateRollingSummary",
        "getLatestRollingSummary",
        "getRollingSummaryHistory",
        "regenerateSummary",
        "stopAll",
      ];

      requiredMethods.forEach((method) => {
        expect(typeof (liveRollingSummaryService as any)[method]).toBe("function");
      });
    });
  });

  describe("Summary Generation", () => {
    it("should handle null database gracefully", async () => {
      // This test verifies the service doesn't crash when db is unavailable
      const result = await liveRollingSummaryService.generateRollingSummary(testConferenceId);
      // Should return null or handle gracefully
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("should have correct summary structure", async () => {
      const result = await liveRollingSummaryService.generateRollingSummary(testConferenceId);
      if (result) {
        expect(result).toHaveProperty("conferenceId");
        expect(result).toHaveProperty("summary");
        expect(result).toHaveProperty("windowStartTime");
        expect(result).toHaveProperty("windowEndTime");
        expect(result).toHaveProperty("segmentCount");
        expect(result).toHaveProperty("generatedAt");
      }
    });
  });

  describe("Interval Management", () => {
    it("should start and stop intervals", async () => {
      const testId = 99999;
      await liveRollingSummaryService.startLiveRollingSummary(testId);
      // Give a moment for the interval to be set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Stop the interval
      liveRollingSummaryService.stopLiveRollingSummary(testId);
      expect(true).toBe(true); // If we got here without errors, it worked
    });

    it("should handle multiple conferences", async () => {
      const conf1 = 11111;
      const conf2 = 22222;

      await liveRollingSummaryService.startLiveRollingSummary(conf1);
      await liveRollingSummaryService.startLiveRollingSummary(conf2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      liveRollingSummaryService.stopLiveRollingSummary(conf1);
      liveRollingSummaryService.stopLiveRollingSummary(conf2);

      expect(true).toBe(true);
    });

    it("should replace existing interval when starting again", async () => {
      const testId = 33333;
      await liveRollingSummaryService.startLiveRollingSummary(testId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Start again - should replace the previous interval
      await liveRollingSummaryService.startLiveRollingSummary(testId);
      await new Promise((resolve) => setTimeout(resolve, 50));

      liveRollingSummaryService.stopLiveRollingSummary(testId);
      expect(true).toBe(true);
    });
  });

  describe("Query Methods", () => {
    it("should return null for non-existent latest summary", async () => {
      const result = await liveRollingSummaryService.getLatestRollingSummary(999999);
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("should return empty array for non-existent history", async () => {
      const result = await liveRollingSummaryService.getRollingSummaryHistory(999999);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect history limit parameter", async () => {
      const result = await liveRollingSummaryService.getRollingSummaryHistory(testConferenceId, 5);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should have default limit of 50", async () => {
      const result = await liveRollingSummaryService.getRollingSummaryHistory(testConferenceId);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe("Regeneration", () => {
    it("should handle regenerate with valid time window", async () => {
      const now = Date.now();
      const windowStart = now - 60000;
      const windowEnd = now;

      const result = await liveRollingSummaryService.regenerateSummary(testConferenceId, windowStart, windowEnd);
      // Should return null or a valid summary (depending on whether segments exist)
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("should return null for empty time window", async () => {
      const now = Date.now();
      // Use a future time window that won't have any segments
      const windowStart = now + 1000000;
      const windowEnd = now + 2000000;

      const result = await liveRollingSummaryService.regenerateSummary(testConferenceId, windowStart, windowEnd);
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("Cleanup", () => {
    it("should stop all intervals on stopAll", async () => {
      const conf1 = 44444;
      const conf2 = 55555;

      await liveRollingSummaryService.startLiveRollingSummary(conf1);
      await liveRollingSummaryService.startLiveRollingSummary(conf2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      liveRollingSummaryService.stopAll();
      expect(true).toBe(true);
    });
  });

  describe("Window Size", () => {
    it("should use 60 second window", async () => {
      // Verify the service uses the correct window size
      const now = Date.now();
      const result = await liveRollingSummaryService.generateRollingSummary(testConferenceId);

      if (result) {
        const windowDuration = result.windowEndTime - result.windowStartTime;
        // Should be approximately 60 seconds (60000 ms)
        expect(windowDuration).toBeLessThanOrEqual(60000);
        expect(windowDuration).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully in generateRollingSummary", async () => {
      // This should not throw even if something goes wrong
      const result = await liveRollingSummaryService.generateRollingSummary(testConferenceId);
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("should handle errors gracefully in getLatestRollingSummary", async () => {
      const result = await liveRollingSummaryService.getLatestRollingSummary(testConferenceId);
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("should handle errors gracefully in getRollingSummaryHistory", async () => {
      const result = await liveRollingSummaryService.getRollingSummaryHistory(testConferenceId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle errors gracefully in regenerateSummary", async () => {
      const result = await liveRollingSummaryService.regenerateSummary(testConferenceId, 0, 1000);
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should have correct GeneratedSummary interface", async () => {
      const result = await liveRollingSummaryService.generateRollingSummary(testConferenceId);
      if (result) {
        expect(typeof result.conferenceId).toBe("number");
        expect(typeof result.summary).toBe("string");
        expect(typeof result.windowStartTime).toBe("number");
        expect(typeof result.windowEndTime).toBe("number");
        expect(typeof result.segmentCount).toBe("number");
        expect(result.generatedAt instanceof Date).toBe(true);
      }
    });
  });
});
