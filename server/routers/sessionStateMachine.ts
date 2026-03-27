/**
 * Session State Machine Router
 * Server-authoritative session lifecycle management
 * 
 * This router implements a strict state machine:
 * idle → running → paused → ended
 * 
 * All state transitions are persisted to the database.
 * The UI is a thin client over this backend state.
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

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

// In-memory session store (will be replaced with database)
const sessionStore = new Map<string, SessionState>();

export const sessionStateMachineRouter = {
  /**
   * Get current session state
   */
  getSessionState: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input, ctx }) => {
      const session = sessionStore.get(input.sessionId);
      
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Session ${input.sessionId} not found`,
        });
      }

      // Calculate elapsed time
      let elapsedSeconds = 0;
      if (session.status === "running" && session.startedAt) {
        elapsedSeconds = Math.floor((Date.now() - session.startedAt) / 1000) - session.totalPausedDuration;
      } else if (session.endedAt && session.startedAt) {
        elapsedSeconds = Math.floor((session.endedAt - session.startedAt) / 1000) - session.totalPausedDuration;
      }

      return {
        ...session,
        elapsedSeconds,
      };
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

      // Check if session already exists
      let session = sessionStore.get(sessionId);
      
      if (!session) {
        // Create new session
        session = {
          sessionId,
          eventId,
          operatorId,
          status: "idle",
          startedAt: null,
          pausedAt: null,
          resumedAt: null,
          endedAt: null,
          totalPausedDuration: 0,
          elapsedSeconds: 0,
        };
        sessionStore.set(sessionId, session);
      }

      // Validate state transition: idle → running
      if (session.status !== "idle") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot start session in ${session.status} state. Session must be idle.`,
        });
      }

      // Execute state transition
      const now = Date.now();
      session.status = "running";
      session.startedAt = now;
      sessionStore.set(sessionId, session);

      // TODO: Persist to database
      // TODO: Emit state transition event to Ably
      // TODO: Sync to Viasocket

      return {
        success: true,
        previousState: "idle",
        newState: "running",
        timestamp: now,
        message: "Session started",
      } as StateTransitionResult;
    }),

  /**
   * Pause session: running → paused
   */
  pauseSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = sessionStore.get(input.sessionId);

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
      const now = Date.now();
      session.status = "paused";
      session.pausedAt = now;
      sessionStore.set(input.sessionId, session);

      // TODO: Persist to database
      // TODO: Emit state transition event to Ably
      // TODO: Sync to Viasocket

      return {
        success: true,
        previousState: "running",
        newState: "paused",
        timestamp: now,
        message: "Session paused",
      } as StateTransitionResult;
    }),

  /**
   * Resume session: paused → running
   */
  resumeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = sessionStore.get(input.sessionId);

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
      const now = Date.now();
      if (session.pausedAt) {
        const pauseDuration = Math.floor((now - session.pausedAt) / 1000);
        session.totalPausedDuration += pauseDuration;
      }

      // Execute state transition
      session.status = "running";
      session.resumedAt = now;
      session.pausedAt = null;
      sessionStore.set(input.sessionId, session);

      // TODO: Persist to database
      // TODO: Emit state transition event to Ably
      // TODO: Sync to Viasocket

      return {
        success: true,
        previousState: "paused",
        newState: "running",
        timestamp: now,
        message: "Session resumed",
      } as StateTransitionResult;
    }),

  /**
   * End session: running/paused → ended
   */
  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = sessionStore.get(input.sessionId);

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
      const now = Date.now();
      const previousState = session.status;
      
      // If session was paused, add final pause duration
      if (session.status === "paused" && session.pausedAt) {
        const pauseDuration = Math.floor((now - session.pausedAt) / 1000);
        session.totalPausedDuration += pauseDuration;
      }

      session.status = "ended";
      session.endedAt = now;
      sessionStore.set(input.sessionId, session);

      // TODO: Persist to database
      // TODO: Generate handoff package (transcript, report, recording)
      // TODO: Emit state transition event to Ably
      // TODO: Sync to Viasocket

      return {
        success: true,
        previousState: previousState as SessionStatus,
        newState: "ended",
        timestamp: now,
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
      const session = sessionStore.get(input.sessionId);

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

      const now = Date.now();

      // TODO: Persist action to database
      // TODO: Emit action event to Ably for real-time updates
      // TODO: Sync action to Viasocket

      return {
        success: true,
        actionId: `action_${Date.now()}`,
        timestamp: now,
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
      // TODO: Query from database
      // For now, return empty array
      return {
        actions: [],
        total: 0,
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
      const session = sessionStore.get(input.sessionId);

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
