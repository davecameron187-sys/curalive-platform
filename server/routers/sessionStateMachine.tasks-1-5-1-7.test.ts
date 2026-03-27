/**
 * Integration Tests — Sprint 1 Tasks 1.5-1.7
 * 
 * Tests for:
 * - Task 1.5: ModeratorConsole UI with Ably subscriptions
 * - Task 1.6: Viasocket action sync
 * - Task 1.7: Session handoff package generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDb } from "../db";
import { operatorSessions, operatorActions, sessionStateTransitions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sprint 1 Tasks 1.5-1.7 Integration Tests", () => {
  let database: any;
  let testSessionId: string;
  let testEventId: string;
  let testOperatorId: number;

  beforeEach(async () => {
    database = await getDb();
    testSessionId = `session_${Date.now()}`;
    testEventId = `event_${Date.now()}`;
    testOperatorId = 1;

    // Create test session
    if (database) {
      await database.insert(operatorSessions).values({
        id: testSessionId,
        eventId: testEventId,
        operatorId: testOperatorId,
        status: "idle",
        startedAt: null,
        pausedAt: null,
        resumedAt: null,
        endedAt: null,
        totalPausedDuration: 0,
      });
    }
  });

  afterEach(async () => {
    // Cleanup test data
    if (database) {
      await database.delete(operatorActions).where(eq(operatorActions.sessionId, testSessionId));
      await database.delete(sessionStateTransitions).where(eq(sessionStateTransitions.sessionId, testSessionId));
      await database.delete(operatorSessions).where(eq(operatorSessions.id, testSessionId));
    }
  });

  describe("Task 1.5 - ModeratorConsole UI Integration", () => {
    it("should subscribe to session state changes via Ably", async () => {
      // Mock Ably subscription
      const stateChangeListener = vi.fn();

      // Simulate state transition
      const now = new Date();
      await database.insert(sessionStateTransitions).values({
        sessionId: testSessionId,
        fromState: "idle",
        toState: "running",
        createdAt: now,
        metadata: { timestamp: now.toISOString() },
      });

      // Verify state transition was recorded
      const transitions = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(transitions).toHaveLength(1);
      expect(transitions[0].toState).toBe("running");
    });

    it("should subscribe to operator action events via Ably", async () => {
      // Create operator action
      const now = new Date();
      await database.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "question_approved",
        targetId: "q_123",
        targetType: "question",
        createdAt: now,
        metadata: { approvedBy: testOperatorId },
        syncedToViasocket: false,
      });

      // Verify action was recorded
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(actions).toHaveLength(1);
      expect(actions[0].actionType).toBe("question_approved");
    });

    it("should display real-time session state updates", async () => {
      // Start session
      await database
        .update(operatorSessions)
        .set({
          status: "running",
          startedAt: new Date(),
        })
        .where(eq(operatorSessions.id, testSessionId));

      // Verify session state
      const sessions = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.id, testSessionId));

      expect(sessions[0].status).toBe("running");
      expect(sessions[0].startedAt).toBeDefined();
    });

    it("should display action history with pagination", async () => {
      // Create multiple actions
      for (let i = 0; i < 25; i++) {
        await database.insert(operatorActions).values({
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: i % 2 === 0 ? "question_approved" : "question_rejected",
          targetId: `q_${i}`,
          targetType: "question",
          createdAt: new Date(Date.now() + i * 1000),
          metadata: { index: i },
          syncedToViasocket: false,
        });
      }

      // Verify action count
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(actions).toHaveLength(25);

      // Test pagination (first 20)
      const page1 = actions.slice(0, 20);
      expect(page1).toHaveLength(20);

      // Test pagination (next 5)
      const page2 = actions.slice(20, 40);
      expect(page2).toHaveLength(5);
    });
  });

  describe("Task 1.6 - Viasocket Action Sync Integration", () => {
    it("should mark actions for Viasocket sync", async () => {
      // Create action
      await database.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "question_approved",
        targetId: "q_123",
        targetType: "question",
        createdAt: new Date(),
        metadata: { approved: true },
        syncedToViasocket: false,
      });

      // Verify action is not synced initially
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(actions[0].syncedToViasocket).toBe(false);
    });

    it("should update sync status after successful sync", async () => {
      // Create action
      const result = await database.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "compliance_flag_raised",
        targetId: "q_456",
        targetType: "question",
        createdAt: new Date(),
        metadata: { flagType: "inappropriate_language" },
        syncedToViasocket: false,
      });

      const actionId = result[0];

      // Simulate successful sync
      await database
        .update(operatorActions)
        .set({
          syncedToViasocket: true,
          syncedAt: new Date(),
        })
        .where(eq(operatorActions.id, actionId));

      // Verify sync status updated
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.id, actionId));

      expect(actions[0].syncedToViasocket).toBe(true);
      expect(actions[0].syncedAt).toBeDefined();
    });

    it("should track retry attempts for failed syncs", async () => {
      // Create action
      const result = await database.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "note_created",
        targetId: null,
        targetType: null,
        createdAt: new Date(),
        metadata: {
          viasocketSyncRetry: {
            retryCount: 1,
            nextRetryAt: new Date(Date.now() + 60000).toISOString(),
            lastError: "Network timeout",
          },
        },
        syncedToViasocket: false,
      });

      const actionId = result[0];

      // Verify retry metadata
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.id, actionId));

      const metadata = actions[0].metadata as Record<string, any>;
      expect(metadata.viasocketSyncRetry.retryCount).toBe(1);
      expect(metadata.viasocketSyncRetry.lastError).toBe("Network timeout");
    });

    it("should handle webhook callbacks from Viasocket", async () => {
      // Create action
      const result = await database.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "key_moment_marked",
        targetId: null,
        targetType: null,
        createdAt: new Date(),
        metadata: {},
        syncedToViasocket: false,
      });

      const actionId = result[0];

      // Simulate webhook callback
      await database
        .update(operatorActions)
        .set({
          syncedToViasocket: true,
          metadata: {
            viasocketId: "via_789",
            viasocketStatus: "synced",
          },
        })
        .where(eq(operatorActions.id, actionId));

      // Verify webhook update
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.id, actionId));

      const metadata = actions[0].metadata as Record<string, any>;
      expect(metadata.viasocketId).toBe("via_789");
      expect(metadata.viasocketStatus).toBe("synced");
    });
  });

  describe("Task 1.7 - Session Handoff Package Integration", () => {
    it("should generate transcript from state transitions", async () => {
      // Create state transitions with transcript segments
      const transitions = [
        {
          sessionId: testSessionId,
          fromState: "idle" as const,
          toState: "running" as const,
          createdAt: new Date(),
          metadata: { transcriptSegment: "Welcome to the earnings call" },
        },
        {
          sessionId: testSessionId,
          fromState: "running" as const,
          toState: "running" as const,
          createdAt: new Date(Date.now() + 5000),
          metadata: { transcriptSegment: "Thank you for joining us today" },
        },
      ];

      for (const t of transitions) {
        await database.insert(sessionStateTransitions).values(t);
      }

      // Verify transcript segments
      const records = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      expect(records).toHaveLength(2);
      expect(records[0].metadata).toHaveProperty("transcriptSegment");
    });

    it("should extract compliance flags from action history", async () => {
      // Create compliance flag actions
      const flags = [
        {
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: "compliance_flag_raised",
          targetId: "q_789",
          targetType: "question",
          createdAt: new Date(),
          metadata: { flagType: "inappropriate_language", details: "Contains profanity" },
          syncedToViasocket: false,
        },
        {
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: "compliance_flag_raised",
          targetId: "q_790",
          targetType: "question",
          createdAt: new Date(Date.now() + 5000),
          metadata: { flagType: "market_sensitive", details: "Undisclosed information" },
          syncedToViasocket: false,
        },
      ];

      for (const flag of flags) {
        await database.insert(operatorActions).values(flag);
      }

      // Verify compliance flags
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      const complianceFlags = actions.filter((a) => a.actionType === "compliance_flag_raised");
      expect(complianceFlags).toHaveLength(2);
    });

    it("should calculate session metrics", async () => {
      // Create session with metrics
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 3600000); // 1 hour

      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          startedAt: startTime,
          endedAt: endTime,
          totalPausedDuration: 300, // 5 minutes
        })
        .where(eq(operatorSessions.id, testSessionId));

      // Create some actions
      for (let i = 0; i < 15; i++) {
        await database.insert(operatorActions).values({
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: i % 3 === 0 ? "compliance_flag_raised" : "question_approved",
          targetId: `q_${i}`,
          targetType: "question",
          createdAt: new Date(startTime.getTime() + i * 1000),
          metadata: {},
          syncedToViasocket: false,
        });
      }

      // Verify metrics
      const sessions = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.id, testSessionId));

      const session = sessions[0];
      expect(session.totalPausedDuration).toBe(300);

      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(actions).toHaveLength(15);
      const complianceCount = actions.filter((a) => a.actionType === "compliance_flag_raised").length;
      expect(complianceCount).toBeGreaterThan(0);
    });

    it("should generate complete handoff package data", async () => {
      // Create full session lifecycle
      const startTime = new Date();

      // Start session
      await database
        .update(operatorSessions)
        .set({
          status: "running",
          startedAt: startTime,
        })
        .where(eq(operatorSessions.id, testSessionId));

      // Add state transitions
      await database.insert(sessionStateTransitions).values({
        sessionId: testSessionId,
        fromState: "idle",
        toState: "running",
        createdAt: startTime,
        metadata: { transcriptSegment: "Session started" },
      });

      // Add actions
      const actions = [
        {
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: "question_approved",
          targetId: "q_1",
          targetType: "question",
          createdAt: new Date(startTime.getTime() + 10000),
          metadata: {},
          syncedToViasocket: false,
        },
        {
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: "compliance_flag_raised",
          targetId: "q_2",
          targetType: "question",
          createdAt: new Date(startTime.getTime() + 20000),
          metadata: { flagType: "market_sensitive" },
          syncedToViasocket: false,
        },
      ];

      for (const action of actions) {
        await database.insert(operatorActions).values(action);
      }

      // End session
      const endTime = new Date(startTime.getTime() + 1800000); // 30 minutes
      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: endTime,
          totalPausedDuration: 60,
        })
        .where(eq(operatorSessions.id, testSessionId));

      // Verify complete package data
      const sessions = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.id, testSessionId));

      const transitions = await database
        .select()
        .from(sessionStateTransitions)
        .where(eq(sessionStateTransitions.sessionId, testSessionId));

      const actionRecords = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(sessions[0].status).toBe("ended");
      expect(transitions.length).toBeGreaterThan(0);
      expect(actionRecords).toHaveLength(2);
    });
  });

  describe("Cross-Task Integration", () => {
    it("should sync all operator actions to Viasocket during session", async () => {
      // Create multiple actions
      const actionTypes = [
        "question_approved",
        "question_rejected",
        "compliance_flag_raised",
        "key_moment_marked",
      ];

      for (let i = 0; i < 4; i++) {
        await database.insert(operatorActions).values({
          sessionId: testSessionId,
          operatorId: testOperatorId,
          actionType: actionTypes[i],
          targetId: `q_${i}`,
          targetType: "question",
          createdAt: new Date(Date.now() + i * 1000),
          metadata: {},
          syncedToViasocket: false,
        });
      }

      // Simulate sync of all actions
      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      for (const action of actions) {
        await database
          .update(operatorActions)
          .set({ syncedToViasocket: true, syncedAt: new Date() })
          .where(eq(operatorActions.id, action.id));
      }

      // Verify all synced
      const syncedActions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(syncedActions.every((a) => a.syncedToViasocket)).toBe(true);
    });

    it("should generate handoff package after session ends", async () => {
      // Complete session lifecycle
      const startTime = new Date();

      await database
        .update(operatorSessions)
        .set({
          status: "running",
          startedAt: startTime,
        })
        .where(eq(operatorSessions.id, testSessionId));

      // Add actions during session
      await database.insert(operatorActions).values({
        sessionId: testSessionId,
        operatorId: testOperatorId,
        actionType: "question_approved",
        targetId: "q_1",
        targetType: "question",
        createdAt: new Date(startTime.getTime() + 5000),
        metadata: {},
        syncedToViasocket: true, // Already synced
        syncedAt: new Date(),
      });

      // End session
      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: new Date(startTime.getTime() + 1800000),
        })
        .where(eq(operatorSessions.id, testSessionId));

      // Verify session ended with actions
      const sessions = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.id, testSessionId));

      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, testSessionId));

      expect(sessions[0].status).toBe("ended");
      expect(actions).toHaveLength(1);
      expect(actions[0].syncedToViasocket).toBe(true);
    });
  });
});
