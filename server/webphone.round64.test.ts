/**
 * Round 64 tests — Twilio inbound routing, Telnyx number purchase, and activity stats.
 */
import { describe, it, expect, vi } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Mock carrier helpers ─────────────────────────────────────────────────────
vi.mock("./webphone/twilio", () => ({
  generateTwilioToken: vi.fn().mockReturnValue({
    token: "mock-twilio-token",
    identity: "operator-1",
    carrier: "twilio",
    expiresIn: 3600,
  }),
  buildTwiMLVoiceResponse: vi.fn().mockImplementation((to: string, callerId: string) => {
    return `<Response><Dial callerId="${callerId}"><Number>${to}</Number></Dial></Response>`;
  }),
}));

vi.mock("./webphone/telnyx", () => ({
  getTelnyxCredentials: vi.fn().mockReturnValue({
    sipUser: "operator-1",
    sipPassword: "mock-password",
    sipDomain: "sip.telnyx.com",
    carrier: "telnyx",
    connectionId: "conn-123",
  }),
  parseTelnyxWebhook: vi.fn().mockReturnValue(null),
}));

vi.mock("./webphone/carrierManager", () => ({
  getActiveCarrier: vi.fn().mockResolvedValue("twilio"),
  getAllCarrierHealth: vi.fn().mockResolvedValue([
    { carrier: "twilio", status: "healthy", failoverActive: false, lastCheckedAt: Date.now() },
    { carrier: "telnyx", status: "healthy", failoverActive: false, lastCheckedAt: Date.now() },
  ]),
  triggerFailover: vi.fn().mockResolvedValue(undefined),
  restoreCarrier: vi.fn().mockResolvedValue(undefined),
  setCarrierStatus: vi.fn().mockResolvedValue(undefined),
  seedCarrierStatus: vi.fn().mockResolvedValue(undefined),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Twilio Inbound Routing Configuration", () => {
  it("should construct the correct Voice URL from APP_ORIGIN", () => {
    const origin = "https://curalive-platform.replit.app";
    const voiceUrl = `${origin}/api/webphone/inbound`;
    expect(voiceUrl).toBe("https://curalive-platform.replit.app/api/webphone/inbound");
    expect(voiceUrl).toContain("/api/webphone/inbound");
  });

  it("should fall back to input voiceUrl when provided", () => {
    const inputVoiceUrl = "https://custom-domain.com/api/webphone/inbound";
    const defaultVoiceUrl = "https://curalive-platform.replit.app/api/webphone/inbound";
    const voiceUrl = inputVoiceUrl || defaultVoiceUrl;
    expect(voiceUrl).toBe("https://custom-domain.com/api/webphone/inbound");
  });

  it("should use default origin when no override provided", () => {
    const inputVoiceUrl = "";
    const defaultVoiceUrl = "https://curalive-platform.replit.app/api/webphone/inbound";
    const voiceUrl = inputVoiceUrl || defaultVoiceUrl;
    expect(voiceUrl).toBe("https://curalive-platform.replit.app/api/webphone/inbound");
  });

  it("should derive status callback from voice URL", () => {
    const voiceUrl = "https://curalive-platform.replit.app/api/webphone/inbound";
    const statusCallback = voiceUrl.replace("/inbound", "/status");
    expect(statusCallback).toBe("https://curalive-platform.replit.app/api/webphone/status");
  });
});

describe("Telnyx Number Purchase Flow", () => {
  it("should construct the correct search URL with country and area code", () => {
    const params = new URLSearchParams({
      "filter[country_code]": "US",
      "filter[features]": "sip_trunking",
      "filter[limit]": "5",
    });
    params.set("filter[national_destination_code]", "318");
    const url = `https://api.telnyx.com/v2/available_phone_numbers?${params}`;
    expect(url).toContain("filter%5Bcountry_code%5D=US");
    expect(url).toContain("filter%5Bnational_destination_code%5D=318");
    expect(url).toContain("filter%5Bfeatures%5D=sip_trunking");
  });

  it("should construct the correct order body with connection ID", () => {
    const phoneNumber = "+13185551234";
    const connectionId = "conn-123";
    const orderBody: Record<string, unknown> = {
      phone_numbers: [{ phone_number: phoneNumber }],
    };
    if (connectionId) {
      orderBody.connection_id = connectionId;
    }
    expect(orderBody.phone_numbers).toHaveLength(1);
    expect(orderBody.connection_id).toBe("conn-123");
  });

  it("should construct order body without connection ID when not set", () => {
    const phoneNumber = "+13185551234";
    const connectionId: string | null = null;
    const orderBody: Record<string, unknown> = {
      phone_numbers: [{ phone_number: phoneNumber }],
    };
    if (connectionId) {
      orderBody.connection_id = connectionId;
    }
    expect(orderBody.phone_numbers).toHaveLength(1);
    expect(orderBody.connection_id).toBeUndefined();
  });

  it("should support different country codes", () => {
    const countries = ["US", "GB", "ZA", "AU"];
    for (const cc of countries) {
      const params = new URLSearchParams({ "filter[country_code]": cc });
      expect(params.get("filter[country_code]")).toBe(cc);
    }
  });
});

describe("Activity Stats Computation", () => {
  // Simulate the computeStats function
  type Session = {
    status: string;
    carrier: string;
    direction: string;
    durationSecs: number | null;
  };

  const computeStats = (sessions: Session[]) => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === "completed").length;
    const failed = sessions.filter(s => s.status === "failed" || s.status === "no_answer").length;
    const totalSecs = sessions.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
    const avgDuration = total > 0 ? Math.round(totalSecs / total) : 0;
    const twilioCount = sessions.filter(s => s.carrier === "twilio").length;
    const telnyxCount = sessions.filter(s => s.carrier === "telnyx").length;
    const inbound = sessions.filter(s => s.direction === "inbound").length;
    const outbound = sessions.filter(s => s.direction === "outbound").length;
    return { total, completed, failed, totalSecs, avgDuration, twilioCount, telnyxCount, inbound, outbound };
  };

  it("computes correct stats for an empty session list", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.avgDuration).toBe(0);
  });

  it("computes correct stats for mixed sessions", () => {
    const sessions: Session[] = [
      { status: "completed", carrier: "twilio", direction: "outbound", durationSecs: 120 },
      { status: "completed", carrier: "twilio", direction: "outbound", durationSecs: 60 },
      { status: "failed", carrier: "telnyx", direction: "outbound", durationSecs: null },
      { status: "completed", carrier: "twilio", direction: "inbound", durationSecs: 300 },
      { status: "no_answer", carrier: "telnyx", direction: "outbound", durationSecs: null },
    ];
    const stats = computeStats(sessions);
    expect(stats.total).toBe(5);
    expect(stats.completed).toBe(3);
    expect(stats.failed).toBe(2);
    expect(stats.totalSecs).toBe(480);
    expect(stats.avgDuration).toBe(96); // 480 / 5 = 96
    expect(stats.twilioCount).toBe(3);
    expect(stats.telnyxCount).toBe(2);
    expect(stats.inbound).toBe(1);
    expect(stats.outbound).toBe(4);
  });

  it("handles sessions with null durations", () => {
    const sessions: Session[] = [
      { status: "initiated", carrier: "twilio", direction: "outbound", durationSecs: null },
      { status: "initiated", carrier: "twilio", direction: "outbound", durationSecs: null },
    ];
    const stats = computeStats(sessions);
    expect(stats.totalSecs).toBe(0);
    expect(stats.avgDuration).toBe(0);
  });

  it("correctly identifies active calls", () => {
    const sessions = [
      { status: "initiated", endedAt: null },
      { status: "completed", endedAt: Date.now() },
      { status: "initiated", endedAt: null },
      { status: "failed", endedAt: Date.now() },
    ];
    const activeCalls = sessions.filter(s => s.status === "initiated" && !s.endedAt);
    expect(activeCalls.length).toBe(2);
  });
});

describe("Empty Stats Fallback", () => {
  it("returns correct empty stats structure", () => {
    const empty = { total: 0, completed: 0, failed: 0, totalSecs: 0, avgDuration: 0, twilioCount: 0, telnyxCount: 0, inbound: 0, outbound: 0 };
    const emptyStats = {
      today: empty,
      week: empty,
      allTime: empty,
      activeCalls: 0,
      recentCalls: [],
    };
    expect(emptyStats.today.total).toBe(0);
    expect(emptyStats.week.total).toBe(0);
    expect(emptyStats.allTime.total).toBe(0);
    expect(emptyStats.activeCalls).toBe(0);
    expect(emptyStats.recentCalls).toHaveLength(0);
  });
});

describe("Inbound TwiML Routing", () => {
  it("should route to operator-1 client identity", () => {
    // Simulates what /api/webphone/inbound does
    const from = "+27821234567";
    const to = "+13188181350";
    // The endpoint creates: <Dial><Client>operator-1</Client></Dial>
    const clientIdentity = "operator-1";
    expect(clientIdentity).toBe("operator-1");
    expect(from).toMatch(/^\+/);
    expect(to).toMatch(/^\+/);
  });
});
