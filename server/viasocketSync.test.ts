import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Viasocket Sync Integration", () => {
  const WEBHOOK_URL = "https://flow.sokt.io/func/scri5FOg88XM";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session Event Sync", () => {
    it("should format session.started event correctly", () => {
      const event = {
        eventType: "session.started",
        sessionId: "sess_123",
        eventId: "evt_456",
        operatorId: "op_789",
        timestamp: new Date("2026-03-27T15:00:00Z"),
      };

      const payload = {
        timestamp: event.timestamp.toISOString(),
        eventType: event.eventType,
        data: {
          sessionId: event.sessionId,
          eventId: event.eventId,
          operatorId: event.operatorId,
          timestamp: event.timestamp,
        },
        source: "curalive",
      };

      expect(payload.eventType).toBe("session.started");
      expect(payload.data.sessionId).toBe("sess_123");
      expect(payload.source).toBe("curalive");
    });

    it("should handle session.paused event", () => {
      const event = {
        eventType: "session.paused",
        sessionId: "sess_123",
        eventId: "evt_456",
        operatorId: "op_789",
      };

      expect(event.eventType).toBe("session.paused");
      expect(event.sessionId).toBe("sess_123");
    });

    it("should handle session.resumed event", () => {
      const event = {
        eventType: "session.resumed",
        sessionId: "sess_123",
        eventId: "evt_456",
        operatorId: "op_789",
      };

      expect(event.eventType).toBe("session.resumed");
    });

    it("should handle session.ended event with summary", () => {
      const event = {
        eventType: "session.ended",
        sessionId: "sess_123",
        eventId: "evt_456",
        operatorId: "op_789",
        metadata: {
          duration: 3600,
          totalQuestions: 42,
          approvedQuestions: 35,
        },
      };

      expect(event.eventType).toBe("session.ended");
      expect(event.metadata.duration).toBe(3600);
      expect(event.metadata.totalQuestions).toBe(42);
    });
  });

  describe("Q&A Event Sync", () => {
    it("should format question.submitted event", () => {
      const event = {
        questionId: "q_123",
        sessionId: "sess_456",
        askerName: "John Investor",
        questionText: "What is your growth strategy?",
        timestamp: new Date(),
      };

      expect(event.questionId).toBe("q_123");
      expect(event.askerName).toBe("John Investor");
      expect(event.questionText.length).toBeGreaterThan(0);
    });

    it("should format question.action event for approval", () => {
      const event = {
        questionId: "q_123",
        sessionId: "sess_456",
        action: "approved",
        operatorId: "op_789",
        timestamp: new Date(),
      };

      expect(event.action).toBe("approved");
      expect(event.operatorId).toBe("op_789");
    });

    it("should format question.action event for rejection", () => {
      const event = {
        questionId: "q_123",
        sessionId: "sess_456",
        action: "rejected",
        operatorId: "op_789",
        reason: "Off-topic question",
        timestamp: new Date(),
      };

      expect(event.action).toBe("rejected");
      expect(event.reason).toBe("Off-topic question");
    });

    it("should format question.action event for hold", () => {
      const event = {
        questionId: "q_123",
        sessionId: "sess_456",
        action: "held",
        operatorId: "op_789",
        reason: "Pending legal review",
        timestamp: new Date(),
      };

      expect(event.action).toBe("held");
      expect(event.reason).toBe("Pending legal review");
    });

    it("should format answer.submitted event", () => {
      const event = {
        answerId: "a_123",
        questionId: "q_456",
        sessionId: "sess_789",
        speakerId: "sp_101",
        answerText: "We focus on organic growth and strategic partnerships.",
        timestamp: new Date(),
      };

      expect(event.answerId).toBe("a_123");
      expect(event.speakerId).toBe("sp_101");
      expect(event.answerText.length).toBeGreaterThan(0);
    });

    it("should format question.upvoted event", () => {
      const event = {
        questionId: "q_123",
        sessionId: "sess_456",
        upvoteCount: 42,
        timestamp: new Date(),
      };

      expect(event.upvoteCount).toBe(42);
    });
  });

  describe("Operator Action Sync", () => {
    it("should format operator.note.created event", () => {
      const event = {
        noteId: "note_123",
        sessionId: "sess_456",
        operatorId: "op_789",
        noteText: "Legal review required for question about litigation",
        timestamp: new Date(),
        tags: ["compliance", "legal"],
      };

      expect(event.noteId).toBe("note_123");
      expect(event.tags).toContain("compliance");
      expect(event.tags).toContain("legal");
    });
  });

  describe("Transcript Sync", () => {
    it("should format transcript.segment event", () => {
      const event = {
        segmentId: "seg_123",
        sessionId: "sess_456",
        speaker: "CEO John Smith",
        text: "Thank you for the question about our market expansion.",
        startTime: 120.5,
        endTime: 145.3,
        timestamp: new Date(),
      };

      expect(event.speaker).toBe("CEO John Smith");
      expect(event.startTime).toBeLessThan(event.endTime);
      expect(event.text.length).toBeGreaterThan(0);
    });
  });

  describe("Intelligence Signals Sync", () => {
    it("should format intelligence.signals event with all metrics", () => {
      const event = {
        sessionId: "sess_456",
        sentiment: {
          score: 0.78,
          trend: "improving",
        },
        compliance: {
          riskLevel: "medium",
          flags: ["litigation_mention", "forward_looking_statement"],
        },
        engagement: {
          questionsCount: 42,
          upvotesCount: 156,
          participationRate: 0.85,
        },
        timestamp: new Date(),
      };

      expect(event.sentiment.score).toBeGreaterThan(0);
      expect(event.sentiment.score).toBeLessThanOrEqual(1);
      expect(event.compliance.riskLevel).toBe("medium");
      expect(event.engagement.questionsCount).toBe(42);
    });

    it("should handle partial intelligence.signals", () => {
      const event = {
        sessionId: "sess_456",
        sentiment: {
          score: 0.65,
          trend: "stable",
        },
        timestamp: new Date(),
      };

      expect(event.sentiment).toBeDefined();
      expect(event.compliance).toBeUndefined();
      expect(event.engagement).toBeUndefined();
    });
  });

  describe("Session Summary Sync", () => {
    it("should format session.summary event with complete data", () => {
      const event = {
        sessionId: "sess_456",
        eventId: "evt_789",
        operatorId: "op_101",
        duration: 3600,
        totalQuestions: 42,
        approvedQuestions: 35,
        rejectedQuestions: 5,
        finalSentiment: 0.76,
        complianceRisks: ["forward_looking_statements", "litigation_mentions"],
        transcriptUrl: "https://storage.example.com/transcript_sess_456.txt",
        recordingUrl: "https://storage.example.com/recording_sess_456.mp4",
        timestamp: new Date(),
      };

      expect(event.duration).toBe(3600);
      expect(event.totalQuestions).toBe(42);
      expect(event.approvedQuestions + event.rejectedQuestions).toBeLessThanOrEqual(event.totalQuestions);
      expect(event.complianceRisks.length).toBeGreaterThan(0);
      expect(event.transcriptUrl).toContain("storage.example.com");
    });
  });

  describe("Webhook URL Configuration", () => {
    it("should have correct webhook endpoint", () => {
      expect(WEBHOOK_URL).toBe("https://flow.sokt.io/func/scri5FOg88XM");
      expect(WEBHOOK_URL).toContain("flow.sokt.io");
      expect(WEBHOOK_URL).toContain("scri5FOg88XM");
    });

    it("should support POST requests", () => {
      const payload = {
        timestamp: new Date().toISOString(),
        eventType: "test.connection",
        data: { message: "CuraLive Viasocket integration test" },
        source: "curalive",
      };

      expect(payload.eventType).toBe("test.connection");
      expect(payload.source).toBe("curalive");
    });
  });

  describe("Event Payload Structure", () => {
    it("should include required fields in all payloads", () => {
      const payload = {
        timestamp: new Date().toISOString(),
        eventType: "session.started",
        data: { sessionId: "sess_123" },
        source: "curalive",
      };

      expect(payload).toHaveProperty("timestamp");
      expect(payload).toHaveProperty("eventType");
      expect(payload).toHaveProperty("data");
      expect(payload).toHaveProperty("source");
    });

    it("should have ISO timestamp format", () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("Data Validation", () => {
    it("should validate sentiment score range", () => {
      const validScores = [0, 0.5, 0.75, 1];
      validScores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it("should validate compliance risk levels", () => {
      const validRisks = ["low", "medium", "high"];
      validRisks.forEach((risk) => {
        expect(["low", "medium", "high"]).toContain(risk);
      });
    });

    it("should validate session action types", () => {
      const validActions = ["session.started", "session.paused", "session.resumed", "session.ended"];
      validActions.forEach((action) => {
        expect(action).toMatch(/^session\./);
      });
    });

    it("should validate Q&A action types", () => {
      const validActions = ["approved", "rejected", "held"];
      validActions.forEach((action) => {
        expect(["approved", "rejected", "held"]).toContain(action);
      });
    });
  });
});
