/**
 * Check-In Kiosk tRPC router — Round 56
 * Handles QR code scanning, check-in validation, and kiosk session management
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, operatorProcedure } from "../_core/trpc";
import {
  startCheckInSession,
  getCheckInSessionById,
  getCheckInSessionsByEvent,
  updateCheckInSession,
  recordAttendeeCheckIn,
  getCheckInsBySession,
  getCheckInsByEvent,
  getCheckInStats,
} from "../db.round56";
import { getDb } from "../db";
import { eventPassRegistrations, attendeeRegistrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const checkinRouter = router({
  /**
   * Start a new check-in kiosk session for an event.
   * Operator-only: requires operator or admin role.
   */
  startCheckInSession: operatorProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        kioskId: z.string().min(1), // Unique identifier for this kiosk device
      })
    )
    .mutation(async ({ input }) => {
      const session = await startCheckInSession({
        eventId: input.eventId,
        kioskId: input.kioskId,
        status: "active",
        totalScanned: 0,
        successfulScans: 0,
        failedScans: 0,
      });
      return session;
    }),

  /**
   * Scan an attendee QR code and record check-in.
   * Public: allows kiosk to scan without authentication (but validates event).
   */
  scanAttendeeQr: publicProcedure
    .input(
      z.object({
        sessionId: z.number().int().positive(),
        passCode: z.string().min(1), // QR code value (pass code)
        eventId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify session exists and belongs to this event
      const session = await getCheckInSessionById(input.sessionId);
      if (!session || session.eventId !== input.eventId) {
        throw new Error("Invalid check-in session");
      }

      // Check if already scanned (prevent duplicates)
      const existingCheckIns = await getCheckInsBySession(input.sessionId);
      const alreadyScanned = existingCheckIns.find((c) => c.passCode === input.passCode && c.result === "success");
      if (alreadyScanned) {
        // Record duplicate attempt
        const checkIn = await recordAttendeeCheckIn({
          sessionId: input.sessionId,
          eventId: input.eventId,
          passCode: input.passCode,
          result: "duplicate",
          errorMessage: "Attendee already checked in",
        });
        // Update session stats
        await updateCheckInSession(input.sessionId, {
          totalScanned: session.totalScanned + 1,
          failedScans: session.failedScans + 1,
        });
        return { success: false, result: "duplicate", checkIn };
      }

      // Look up pass code in event pass registrations
      const passRegistrations = await db
        .select()
        .from(eventPassRegistrations)
        .where(eq(eventPassRegistrations.qrCode, input.passCode))
        .limit(1);

      if (!passRegistrations.length) {
        // QR code not found
        const checkIn = await recordAttendeeCheckIn({
          sessionId: input.sessionId,
          eventId: input.eventId,
          passCode: input.passCode,
          result: "not_found",
          errorMessage: "QR code not found in registration system",
        });
        // Update session stats
        await updateCheckInSession(input.sessionId, {
          totalScanned: session.totalScanned + 1,
          failedScans: session.failedScans + 1,
        });
        return { success: false, result: "not_found", checkIn };
      }

      const registration = passRegistrations[0];

      // Successful check-in
      const checkIn = await recordAttendeeCheckIn({
        sessionId: input.sessionId,
        eventId: input.eventId,
        passCode: input.passCode,
        registrationId: registration.id,
        attendeeName: registration.attendeeName,
        attendeeEmail: registration.attendeeEmail,
        company: registration.company,
        result: "success",
      });

      // Update session stats
      await updateCheckInSession(input.sessionId, {
        totalScanned: session.totalScanned + 1,
        successfulScans: session.successfulScans + 1,
      });

      return {
        success: true,
        result: "success",
        checkIn,
        attendee: {
          name: registration.attendeeName,
          email: registration.attendeeEmail,
          company: registration.company,
        },
      };
    }),

  /**
   * Get check-in session details and stats.
   * Operator-only.
   */
  getCheckInSession: operatorProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const session = await getCheckInSessionById(input.sessionId);
      if (!session) return null;
      const stats = await getCheckInStats(input.sessionId);
      return { session, stats };
    }),

  /**
   * Get all check-ins for a session.
   * Operator-only.
   */
  getCheckInsBySession: operatorProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getCheckInsBySession(input.sessionId);
    }),

  /**
   * Get all check-in sessions for an event.
   * Operator-only.
   */
  getCheckInSessionsByEvent: operatorProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getCheckInSessionsByEvent(input.eventId);
    }),

  /**
   * End a check-in session.
   * Operator-only.
   */
  endCheckInSession: operatorProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const session = await updateCheckInSession(input.sessionId, {
        status: "ended",
        endedAt: new Date(),
      });
      return session;
    }),

  /**
   * Get check-in statistics for an event.
   * Operator-only.
   */
  getCheckInStats: operatorProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ input }) => {
      const checkIns = await getCheckInsByEvent(input.eventId);
      const successCount = checkIns.filter((c) => c.result === "success").length;
      const duplicateCount = checkIns.filter((c) => c.result === "duplicate").length;
      const notFoundCount = checkIns.filter((c) => c.result === "not_found").length;
      const invalidCount = checkIns.filter((c) => c.result === "invalid").length;
      return {
        eventId: input.eventId,
        totalScanned: checkIns.length,
        successCount,
        duplicateCount,
        notFoundCount,
        invalidCount,
        successRate: checkIns.length > 0 ? (successCount / checkIns.length) * 100 : 0,
      };
    }),
});
