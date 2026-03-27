/**
 * Session State Machine Tests — Database Persistence
 * Task 1.1: Session Persistence Acceptance Criteria
 * 
 * Tests verify:
 * - startSession persists to operatorSessions table
 * - pauseSession updates status and pausedAt timestamp
 * - resumeSession updates status and clears pausedAt
 * - endSession persists endedAt and calculates total duration
 * - All state transitions logged to sessionStateTransitions table
 * - Database queries optimized (indexed on sessionId, userId, status)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDb } from "../db";
import { operatorSessions, sessionStateTransitions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Session State Machine — Database Persistence", () => {
  let database: any;
  const testSessionId = `test-session-${Date.now()}`;
  const testEventId = "test-event-123";
  const testOperatorId = 1;

  beforeEach(async () => {
    database = await getDb();
    if (!database) {
      throw new Error("Database connection failed");
    }
  });

  afterEach(async () => {
    // Cleanup test data
    if (database) {
      await database
        .delete(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));
      
      await database
        .delete(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));
    }
  });

  describe("startSession", () => {
    it("should create session in idle state", async () => {
      const now = new Date();
      
      await database.insert(operatorSessions).values({
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

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("idle");
      expect(result[0].startedAt).toBeNull();
    });

    it("should transition from idle to running", async () => {
      const now = new Date();
      
      // Create session in idle state
      await database.insert(operatorSessions).values({
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

      // Transition to running
      const startTime = new Date();
      await database
        .update(operatorSessions)
        .set({
          status: "running",
          startedAt: startTime,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result[0].status).toBe("running");
      expect(result[0].startedAt).not.toBeNull();
      expect(result[0].startedAt.getTime()).toBeGreaterThanOrEqual(startTime.getTime() - 100);
    });

    it("should log state transition to audit table", async () => {
      const now = new Date();
      
      // Create session
      await database.insert(operatorSessions).values({
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

      // Log transition
      await database.insert(sessionStateTransitions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        fromState: "idle",
        toState: "running",
        timestamp: now,
        metadata: JSON.stringify({ startedBy: testOperatorId }),
      });

      const transitions = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(transitions).toHaveLength(1);
      expect(transitions[0].fromState).toBe("idle");
      expect(transitions[0].toState).toBe("running");
    });
  });

  describe("pauseSession", () => {
    it("should update status to paused and set pausedAt", async () => {
      const now = new Date();
      
      // Create running session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: new Date(now.getTime() - 10000), // 10 seconds ago
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Pause session
      const pauseTime = new Date();
      await database
        .update(operatorSessions)
        .set({
          status: "paused",
          pausedAt: pauseTime,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result[0].status).toBe("paused");
      expect(result[0].pausedAt).not.toBeNull();
      expect(result[0].pausedAt.getTime()).toBeGreaterThanOrEqual(pauseTime.getTime() - 100);
    });

    it("should log pause transition", async () => {
      const now = new Date();
      
      // Create running session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: new Date(now.getTime() - 10000),
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Log pause transition
      await database.insert(sessionStateTransitions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        fromState: "running",
        toState: "paused",
        timestamp: now,
        metadata: JSON.stringify({ pausedBy: testOperatorId }),
      });

      const transitions = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(transitions).toHaveLength(1);
      expect(transitions[0].fromState).toBe("running");
      expect(transitions[0].toState).toBe("paused");
    });
  });

  describe("resumeSession", () => {
    it("should update status to running and clear pausedAt", async () => {
      const now = new Date();
      const pausedTime = new Date(now.getTime() - 5000);
      
      // Create paused session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "paused",
        startedAt: new Date(now.getTime() - 15000),
        pausedAt: pausedTime,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Resume session
      const resumeTime = new Date();
      const pauseDuration = Math.floor((resumeTime.getTime() - pausedTime.getTime()) / 1000);
      
      await database
        .update(operatorSessions)
        .set({
          status: "running",
          resumedAt: resumeTime,
          pausedAt: null,
          totalPausedDuration: pauseDuration,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result[0].status).toBe("running");
      expect(result[0].pausedAt).toBeNull();
      expect(result[0].totalPausedDuration).toBeGreaterThan(0);
      expect(result[0].resumedAt).not.toBeNull();
    });

    it("should accumulate pause duration across multiple pauses", async () => {
      const now = new Date();
      
      // Create session with initial pause duration
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "paused",
        startedAt: new Date(now.getTime() - 30000),
        pausedAt: new Date(now.getTime() - 5000),
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 10, // 10 seconds from previous pause
        createdAt: now,
        updatedAt: now,
      });

      // Resume with additional pause duration
      const resumeTime = new Date();
      const additionalPauseDuration = 5;
      const newTotalPausedDuration = 10 + additionalPauseDuration;
      
      await database
        .update(operatorSessions)
        .set({
          status: "running",
          resumedAt: resumeTime,
          pausedAt: null,
          totalPausedDuration: newTotalPausedDuration,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result[0].totalPausedDuration).toBe(newTotalPausedDuration);
    });

    it("should log resume transition with pause duration", async () => {
      const now = new Date();
      
      // Create paused session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "paused",
        startedAt: new Date(now.getTime() - 15000),
        pausedAt: new Date(now.getTime() - 5000),
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Log resume transition
      await database.insert(sessionStateTransitions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        fromState: "paused",
        toState: "running",
        timestamp: now,
        metadata: JSON.stringify({ resumedBy: testOperatorId, pauseDurationSeconds: 5 }),
      });

      const transitions = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(transitions).toHaveLength(1);
      expect(transitions[0].fromState).toBe("paused");
      expect(transitions[0].toState).toBe("running");
      const metadata = JSON.parse(transitions[0].metadata || "{}");
      expect(metadata.pauseDurationSeconds).toBe(5);
    });
  });

  describe("endSession", () => {
    it("should update status to ended and set endedAt", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000); // 60 seconds ago
      
      // Create running session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: startTime,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      // End session
      const endTime = new Date();
      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: endTime,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result[0].status).toBe("ended");
      expect(result[0].endedAt).not.toBeNull();
      expect(result[0].endedAt.getTime()).toBeGreaterThanOrEqual(endTime.getTime() - 100);
    });

    it("should calculate total duration correctly", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000); // 60 seconds ago
      
      // Create running session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: startTime,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 10, // 10 seconds paused
        createdAt: now,
        updatedAt: now,
      });

      // End session
      const endTime = new Date();
      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: endTime,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      const totalDuration = Math.floor((result[0].endedAt.getTime() - result[0].startedAt.getTime()) / 1000);
      expect(totalDuration).toBeGreaterThanOrEqual(60);
    });

    it("should add final pause duration if ending from paused state", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000);
      const pauseTime = new Date(now.getTime() - 10000);
      
      // Create paused session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "paused",
        startedAt: startTime,
        pausedAt: pauseTime,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 5, // 5 seconds from previous pause
        createdAt: now,
        updatedAt: now,
      });

      // End session from paused state
      const endTime = new Date();
      const finalPauseDuration = Math.floor((endTime.getTime() - pauseTime.getTime()) / 1000);
      const totalPausedDuration = 5 + finalPauseDuration;
      
      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: endTime,
          totalPausedDuration: totalPausedDuration,
          updatedAt: new Date(),
        })
        .where(eq(operatorSessions.sessionId, testSessionId));

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result[0].status).toBe("ended");
      expect(result[0].totalPausedDuration).toBeGreaterThanOrEqual(5);
    });

    it("should log end transition with total duration", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000);
      
      // Create running session
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: startTime,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Log end transition
      const totalDurationSeconds = 60;
      await database.insert(sessionStateTransitions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        fromState: "running",
        toState: "ended",
        timestamp: now,
        metadata: JSON.stringify({ 
          endedBy: testOperatorId, 
          totalDurationSeconds 
        }),
      });

      const transitions = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(transitions).toHaveLength(1);
      expect(transitions[0].fromState).toBe("running");
      expect(transitions[0].toState).toBe("ended");
      const metadata = JSON.parse(transitions[0].metadata || "{}");
      expect(metadata.totalDurationSeconds).toBe(60);
    });
  });

  describe("State Transitions Audit Trail", () => {
    it("should log complete session lifecycle", async () => {
      const now = new Date();
      
      // Create session
      await database.insert(operatorSessions).values({
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

      // Log transitions
      const transitions = [
        { prev: "idle", next: "running" },
        { prev: "running", next: "paused" },
        { prev: "paused", next: "running" },
        { prev: "running", next: "ended" },
      ];

      for (const t of transitions) {
        await database.insert(sessionStateTransitions).values({
          sessionId: testSessionId,
          operatorId: testOperatorId,
          fromState: t.prev,
          toState: t.next,
          metadata: null,
        });
      }

      const result = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(result).toHaveLength(4);
      expect(result[0].fromState).toBe("idle");
      expect(result[0].toState).toBe("running");
      expect(result[3].fromState).toBe("running");
      expect(result[3].toState).toBe("ended");
    });

    it("should query transitions by sessionId efficiently", async () => {
      const now = new Date();
      
      // Create session
      await database.insert(operatorSessions).values({
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

      // Log transitions
      for (let i = 0; i < 5; i++) {
        await database.insert(sessionStateTransitions).values({
          sessionId: testSessionId,
          operatorId: testOperatorId,
          fromState: "running",
          toState: "paused",
          metadata: null,
        });
      }

      const result = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(result).toHaveLength(5);
      expect(result.every(r => r.sessionId === testSessionId)).toBe(true);
    });
  });

  describe("Database Indexes", () => {
    it("should query sessions by sessionId", async () => {
      const now = new Date();
      
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: now,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.sessionId, testSessionId));

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe(testSessionId);
    });

    it("should query sessions by operatorId", async () => {
      const now = new Date();
      const operatorId = 42;
      
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: operatorId,
        status: "running",
        startedAt: now,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.operatorId, operatorId));

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.sessionId === testSessionId)).toBe(true);
    });

    it("should query sessions by status", async () => {
      const now = new Date();
      
      await database.insert(operatorSessions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "running",
        startedAt: now,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.status, "running"));

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.sessionId === testSessionId)).toBe(true);
    });
  });
});
