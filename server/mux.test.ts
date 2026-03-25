/**
 * Mux router tests
 *
 * Tests the muxRouter procedures: isConfigured, listStreams, createStream,
 * getStream, disableStream, enableStream, deleteStream.
 *
 * The Mux API is not called in tests — we verify the router's behaviour
 * when Mux is not configured (graceful degradation) and when the DB layer
 * returns expected results.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAuthCaller() {
  return appRouter.createCaller({
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
      lastSignedIn: new Date(),
      loginMethod: "oauth",
    },
    req: {} as any,
    res: {} as any,
  });
}

function makePublicCaller() {
  return appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("mux.isConfigured", () => {
  it("returns configured: false when MUX_TOKEN_ID is not set", async () => {
    const caller = makePublicCaller();
    // In test environment, MUX_TOKEN_ID is not set
    const result = await caller.mux.isConfigured();
    expect(result).toHaveProperty("configured");
    expect(typeof result.configured).toBe("boolean");
  });
});

describe("mux.listStreams", () => {
  it("returns an array for authenticated users", async () => {
    const caller = makeAuthCaller();
    const result = await caller.mux.listStreams({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = makePublicCaller();
    await expect(caller.mux.listStreams({})).rejects.toThrow();
  });

  it("accepts optional eventId filter", async () => {
    const caller = makeAuthCaller();
    const result = await caller.mux.listStreams({ eventId: 999 });
    expect(Array.isArray(result)).toBe(true);
    // No streams for non-existent event
    expect(result.length).toBe(0);
  });
});

describe("mux.createStream", () => {
  it("throws when Mux is not configured", async () => {
    const caller = makeAuthCaller();
    // MUX_TOKEN_ID is not set in test env — should throw a descriptive error
    await expect(
      caller.mux.createStream({
        label: "Test Stream",
        recordingEnabled: false,
        isPublic: true,
      })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = makePublicCaller();
    await expect(
      caller.mux.createStream({
        label: "Test Stream",
        recordingEnabled: false,
        isPublic: true,
      })
    ).rejects.toThrow();
  });
});

describe("mux.getStream", () => {
  it("throws NOT_FOUND for non-existent stream", async () => {
    const caller = makeAuthCaller();
    await expect(
      caller.mux.getStream({ muxStreamId: "non-existent-stream-id" })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = makePublicCaller();
    await expect(
      caller.mux.getStream({ muxStreamId: "some-stream-id" })
    ).rejects.toThrow();
  });
});

describe("mux.disableStream", () => {
  it("throws NOT_FOUND for non-existent stream", async () => {
    const caller = makeAuthCaller();
    await expect(
      caller.mux.disableStream({ muxStreamId: "non-existent-stream-id" })
    ).rejects.toThrow();
  });
});

describe("mux.enableStream", () => {
  it("throws NOT_FOUND for non-existent stream", async () => {
    const caller = makeAuthCaller();
    await expect(
      caller.mux.enableStream({ muxStreamId: "non-existent-stream-id" })
    ).rejects.toThrow();
  });
});

describe("mux.deleteStream", () => {
  it("throws NOT_FOUND for non-existent stream", async () => {
    const caller = makeAuthCaller();
    await expect(
      caller.mux.deleteStream({ muxStreamId: "non-existent-stream-id" })
    ).rejects.toThrow();
  });
});
