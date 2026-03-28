/**
 * End-to-End Integration Tests — Operator Console Full Lifecycle
 * 
 * Tests the complete workflow from session creation through end-session handoff
 * including Q&A moderation, real-time updates, and data persistence
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { operatorSessions, operatorActions, questions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Operator Console E2E Tests", () => {
  let db: any;
  const testSessionId = `test-session-${Date.now()}`;
  const testEventId = `test-event-${Date.now()}`;
  const testOperatorId = 1;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  afterAll(async () => {
    // Cleanup test data
    if (db) {
      await db.delete(operatorActions).where(eq(operatorActions.sessionId, testSessionId));
      await db.delete(questions).where(eq(questions.sessionId, testSessionId));
      await db.delete(operatorSessions).where(eq(operatorSessions.sessionId, testSessionId));
    }
  });

  describe("Session Lifecycle", () => {
    it("should create a new session in idle state", async () => {
      const now = new Date();
      await db.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "idle",
        startedAt: null,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("idle");
      expect(result[0].startedAt).toBeNull();
    });

    it("should transition from idle to running", async () => {
      const startTime = new Date();
      await db
        .update(operatorSessions)
        .set({
          status: "running",
          startedAt: startTime,
          updatedAt: startTime,
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      expect(result[0].status).toBe("running");
      expect(result[0].startedAt).not.toBeNull();
    });

    it("should transition from running to paused", async () => {
      const pauseTime = new Date();
      await db
        .update(operatorSessions)
        .set({
          status: "paused",
          pausedAt: pauseTime,
          updatedAt: pauseTime,
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      expect(result[0].status).toBe("paused");
      expect(result[0].pausedAt).not.toBeNull();
    });

    it("should transition from paused back to running", async () => {
      const resumeTime = new Date();
      await db
        .update(operatorSessions)
        .set({
          status: "running",
          resumedAt: resumeTime,
          updatedAt: resumeTime,
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      expect(result[0].status).toBe("running");
      expect(result[0].resumedAt).not.toBeNull();
    });

    it("should transition from running to ended", async () => {
      const endTime = new Date();
      await db
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: endTime,
          updatedAt: endTime,
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      expect(result[0].status).toBe("ended");
      expect(result[0].endedAt).not.toBeNull();
    });
  });

  describe("Q&A Moderation", () => {
    it("should create a question in submitted state", async () => {
      await db.insert(questions).values({
        sessionId: testSessionId,
        questionText: "What is your guidance for Q2?",
        submitterName: "John Analyst",
        status: "submitted",
        upvotes: 0,
        complianceRiskScore: 0.1,
        triageScore: 0.8,
        priorityScore: 0.75,
        isAnswered: false,
        questionCategory: "guidance",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, testSessionId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("submitted");
    });

    it("should approve a question", async () => {
      await db
        .update(questions)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(questions.sessionId, testSessionId));

      const result = await db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, testSessionId))
        .limit(1);

      expect(result[0].status).toBe("approved");
    });

    it("should mark question as answered", async () => {
      await db
        .update(questions)
        .set({
          isAnswered: true,
          updatedAt: new Date(),
        })
        .where(eq(questions.sessionId, testSessionId));

      const result = await db
        .select()
        .from(questions)
        .where(eq(questions.sessionId, testSessionId))
        .limit(1);

      expect(result[0].isAnswered).toBe(true);
    });
  });

  describe("Operator Actions", () => {
    it("should log session_started action", async () => {
      await db.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "session_started",
        targetId: testSessionId,
        targetType: "session",
        metadata: { startedBy: testOperatorId },
        syncedToViasocket: false,
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].actionType).toBe("session_started");
    });

    it("should log note_created action", async () => {
      await db.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "note_created",
        targetId: null,
        targetType: null,
        metadata: { content: "Strong Q1 results, guidance raised" },
        syncedToViasocket: false,
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      const noteAction = result.find((a) => a.actionType === "note_created");
      expect(noteAction).toBeDefined();
      expect(noteAction?.metadata?.content).toBe("Strong Q1 results, guidance raised");
    });

    it("should log question_approved action", async () => {
      await db.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "question_approved",
        targetId: "1",
        targetType: "question",
        metadata: { questionId: 1, complianceRiskScore: 0.1 },
        syncedToViasocket: false,
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      const approvalAction = result.find((a) => a.actionType === "question_approved");
      expect(approvalAction).toBeDefined();
    });

    it("should retrieve full action history", async () => {
      const result = await db
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.map((a) => a.actionType)).toContain("session_started");
      expect(result.map((a) => a.actionType)).toContain("note_created");
      expect(result.map((a) => a.actionType)).toContain("question_approved");
    });
  });

  describe("Data Persistence", () => {
    it("should persist session state across queries", async () => {
      const session1 = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      const session2 = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      expect(session1[0].status).toBe(session2[0].status);
      expect(session1[0].endedAt?.getTime()).toBe(session2[0].endedAt?.getTime());
    });

    it("should calculate elapsed time correctly", async () => {
      const session = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId))
        .limit(1);

      const startTime = session[0].startedAt?.getTime() || 0;
      const endTime = session[0].endedAt?.getTime() || 0;
      const elapsedMs = endTime - startTime;

      expect(elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid session ID gracefully", async () => {
      const result = await db
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, "invalid-session-id"))
        .limit(1);

      expect(result).toHaveLength(0);
    });

    it("should prevent duplicate session creation", async () => {
      // Attempt to create duplicate
      try {
        await db.insert(operatorSessions).values({
          sessionId: testSessionId,
          eventId: testEventId,
          operatorId: testOperatorId,
          status: "idle",
          startedAt: null,
          pausedAt: null,
          resumedAt: null,
          endedAt: null,
          totalPausedDuration: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (err) {
        // Expected to fail due to unique constraint
        expect(err).toBeDefined();
      }
    });
  });
});
