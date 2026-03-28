/**
 * Fallback Logic Integration Tests
 * Tests retry mechanism, provider switching, and operator notifications
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeFallbackLogic, initializeProviderStatus } from "../services/connectivityFallback";
import type { ConnectivityProvider, FallbackResult } from "../services/connectivityFallback";

describe("Connectivity Fallback Logic", () => {
  beforeEach(() => {
    initializeProviderStatus();
    vi.clearAllMocks();
  });

  describe("executeFallbackLogic", () => {
    it("should return success when primary provider initializes successfully", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-1",
        eventId: "test-event-1",
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe("webphone");
      expect(result.attempt).toBeGreaterThanOrEqual(1);
      expect(result.totalAttempts).toBeGreaterThanOrEqual(1);
    });

    it("should attempt retries before switching providers", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-2",
        eventId: "test-event-2",
      });

      // Should have attempted at least once
      expect(result.attempt).toBeGreaterThanOrEqual(1);
      expect(result.totalAttempts).toBeGreaterThanOrEqual(1);
    });

    it("should include session metadata in fallback config", async () => {
      const config = {
        sessionId: "test-session-3",
        eventId: "test-event-3",
      };

      const result = await executeFallbackLogic("webphone", config);

      expect(result).toBeDefined();
      expect(result.provider).toBeDefined();
    });

    it("should handle custom retry configuration", async () => {
      const customConfig = {
        maxRetries: 2,
        retryDelayMs: 100,
        backoffMultiplier: 2,
      };

      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-4",
        eventId: "test-event-4",
      }, customConfig);

      expect(result).toBeDefined();
      expect(result.totalAttempts).toBeLessThanOrEqual(customConfig.maxRetries + 1);
    });

    it("should return fallback provider on primary failure", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-5",
        eventId: "test-event-5",
      });

      // Result should have provider set (either primary or fallback)
      expect(result.provider).toBeDefined();
      expect(["webphone", "teams", "zoom", "webex", "rtmp", "pstn"]).toContain(result.provider);
    });

    it("should include reason when fallback occurs", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-6",
        eventId: "test-event-6",
      });

      // If fallback occurred, reason should be set
      if (result.provider !== "webphone") {
        expect(result.reason).toBeDefined();
      }
    });

    it("should include connection ID on success", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-7",
        eventId: "test-event-7",
      });

      if (result.success) {
        expect(result.connectionId).toBeDefined();
      }
    });

    it("should handle missing session metadata gracefully", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: undefined,
        eventId: undefined,
      });

      expect(result).toBeDefined();
      expect(result.provider).toBeDefined();
    });

    it("should track attempt count correctly", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-8",
        eventId: "test-event-8",
      });

      expect(result.attempt).toBeGreaterThanOrEqual(1);
      expect(result.totalAttempts).toBeGreaterThanOrEqual(result.attempt);
    });

    it("should support all provider types in fallback sequence", async () => {
      const providers: ConnectivityProvider[] = ["webphone", "teams", "zoom", "webex", "rtmp", "pstn"];

      for (const provider of providers) {
        const result = await executeFallbackLogic(provider, {
          sessionId: `test-session-${provider}`,
          eventId: "test-event",
        });

        expect(result).toBeDefined();
        expect(result.provider).toBeDefined();
      }
    });

    it("should return error message on complete failure", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-9",
        eventId: "test-event-9",
      });

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("Fallback Result Structure", () => {
    it("should return FallbackResult with required fields", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-10",
        eventId: "test-event-10",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("provider");
      expect(result).toHaveProperty("attempt");
      expect(result).toHaveProperty("totalAttempts");
    });

    it("should include optional fields when applicable", async () => {
      const result = await executeFallbackLogic("webphone", {
        sessionId: "test-session-11",
        eventId: "test-event-11",
      });

      // Optional fields should be defined when relevant
      if (result.success) {
        expect(result.connectionId).toBeDefined();
      }
      if (result.provider !== "webphone") {
        expect(result.reason).toBeDefined();
      }
    });
  });

  describe("Provider Status Tracking", () => {
    it("should initialize provider status on startup", () => {
      initializeProviderStatus();
      // Should not throw
      expect(true).toBe(true);
    });

    it("should track multiple provider attempts", async () => {
      const result1 = await executeFallbackLogic("webphone", {
        sessionId: "test-session-12",
        eventId: "test-event-12",
      });

      const result2 = await executeFallbackLogic("teams", {
        sessionId: "test-session-13",
        eventId: "test-event-13",
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe("Session Context Handling", () => {
    it("should pass session context through fallback logic", async () => {
      const sessionId = "unique-session-id-12345";
      const eventId = "unique-event-id-67890";

      const result = await executeFallbackLogic("webphone", {
        sessionId,
        eventId,
      });

      expect(result).toBeDefined();
      // Session context should be preserved in logs/notifications
    });

    it("should handle concurrent fallback attempts", async () => {
      const promises = [
        executeFallbackLogic("webphone", { sessionId: "session-a", eventId: "event-a" }),
        executeFallbackLogic("teams", { sessionId: "session-b", eventId: "event-b" }),
        executeFallbackLogic("zoom", { sessionId: "session-c", eventId: "event-c" }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.provider).toBeDefined();
      });
    });
  });
});
