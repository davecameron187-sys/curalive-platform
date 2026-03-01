import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("ably.tokenRequest", () => {
  it("returns a valid token request when ABLY_API_KEY is set", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ably.tokenRequest({ clientId: "test-user-123" });

    // The ABLY_API_KEY env var is set — we expect production mode
    expect(result.mode).toBe("ably");
    expect(result.tokenRequest).not.toBeNull();

    const tr = result.tokenRequest!;
    expect(tr.keyName).toBeTruthy();
    expect(tr.keyName).toContain("RrRAig");
    expect(tr.mac).toBeTruthy();
    expect(tr.nonce).toBeTruthy();
    expect(tr.clientId).toBe("test-user-123");
    expect(tr.ttl).toBe(3600 * 1000);
    expect(JSON.parse(tr.capability)).toHaveProperty("chorus-event-*");
  });

  it("returns demo mode when ABLY_API_KEY is not set", async () => {
    const originalKey = process.env.ABLY_API_KEY;
    delete process.env.ABLY_API_KEY;

    try {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.ably.tokenRequest({ clientId: "test-user" });
      expect(result.mode).toBe("demo");
      expect(result.tokenRequest).toBeNull();
    } finally {
      process.env.ABLY_API_KEY = originalKey;
    }
  });
});
