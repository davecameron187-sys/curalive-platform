/**
 * webcast.test.ts — Tests for the CuraLive Webcasting Platform router.
 * Validates: event listing, registration, Q&A, polls, and analytics.
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });

describe("webcast.listEvents", () => {
  it("returns a non-empty list of demo events", async () => {
    const events = await caller.webcast.listEvents({ limit: 20 });
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it("each event has required fields", async () => {
    const events = await caller.webcast.listEvents({ limit: 20 });
    for (const ev of events) {
      expect(ev).toHaveProperty("title");
      expect(ev).toHaveProperty("slug");
      expect(ev).toHaveProperty("eventType");
      expect(ev).toHaveProperty("industryVertical");
      expect(ev).toHaveProperty("status");
    }
  });

  it("returns events covering multiple industry verticals", async () => {
    const events = await caller.webcast.listEvents({ limit: 50 });
    const verticals = new Set(events.map(e => e.industryVertical));
    expect(verticals.size).toBeGreaterThanOrEqual(3);
  });

  it("returns events covering multiple event types", async () => {
    const events = await caller.webcast.listEvents({ limit: 50 });
    const types = new Set(events.map(e => e.eventType));
    expect(types.size).toBeGreaterThanOrEqual(3);
  });
});

describe("webcast.getEvent", () => {
  it("returns a specific event by slug", async () => {
    const event = await caller.webcast.getEvent({ slug: "q4-2025-earnings-webcast" });
    expect(event).toBeDefined();
    expect(event.title).toContain("Q4 2025");
    expect(event.eventType).toBe("webcast");
    expect(event.industryVertical).toBe("financial_services");
  });

  it("returns the live CEO town hall event", async () => {
    const event = await caller.webcast.getEvent({ slug: "ceo-town-hall-q1-2026" });
    expect(event).toBeDefined();
    expect(event.status).toBe("live");
    expect(event.industryVertical).toBe("corporate_communications");
  });

  it("throws for a non-existent slug", async () => {
    await expect(caller.webcast.getEvent({ slug: "does-not-exist-xyz" })).rejects.toThrow();
  });
});

describe("webcast.submitQuestion", () => {
  it("allows submitting a Q&A question (public)", async () => {
    const result = await caller.webcast.submitQuestion({
      eventId: 1,
      attendeeName: "Test Attendee",
      attendeeEmail: "test@example.com",
      question: "What is the outlook for the next quarter?",
      isAnonymous: false,
    });
    expect(result.success).toBe(true);
  });

  it("allows anonymous question submission", async () => {
    const result = await caller.webcast.submitQuestion({
      eventId: 1,
      attendeeName: "Anonymous",
      question: "Can you clarify the dividend policy?",
      isAnonymous: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("webcast.upvoteQuestion", () => {
  it("allows upvoting a question (public)", async () => {
    const result = await caller.webcast.upvoteQuestion({ questionId: 1 });
    expect(result.success).toBe(true);
  });
});

describe("webcast.votePoll", () => {
  it("returns success or throws 'Poll is not active' for a non-live poll", async () => {
    try {
      const result = await caller.webcast.votePoll({
        pollId: 1,
        optionIndexes: [0],
      });
      expect(result.success).toBe(true);
    } catch (err: any) {
      // Expected when no live poll exists in the test environment
      expect(err.message).toMatch(/Poll is not active|not found/i);
    }
  });
});

describe("webcast.getQuestions", () => {
  it("returns questions for an event (public)", async () => {
    const questions = await caller.webcast.getQuestions({ eventId: 1, includeAll: false });
    expect(Array.isArray(questions)).toBe(true);
  });
});

describe("webcast.getPolls", () => {
  it("returns polls for an event (public)", async () => {
    const polls = await caller.webcast.getPolls({ eventId: 1 });
    expect(Array.isArray(polls)).toBe(true);
  });
});

describe("webcast.register", () => {
  it("allows public registration for an event", async () => {
    const result = await caller.webcast.register({
      eventId: 1,
      firstName: "Jane",
      lastName: "Investor",
      email: "jane.investor@example.com",
      company: "BlackRock",
      jobTitle: "Portfolio Manager",
      country: "United Kingdom",
      registrationSource: "direct",
    });
    expect(result.success).toBe(true);
  });
});
