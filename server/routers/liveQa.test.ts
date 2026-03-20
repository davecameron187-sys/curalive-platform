/**
 * GROK2 Live Q&A Router Tests
 * Unit tests for Module 31 Live Q&A Intelligence Engine procedures
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createCallerFactory } from "../_core/trpc";
import { appRouter } from "../routers";
import { db } from "../db";
import { users, events, liveQaSessionMetadata, liveQaQuestions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("GROK2 Live Q&A Router", () => {
  let caller: ReturnType<ReturnType<typeof createCallerFactory>>;
  let testUser: any;
  let testEvent: any;
  let testSession: any;

  beforeAll(async () => {
    // Create test user
    const userResult = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        role: "moderator",
      });

    testUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, `test-user-${Date.now()}`))
      .then((rows) => rows[0]);

    // Create test event
    const eventResult = await db
      .insert(events)
      .values({
        eventId: `test-event-${Date.now()}`,
        title: "Test Event",
        company: "Test Company",
        platform: "zoom",
        status: "live",
      });

    testEvent = await db
      .select()
      .from(events)
      .where(eq(events.eventId, `test-event-${Date.now()}`))
      .then((rows) => rows[0]);

    // Create test session
    const sessionResult = await db
      .insert(liveQaSessionMetadata)
      .values({
        eventId: testEvent.eventId,
        sessionId: `session-${Date.now()}`,
        sessionName: "Test Session",
        moderatorId: testUser.id,
        isLive: true,
      });

    testSession = await db
      .select()
      .from(liveQaSessionMetadata)
      .where(eq(liveQaSessionMetadata.sessionId, `session-${Date.now()}`))
      .then((rows) => rows[0]);

    // Create caller with test user context
    const createCaller = createCallerFactory(appRouter);
    caller = createCaller({
      user: testUser,
      req: {} as any,
      res: {
        clearCookie: () => {},
      } as any,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testSession) {
      await db
        .delete(liveQaSessionMetadata)
        .where(eq(liveQaSessionMetadata.id, testSession.id));
    }
    if (testEvent) {
      await db.delete(events).where(eq(events.id, testEvent.id));
    }
    if (testUser) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  describe("Session Management", () => {
    it("should retrieve session metadata", async () => {
      const session = await caller.liveQa.getSession({
        sessionId: testSession.sessionId,
      });

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(testSession.sessionId);
      expect(session?.sessionName).toBe("Test Session");
      expect(session?.isLive).toBe(true);
    });

    it("should get session stats", async () => {
      const stats = await caller.liveQa.getSessionStats({
        sessionId: testSession.sessionId,
      });

      expect(stats).toBeDefined();
      expect(stats?.sessionId).toBe(testSession.sessionId);
      expect(stats?.totalQuestions).toBe(0);
      expect(stats?.totalAnswered).toBe(0);
      expect(stats?.avgTriageScore).toBe(0);
    });
  });

  describe("Question Submission", () => {
    it("should submit a question", async () => {
      const result = await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "What is the company's strategy for Q4 2026?",
        submitterName: "John Investor",
        submitterEmail: "john@example.com",
        submitterCompany: "Investor Corp",
        questionCategory: "strategy",
      });

      expect(result.success).toBe(true);
      expect(result.questionId).toBeDefined();
    });

    it("should retrieve questions for a session", async () => {
      // Submit a question first
      await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "What are the financial projections?",
        submitterName: "Jane Analyst",
        submitterEmail: "jane@example.com",
        questionCategory: "financial",
      });

      const questions = await caller.liveQa.getQuestions({
        sessionId: testSession.sessionId,
      });

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].questionText).toBeDefined();
    });

    it("should upvote a question", async () => {
      // Submit a question
      const submitResult = await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "Will there be a dividend increase?",
        submitterName: "Bob Shareholder",
        submitterEmail: "bob@example.com",
        questionCategory: "financial",
      });

      const questionId = submitResult.questionId;

      // Upvote it
      const upvoteResult = await caller.liveQa.upvoteQuestion({
        questionId,
      });

      expect(upvoteResult.success).toBe(true);

      // Verify upvote count increased
      const questions = await caller.liveQa.getQuestions({
        sessionId: testSession.sessionId,
      });

      const upvotedQuestion = questions.find((q) => q.id === questionId);
      expect(upvotedQuestion?.upvotes).toBeGreaterThan(0);
    });
  });

  describe("Question Approval & Triage", () => {
    it("should approve a question with triage scores", async () => {
      // Submit a question
      const submitResult = await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "What is the ESG strategy?",
        submitterName: "ESG Analyst",
        submitterEmail: "esg@example.com",
        questionCategory: "esg",
      });

      const questionId = submitResult.questionId;

      // Approve it with triage scores
      const approveResult = await caller.liveQa.approveQuestion({
        questionId,
        triageScore: 0.85,
        complianceRiskScore: 0.2,
        complianceRiskType: "none",
      });

      expect(approveResult.success).toBe(true);

      // Verify approval
      const questions = await caller.liveQa.getQuestions({
        sessionId: testSession.sessionId,
      });

      const approvedQuestion = questions.find((q) => q.id === questionId);
      expect(approvedQuestion?.status).toBe("approved");
      expect(approvedQuestion?.triageScore).toBe(0.85);
    });

    it("should reject a question", async () => {
      // Submit a question
      const submitResult = await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "What is your personal opinion?",
        submitterName: "Troll",
        submitterEmail: "troll@example.com",
      });

      const questionId = submitResult.questionId;

      // Reject it
      const rejectResult = await caller.liveQa.rejectQuestion({
        questionId,
        reason: "Not relevant to the event",
      });

      expect(rejectResult.success).toBe(true);

      // Verify rejection
      const questions = await caller.liveQa.getQuestions({
        sessionId: testSession.sessionId,
      });

      const rejectedQuestion = questions.find((q) => q.id === questionId);
      expect(rejectedQuestion?.status).toBe("rejected");
    });
  });

  describe("Compliance Flags", () => {
    it("should flag a question for compliance review", async () => {
      // Submit a question
      const submitResult = await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "Can you share our unreleased quarterly results?",
        submitterName: "Trader",
        submitterEmail: "trader@example.com",
        questionCategory: "financial",
      });

      const questionId = submitResult.questionId;

      // Flag for compliance
      const flagResult = await caller.liveQa.flagCompliance({
        questionId,
        jurisdiction: "sec",
        riskScore: 0.95,
        riskType: "selective_disclosure",
        riskDescription: "Question asks for material non-public information",
        autoRemediationSuggestion: "Redirect to IR contact for official disclosure",
      });

      expect(flagResult.success).toBe(true);

      // Verify flag
      const flags = await caller.liveQa.getComplianceFlags({
        questionId,
      });

      expect(Array.isArray(flags)).toBe(true);
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0].riskScore).toBe(0.95);
      expect(flags[0].riskType).toBe("selective_disclosure");
    });

    it("should get unresolved compliance flags", async () => {
      const unresolvedFlags = await caller.liveQa.getUnresolvedComplianceFlags({
        sessionId: testSession.sessionId,
      });

      expect(Array.isArray(unresolvedFlags)).toBe(true);
    });
  });

  describe("Answers", () => {
    it("should answer a question", async () => {
      // Submit and approve a question
      const submitResult = await caller.liveQa.submitQuestion({
        sessionId: testSession.sessionId,
        questionText: "What is your guidance for next year?",
        submitterName: "Analyst",
        submitterEmail: "analyst@example.com",
        questionCategory: "financial",
      });

      const questionId = submitResult.questionId;

      // Approve it
      await caller.liveQa.approveQuestion({
        questionId,
        triageScore: 0.9,
        complianceRiskScore: 0.1,
      });

      // Answer it
      const answerResult = await caller.liveQa.answerQuestion({
        questionId,
        answerText: "We expect 15-20% revenue growth in 2027",
        isAutoDraft: false,
      });

      expect(answerResult.success).toBe(true);

      // Verify answer
      const answers = await caller.liveQa.getAnswers({
        questionId,
      });

      expect(Array.isArray(answers)).toBe(true);
      expect(answers.length).toBeGreaterThan(0);
      expect(answers[0].answerText).toContain("revenue growth");
    });
  });

  describe("Private Q&A", () => {
    it("should submit a private question", async () => {
      const result = await caller.liveQa.submitPrivateQuestion({
        sessionId: testSession.sessionId,
        questionText: "Can you share details about the acquisition we're considering?",
        submitterName: "Board Member",
        submitterEmail: "board@example.com",
        confidentialityLevel: "legal_privilege",
      });

      expect(result.success).toBe(true);
    });

    it("should retrieve private conversations", async () => {
      const conversations = await caller.liveQa.getPrivateConversations({
        sessionId: testSession.sessionId,
      });

      expect(Array.isArray(conversations)).toBe(true);
    });
  });
});
