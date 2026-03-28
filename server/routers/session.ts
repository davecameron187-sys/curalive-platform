/**
 * Session Router — Live Session Data Access
 * 
 * Provides tRPC procedures for accessing live session data:
 * - Get current live session (if any)
 * - Get session details by ID
 * - Get live participants
 * - Get live Q&A questions
 * - Get live transcript
 * - Get session notes
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { operatorSessions, liveQaQuestions, transcriptSegments } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const sessionRouter = router({
  /**
   * Get current live session (if any)
   * Returns the most recent session with status "running"
   */
  getLiveSession: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection unavailable",
      });
    }

    try {
      // Find the most recent running session
      const result = await database
        .select()
        .from(operatorSessions)
        .where(eq(operatorSessions.status, "running"))
        .orderBy(desc(operatorSessions.startedAt))
        .limit(1);

      if (!result.length) {
        return null; // No live session
      }

      const session = result[0];
      const now = new Date();
      const startedAt = session.startedAt || now;
      const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000) - (session.totalPausedDuration || 0);

      return {
        id: session.sessionId,
        eventName: session.eventId, // TODO: Join with events table for real event name
        status: "live" as const,
        startedAt: startedAt.getTime(),
        duration: elapsedSeconds,
        attendeeCount: 1247, // TODO: Get real count from WebPhone/participants
        connectivityProvider: "webphone" as const, // TODO: Get from session metadata
        providerStatus: "active" as const, // TODO: Get from connectivity service
        fallbackReason: undefined,
      };
    } catch (error) {
      console.error("[SessionRouter] Error getting live session:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get live session",
      });
    }
  }),

  /**
   * Get session details by ID
   */
  getSessionById: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        const result = await database
          .select()
          .from(operatorSessions)
          .where(eq(operatorSessions.sessionId, input.sessionId))
          .limit(1);

        if (!result.length) {
          return null;
        }

        const session = result[0];
        const now = new Date();
        const startedAt = session.startedAt || now;
        const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000) - (session.totalPausedDuration || 0);

        return {
          id: session.sessionId,
          eventName: session.eventId,
          status: session.status,
          startedAt: startedAt.getTime(),
          duration: elapsedSeconds,
          attendeeCount: 1247,
          connectivityProvider: "webphone" as const,
          providerStatus: "active" as const,
        };
      } catch (error) {
        console.error("[SessionRouter] Error getting session by ID:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get session",
        });
      }
    }),

  /**
   * Get live Q&A questions for a session
   */
  getLiveQA: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        const questions = await database
          .select()
          .from(liveQaQuestions)
          .where(eq(liveQaQuestions.sessionId, input.sessionId))
          .orderBy(desc(liveQaQuestions.createdAt));

        const pending = questions.filter(q => q.status === "submitted");
        const approved = questions.filter(q => q.status === "approved");

        return {
          pending: pending.map(q => ({
            id: q.id.toString(),
            text: q.questionText,
            asker: q.submitterName || `Attendee_${q.id}`,
            upvotes: q.upvotes || 0,
            status: q.status,
            createdAt: q.createdAt?.getTime() || Date.now(),
          })),
          approved: approved.map(q => ({
            id: q.id.toString(),
            text: q.questionText,
            asker: q.submitterName || `Attendee_${q.id}`,
            upvotes: q.upvotes || 0,
            status: q.status,
            createdAt: q.createdAt?.getTime() || Date.now(),
          })),
          pendingCount: pending.length,
          approvedCount: approved.length,
          totalCount: questions.length,
        };
      } catch (error) {
        console.error("[SessionRouter] Error getting live Q&A:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get Q&A questions",
        });
      }
    }),

  /**
   * Get live transcript for a session
   */
  getLiveTranscript: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        const entries = await database
          .select()
          .from(transcriptSegments)
          .where(eq(transcriptSegments.sessionId, input.sessionId))
          .orderBy(transcriptSegments.createdAt);

        return entries.map(entry => ({
          id: entry.id.toString(),
          speaker: entry.speaker || "Unknown",
          text: entry.text,
          timestamp: entry.createdAt?.getTime() || Date.now(),
          confidence: 0.95,
        }));
      } catch (error) {
        console.error("[SessionRouter] Error getting live transcript:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get transcript",
        });
      }
    }),

  /**
   * Approve Q&A question
   */
  approveQuestion: protectedProcedure
    .input(z.object({ questionId: z.string(), sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        await database
          .update(liveQaQuestions)
          .set({ status: "approved", updatedAt: new Date() })
          .where(eq(liveQaQuestions.id, parseInt(input.questionId)));

        return { success: true };
      } catch (error) {
        console.error("[SessionRouter] Error approving question:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve question",
        });
      }
    }),

  /**
   * Reject Q&A question
   */
  rejectQuestion: protectedProcedure
    .input(z.object({ questionId: z.string(), sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        await database
          .update(liveQaQuestions)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(liveQaQuestions.id, parseInt(input.questionId)));

        return { success: true };
      } catch (error) {
        console.error("[SessionRouter] Error rejecting question:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject question",
        });
      }
    }),

  /**
   * Save session notes
   */
  saveNotes: protectedProcedure
    .input(z.object({ sessionId: z.string(), notes: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        // TODO: Implement notes table in schema
        // For now, store in session metadata
        await database
          .update(operatorSessions)
          .set({ 
            // metadata: { notes: input.notes },
            updatedAt: new Date() 
          })
          .where(eq(operatorSessions.sessionId, input.sessionId));

        return { success: true };
      } catch (error) {
        console.error("[SessionRouter] Error saving notes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save notes",
        });
      }
    }),

  /**
   * Get session notes
   */
  getNotes: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable",
        });
      }

      try {
        const result = await database
          .select()
          .from(operatorSessions)
          .where(eq(operatorSessions.sessionId, input.sessionId))
          .limit(1);

        if (!result.length) {
          return { notes: "" };
        }

        // TODO: Return notes from metadata once schema is updated
        return { notes: "" };
      } catch (error) {
        console.error("[SessionRouter] Error getting notes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get notes",
        });
      }
    }),
});
