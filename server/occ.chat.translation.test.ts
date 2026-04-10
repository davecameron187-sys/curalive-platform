/**
 * Tests for OCC chat translation feature.
 * Covers: translateChatMessage procedure, sendChatMessage with autoTranslateTo,
 * and updateChatMessageTranslation DB helper.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the LLM helper ──────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            detectedLanguage: "fr",
            translation: "Hello, how are you?",
          }),
        },
      },
    ],
  }),
}));

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db.occ", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db.occ")>();
  return {
    ...actual,
    getOccChatMessages: vi.fn().mockResolvedValue([]),
    insertOccChatMessage: vi.fn().mockResolvedValue({ insertId: 42 }),
    updateChatMessageTranslation: vi.fn().mockResolvedValue(undefined),
    getOccAudioFiles: vi.fn().mockResolvedValue([]),
    getOccParticipantHistory: vi.fn().mockResolvedValue([]),
    getOccAccessCodeLog: vi.fn().mockResolvedValue([]),
    getOccConferences: vi.fn().mockResolvedValue([]),
    getOccConferenceById: vi.fn().mockResolvedValue(null),
    getOccConferenceByEventId: vi.fn().mockResolvedValue(null),
    updateOccConference: vi.fn().mockResolvedValue(undefined),
    getOccParticipants: vi.fn().mockResolvedValue([]),
    getOccParticipantById: vi.fn().mockResolvedValue(null),
    updateOccParticipantState: vi.fn().mockResolvedValue(undefined),
    updateOccParticipant: vi.fn().mockResolvedValue(undefined),
    getOccLoungeEntries: vi.fn().mockResolvedValue([]),
    pickFromLounge: vi.fn().mockResolvedValue(undefined),
    getOccOperatorRequests: vi.fn().mockResolvedValue([]),
    pickOperatorRequest: vi.fn().mockResolvedValue(undefined),
    getOrCreateOperatorSession: vi.fn().mockResolvedValue({ id: 1, state: "present" }),
    updateOperatorState: vi.fn().mockResolvedValue(undefined),
    heartbeatOperatorSession: vi.fn().mockResolvedValue(undefined),
  };
});

// ─── Mock Ably publish (no-op in tests) ──────────────────────────────────────
vi.mock("node-fetch", () => ({ default: vi.fn().mockResolvedValue({ ok: true }) }));

// ─── Context helpers ──────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createOperatorContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "operator-1",
    email: "operator@curalive.cc",
    name: "Sarah Nkosi",
    loginMethod: "oauth",
    role: "operator",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("occ.translateChatMessage", () => {
  it("returns detectedLanguage, translatedMessage, and translationLanguage", async () => {
    const ctx = createOperatorContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.occ.translateChatMessage({
      messageId: 42,
      message: "Bonjour, comment allez-vous?",
      targetLanguage: "en",
      conferenceId: 1,
    });

    expect(result).toMatchObject({
      detectedLanguage: "fr",
      translatedMessage: "Hello, how are you?",
      translationLanguage: "en",
    });
  });

  it("calls updateChatMessageTranslation with the correct args", async () => {
    const { updateChatMessageTranslation } = await import("./db.occ");
    const ctx = createOperatorContext();
    const caller = appRouter.createCaller(ctx);

    await caller.occ.translateChatMessage({
      messageId: 99,
      message: "Bonjour",
      targetLanguage: "en",
      conferenceId: 2,
    });

    expect(updateChatMessageTranslation).toHaveBeenCalledWith(
      99,
      "fr",
      "Hello, how are you?",
      "en"
    );
  });
});

describe("occ.sendChatMessage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-apply default mock for insertOccChatMessage
    const { insertOccChatMessage } = await import("./db.occ");
    vi.mocked(insertOccChatMessage).mockResolvedValue({ insertId: 42 } as any);
  });

  it("sends a chat message without translation when autoTranslateTo is not set", async () => {
    const { insertOccChatMessage } = await import("./db.occ");
    const ctx = createOperatorContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.occ.sendChatMessage({
      conferenceId: 1,
      senderName: "Sarah Nkosi",
      senderType: "operator",
      message: "Q&A starts in 5 minutes.",
      recipientType: "all",
    });

    expect(result).toEqual({ success: true });
    expect(insertOccChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conferenceId: 1,
        senderName: "Sarah Nkosi",
        senderType: "operator",
        message: "Q&A starts in 5 minutes.",
        recipientType: "all",
      })
    );
  });

  it("accepts autoTranslateTo parameter without throwing", async () => {
    const ctx = createOperatorContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.occ.sendChatMessage({
        conferenceId: 1,
        senderName: "Sarah Nkosi",
        senderType: "operator",
        message: "Bonjour tout le monde",
        recipientType: "all",
        autoTranslateTo: "en",
      })
    ).resolves.toEqual({ success: true });
  });
});

describe("occ.getChatMessages", () => {
  it("returns an empty array when no messages exist", async () => {
    const ctx = createOperatorContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.occ.getChatMessages({ conferenceId: 99 });
    expect(Array.isArray(result)).toBe(true);
  });
});
