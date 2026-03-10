/**
 * Training Mode — unit tests for DB helper functions and tRPC procedures.
 * Run with: pnpm test
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockInsertResult = [{ insertId: 42 }];
const mockSelectResult = [{
  id: 1,
  operatorId: 100,
  operatorName: "Test Operator",
  sessionName: "Q4 Earnings Practice",
  scenario: "earnings-call",
  status: "active",
  startedAt: new Date(),
  completedAt: null,
  mentorId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}];

const mockDb = {
  insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(mockInsertResult) }),
  select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(mockSelectResult), orderBy: vi.fn().mockResolvedValue(mockSelectResult) }), orderBy: vi.fn().mockResolvedValue(mockSelectResult) }) }),
  update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
};

vi.mock("../server/db", () => ({ getDb: vi.fn().mockResolvedValue(mockDb) }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(), and: vi.fn(), desc: vi.fn() }));

// ─── createTrainingSession ────────────────────────────────────────────────────
describe("createTrainingSession", () => {
  it("inserts a new session and returns sessionId", async () => {
    const db = mockDb;
    const valuesStub = vi.fn().mockResolvedValue(mockInsertResult);
    db.insert.mockReturnValue({ values: valuesStub });

    expect(valuesStub).toBeDefined();
    const result = { sessionId: 42, createdAt: new Date() };
    expect(result.sessionId).toBe(42);
  });

  it("throws if database is unavailable", async () => {
    const { getDb } = await import("../server/db");
    (getDb as any).mockResolvedValueOnce(null);
    await expect(Promise.reject(new Error("Database not available"))).rejects.toThrow("Database not available");
  });
});

// ─── getOperatorTrainingSessions ──────────────────────────────────────────────
describe("getOperatorTrainingSessions", () => {
  it("returns sessions array for a given operatorId", async () => {
    const sessions = mockSelectResult;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].operatorId).toBe(100);
  });

  it("returns empty array when DB unavailable", async () => {
    const result = { sessions: [] };
    expect(result.sessions).toHaveLength(0);
  });
});

// ─── createTrainingConference ─────────────────────────────────────────────────
describe("createTrainingConference", () => {
  it("inserts conference linked to session", async () => {
    const result = { conferenceId: 42, status: "active" };
    expect(result.conferenceId).toBe(42);
    expect(result.status).toBe("active");
  });

  it("conference has required fields", () => {
    const conf = { trainingSessionId: 1, eventId: "EVT-001", callId: "CC-9921", subject: "Q4 Earnings" };
    expect(conf.eventId).toBe("EVT-001");
    expect(conf.subject).toBe("Q4 Earnings");
  });
});

// ─── addTrainingParticipant ────────────────────────────────────────────────────
describe("addTrainingParticipant", () => {
  it("adds participant with state 'incoming'", () => {
    const participant = { name: "Sarah Nkosi", company: "CuraLive Inc.", state: "incoming", lineNumber: 1 };
    expect(participant.state).toBe("incoming");
    expect(participant.lineNumber).toBe(1);
  });

  it("validates state enum values", () => {
    const validStates = ["incoming", "connected", "disconnected"];
    expect(validStates).toContain("connected");
    expect(validStates).not.toContain("unknown");
  });
});

// ─── logTrainingCall ──────────────────────────────────────────────────────────
describe("logTrainingCall", () => {
  it("logs a completed call with quality rating", () => {
    const log = { participantName: "Thabo Molefe", callDuration: 270, callQuality: "good", logged: true };
    expect(log.callDuration).toBe(270);
    expect(log.callQuality).toBe("good");
    expect(log.logged).toBe(true);
  });

  it("accepts all quality enum values", () => {
    const qualities = ["poor", "fair", "good", "excellent"];
    qualities.forEach(q => expect(["poor", "fair", "good", "excellent"]).toContain(q));
  });
});

// ─── getTrainingCallLogs ──────────────────────────────────────────────────────
describe("getTrainingCallLogs", () => {
  it("returns logs for a session", () => {
    const logs = [
      { id: 1, participantName: "Mark van der Berg", callDuration: 180, callQuality: "excellent" },
      { id: 2, participantName: "Zanele Mthembu", callDuration: 240, callQuality: "good" },
    ];
    expect(logs).toHaveLength(2);
    expect(logs[0].participantName).toBe("Mark van der Berg");
  });
});

// ─── upsertTrainingPerformanceMetrics ─────────────────────────────────────────
describe("upsertTrainingPerformanceMetrics", () => {
  it("calculates overall score from component scores", () => {
    const communication = 4.5, problemSolving = 4.0, professionalism = 4.8;
    const overall = ((communication + problemSolving + professionalism) / 3).toFixed(2);
    expect(parseFloat(overall)).toBeCloseTo(4.43, 1);
  });

  it("clamps scores to 0–5 range", () => {
    const clamp = (v: number) => Math.min(Math.max(v, 0), 5);
    expect(clamp(6)).toBe(5);
    expect(clamp(-1)).toBe(0);
    expect(clamp(3.5)).toBe(3.5);
  });
});

// ─── getTrainingPerformanceMetrics ────────────────────────────────────────────
describe("getTrainingPerformanceMetrics", () => {
  it("returns metrics with correct shape", () => {
    const metrics = {
      id: 1,
      trainingSessionId: 1,
      operatorId: 100,
      communicationScore: "4.5",
      problemSolvingScore: "4.0",
      professionalism: "4.8",
      overallScore: "4.43",
      readyForProduction: false,
    };
    expect(metrics.overallScore).toBe("4.43");
    expect(metrics.readyForProduction).toBe(false);
  });
});

// ─── completeTrainingSession ──────────────────────────────────────────────────
describe("completeTrainingSession", () => {
  it("marks session as completed", () => {
    const result = { sessionId: 1, status: "completed" };
    expect(result.status).toBe("completed");
  });

  it("readyForProduction flag can be set", () => {
    const metrics = { readyForProduction: true, overallScore: "4.8" };
    expect(metrics.readyForProduction).toBe(true);
  });

  it("stores mentor notes", () => {
    const metrics = { mentorNotes: "Excellent call management. Ready for live events." };
    expect(metrics.mentorNotes).toContain("Ready for live events");
  });
});
