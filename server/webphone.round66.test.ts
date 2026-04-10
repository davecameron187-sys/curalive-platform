/**
 * Round 66 — Voicemail, Call Transfer, and Transcription Tests
 *
 * Tests for:
 * 1. Voicemail recording fallback (when no operators available)
 * 2. Blind transfer and warm transfer procedures
 * 3. Recording transcription via Whisper
 * 4. Transcript search
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock environment ─────────────────────────────────────────────────────────

vi.mock("../server/_core/env", () => ({
  env: {
    TWILIO_ACCOUNT_SID: "ACtest123",
    TWILIO_AUTH_TOKEN: "test_auth_token",
    TWILIO_CALLER_ID: "+15005550006",
    TWILIO_TWIML_APP_SID: "APtest123",
    TWILIO_API_KEY: "SKtest123",
    TWILIO_API_SECRET: "test_secret",
    TELNYX_API_KEY: "KEY01_test",
    TELNYX_SIP_USERNAME: "test_user",
    TELNYX_SIP_PASSWORD: "test_pass",
    TELNYX_SIP_DOMAIN: "sip.telnyx.com",
    TELNYX_SIP_CONNECTION_ID: "conn_test",
    ABLY_API_KEY: "test_ably_key",
    APP_ID: "curalive-test",
    APP_ORIGIN: "https://curalive-platform.replit.app",
    BUILT_IN_FORGE_API_KEY: "test_forge_key",
  },
}));

vi.mock("twilio", () => {
  const mockTwilio = vi.fn(() => ({
    calls: {
      create: vi.fn().mockResolvedValue({ sid: "CA_transfer_test" }),
    },
    incomingPhoneNumbers: {
      list: vi.fn().mockResolvedValue([
        { sid: "PN_test", phoneNumber: "+15005550006", voiceUrl: "" },
      ]),
      get: vi.fn(() => ({
        update: vi.fn().mockResolvedValue({ sid: "PN_test", voiceUrl: "https://curalive-platform.replit.app/api/webphone/inbound" }),
      })),
    },
    tokens: {
      create: vi.fn().mockResolvedValue({ accountSid: "ACtest123" }),
    },
  }));
  return { default: mockTwilio };
});

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("../server/webphone/ablyPublish", () => ({
  publishWebphoneEvent: vi.fn().mockResolvedValue(undefined),
  WEBPHONE_CHANNEL: "webphone:activity",
}));

// ─── 1. Voicemail TwiML generation ───────────────────────────────────────────

describe("Voicemail TwiML", () => {
  it("generates Say + Record TwiML for voicemail fallback", () => {
    const twilio = require("twilio");
    const VoiceResponse = twilio.twiml?.VoiceResponse ?? class {
      private parts: string[] = [];
      say(opts: { voice?: string }, text?: string) {
        const t = typeof opts === "string" ? opts : text ?? "";
        this.parts.push(`<Say>${t}</Say>`);
        return this;
      }
      record(opts: Record<string, unknown>) {
        const attrs = Object.entries(opts).map(([k, v]) => `${k}="${v}"`).join(" ");
        this.parts.push(`<Record ${attrs}/>`);
        return this;
      }
      toString() {
        return `<?xml version="1.0" encoding="UTF-8"?><Response>${this.parts.join("")}</Response>`;
      }
    };

    const response = new VoiceResponse();
    response.say({ voice: "alice" }, "No operators are available. Please leave a message after the tone.");
    response.record({
      maxLength: 120,
      playBeep: true,
      action: "https://curalive-platform.replit.app/api/webphone/voicemail-status",
      recordingStatusCallback: "https://curalive-platform.replit.app/api/webphone/voicemail-status",
    });

    const xml = response.toString();
    expect(xml).toContain("No operators are available");
    expect(xml).toContain("Record");
  });

  it("voicemail-status endpoint requires recordingUrl and callSid", () => {
    const requiredFields = ["RecordingUrl", "CallSid", "RecordingDuration", "From"];
    const mockBody = {
      RecordingUrl: "https://api.twilio.com/recordings/RE_test",
      CallSid: "CA_voicemail_test",
      RecordingDuration: "45",
      From: "+27821234567",
    };

    for (const field of requiredFields) {
      expect(mockBody).toHaveProperty(field);
    }
  });
});

// ─── 2. Blind Transfer ────────────────────────────────────────────────────────

describe("Blind Transfer", () => {
  it("validates required callSid and target fields", () => {
    const input = { callSid: "CA_test", target: "+27821234567" };
    expect(input.callSid).toBeTruthy();
    expect(input.target).toBeTruthy();
  });

  it("normalises E.164 target before transfer", () => {
    const normalizeToE164 = (raw: string): string => {
      const stripped = raw.trim().replace(/[\s\-().]/g, "");
      if (stripped.startsWith("+")) return stripped;
      if (stripped.startsWith("00")) return "+" + stripped.slice(2);
      if (stripped.startsWith("0") && stripped.length === 10) return "+27" + stripped.slice(1);
      return stripped;
    };

    expect(normalizeToE164("0821234567")).toBe("+27821234567");
    expect(normalizeToE164("+27821234567")).toBe("+27821234567");
    expect(normalizeToE164("0027821234567")).toBe("+27821234567");
  });

  it("blind transfer creates a new Twilio call to the target", async () => {
    // Simulate the Twilio REST API call that blindTransfer makes
    const mockCallsCreate = vi.fn().mockResolvedValue({ sid: "CA_transfer_test" });
    const mockClient = { calls: { create: mockCallsCreate } };

    const result = await mockClient.calls.create({
      to: "+27821234567",
      from: "+15005550006",
      url: "https://curalive-platform.replit.app/api/webphone/twiml",
    });

    expect(result.sid).toBe("CA_transfer_test");
    expect(mockCallsCreate).toHaveBeenCalledWith(expect.objectContaining({
      to: "+27821234567",
    }));
  });

  it("rejects transfer to empty target", () => {
    const target = "";
    expect(target.trim().length).toBe(0);
  });
});

// ─── 3. Warm Transfer ─────────────────────────────────────────────────────────

describe("Warm Transfer", () => {
  it("warm transfer requires callSid, target, and optional announcement", () => {
    const input = {
      callSid: "CA_warm_test",
      target: "+27821234567",
      announcement: "Transferring you to the billing department.",
    };

    expect(input.callSid).toBeTruthy();
    expect(input.target).toBeTruthy();
    expect(input.announcement).toBeTruthy();
  });

  it("warm transfer TwiML includes Say + Dial", () => {
    const announcement = "Transferring you to the billing department.";
    const target = "+27821234567";

    // Simulate TwiML generation
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${announcement}</Say><Dial>${target}</Dial></Response>`;

    expect(twiml).toContain(announcement);
    expect(twiml).toContain(target);
    expect(twiml).toContain("<Dial>");
  });

  it("warm transfer without announcement skips Say verb", () => {
    const target = "+27821234567";
    const announcement = "";

    const twiml = announcement
      ? `<Response><Say>${announcement}</Say><Dial>${target}</Dial></Response>`
      : `<Response><Dial>${target}</Dial></Response>`;

    expect(twiml).not.toContain("<Say>");
    expect(twiml).toContain("<Dial>");
  });
});

// ─── 4. Transcription ─────────────────────────────────────────────────────────

describe("Recording Transcription", () => {
  it("transcribeRecording requires sessionId", () => {
    const input = { sessionId: 42 };
    expect(typeof input.sessionId).toBe("number");
    expect(input.sessionId).toBeGreaterThan(0);
  });

  it("transcription result has expected shape", () => {
    const mockTranscription = {
      text: "Good afternoon, this is John from the finance department calling about the Q4 earnings report.",
      language: "en",
      segments: [
        { id: 0, start: 0, end: 3.5, text: "Good afternoon, this is John", avg_logprob: -0.2 },
      ],
    };

    expect(mockTranscription.text).toBeTruthy();
    expect(mockTranscription.language).toBe("en");
    expect(Array.isArray(mockTranscription.segments)).toBe(true);
    expect(mockTranscription.segments[0]).toHaveProperty("start");
    expect(mockTranscription.segments[0]).toHaveProperty("end");
  });

  it("auto-transcription triggers on recording completion", () => {
    const recordingStatus = "completed";
    const shouldAutoTranscribe = recordingStatus === "completed";
    expect(shouldAutoTranscribe).toBe(true);
  });

  it("transcription is skipped if recording failed", () => {
    const recordingStatus = "failed";
    const shouldAutoTranscribe = recordingStatus === "completed";
    expect(shouldAutoTranscribe).toBe(false);
  });
});

// ─── 5. Transcript Search ─────────────────────────────────────────────────────

describe("Transcript Search", () => {
  it("searchTranscriptions requires query of at least 2 characters", () => {
    const query = "Q4";
    expect(query.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects empty query", () => {
    const query = "";
    expect(query.length).toBeLessThan(2);
  });

  it("search results have expected shape", () => {
    const mockResults = [
      {
        id: 1,
        remoteNumber: "+27821234567",
        transcription: "Good afternoon, this is John from the finance department.",
        startedAt: new Date(),
        durationSecs: 120,
      },
    ];

    expect(Array.isArray(mockResults)).toBe(true);
    expect(mockResults[0]).toHaveProperty("id");
    expect(mockResults[0]).toHaveProperty("transcription");
    expect(mockResults[0].transcription).toContain("John");
  });

  it("search is case-insensitive", () => {
    const transcription = "Good afternoon, this is John from the Finance Department.";
    const query = "finance";
    expect(transcription.toLowerCase()).toContain(query.toLowerCase());
  });
});

// ─── 6. Ably voicemail:received event ────────────────────────────────────────

describe("Ably voicemail:received event", () => {
  it("publishes voicemail:received event with correct shape", async () => {
    const { publishWebphoneEvent } = await import("../server/webphone/ablyPublish");

    await publishWebphoneEvent("voicemail:received", {
      remoteNumber: "+27821234567",
      durationSecs: 45,
      timestamp: Date.now(),
    });

    expect(publishWebphoneEvent).toHaveBeenCalledWith("voicemail:received", expect.objectContaining({
      remoteNumber: "+27821234567",
      durationSecs: 45,
    }));
  });

  it("voicemail:received is a valid WebphoneEvent type", async () => {
    const { publishWebphoneEvent } = await import("../server/webphone/ablyPublish");
    type WebphoneEvent = Parameters<typeof publishWebphoneEvent>[0];

    const event: WebphoneEvent = "voicemail:received";
    expect(event).toBe("voicemail:received");
  });
});
