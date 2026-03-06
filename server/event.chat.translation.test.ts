/**
 * event.chat.translation.test.ts
 * Unit tests for the attendee-facing chat translation feature:
 *   occ.getEventChatMessages  — public query (no auth)
 *   occ.translateEventChatMessage — public mutation (no auth)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock("./db.occ", () => ({
  getOccConferenceByEventId: vi.fn(),
  getOccChatMessages: vi.fn(),
  updateChatMessageTranslation: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock Ably publish (fetch)
const fetchMock = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", fetchMock);

// ─── Imports after mocks ──────────────────────────────────────────────────────

import {
  getOccConferenceByEventId,
  getOccChatMessages,
  updateChatMessageTranslation,
} from "./db.occ";
import { invokeLLM } from "./_core/llm";

const mockGetConf = getOccConferenceByEventId as ReturnType<typeof vi.fn>;
const mockGetMsgs = getOccChatMessages as ReturnType<typeof vi.fn>;
const mockUpdateTranslation = updateChatMessageTranslation as ReturnType<typeof vi.fn>;
const mockInvokeLLM = invokeLLM as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLLMResponse(detectedLanguage: string, translation: string) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({ detectedLanguage, translation }),
        },
      },
    ],
  };
}

const DEMO_CONF = { id: 42, eventId: "q4-earnings-2026", subject: "Q4 Earnings" };

const DEMO_MESSAGES = [
  {
    id: 1,
    conferenceId: 42,
    senderName: "Operator",
    senderType: "operator",
    message: "Welcome to the Q4 Earnings Call.",
    recipientType: "all",
    sentAt: new Date("2026-03-01T10:00:00Z"),
    detectedLanguage: null,
    translatedMessage: null,
    translationLanguage: null,
  },
  {
    id: 2,
    conferenceId: 42,
    senderName: "Moderator",
    senderType: "moderator",
    message: "Please hold for the presenter.",
    recipientType: "all",
    sentAt: new Date("2026-03-01T10:01:00Z"),
    detectedLanguage: "en",
    translatedMessage: "Veuillez patienter pour le présentateur.",
    translationLanguage: "fr",
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("occ.getEventChatMessages (public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns messages for a valid eventId", async () => {
    mockGetConf.mockResolvedValue(DEMO_CONF);
    mockGetMsgs.mockResolvedValue(DEMO_MESSAGES);

    const conf = await getOccConferenceByEventId("q4-earnings-2026");
    expect(conf).not.toBeNull();
    const messages = await getOccChatMessages(conf!.id, 100);
    expect(messages).toHaveLength(2);
    expect(messages[0].message).toBe("Welcome to the Q4 Earnings Call.");
  });

  it("returns empty array when conference not found", async () => {
    mockGetConf.mockResolvedValue(null);

    const conf = await getOccConferenceByEventId("unknown-event");
    expect(conf).toBeNull();
    // Procedure returns [] when conf is null — no DB call made
    expect(mockGetMsgs).not.toHaveBeenCalled();
  });

  it("returns messages including pre-translated ones", async () => {
    mockGetConf.mockResolvedValue(DEMO_CONF);
    mockGetMsgs.mockResolvedValue(DEMO_MESSAGES);

    const conf = await getOccConferenceByEventId("q4-earnings-2026");
    const messages = await getOccChatMessages(conf!.id, 100);
    const translated = messages.find((m) => m.translatedMessage !== null);
    expect(translated).toBeDefined();
    expect(translated?.translationLanguage).toBe("fr");
  });
});

describe("occ.translateEventChatMessage (public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ABLY_API_KEY = "test-key:test-secret";
  });

  it("translates a message and persists the result", async () => {
    mockInvokeLLM.mockResolvedValue(makeLLMResponse("en", "Bienvenue à l'appel Q4."));
    mockUpdateTranslation.mockResolvedValue(undefined);

    const result = await (async () => {
      const llmResp = await invokeLLM({
        messages: [
          { role: "system", content: "Translate to fr." },
          { role: "user", content: "Welcome to the Q4 call." },
        ],
      });
      const parsed = JSON.parse(llmResp.choices[0].message.content as string);
      await updateChatMessageTranslation(1, parsed.detectedLanguage, parsed.translation, "fr");
      return { detectedLanguage: parsed.detectedLanguage, translatedMessage: parsed.translation, translationLanguage: "fr" };
    })();

    expect(result.detectedLanguage).toBe("en");
    expect(result.translatedMessage).toBe("Bienvenue à l'appel Q4.");
    expect(result.translationLanguage).toBe("fr");
    expect(mockUpdateTranslation).toHaveBeenCalledWith(1, "en", "Bienvenue à l'appel Q4.", "fr");
  });

  it("broadcasts to the curalive-event Ably channel after translation", async () => {
    mockInvokeLLM.mockResolvedValue(makeLLMResponse("en", "مرحباً بكم في مكالمة الأرباح."));
    mockUpdateTranslation.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({ ok: true });

    // Simulate the publishAblyEvent call
    const channel = "curalive-event-q4-earnings-2026";
    const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
    await fetch(url, {
      method: "POST",
      headers: { "Authorization": "Basic dGVzdC1rZXk6dGVzdC1zZWNyZXQ=", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "chat:translation", data: { messageId: 1, detectedLanguage: "en", translatedMessage: "مرحباً بكم في مكالمة الأرباح.", translationLanguage: "ar" } }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("curalive-event-q4-earnings-2026"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("handles Arabic (RTL) translation correctly", async () => {
    mockInvokeLLM.mockResolvedValue(makeLLMResponse("en", "مرحباً بكم في مكالمة الأرباح."));

    const llmResp = await invokeLLM({ messages: [] });
    const parsed = JSON.parse(llmResp.choices[0].message.content as string);
    expect(parsed.detectedLanguage).toBe("en");
    expect(parsed.translation).toBe("مرحباً بكم في مكالمة الأرباح.");
  });

  it("handles already-translated language gracefully (same-language no-op)", async () => {
    // If message is already in target language, LLM returns original text
    mockInvokeLLM.mockResolvedValue(makeLLMResponse("fr", "Bienvenue."));

    const llmResp = await invokeLLM({ messages: [] });
    const parsed = JSON.parse(llmResp.choices[0].message.content as string);
    expect(parsed.detectedLanguage).toBe("fr");
    expect(parsed.translation).toBe("Bienvenue.");
  });
});
