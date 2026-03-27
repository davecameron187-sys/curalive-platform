/**
 * Session State Machine Router — Database-Backed Implementation with Ably Real-Time Sync
 * Server-authoritative session lifecycle management with full persistence and real-time updates
 * 
 * This router implements a strict state machine:
 * idle → running → paused → ended
 * 
 * All state transitions are persisted to the database, logged for audit, and published to Ably
 * for real-time UI updates. The UI is a thin client over this backend state.
 * 
 * Tasks Implemented:
 * - Task 1.1: Session Persistence (database-backed state machine)
 * - Task 1.2: Ably Real-Time Sync (publish state transitions to Ably channels)
 * - Task 1.3: Action Logging (persist operator actions with Ably events)
 */

import { z } from "zod";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { operatorSessions, sessionStateTransitions, operatorActions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { publishToChannel } from "../_core/ably";

// Type definitions
export type SessionStatus = "idle" | "running" | "paused" | "ended";

interface SessionState {
  sessionId: string;
  eventId: string;
  operatorId: number;
  status: SessionStatus;
  startedAt: number | null;
  pausedAt: number | null;
  resumedAt: number | null;
  endedAt: number | null;
  totalPausedDuration: number;
  elapsedSeconds: number;
}

interface StateTransitionResult {
  success: boolean;
  previousState: SessionStatus;
  newState: SessionStatus;
  timestamp: number;
  message: string;
}

/**
 * Helper: Get session from database
 */
async function getSessionFromDb(sessionId: string): Promise<SessionState | null> {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection unavailable",
    });
  }

  const result = await database
    .select()
    .from(operatorSessions)
    .where(eq(operatorSessions.sessionId, sessionId))
    .limit(1);

  if (!result.length) return null;

  const row = result[0];
  
  // Calculate elapsed time
  let elapsedSeconds = 0;
  if (row.status === "running" && row.startedAt) {
    elapsedSeconds = Math.floor((Date.now() - row.startedAt.getTime()) / 1000) - (row.totalPausedDuration || 0);
  } else if (row.endedAt && row.startedAt) {
    elapsedSeconds = Math.floor((row.endedAt.getTime() - row.startedAt.getTime()) / 1000) - (row.totalPausedDuration || 0);
  }

  return {
    sessionId: row.sessionId,
    eventId: row.eventId,
    operatorId: row.operatorId,
    status: row.status as SessionStatus,
    startedAt: row.startedAt?.getTime() || null,
    pausedAt: row.pausedAt?.getTime() || null,
    resumedAt: row.resumedAt?.getTime() || null,
    endedAt: row.endedAt?.getTime() || null,
    totalPausedDuration: row.totalPausedDuration || 0,
    elapsedSeconds,
  };
}

/**
 * Helper: Log state transition to audit table
 */
async function logStateTransition(
  sessionId: string,
  operatorId: number,
  fromState: SessionStatus,
  toState: SessionStatus,
  metadata?: Record<string, any>
): Promise<void> {
  const database = await getDb();
  if (!database) {
    console.warn("[SessionStateMachine] Cannot log transition: database not available");
    return;
  }

  await database.insert(sessionStateTransitions).values({
    sessionId,
    operatorId,
    fromState,
    toState,
    metadata: metadata || null,
  });
}

/**
 * Helper: Publish state transition to Ably for real-time updates
 */
async function publishStateTransitionEvent(
  sessionId: string,
  fromState: SessionStatus,
  toState: SessionStatus,
  metadata?: Record<string, any>
): Promise<void> {
  const channelName = `session:${sessionId}:state`;
  const success = await publishToChannel(channelName, "state.changed", {
    sessionId,
    fromState,
    toState,
    timestamp: new Date().toISOString(),
    metadata: metadata || null,
  });

  if (!success) {
    console.warn(`[SessionStateMachine] Failed to publish state transition to Ably for session ${sessionId}`);
  }
}

/**
 * Helper: Log operator action to database
 */
async function logOperatorAction(
  sessionId: string,
  operatorId: number,
  actionType: string,
  targetId?: string,
  targetType?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const database = await getDb();
  if (!database) {
    console.warn("[SessionStateMachine] Cannot log action: database not available");
    return;
  }

  await database.insert(operatorActions).values({
    sessionId,
    operatorId,
    actionType: actionType as any,
    targetId: targetId || null,
    targetType: targetType || null,
    metadata: metadata || null,
    syncedToViasocket: false,
    createdAt: new Date(),
  });
}

/**
 * Helper: Publish operator action to Ably for real-time updates
 */
async function publishOperatorActionEvent(
  sessionId: string,
  actionType: string,
  metadata?: Record<string, any>
): Promise<void> {
  const channelName = `session:${sessionId}:actions`;
  const success = await publishToChannel(channelName, "action.created", {
    sessionId,
    actionType,
    timestamp: new Date().toISOString(),
    metadata: metadata || null,
  });

  if (!success) {
    console.warn(`[SessionStateMachine] Failed to publish action event to Ably for session ${sessionId}`);
  }
}

