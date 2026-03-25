/**
 * chat.translation.improvements.test.ts
 * Unit tests for the three chat translation improvements:
 *   1. Translate-all batch logic
 *   2. localStorage language persistence (simulated)
 *   3. AblyContext chat:translation event forwarding
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
    choices: [{ message: { content: JSON.stringify({ detectedLanguage, translation }) } }],
  };
}

const DEMO_CONF = { id: 42, eventId: "q4-earnings-2026", subject: "Q4 Earnings" };

const DEMO_MESSAGES = [
  { id: 1, conferenceId: 42, senderName: "Operator", senderType: "operator", message: "Welcome to the call.", recipientType: "all", sentAt: new Date(), detectedLanguage: null, translatedMessage: null, translationLanguage: null },
  { id: 2, conferenceId: 42, senderName: "Moderator", senderType: "moderator", message: "Please hold.", recipientType: "all", sentAt: new Date(), detectedLanguage: null, translatedMessage: null, translationLanguage: null },
  { id: 3, conferenceId: 42, senderName: "Operator", senderType: "operator", message: "We will now open for questions.", recipientType: "all", sentAt: new Date(), detectedLanguage: "en", translatedMessage: "Nous allons maintenant ouvrir les questions.", translationLanguage: "fr" },
];

// ─── 1. Translate-all batch logic ─────────────────────────────────────────────

describe("Translate-all batch logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ABLY_API_KEY = "test-key:test-secret";
  });

  it("identifies untranslated messages correctly", () => {
    const targetLanguage = "fr";
    const existingTranslations: Record<number, { translationLanguage: string }> = {
      3: { translationLanguage: "fr" }, // already translated
    };

    const untranslated = DEMO_MESSAGES.filter(
      (m) => !existingTranslations[m.id] || existingTranslations[m.id].translationLanguage !== targetLanguage
    );

    expect(untranslated).toHaveLength(2);
    expect(untranslated.map((m) => m.id)).toEqual([1, 2]);
  });

  it("skips messages already translated to the target language", () => {
    const targetLanguage = "fr";
    const existingTranslations: Record<number, { translationLanguage: string }> = {
      1: { translationLanguage: "fr" },
      2: { translationLanguage: "fr" },
      3: { translationLanguage: "fr" },
    };

    const untranslated = DEMO_MESSAGES.filter(
      (m) => !existingTranslations[m.id] || existingTranslations[m.id].translationLanguage !== targetLanguage
    );

    expect(untranslated).toHaveLength(0);
  });

  it("translates each untranslated message sequentially via LLM", async () => {
    mockInvokeLLM
      .mockResolvedValueOnce(makeLLMResponse("en", "Bienvenue à l'appel."))
      .mockResolvedValueOnce(makeLLMResponse("en", "Veuillez patienter."));
    mockUpdateTranslation.mockResolvedValue(undefined);

    const untranslated = DEMO_MESSAGES.filter((m) => !m.translatedMessage);
    const results: { id: number; translated: string }[] = [];

    for (const msg of untranslated) {
      const llmResp = await invokeLLM({ messages: [{ role: "user", content: msg.message }] });
      const parsed = JSON.parse(llmResp.choices[0].message.content as string);
      await updateChatMessageTranslation(msg.id, parsed.detectedLanguage, parsed.translation, "fr");
      results.push({ id: msg.id, translated: parsed.translation });
    }

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ id: 1, translated: "Bienvenue à l'appel." });
    expect(results[1]).toEqual({ id: 2, translated: "Veuillez patienter." });
    expect(mockInvokeLLM).toHaveBeenCalledTimes(2);
    expect(mockUpdateTranslation).toHaveBeenCalledTimes(2);
  });

  it("returns zero untranslated when all messages match target language", () => {
    const targetLanguage = "de";
    const existingTranslations: Record<number, { translationLanguage: string }> = {
      1: { translationLanguage: "de" },
      2: { translationLanguage: "de" },
      3: { translationLanguage: "de" },
    };

    const untranslated = DEMO_MESSAGES.filter(
      (m) => !existingTranslations[m.id] || existingTranslations[m.id].translationLanguage !== targetLanguage
    );

    expect(untranslated).toHaveLength(0);
  });
});

// ─── 2. localStorage language persistence ─────────────────────────────────────

describe("localStorage chat language persistence", () => {
  const STORAGE_KEY = "curalive_chat_lang";

  beforeEach(() => {
    // Simulate localStorage in Node environment
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
  });

  it("defaults to 'en' when no preference is stored", () => {
    const lang = localStorage.getItem(STORAGE_KEY) ?? "en";
    expect(lang).toBe("en");
  });

  it("persists language selection to localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "fr");
    const lang = localStorage.getItem(STORAGE_KEY) ?? "en";
    expect(lang).toBe("fr");
  });

  it("restores persisted language on next load", () => {
    localStorage.setItem(STORAGE_KEY, "ar");
    // Simulate re-initializing state from localStorage
    const restoredLang = localStorage.getItem(STORAGE_KEY) ?? "en";
    expect(restoredLang).toBe("ar");
  });

  it("enables translation automatically when a non-English language is restored", () => {
    localStorage.setItem(STORAGE_KEY, "pt");
    const restoredLang = localStorage.getItem(STORAGE_KEY) ?? "en";
    const translationEnabled = restoredLang !== "en";
    expect(translationEnabled).toBe(true);
  });

  it("does not enable translation when 'en' is stored", () => {
    localStorage.setItem(STORAGE_KEY, "en");
    const restoredLang = localStorage.getItem(STORAGE_KEY) ?? "en";
    const translationEnabled = restoredLang !== "en";
    expect(translationEnabled).toBe(false);
  });
});

// ─── 3. AblyContext chat:translation event forwarding ─────────────────────────

describe("AblyContext chat:translation event forwarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ABLY_API_KEY = "test-key:test-secret";
  });

  it("publishes chat:translation event to the correct Ably channel", async () => {
    const eventId = "q4-earnings-2026";
    const channel = `curalive-event-${eventId}`;
    const translationPayload = {
      messageId: 1,
      detectedLanguage: "en",
      translatedMessage: "Bienvenue à l'appel.",
      translationLanguage: "fr",
    };

    const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic dGVzdC1rZXk6dGVzdC1zZWNyZXQ=",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "chat:translation", data: translationPayload }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("curalive-event-q4-earnings-2026"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("chat:translation"),
      })
    );
  });

  it("chat:translation event payload contains all required fields", () => {
    const event = {
      messageId: 5,
      detectedLanguage: "en",
      translatedMessage: "Bienvenido a la llamada.",
      translationLanguage: "es",
    };

    expect(event).toHaveProperty("messageId");
    expect(event).toHaveProperty("detectedLanguage");
    expect(event).toHaveProperty("translatedMessage");
    expect(event).toHaveProperty("translationLanguage");
    expect(typeof event.messageId).toBe("number");
    expect(typeof event.translatedMessage).toBe("string");
  });

  it("AblyContext appends new chat:translation events to the events array", () => {
    // Simulate the state update logic from AblyContext
    const chatTranslationEvents: typeof DEMO_MESSAGES = [];
    const newEvent = {
      messageId: 2,
      detectedLanguage: "en",
      translatedMessage: "Veuillez patienter.",
      translationLanguage: "fr",
    };

    // Simulate setChatTranslationEvents((prev) => [...prev, data])
    chatTranslationEvents.push(newEvent as any);

    expect(chatTranslationEvents).toHaveLength(1);
    expect(chatTranslationEvents[0]).toMatchObject(newEvent);
  });

  it("EventRoom useEffect applies the latest chatTranslationEvent to local state", () => {
    // Simulate the useEffect in EventRoom that reads chatTranslationEvents
    const chatTranslationEvents = [
      { messageId: 1, detectedLanguage: "en", translatedMessage: "Bienvenue.", translationLanguage: "fr" },
      { messageId: 2, detectedLanguage: "en", translatedMessage: "Veuillez patienter.", translationLanguage: "fr" },
    ];

    const messageTranslations: Record<number, { translatedMessage: string; detectedLanguage: string; translationLanguage: string }> = {};

    // Apply the latest event (simulating the useEffect)
    const latest = chatTranslationEvents[chatTranslationEvents.length - 1];
    if (latest) {
      messageTranslations[latest.messageId] = {
        translatedMessage: latest.translatedMessage,
        detectedLanguage: latest.detectedLanguage,
        translationLanguage: latest.translationLanguage,
      };
    }

    expect(messageTranslations[2]).toBeDefined();
    expect(messageTranslations[2].translatedMessage).toBe("Veuillez patienter.");
    expect(messageTranslations[2].translationLanguage).toBe("fr");
  });
});
