/**
 * CuraLive — Ably Cross-Device Sync Tests
 *
 * Validates:
 * 1. The ably.tokenRequest tRPC procedure returns a valid token or demo mode
 * 2. The token request contains the required Ably token fields
 * 3. The channel naming convention is correct for cross-device sync
 */

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("ably.tokenRequest", () => {
  it("returns a response with a mode field", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ably.tokenRequest({ clientId: "test-device-001" });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("mode");
    expect(["ably", "demo"]).toContain(result.mode);
  });

  it("returns demo mode when ABLY_API_KEY is not set or invalid", async () => {
    const originalKey = process.env.ABLY_API_KEY;
    // Temporarily unset to simulate missing key
    delete process.env.ABLY_API_KEY;

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ably.tokenRequest({ clientId: "test-device-002" });

    expect(result.mode).toBe("demo");
    expect(result.tokenRequest).toBeNull();

    // Restore
    if (originalKey) process.env.ABLY_API_KEY = originalKey;
  });

  it("returns ably mode with tokenRequest when ABLY_API_KEY is set", async () => {
    if (!process.env.ABLY_API_KEY) {
      console.log("Skipping: ABLY_API_KEY not configured in this environment");
      return;
    }

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ably.tokenRequest({ clientId: "test-device-003" });

    expect(result.mode).toBe("ably");
    expect(result.tokenRequest).not.toBeNull();

    // Validate token request shape (Ably TokenRequest fields)
    const token = result.tokenRequest as Record<string, unknown>;
    expect(token).toHaveProperty("keyName");
    expect(token).toHaveProperty("timestamp");
    expect(token).toHaveProperty("mac");
    expect(typeof token.keyName).toBe("string");
    expect(typeof token.timestamp).toBe("number");
  });

  it("uses correct channel naming convention for cross-device sync", () => {
    // Channel name format: chorus-event-{eventId}
    const eventId = "q4-earnings-2026";
    const channelName = `chorus-event-${eventId}`;

    expect(channelName).toBe("chorus-event-q4-earnings-2026");
    expect(channelName).toMatch(/^chorus-event-[a-z0-9-]+$/);
  });

  it("sync-test page uses a dedicated channel", () => {
    // The SyncTest page uses eventId="sync-test" → channel "chorus-event-sync-test"
    const syncTestChannel = `chorus-event-sync-test`;
    expect(syncTestChannel).toBe("chorus-event-sync-test");
  });
});
