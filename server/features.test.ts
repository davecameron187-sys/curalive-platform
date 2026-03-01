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

describe("events.generateSummary", () => {
  it("returns a structured summary with all required fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.events.generateSummary({
      eventTitle: "Test Earnings Call",
      transcript: [
        { speaker: "CEO", text: "Revenue grew 30% this quarter.", timeLabel: "00:01:00" },
        { speaker: "CFO", text: "Gross margin expanded to 70%.", timeLabel: "00:03:00" },
      ],
      qaItems: [
        { question: "What drove the margin expansion?", author: "Analyst", status: "answered" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.summary).toBeDefined();

    const summary = result.summary as {
      headline: string;
      keyPoints: string[];
      financialHighlights: string[];
      sentiment: string;
      actionItems: string[];
      executiveSummary: string;
    };

    expect(typeof summary.headline).toBe("string");
    expect(summary.headline.length).toBeGreaterThan(10);
    expect(Array.isArray(summary.keyPoints)).toBe(true);
    expect(summary.keyPoints.length).toBeGreaterThan(0);
    expect(Array.isArray(summary.financialHighlights)).toBe(true);
    expect(typeof summary.sentiment).toBe("string");
    expect(Array.isArray(summary.actionItems)).toBe(true);
    expect(typeof summary.executiveSummary).toBe("string");
    expect(summary.executiveSummary.length).toBeGreaterThan(20);
  }, 30000); // Allow 30s for LLM call

  it("handles empty transcript gracefully", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.events.generateSummary({
      eventTitle: "Empty Event",
      transcript: [],
      qaItems: [],
    });

    // Should either succeed with fallback or return success: false
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(result.summary).toBeDefined();
  }, 30000);
});

describe("ably.tokenRequest", () => {
  it("returns a valid Ably token request object", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.ably.tokenRequest({
      clientId: "test-client-123",
      channelPrefix: "chorus-test",
    });

    expect(result.tokenRequest).toBeDefined();
    // Ably token requests have keyName, timestamp, nonce, mac fields
    const tr = result.tokenRequest as Record<string, unknown>;
    expect(typeof tr.keyName).toBe("string");
    expect(typeof tr.timestamp).toBe("number");
    expect(typeof tr.nonce).toBe("string");
    expect(typeof tr.mac).toBe("string");
  });
});