export const sessionStateMachineRouter = {
  /**
   * Get current session state
   */
  getSessionState: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await getSessionFromDb(input.sessionId);
      
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      return session;
    }),

  /**
   * Start session: idle → running
   */
  startSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionId, eventId } = input;
      const operatorId = ctx.user.id;

      // Get existing session or create new
      let session = await getSessionFromDb(sessionId);
      
      if (!session) {
        // Create new session in database
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection unavailable",
          });
        }

        const now = new Date();
        await database.insert(operatorSessions).values({
          sessionId,
          eventId,
          operatorId,
          status: "idle",
          startedAt: null,
          pausedAt: null,
          resumedAt: null,
          endedAt: null,
          totalPausedDuration: 0,
          createdAt: now,
          updatedAt: now,
        });

        session = await getSessionFromDb(sessionId);
        if (!session) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create session",
          });
        }
      }

      // Validate state transition: idle → running
      if (session.status !== "idle") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot start session in ${session.status} state. Session must be idle.`,
        });
      }

      // Execute state transition
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      const now = new Date();
      await database
        .update(operatorSessions)
        .set({
          status: "running",
          startedAt: now,
          updatedAt: now,
        })
        .where(eq(operatorSessions.sessionId, sessionId));

      // Log transition
      await logStateTransition(sessionId, operatorId, "idle", "running", {
        startedBy: ctx.user.id,
      });

      // Log action
      await logOperatorAction(sessionId, operatorId, "session_started", sessionId, "session", {
        startedBy: ctx.user.id,
      });

      // Publish to Ably for real-time updates
      await publishStateTransitionEvent(sessionId, "idle", "running", { startedBy: ctx.user.id });
      await publishOperatorActionEvent(sessionId, "session_started", { startedBy: ctx.user.id });

      return {
        success: true,
        previousState: "idle",
        newState: "running",
        timestamp: now.getTime(),
        message: "Session started",
      } as StateTransitionResult;
    }),

  /**
   * Pause session: running → paused
   */
  pauseSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = await getSessionFromDb(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      // Validate state transition: running → paused
      if (session.status !== "running") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot pause session in ${session.status} state. Session must be running.`,
        });
      }

      // Execute state transition
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      const now = new Date();
      await database
        .update(operatorSessions)
        .set({
          status: "paused",
          pausedAt: now,
          updatedAt: now,
        })
        .where(eq(operatorSessions.sessionId, input.sessionId));

      // Log transition
      await logStateTransition(input.sessionId, ctx.user.id, "running", "paused", {
        pausedBy: ctx.user.id,
      });

      // Log action
      await logOperatorAction(input.sessionId, ctx.user.id, "session_paused", input.sessionId, "session", {
        pausedBy: ctx.user.id,
      });

      // Publish to Ably for real-time updates
      await publishStateTransitionEvent(input.sessionId, "running", "paused", { pausedBy: ctx.user.id });
      await publishOperatorActionEvent(input.sessionId, "session_paused", { pausedBy: ctx.user.id });

      return {
        success: true,
        previousState: "running",
        newState: "paused",
        timestamp: now.getTime(),
        message: "Session paused",
      } as StateTransitionResult;
    }),

  /**
   * Resume session: paused → running
   */
  resumeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = await getSessionFromDb(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      // Validate state transition: paused → running
      if (session.status !== "paused") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot resume session in ${session.status} state. Session must be paused.`,
        });
      }

      // Calculate pause duration
      const now = new Date();
      let pauseDuration = 0;
      if (session.pausedAt) {
        pauseDuration = Math.floor((now.getTime() - session.pausedAt) / 1000);
      }

      const newTotalPausedDuration = (session.totalPausedDuration || 0) + pauseDuration;

      // Execute state transition
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      await database
        .update(operatorSessions)
        .set({
          status: "running",
          resumedAt: now,
          pausedAt: null,
          totalPausedDuration: newTotalPausedDuration,
          updatedAt: now,
        })
        .where(eq(operatorSessions.sessionId, input.sessionId));

      // Log transition
      await logStateTransition(input.sessionId, ctx.user.id, "paused", "running", {
        resumedBy: ctx.user.id,
        pauseDurationSeconds: pauseDuration,
      });

      // Log action
      await logOperatorAction(input.sessionId, ctx.user.id, "session_resumed", input.sessionId, "session", {
        resumedBy: ctx.user.id,
        pauseDurationSeconds: pauseDuration,
      });

      // Publish to Ably for real-time updates
      await publishStateTransitionEvent(input.sessionId, "paused", "running", {
        resumedBy: ctx.user.id,
        pauseDurationSeconds: pauseDuration,
      });
      await publishOperatorActionEvent(input.sessionId, "session_resumed", {
        resumedBy: ctx.user.id,
        pauseDurationSeconds: pauseDuration,
      });

      return {
        success: true,
        previousState: "paused",
        newState: "running",
        timestamp: now.getTime(),
        message: "Session resumed",
      } as StateTransitionResult;
    }),

  /**
   * End session: running/paused → ended
   */
  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = await getSessionFromDb(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      // Validate state transition: running/paused → ended
      if (session.status !== "running" && session.status !== "paused") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot end session in ${session.status} state. Session must be running or paused.`,
        });
      }

      // Execute state transition
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      const now = new Date();
      const previousState = session.status;
      
      // If session was paused, add final pause duration
      let finalTotalPausedDuration = session.totalPausedDuration || 0;
      if (session.status === "paused" && session.pausedAt) {
        const pauseDuration = Math.floor((now.getTime() - session.pausedAt) / 1000);
        finalTotalPausedDuration += pauseDuration;
      }

      await database
        .update(operatorSessions)
        .set({
          status: "ended",
          endedAt: now,
          totalPausedDuration: finalTotalPausedDuration,
          updatedAt: now,
        })
        .where(eq(operatorSessions.sessionId, input.sessionId));

      // Log transition
      await logStateTransition(input.sessionId, ctx.user.id, previousState as SessionStatus, "ended", {
        endedBy: ctx.user.id,
        totalDurationSeconds: session.startedAt 
          ? Math.floor((now.getTime() - session.startedAt) / 1000)
          : 0,
      });

      // Log action
      await logOperatorAction(input.sessionId, ctx.user.id, "session_ended", input.sessionId, "session", {
        endedBy: ctx.user.id,
        totalDurationSeconds: session.startedAt 
          ? Math.floor((now.getTime() - session.startedAt) / 1000)
          : 0,
      });

      // Publish to Ably for real-time updates
      await publishStateTransitionEvent(input.sessionId, previousState as SessionStatus, "ended", {
        endedBy: ctx.user.id,
        totalDurationSeconds: session.startedAt 
          ? Math.floor((now.getTime() - session.startedAt) / 1000)
          : 0,
      });
      await publishOperatorActionEvent(input.sessionId, "session_ended", {
        endedBy: ctx.user.id,
        totalDurationSeconds: session.startedAt 
          ? Math.floor((now.getTime() - session.startedAt) / 1000)
          : 0,
      });

      return {
        success: true,
        previousState: previousState as SessionStatus,
        newState: "ended",
        timestamp: now.getTime(),
        message: "Session ended",
      } as StateTransitionResult;
    }),

  /**
   * Create operator action (note, approval, rejection, etc.)
   */
  createOperatorAction: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        actionType: z.enum([
          "note_created",
          "question_approved",
          "question_rejected",
          "question_held",
          "question_sent_to_speaker",
          "compliance_flag_raised",
          "compliance_flag_cleared",
          "key_moment_marked",
        ]),
        targetId: z.string().optional(),
        targetType: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = await getSessionFromDb(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      // Validate session is running
      if (session.status !== "running") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot record action in ${session.status} session. Session must be running.`,
        });
      }

      const now = new Date();
      const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Persist action to operatorActions table
      await logOperatorAction(
        input.sessionId,
        ctx.user.id,
        input.actionType,
        input.targetId,
        input.targetType,
        input.metadata
      );

      // Emit action event to Ably for real-time updates
      await publishOperatorActionEvent(input.sessionId, input.actionType, {
        actionId,
        targetId: input.targetId,
        targetType: input.targetType,
        createdBy: ctx.user.id,
        ...input.metadata,
      });

      // TODO: Sync action to Viasocket

      return {
        success: true,
        actionId,
        timestamp: now.getTime(),
        message: `Action ${input.actionType} recorded`,
      };
    }),

  /**
   * Get session action history
   */
  getSessionActionHistory: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      const actions = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, input.sessionId))
        .orderBy((t) => t.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.sessionId, input.sessionId));

      return {
        actions: actions.map((a) => ({
          id: a.id,
          actionType: a.actionType,
          targetId: a.targetId,
          targetType: a.targetType,
          metadata: a.metadata,
          createdAt: a.createdAt.getTime(),
        })),
        total: countResult.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get session handoff package
   */
  getSessionHandoffPackage: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await getSessionFromDb(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      // Validate session is ended
      if (session.status !== "ended") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot retrieve handoff package for ${session.status} session. Session must be ended.`,
        });
      }

      // TODO: Query from database
      return {
        sessionId: input.sessionId,
        transcriptUrl: null,
        aiReportUrl: null,
        recordingUrl: null,
        actionHistory: [],
        complianceFlags: [],
        questionsAnsweredCount: 0,
        questionsRejectedCount: 0,
        totalSessionDuration: session.totalPausedDuration,
        downloadedAt: null,
        archivedAt: null,
      };
    }),
};
