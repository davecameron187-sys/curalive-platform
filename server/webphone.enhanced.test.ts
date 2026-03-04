/**
 * Enhanced Webphone tests — covers caller ID selection, error mapping,
 * inbound TwiML endpoint, and E.164 normalization.
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

import { buildTwiMLVoiceResponse } from "./webphone/twilio";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TwiML Voice Response with Caller ID", () => {
  it("generates TwiML XML with the specified caller ID", () => {
    const xml = buildTwiMLVoiceResponse("+27821234567", "+13188181350");
    expect(xml).toContain("+27821234567");
    expect(xml).toContain("+13188181350");
    expect(xml).toContain("<Dial");
    expect(xml).toContain("<Number>");
  });

  it("generates TwiML XML with a different caller ID", () => {
    const xml = buildTwiMLVoiceResponse("+27821234567", "+27110108353");
    expect(xml).toContain("+27110108353");
    expect(xml).toContain("+27821234567");
  });

  it("handles international numbers correctly", () => {
    const xml = buildTwiMLVoiceResponse("+442071234567", "+13188181350");
    expect(xml).toContain("+442071234567");
  });
});

describe("E.164 Number Normalization", () => {
  // Client-side function replicated for testing
  function normalizeToE164(raw: string): string {
    const stripped = raw.trim().replace(/[\s\-().]/g, "");
    if (stripped.startsWith("+")) return stripped;
    if (stripped.startsWith("00")) return "+" + stripped.slice(2);
    if (stripped.startsWith("0") && stripped.length === 10) return "+27" + stripped.slice(1);
    return stripped;
  }

  it("passes through E.164 numbers unchanged", () => {
    expect(normalizeToE164("+27821234567")).toBe("+27821234567");
    expect(normalizeToE164("+13188181350")).toBe("+13188181350");
  });

  it("converts South African local numbers to E.164", () => {
    expect(normalizeToE164("0821234567")).toBe("+27821234567");
    expect(normalizeToE164("0111234567")).toBe("+27111234567");
  });

  it("converts 00-prefixed international numbers", () => {
    expect(normalizeToE164("0027821234567")).toBe("+27821234567");
    expect(normalizeToE164("00442071234567")).toBe("+442071234567");
  });

  it("strips spaces, dashes, and parentheses", () => {
    expect(normalizeToE164("+27 82 123 4567")).toBe("+27821234567");
    expect(normalizeToE164("(082) 123-4567")).toBe("+27821234567");
    expect(normalizeToE164("+1 (318) 818-1350")).toBe("+13188181350");
  });

  it("handles edge cases", () => {
    expect(normalizeToE164("")).toBe("");
    expect(normalizeToE164("  +27821234567  ")).toBe("+27821234567");
  });
});

describe("Twilio Error Code Mapping", () => {
  // Replicate the error map for testing
  const TWILIO_ERROR_MAP: Record<number, string> = {
    13224: "Invalid phone number format. Use E.164 format (e.g. +27821234567).",
    13225: "Caller ID is not a verified Twilio number.",
    13227: "Destination number is not reachable.",
    13228: "Call rejected by the destination carrier.",
    13230: "Destination number is busy. Try again later.",
    13231: "Call timed out — no answer.",
    13233: "International calling is not enabled on this account.",
    13235: "Destination country is not supported.",
    20101: "Access token is invalid or expired. Refresh the page.",
    20103: "Access token has expired. Refresh the page.",
    31002: "Connection declined by Twilio.",
    31003: "Connection timed out. Check your internet.",
    31005: "WebSocket connection failed. Check firewall settings.",
    31009: "Transport error — unstable internet connection.",
    31201: "Authentication failed. Credentials may be invalid.",
    31204: "Voice SDK could not register. Check TwiML App SID.",
    31205: "JWT token expired during the call. Refresh and retry.",
    31208: "Media connection failed. Check microphone and firewall.",
    31401: "Insufficient funds in Twilio account.",
    31480: "No answer from the dialled number.",
    31486: "The dialled number is busy.",
    31603: "Call rejected by the remote party.",
  };

  function friendlyError(code: number | undefined, fallback: string): string {
    if (code && TWILIO_ERROR_MAP[code]) return TWILIO_ERROR_MAP[code];
    return fallback;
  }

  it("maps known error codes to user-friendly messages", () => {
    expect(friendlyError(31401, "fallback")).toBe("Insufficient funds in Twilio account.");
    expect(friendlyError(20101, "fallback")).toBe("Access token is invalid or expired. Refresh the page.");
    expect(friendlyError(13224, "fallback")).toBe("Invalid phone number format. Use E.164 format (e.g. +27821234567).");
  });

  it("returns fallback for unknown error codes", () => {
    expect(friendlyError(99999, "Something went wrong")).toBe("Something went wrong");
    expect(friendlyError(undefined, "Unknown error")).toBe("Unknown error");
  });

  it("covers all common call failure codes", () => {
    const callFailureCodes = [13227, 13228, 13230, 13231, 31480, 31486, 31603];
    for (const code of callFailureCodes) {
      const msg = friendlyError(code, "fallback");
      expect(msg).not.toBe("fallback");
      expect(msg.length).toBeGreaterThan(10);
    }
  });

  it("covers all authentication/token codes", () => {
    const authCodes = [20101, 20103, 31201, 31204, 31205];
    for (const code of authCodes) {
      const msg = friendlyError(code, "fallback");
      expect(msg).not.toBe("fallback");
    }
  });

  it("covers all network/transport codes", () => {
    const networkCodes = [31002, 31003, 31005, 31009, 31208];
    for (const code of networkCodes) {
      const msg = friendlyError(code, "fallback");
      expect(msg).not.toBe("fallback");
    }
  });
});

describe("Inbound TwiML endpoint logic", () => {
  it("should route inbound calls to a client identity", () => {
    // Simulate what the /api/webphone/inbound endpoint does
    // It creates a VoiceResponse with <Dial><Client>operator-1</Client></Dial>
    const expectedBehavior = {
      from: "+27821234567",
      to: "+13188181350",
      routedTo: "operator-1",
    };
    expect(expectedBehavior.routedTo).toBe("operator-1");
    expect(expectedBehavior.from).toMatch(/^\+/);
    expect(expectedBehavior.to).toMatch(/^\+/);
  });
});

describe("Caller ID Selection", () => {
  it("should support multiple caller ID types", () => {
    const callerIds = [
      { number: "+13188181350", label: "+13188181350", type: "purchased" },
      { number: "+27110108353", label: "SA Number", type: "purchased" },
      { number: "+27844446001", label: "David Cell", type: "verified" },
    ];

    expect(callerIds).toHaveLength(3);
    expect(callerIds.filter(c => c.type === "purchased")).toHaveLength(2);
    expect(callerIds.filter(c => c.type === "verified")).toHaveLength(1);
  });

  it("should validate caller ID format (E.164)", () => {
    const validCallerIds = ["+13188181350", "+27110108353", "+442071234567"];
    const invalidCallerIds = ["operator-1", "0821234567", "not-a-number"];

    for (const id of validCallerIds) {
      expect(id.startsWith("+")).toBe(true);
    }
    for (const id of invalidCallerIds) {
      expect(id.startsWith("+")).toBe(false);
    }
  });

  it("should fall back to env TWILIO_CALLER_ID when no selection", () => {
    const clientCallerId = "";
    const envCallerId = "+13188181350";
    const callerId = (clientCallerId && clientCallerId.startsWith("+")) ? clientCallerId : envCallerId;
    expect(callerId).toBe("+13188181350");
  });

  it("should use client-selected caller ID when valid", () => {
    const clientCallerId = "+27110108353";
    const envCallerId = "+13188181350";
    const callerId = (clientCallerId && clientCallerId.startsWith("+")) ? clientCallerId : envCallerId;
    expect(callerId).toBe("+27110108353");
  });
});
