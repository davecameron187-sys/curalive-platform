/**
 * Archive Router — Shadow Mode Backend
 * 
 * Procedures for fetching, filtering, and managing archived sessions
 * Supports AI service selection and execution on past sessions
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { liveQaSessionMetadata, liveQaQuestions, complianceFlags, operatorActions } from "../../drizzle/schema";
import { eq, desc, ilike, and } from "drizzle-orm";

export const archiveRouter = router({
  /**
   * Get archived sessions with pagination and filtering
   */
  getArchivedSessions: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const offset = (input.page - 1) * input.limit;

      try {
        // Build where conditions
        const conditions = [];
        if (input.search) {
          conditions.push(ilike(liveQaSessionMetadata.sessionName, `%${input.search}%`));
        }
        // Only get ended sessions
        conditions.push(eq(liveQaSessionMetadata.isLive, false));

        const whereClause = conditions.length > 0 ? and(...conditions) : eq(liveQaSessionMetadata.isLive, false);

        const archivedSessions = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(whereClause)
          .orderBy(desc(liveQaSessionMetadata.startedAt))
          .limit(input.limit)
          .offset(offset);

        return archivedSessions.map((session) => {
          const endedAt = session.endedAt || new Date();
          const duration = Math.floor((new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000);
          return {
            id: session.sessionId,
            eventName: session.sessionName,
            startedAt: session.startedAt,
            endedAt,
            duration,
            attendeeCount: session.totalAttendees || 0,
            status: "completed" as const,
            transcriptReady: !!session.transcriptUrl,
            analysisReady: !!session.recordingUrl,
          };
        });
      } catch (error) {
        console.error("Error fetching archived sessions:", error);
        return [];
      }
    }),

  /**
   * Get single session details for Shadow Mode
   */
  getSessionDetails: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      try {
        const session = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(eq(liveQaSessionMetadata.sessionId, input.sessionId))
          .limit(1);

        if (!session || session.length === 0) {
          throw new Error("Session not found");
        }

        const sessionData = session[0];

        // Fetch related data
        const qaQuestions = await database
          .select()
          .from(liveQaQuestions)
          .where(eq(liveQaQuestions.sessionId, input.sessionId));

        const flags = await database
          .select()
          .from(complianceFlags)
          .where(eq(complianceFlags.sessionId, input.sessionId));

        const actions = await database
          .select()
          .from(operatorActions)
          .where(eq(operatorActions.sessionId, input.sessionId));

        return {
          session: {
            id: sessionData.sessionId,
            eventName: sessionData.sessionName,
            startedAt: sessionData.startedAt,
            endedAt: sessionData.endedAt,
            status: sessionData.isLive ? "live" : "completed",
            attendeeCount: sessionData.totalAttendees,
          },
          questions: qaQuestions.map((q) => ({
            id: q.id,
            text: q.questionText,
            askedBy: q.submitterName,
            status: q.status,
            timestamp: q.createdAt,
          })),
          operatorNotes: actions
            .filter((a) => a.actionType === "note_created")
            .map((a) => {
              const metadata = a.metadata as { note?: string } | null;
              return {
                id: a.id,
                note: metadata?.note || "",
                createdAt: a.createdAt,
              };
            }),
          complianceFlags: flags.map((f) => ({
            id: f.id,
            riskType: f.riskType,
            riskScore: f.riskScore,
            description: f.riskDescription,
            timestamp: f.createdAt,
          })),
        };
      } catch (error) {
        console.error("Error fetching session details:", error);
        throw error;
      }
    }),

  /**
   * Get AI service status for a session
   */
  getServiceStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      try {
        const session = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(eq(liveQaSessionMetadata.sessionId, input.sessionId))
          .limit(1);

        if (!session || session.length === 0) {
          throw new Error("Session not found");
        }

        const sessionData = session[0];

        return {
          sessionId: input.sessionId,
          whisperStatus: sessionData.transcriptUrl ? ("completed" as const) : ("pending" as const),
          recallStatus: sessionData.recordingUrl ? ("completed" as const) : ("pending" as const),
          lastUpdated: sessionData.updatedAt,
        };
      } catch (error) {
        console.error("Error fetching service status:", error);
        throw error;
      }
    }),

  /**
   * Trigger AI services on an archived session
   */
  runAiServices: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        services: z.array(z.enum(["whisper", "recall"])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      try {
        const session = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(eq(liveQaSessionMetadata.sessionId, input.sessionId))
          .limit(1);

        if (!session || session.length === 0) {
          throw new Error("Session not found");
        }

        // Mark services as processing
        const results = {
          whisper: input.services.includes("whisper") ? "processing" : "skipped",
          recall: input.services.includes("recall") ? "processing" : "skipped",
        };

        // TODO: Actually trigger the services via webhooks or background jobs
        // For now, just return the status

        return {
          sessionId: input.sessionId,
          status: "started",
          services: results,
          message: "AI services queued for processing",
        };
      } catch (error) {
        console.error("Error running AI services:", error);
        throw error;
      }
    }),

  /**
   * Export session as CSV
   */
  exportSessionAsCSV: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      try {
        const session = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(eq(liveQaSessionMetadata.sessionId, input.sessionId))
          .limit(1);

        if (!session || session.length === 0) {
          throw new Error("Session not found");
        }

        const sessionData = session[0];

        // Fetch all related data
        const questions = await database
          .select()
          .from(liveQaQuestions)
          .where(eq(liveQaQuestions.sessionId, input.sessionId));

        const flags = await database
          .select()
          .from(complianceFlags)
          .where(eq(complianceFlags.sessionId, input.sessionId));

        // Build CSV content
        const csvLines = [
          "CuraLive Session Export",
          `Session ID,${sessionData.sessionId}`,
          `Event Name,${sessionData.sessionName}`,
          `Started At,${sessionData.startedAt?.toISOString() || ""}`,
          `Ended At,${sessionData.endedAt?.toISOString() || ""}`,
          `Total Attendees,${sessionData.totalAttendees || 0}`,
          "",
          "Questions",
          "ID,Question,Submitter,Status,Created At",
          ...questions.map((q) => `${q.id},"${q.questionText}","${q.submitterName || ""}",${q.status},${q.createdAt?.toISOString() || ""}`),
          "",
          "Compliance Flags",
          "ID,Risk Type,Risk Score,Description,Created At",
          ...flags.map((f) => `${f.id},${f.riskType},${f.riskScore},"${f.riskDescription}",${f.createdAt?.toISOString() || ""}`),
        ];

        const csvContent = csvLines.join("\n");

        return {
          sessionId: input.sessionId,
          format: "csv",
          content: csvContent,
          filename: `session-${input.sessionId}-export.csv`,
          size: csvContent.length,
        };
      } catch (error) {
        console.error("Error exporting session as CSV:", error);
        throw error;
      }
    }),

  /**
   * Export session as PDF
   */
  exportSessionAsPDF: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      try {
        const session = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(eq(liveQaSessionMetadata.sessionId, input.sessionId))
          .limit(1);

        if (!session || session.length === 0) {
          throw new Error("Session not found");
        }

        const sessionData = session[0];

        // Fetch all related data
        const questions = await database
          .select()
          .from(liveQaQuestions)
          .where(eq(liveQaQuestions.sessionId, input.sessionId));

        const flags = await database
          .select()
          .from(complianceFlags)
          .where(eq(complianceFlags.sessionId, input.sessionId));

        // Build PDF content (simplified text format)
        const pdfLines = [
          "CuraLive Session Report",
          "=".repeat(50),
          "",
          `Session ID: ${sessionData.sessionId}`,
          `Event Name: ${sessionData.sessionName}`,
          `Started: ${sessionData.startedAt?.toISOString() || "N/A"}`,
          `Ended: ${sessionData.endedAt?.toISOString() || "N/A"}`,
          `Total Attendees: ${sessionData.totalAttendees || 0}`,
          "",
          "Questions Summary",
          "-".repeat(50),
          `Total Questions: ${questions.length}`,
          ...questions.slice(0, 10).map((q) => `• ${q.questionText} (${q.status})`),
          questions.length > 10 ? `... and ${questions.length - 10} more questions` : "",
          "",
          "Compliance Flags",
          "-".repeat(50),
          `Total Flags: ${flags.length}`,
          ...flags.map((f) => `• ${f.riskType} - Score: ${f.riskScore} - ${f.riskDescription}`),
          "",
          `Report Generated: ${new Date().toISOString()}`,
        ];

        const pdfContent = pdfLines.join("\n");

        return {
          sessionId: input.sessionId,
          format: "pdf",
          content: pdfContent,
          filename: `session-${input.sessionId}-report.pdf`,
          size: pdfContent.length,
        };
      } catch (error) {
        console.error("Error exporting session as PDF:", error);
        throw error;
      }
    }),

  /**
   * Export session as JSON
   */
  exportSessionAsJSON: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      try {
        const session = await database
          .select()
          .from(liveQaSessionMetadata)
          .where(eq(liveQaSessionMetadata.sessionId, input.sessionId))
          .limit(1);

        if (!session || session.length === 0) {
          throw new Error("Session not found");
        }

        const sessionData = session[0];

        // Fetch all related data
        const questions = await database
          .select()
          .from(liveQaQuestions)
          .where(eq(liveQaQuestions.sessionId, input.sessionId));

        const flags = await database
          .select()
          .from(complianceFlags)
          .where(eq(complianceFlags.sessionId, input.sessionId));

        const actions = await database
          .select()
          .from(operatorActions)
          .where(eq(operatorActions.sessionId, input.sessionId));

        // Build JSON export
        const exportData = {
          session: {
            id: sessionData.sessionId,
            eventName: sessionData.sessionName,
            startedAt: sessionData.startedAt,
            endedAt: sessionData.endedAt,
            totalAttendees: sessionData.totalAttendees,
            transcriptUrl: sessionData.transcriptUrl,
            recordingUrl: sessionData.recordingUrl,
          },
          questions: questions.map((q) => ({
            id: q.id,
            text: q.questionText,
            submitter: {
              name: q.submitterName,
              email: q.submitterEmail,
              company: q.submitterCompany,
            },
            status: q.status,
            category: q.questionCategory,
            createdAt: q.createdAt,
          })),
          complianceFlags: flags.map((f) => ({
            id: f.id,
            jurisdiction: f.jurisdiction,
            riskType: f.riskType,
            riskScore: f.riskScore,
            description: f.riskDescription,
            requiresReview: f.requiresLegalReview,
            resolved: f.isResolved,
            createdAt: f.createdAt,
          })),
          operatorActions: actions.map((a) => ({
            id: a.id,
            type: a.actionType,
            targetId: a.targetId,
            targetType: a.targetType,
            createdAt: a.createdAt,
          })),
          exportedAt: new Date().toISOString(),
        };

        const jsonContent = JSON.stringify(exportData, null, 2);

        return {
          sessionId: input.sessionId,
          format: "json",
          content: jsonContent,
          filename: `session-${input.sessionId}-export.json`,
          size: jsonContent.length,
        };
      } catch (error) {
        console.error("Error exporting session as JSON:", error);
        throw error;
      }
    }),
});

export default archiveRouter;
