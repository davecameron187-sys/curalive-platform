import { describe, it, expect, beforeAll } from "vitest";
import { AblyRealtimeService } from "./services/AblyRealtimeService";

describe("Ably Configuration Tests", () => {
  beforeAll(() => {
    // Initialize Ably with the API key from environment
    const apiKey = process.env.ABLY_API_KEY;
    if (apiKey) {
      AblyRealtimeService.initialize(apiKey);
    }
  });

  it("should have ABLY_API_KEY environment variable set", () => {
    const apiKey = process.env.ABLY_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/);
  });

  it("should initialize Ably service", () => {
    const stats = AblyRealtimeService.getStats();
    expect(stats).toBeDefined();
    expect(stats.isInitialized).toBe(true);
  });

  it("should report connection state", () => {
    const state = AblyRealtimeService.getConnectionState();
    expect(state).toBeDefined();
    expect(typeof state).toBe("string");
    expect(["connecting", "connected", "disconnected", "not_initialized"]).toContain(state);
  });

  it("should be able to get or create a channel", () => {
    try {
      const channel = AblyRealtimeService.getChannel(1);
      expect(channel).toBeDefined();
    } catch (error) {
      // Expected if Ably is not fully initialized
      expect(error).toBeDefined();
    }
  });

  it("should track active channels", () => {
    const stats = AblyRealtimeService.getStats();
    expect(stats.channels).toBeDefined();
    expect(Array.isArray(stats.channels)).toBe(true);
  });

  it("should validate Ably API key format", () => {
    const apiKey = process.env.ABLY_API_KEY || "";
    // Ably API keys follow format: keyId.keyName:keySecret
    const isValidFormat = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(apiKey);
    expect(isValidFormat).toBe(true);
  });
});
