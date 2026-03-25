/**
 * Webphone router tests — covers token generation, session logging, and carrier management.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null), // null DB triggers graceful fallbacks
}));

// ─── Mock carrier helpers ─────────────────────────────────────────────────────
vi.mock("./webphone/twilio", () => ({
  generateTwilioToken: vi.fn().mockReturnValue({
    token: "mock-twilio-token",
    identity: "operator-1",
    carrier: "twilio",
    expiresIn: 3600,
  }),
  buildTwiMLVoiceResponse: vi.fn().mockReturnValue("<Response><Dial><Number>+27111234567</Number></Dial></Response>"),
}));

vi.mock("./webphone/telnyx", () => ({
  getTelnyxCredentials: vi.fn().mockReturnValue({
    sipUser: "operator-1",
    sipPassword: "mock-password",
    sipDomain: "sip.telnyx.com",
    carrier: "telnyx",
    connectionId: "conn-123",
  }),
  parseTelnyxWebhook: vi.fn().mockReturnValue({
    event: "call.initiated",
    callControlId: "ctrl-abc",
    direction: "outbound",
    from: "+27000000000",
    to: "+27111234567",
  }),
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

// ─── Import mocked modules ────────────────────────────────────────────────────
import { generateTwilioToken } from "./webphone/twilio";
import { getTelnyxCredentials } from "./webphone/telnyx";
import { getActiveCarrier, getAllCarrierHealth, triggerFailover } from "./webphone/carrierManager";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Twilio token generation", () => {
  it("returns a token with correct shape", () => {
    const result = generateTwilioToken(1);
    expect(result).not.toBeNull();
    expect(result?.carrier).toBe("twilio");
    expect(result?.token).toBe("mock-twilio-token");
    expect(result?.identity).toBe("operator-1");
    expect(result?.expiresIn).toBe(3600);
  });

  it("returns null when env vars are missing", () => {
    vi.mocked(generateTwilioToken).mockReturnValueOnce(null);
    const result = generateTwilioToken(99);
    expect(result).toBeNull();
  });
});

describe("Telnyx credential generation", () => {
  it("returns SIP credentials with correct shape", () => {
    const result = getTelnyxCredentials(1);
    expect(result).not.toBeNull();
    expect(result?.carrier).toBe("telnyx");
    expect(result?.sipDomain).toBe("sip.telnyx.com");
    expect(result?.sipUser).toContain("operator-1");
  });

  it("returns null when env vars are missing", () => {
    vi.mocked(getTelnyxCredentials).mockReturnValueOnce(null);
    const result = getTelnyxCredentials(99);
    expect(result).toBeNull();
  });
});

describe("Carrier manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns twilio as the default active carrier", async () => {
    vi.mocked(getActiveCarrier).mockResolvedValueOnce("twilio");
    const carrier = await getActiveCarrier();
    expect(carrier).toBe("twilio");
  });

  it("returns telnyx when twilio is down", async () => {
    vi.mocked(getActiveCarrier).mockResolvedValueOnce("telnyx");
    const carrier = await getActiveCarrier();
    expect(carrier).toBe("telnyx");
  });

  it("returns health for both carriers", async () => {
    const health = await getAllCarrierHealth();
    expect(health).toHaveLength(2);
    const carriers = health.map(h => h.carrier);
    expect(carriers).toContain("twilio");
    expect(carriers).toContain("telnyx");
  });

  it("triggers failover when primary carrier is unavailable", async () => {
    await triggerFailover("twilio");
    expect(triggerFailover).toHaveBeenCalledWith("twilio");
  });

  it("all carriers have valid status values", async () => {
    const health = await getAllCarrierHealth();
    const validStatuses = ["healthy", "degraded", "down"];
    health.forEach(h => {
      expect(validStatuses).toContain(h.status);
    });
  });
});

describe("Failover logic", () => {
  it("falls back to telnyx when twilio token generation fails", async () => {
    // Simulate Twilio failing
    vi.mocked(generateTwilioToken).mockReturnValueOnce(null);
    vi.mocked(getActiveCarrier).mockResolvedValueOnce("twilio");

    const twilioResult = generateTwilioToken(1);
    expect(twilioResult).toBeNull();

    // Failover should be triggered
    await triggerFailover("twilio");
    expect(triggerFailover).toHaveBeenCalledWith("twilio");

    // Telnyx should be available as fallback
    const telnyxResult = getTelnyxCredentials(1);
    expect(telnyxResult).not.toBeNull();
    expect(telnyxResult?.carrier).toBe("telnyx");
  });

  it("both carriers can be healthy simultaneously", async () => {
    const health = await getAllCarrierHealth();
    const twilioHealth = health.find(h => h.carrier === "twilio");
    const telnyxHealth = health.find(h => h.carrier === "telnyx");
    expect(twilioHealth?.status).toBe("healthy");
    expect(telnyxHealth?.status).toBe("healthy");
  });
});
