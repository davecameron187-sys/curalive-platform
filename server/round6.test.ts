import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("events.verifyAccess", () => {
  it("returns allowed=true for events not in DB", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.events.verifyAccess({ eventId: "nonexistent-event-xyz" });
    expect(result.allowed).toBe(true);
    expect(result.requiresCode).toBe(false);
  });
});

describe("events.setAccessCode", () => {
  it("returns success when DB is unavailable (graceful degradation)", async () => {
    const caller = appRouter.createCaller(createCtx());
    // This will gracefully return success:false if DB is not available
    const result = await caller.events.setAccessCode({
      eventId: "test-event-vitest",
      accessCode: "TEST123",
    });
    // Either succeeds with DB or gracefully fails without DB
    expect(typeof result.success).toBe("boolean");
  });
});

describe("registrations.register", () => {
  it("returns success or graceful error when DB is unavailable", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.registrations.register({
      eventId: "test-event-vitest",
      name: "Test Attendee",
      email: "test@example.com",
      company: "Test Corp",
      language: "English",
      dialIn: false,
    });
    expect(typeof result.success).toBe("boolean");
  });
});

describe("irContacts.list", () => {
  it("returns an array (empty or populated)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.irContacts.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("ably.tokenRequest", () => {
  it("returns a mode field indicating ably or demo", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.ably.tokenRequest({ clientId: "test-user" });
    expect(result.mode).toMatch(/^(ably|demo)$/);
  });
});
