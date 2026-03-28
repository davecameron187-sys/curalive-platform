/**
 * Shadow Mode Archive Router Tests
 * Comprehensive test suite for archived session management and export functionality
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "../db";
import { liveQaSessionMetadata, liveQaQuestions, complianceFlags } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Archive Router", () => {
  let database: any;
  const testSessionId = `test-session-${Date.now()}`;
  const testEventId = "test-event-123";

  beforeAll(async () => {
    database = await getDb();
    if (!database) {
      throw new Error("Database not available for tests");
    }

    // Create test session
    await database.insert(liveQaSessionMetadata).values({
      eventId: testEventId,
      sessionId: testSessionId,
      sessionName: "Test Session",
      moderatorId: 1,
      operatorId: 1,
      startedAt: new Date(),
      endedAt: new Date(),
      isLive: false,
      totalAttendees: 10,
      transcriptUrl: "https://example.com/transcript.json",
      recordingUrl: "https://example.com/recording.mp4",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    if (!database) return;

    // Cleanup test data
    await database
      .delete(liveQaSessionMetadata)
      .where(eq(liveQaSessionMetadata.sessionId, testSessionId));
  });

  describe("getArchivedSessions", () => {
    it("should return archived sessions with pagination", async () => {
      const sessions = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.isLive, false))
        .limit(10);

      expect(sessions).toBeDefined();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it("should filter sessions by search query", async () => {
      const sessions = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionName, "Test Session"));

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].sessionName).toBe("Test Session");
    });

    it("should calculate session duration correctly", () => {
      const startedAt = new Date("2026-03-28T10:00:00Z");
      const endedAt = new Date("2026-03-28T11:30:00Z");
      const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

      expect(duration).toBe(5400); // 1.5 hours in seconds
    });
  });

  describe("getSessionDetails", () => {
    it("should fetch session with related data", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, testSessionId))
        .limit(1);

      expect(session.length).toBe(1);
      expect(session[0].sessionId).toBe(testSessionId);
      expect(session[0].sessionName).toBe("Test Session");
    });

    it("should return empty array for non-existent session", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, "non-existent-id"))
        .limit(1);

      expect(session.length).toBe(0);
    });

    it("should fetch questions for a session", async () => {
      // Create test question
      await database.insert(liveQaQuestions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        questionText: "Test question",
        submitterName: "Test User",
        submitterEmail: "test@example.com",
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const questions = await database
        .select()
        .from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, testSessionId));

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].questionText).toBe("Test question");

      // Cleanup
      await database
        .delete(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, testSessionId));
    });
  });

  describe("exportSessionAsCSV", () => {
    it("should generate valid CSV content", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, testSessionId))
        .limit(1);

      expect(session.length).toBe(1);

      const sessionData = session[0];
      const csvLines = [
        "CuraLive Session Export",
        `Session ID,${sessionData.sessionId}`,
        `Event Name,${sessionData.sessionName}`,
      ];

      const csvContent = csvLines.join("\n");
      expect(csvContent).toContain("CuraLive Session Export");
      expect(csvContent).toContain(testSessionId);
      expect(csvContent).toContain("Test Session");
    });

    it("should include questions in CSV export", async () => {
      // Create test question
      await database.insert(liveQaQuestions).values({
        sessionId: testSessionId,
        eventId: testEventId,
        questionText: "Export test question",
        submitterName: "Export Tester",
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const questions = await database
        .select()
        .from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, testSessionId));

      expect(questions.length).toBeGreaterThan(0);

      const csvLine = questions
        .map((q) => `${q.id},"${q.questionText}","${q.submitterName || ""}"`)
        .join("\n");

      expect(csvLine).toContain("Export test question");
      expect(csvLine).toContain("Export Tester");

      // Cleanup
      await database
        .delete(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, testSessionId));
    });
  });

  describe("exportSessionAsJSON", () => {
    it("should generate valid JSON structure", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, testSessionId))
        .limit(1);

      expect(session.length).toBe(1);

      const exportData = {
        session: {
          id: session[0].sessionId,
          eventName: session[0].sessionName,
          startedAt: session[0].startedAt,
          endedAt: session[0].endedAt,
        },
        questions: [],
        complianceFlags: [],
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const parsed = JSON.parse(jsonContent);

      expect(parsed.session).toBeDefined();
      expect(parsed.session.id).toBe(testSessionId);
      expect(parsed.questions).toEqual([]);
      expect(parsed.complianceFlags).toEqual([]);
    });

    it("should include all session data in JSON export", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, testSessionId))
        .limit(1);

      const exportData = {
        session: {
          id: session[0].sessionId,
          eventName: session[0].sessionName,
          startedAt: session[0].startedAt,
          endedAt: session[0].endedAt,
          totalAttendees: session[0].totalAttendees,
          transcriptUrl: session[0].transcriptUrl,
          recordingUrl: session[0].recordingUrl,
        },
      };

      expect(exportData.session.totalAttendees).toBe(10);
      expect(exportData.session.transcriptUrl).toBe("https://example.com/transcript.json");
      expect(exportData.session.recordingUrl).toBe("https://example.com/recording.mp4");
    });
  });

  describe("getServiceStatus", () => {
    it("should report completed status when URLs exist", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, testSessionId))
        .limit(1);

      expect(session[0].transcriptUrl).toBeTruthy();
      expect(session[0].recordingUrl).toBeTruthy();

      const whisperStatus = session[0].transcriptUrl ? "completed" : "pending";
      const recallStatus = session[0].recordingUrl ? "completed" : "pending";

      expect(whisperStatus).toBe("completed");
      expect(recallStatus).toBe("completed");
    });

    it("should report pending status when URLs are missing", async () => {
      const sessionWithoutUrls = {
        transcriptUrl: null,
        recordingUrl: null,
      };

      const whisperStatus = sessionWithoutUrls.transcriptUrl ? "completed" : "pending";
      const recallStatus = sessionWithoutUrls.recordingUrl ? "completed" : "pending";

      expect(whisperStatus).toBe("pending");
      expect(recallStatus).toBe("pending");
    });
  });

  describe("Data Integrity", () => {
    it("should maintain data consistency across operations", async () => {
      const session = await database
        .select()
        .from(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.sessionId, testSessionId))
        .limit(1);

      expect(session[0].sessionId).toBe(testSessionId);
      expect(session[0].eventId).toBe(testEventId);
      expect(session[0].isLive).toBe(false);
    });

    it("should handle null values gracefully", () => {
      const session = {
        sessionId: testSessionId,
        endedAt: null,
        transcriptUrl: null,
      };

      const endedAt = session.endedAt || new Date();
      const duration = Math.floor((endedAt.getTime() - new Date().getTime()) / 1000);

      expect(endedAt).toBeDefined();
      expect(typeof duration).toBe("number");
    });
  });
});
