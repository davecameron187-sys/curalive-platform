/**
 * Intelligent Webcast Feature Tests
 * Covers: generateSummary (IR sections), Q&A category scoring, language support
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock LLM to avoid real API calls ────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            headline: "Chorus Call Q4 2025 beats expectations with 28% revenue growth",
            keyPoints: ["Revenue $47.2M (+28% YoY)", "AI platform adoption accelerating"],
            financialHighlights: ["Q4 Revenue: $47.2M", "Gross Margin: 72%"],
            sentiment: "Positive",
            actionItems: ["Follow up on Teams integration timeline"],
            executiveSummary: "Strong quarter driven by AI platform adoption.",
            forwardLookingStatements: ["FY2026 guidance of $195–$210M"],
            regulatoryHighlights: ["Guidance in line with JSE Listings Requirements para 3.4"],
            riskFactors: ["Integration timelines subject to third-party API availability"],
          }),
        },
      },
    ],
  }),
}));

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null), // null = no DB; procedures handle gracefully
}));

// ─── Mock notification helper ─────────────────────────────────────────────────
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── generateSummary ─────────────────────────────────────────────────────────
describe("events.generateSummary", () => {
  const SAMPLE_TRANSCRIPT = [
    { speaker: "CEO", text: "Q4 revenue was $47.2 million, up 28% year-over-year.", timeLabel: "00:01:00" },
    { speaker: "CFO", text: "Gross margins expanded to 72%. FY2026 guidance is $195–$210M.", timeLabel: "00:04:00" },
  ];

  it("returns a summary with all base fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.generateSummary({
      eventTitle: "Q4 2025 Earnings Call",
      transcript: SAMPLE_TRANSCRIPT,
    });

    expect(result.success).toBe(true);
    expect(result.summary).toMatchObject({
      headline: expect.any(String),
      keyPoints: expect.any(Array),
      financialHighlights: expect.any(Array),
      sentiment: expect.any(String),
      actionItems: expect.any(Array),
      executiveSummary: expect.any(String),
    });
  });

  it("returns IR-specific sections: forwardLookingStatements, regulatoryHighlights, riskFactors", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.generateSummary({
      eventTitle: "Q4 2025 Earnings Call",
      transcript: SAMPLE_TRANSCRIPT,
    });

    expect(result.summary).toMatchObject({
      forwardLookingStatements: expect.any(Array),
      regulatoryHighlights: expect.any(Array),
      riskFactors: expect.any(Array),
    });

    // IR sections must be non-empty arrays
    expect((result.summary as { forwardLookingStatements: string[] }).forwardLookingStatements.length).toBeGreaterThan(0);
    expect((result.summary as { regulatoryHighlights: string[] }).regulatoryHighlights.length).toBeGreaterThan(0);
    expect((result.summary as { riskFactors: string[] }).riskFactors.length).toBeGreaterThan(0);
  });

  it("includes Q&A items in the analysis when provided", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const mockLLM = invokeLLM as ReturnType<typeof vi.fn>;
    mockLLM.mockClear(); // reset call history

    const caller = appRouter.createCaller(createPublicContext());

    await caller.events.generateSummary({
      eventTitle: "Q4 2025 Earnings Call",
      transcript: SAMPLE_TRANSCRIPT,
      qaItems: [
        { question: "What is the Recall.ai margin impact?", author: "Goldman Sachs", status: "answered" },
        { question: "Unapproved question", author: "Unknown", status: "pending" },
      ],
    });

    expect(mockLLM).toHaveBeenCalledOnce();
    // The prompt is built as a template string and passed as the user message
    const callArgs = mockLLM.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: { role: string }) => m.role === "user");
    // Approved Q&A (status=answered) should be in the prompt
    expect(userMessage.content).toContain("Goldman Sachs");
    // Pending/unapproved items should NOT be included
    expect(userMessage.content).not.toContain("Unapproved question");
  });

  it("falls back gracefully when LLM fails", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("LLM timeout"));

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.generateSummary({
      eventTitle: "Fallback Test Call",
      transcript: SAMPLE_TRANSCRIPT,
    });

    // Should return success: false but still provide a usable fallback summary
    expect(result.success).toBe(false);
    expect(result.summary.headline).toContain("Fallback Test Call");
    expect(result.summary.forwardLookingStatements).toBeDefined();
    expect(result.summary.regulatoryHighlights).toBeDefined();
    expect(result.summary.riskFactors).toBeDefined();
  });
});

// ─── irContacts.sendSummary ───────────────────────────────────────────────────
describe("irContacts.sendSummary", () => {
  it("returns error when no contacts and no additional emails", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.irContacts.sendSummary({
      eventTitle: "Test Event",
      summary: {
        headline: "Test headline",
        keyPoints: [],
        financialHighlights: [],
        sentiment: "Positive",
        actionItems: [],
        executiveSummary: "Test summary.",
        forwardLookingStatements: [],
        regulatoryHighlights: [],
        riskFactors: [],
      },
      additionalEmails: [],
    });

    expect(result.success).toBe(false);
    expect(result.sentCount).toBe(0);
  });

  it("accepts the new IR fields in the summary schema", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // Should not throw a validation error when IR fields are provided
    const result = await caller.irContacts.sendSummary({
      eventTitle: "IR Test Event",
      summary: {
        headline: "Strong Q4 results",
        keyPoints: ["Revenue growth 28%"],
        financialHighlights: ["$47.2M revenue"],
        sentiment: "Positive",
        actionItems: ["Follow up on guidance"],
        executiveSummary: "Strong quarter.",
        forwardLookingStatements: ["FY2026 guidance $195–$210M"],
        regulatoryHighlights: ["Compliant with JSE Listings Requirements"],
        riskFactors: ["Integration timeline risk"],
      },
      additionalEmails: ["test@example.com"],
    });

    // With one additional email, should attempt to send
    expect(result.sentCount).toBe(1);
    expect(result.success).toBe(true);
  });
});

// ─── events.verifyAccess ─────────────────────────────────────────────────────
describe("events.verifyAccess", () => {
  it("allows access when event is not in DB (open event)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.events.verifyAccess({ eventId: "open-event-123" });
    expect(result.allowed).toBe(true);
    expect(result.requiresCode).toBe(false);
  });
});

// ─── ably.tokenRequest ────────────────────────────────────────────────────────
describe("ably.tokenRequest", () => {
  it("returns demo mode when ABLY_API_KEY is not set", async () => {
    const originalKey = process.env.ABLY_API_KEY;
    delete process.env.ABLY_API_KEY;

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ably.tokenRequest({ clientId: "test-user" });

    expect(result.mode).toBe("demo");
    expect(result.tokenRequest).toBeNull();

    process.env.ABLY_API_KEY = originalKey;
  });
});
