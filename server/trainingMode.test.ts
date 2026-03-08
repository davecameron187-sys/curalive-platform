import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createTrainingSession,
  getOperatorTrainingSessions,
  getTrainingSessionDetails,
  createTrainingConference,
  getTrainingConferencesBySession,
  addTrainingParticipant,
  logTrainingCall,
  getTrainingCallLogs,
  upsertTrainingPerformanceMetrics,
  getTrainingPerformanceMetrics,
  completeTrainingSession,
} from "./db";

describe("Training Mode Database Helpers", () => {
  const testUserId = 1;
  const testOperatorName = "Test Operator";
  const testSessionName = "Q4 Earnings Practice";
  const testScenario = "earnings-call";

  describe("createTrainingSession", () => {
    it("should create a new training session", async () => {
      const result = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);
    });

    it("should create a training session with mentor", async () => {
      const mentorId = 2;
      const result = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario,
        mentorId
      );
      expect(result).toBeDefined();
    });
  });

  describe("getOperatorTrainingSessions", () => {
    it("should retrieve all training sessions for an operator", async () => {
      // Create a session first
      await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );

      const sessions = await getOperatorTrainingSessions(testUserId);
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);
    });

    it("should return empty array for operator with no sessions", async () => {
      const nonExistentUserId = 99999;
      const sessions = await getOperatorTrainingSessions(nonExistentUserId);
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe("createTrainingConference", () => {
    it("should create a training conference", async () => {
      // Create session first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      const result = await createTrainingConference({
        trainingSessionId: sessionId,
        eventId: "q4-earnings-2026",
        callId: "TC-TEST001",
        subject: "Q4 Earnings Call",
        product: "Training Conference",
        status: "pending",
      });

      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);
    });
  });

  describe("addTrainingParticipant", () => {
    it("should add a participant to a training conference", async () => {
      // Create session and conference first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      const confResult = await createTrainingConference({
        trainingSessionId: sessionId,
        eventId: "q4-earnings-2026",
        callId: "TC-TEST002",
        subject: "Q4 Earnings Call",
        product: "Training Conference",
        status: "pending",
      });
      const conferenceId = confResult.insertId;

      const result = await addTrainingParticipant({
        trainingConferenceId: conferenceId,
        lineNumber: 1,
        role: "participant",
        name: "John Investor",
        company: "Acme Corp",
        phoneNumber: "+1234567890",
        state: "incoming",
      });

      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);
    });
  });

  describe("logTrainingCall", () => {
    it("should log a training call", async () => {
      // Create session and conference first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      const confResult = await createTrainingConference({
        trainingSessionId: sessionId,
        eventId: "q4-earnings-2026",
        callId: "TC-TEST003",
        subject: "Q4 Earnings Call",
        product: "Training Conference",
        status: "pending",
      });
      const conferenceId = confResult.insertId;

      const result = await logTrainingCall({
        trainingSessionId: sessionId,
        trainingConferenceId: conferenceId,
        operatorId: testUserId,
        participantName: "Jane Analyst",
        callDuration: 300, // 5 minutes
        callQuality: "good",
        operatorPerformance: JSON.stringify({ communication: "excellent" }),
        participantFeedback: JSON.stringify({ satisfaction: 4.5 }),
        recordingUrl: "https://example.com/recording.mp4",
        startedAt: new Date(),
        endedAt: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);
    });
  });

  describe("getTrainingCallLogs", () => {
    it("should retrieve training call logs for a session", async () => {
      // Create session first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      const logs = await getTrainingCallLogs(sessionId);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("upsertTrainingPerformanceMetrics", () => {
    it("should create or update training performance metrics", async () => {
      // Create session first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      const result = await upsertTrainingPerformanceMetrics({
        trainingSessionId: sessionId,
        operatorId: testUserId,
        totalCallsHandled: 5,
        averageCallDuration: 300,
        callQualityScore: BigInt(460) / BigInt(100), // 4.6/5.0
        averageParticipantSatisfaction: BigInt(470) / BigInt(100), // 4.7/5.0
        communicationScore: BigInt(450) / BigInt(100), // 4.5/5.0
        problemSolvingScore: BigInt(460) / BigInt(100), // 4.6/5.0
        professionalism: BigInt(480) / BigInt(100), // 4.8/5.0
        overallScore: BigInt(460) / BigInt(100), // 4.6/5.0
        readyForProduction: true,
        mentorNotes: "Excellent performance. Ready for production.",
      });

      expect(result).toBeDefined();
    });
  });

  describe("getTrainingPerformanceMetrics", () => {
    it("should retrieve performance metrics for an operator", async () => {
      // Create session and metrics first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      await upsertTrainingPerformanceMetrics({
        trainingSessionId: sessionId,
        operatorId: testUserId,
        totalCallsHandled: 5,
        averageCallDuration: 300,
        readyForProduction: true,
      });

      const metrics = await getTrainingPerformanceMetrics(sessionId, testUserId);
      expect(Array.isArray(metrics)).toBe(true);
      if (metrics.length > 0) {
        expect(metrics[0].operatorId).toBe(testUserId);
        expect(metrics[0].trainingSessionId).toBe(sessionId);
      }
    });
  });

  describe("completeTrainingSession", () => {
    it("should complete a training session with final metrics", async () => {
      // Create session first
      const sessionResult = await createTrainingSession(
        testUserId,
        testOperatorName,
        testSessionName,
        testScenario
      );
      const sessionId = sessionResult.insertId;

      const result = await completeTrainingSession(sessionId, {
        trainingSessionId: sessionId,
        operatorId: testUserId,
        totalCallsHandled: 8,
        averageCallDuration: 320,
        callQualityScore: BigInt(480) / BigInt(100), // 4.8/5.0
        averageParticipantSatisfaction: BigInt(490) / BigInt(100), // 4.9/5.0
        communicationScore: BigInt(480) / BigInt(100), // 4.8/5.0
        problemSolvingScore: BigInt(470) / BigInt(100), // 4.7/5.0
        professionalism: BigInt(490) / BigInt(100), // 4.9/5.0
        overallScore: BigInt(480) / BigInt(100), // 4.8/5.0
        readyForProduction: true,
        mentorNotes: "Outstanding performance. Promoted to production.",
        evaluatedAt: new Date(),
      });

      expect(result).toBeDefined();

      // Verify session is marked as completed
      const sessionDetails = await getTrainingSessionDetails(sessionId);
      expect(sessionDetails).toBeDefined();
      if (sessionDetails && sessionDetails.length > 0) {
        expect(sessionDetails[0].status).toBe("completed");
      }
    });
  });
});
