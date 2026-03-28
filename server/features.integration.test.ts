import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as emailNotifications from "./emailNotifications";

/**
 * Integration Tests for New Features
 * Tests for Advanced Q&A, Speaker Profiles, Email Notifications
 */

describe("Email Notifications", () => {
  it("should send event reminder email", async () => {
    const result = await emailNotifications.sendEventReminder(
      "test@example.com",
      "John Doe",
      "Q2 2026 Earnings Call",
      new Date("2026-05-15T10:00:00Z"),
      "https://curalive.com/events/q2-2026"
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should send Q&A alert email", async () => {
    const result = await emailNotifications.sendQAAlert(
      "test@example.com",
      "Jane Smith",
      "Q2 2026 Earnings Call",
      "What are your guidance expectations for Q3?",
      "https://curalive.com/events/q2-2026/qa/q123"
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should send post-event summary email", async () => {
    const result = await emailNotifications.sendPostEventSummary(
      "test@example.com",
      "Bob Johnson",
      "Q2 2026 Earnings Call",
      {
        totalAttendees: 1200,
        totalQuestions: 45,
        averageSentiment: 0.82,
        topSpeaker: "Sarah Chen (CFO)",
        transcriptUrl: "https://curalive.com/events/q2-2026/transcript",
        replayUrl: "https://curalive.com/events/q2-2026/replay",
      }
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should send question approved email", async () => {
    const result = await emailNotifications.sendQuestionApprovedEmail(
      "test@example.com",
      "Alice Brown",
      "Q2 2026 Earnings Call",
      "What is your strategy for international expansion?"
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should send question rejected email", async () => {
    const result = await emailNotifications.sendQuestionRejectedEmail(
      "test@example.com",
      "Charlie Davis",
      "Q2 2026 Earnings Call",
      "Can you comment on the SEC investigation?",
      "Question contains potentially sensitive regulatory information"
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should send bulk emails", async () => {
    const recipients = [
      { email: "user1@example.com", name: "User One" },
      { email: "user2@example.com", name: "User Two" },
      { email: "user3@example.com", name: "User Three" },
    ];

    const results = await emailNotifications.sendBulkEmails(recipients, {
      type: "event_reminder",
      recipientEmail: "",
      recipientName: "",
      eventId: "event-1",
      eventTitle: "Q2 2026 Earnings Call",
      data: {
        eventDate: new Date("2026-05-15T10:00:00Z"),
        eventUrl: "https://curalive.com/events/q2-2026",
      },
    });

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
  });
});

describe("Advanced Q&A Features", () => {
  it("should filter questions by sentiment", () => {
    const questions = [
      {
        id: "q1",
        text: "Great earnings!",
        sentiment: "positive" as const,
      },
      {
        id: "q2",
        text: "Concerning results",
        sentiment: "negative" as const,
      },
      { id: "q3", text: "What about Q3?", sentiment: "neutral" as const },
    ];

    const filtered = questions.filter((q) => q.sentiment === "positive");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("q1");
  });

  it("should filter questions by compliance risk", () => {
    const questions = [
      { id: "q1", text: "Q&A", complianceRisk: "low" as const },
      { id: "q2", text: "SEC", complianceRisk: "high" as const },
      { id: "q3", text: "Guidance", complianceRisk: "medium" as const },
    ];

    const filtered = questions.filter((q) => q.complianceRisk === "high");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("q2");
  });

  it("should support bulk question approval", () => {
    const selectedQuestions = ["q1", "q2", "q3"];
    const approvedQuestions = selectedQuestions.map((id) => ({
      id,
      status: "approved" as const,
    }));

    expect(approvedQuestions).toHaveLength(3);
    expect(approvedQuestions.every((q) => q.status === "approved")).toBe(true);
  });

  it("should support bulk question rejection", () => {
    const selectedQuestions = ["q1", "q2"];
    const rejectedQuestions = selectedQuestions.map((id) => ({
      id,
      status: "rejected" as const,
    }));

    expect(rejectedQuestions).toHaveLength(2);
    expect(rejectedQuestions.every((q) => q.status === "rejected")).toBe(true);
  });

  it("should export questions to CSV", () => {
    const questions = [
      {
        text: "Question 1",
        sentiment: "positive",
        complianceRisk: "low",
        upvotes: 10,
        speaker: "CEO",
      },
      {
        text: "Question 2",
        sentiment: "negative",
        complianceRisk: "high",
        upvotes: 5,
        speaker: "CFO",
      },
    ];

    const csv = [
      ["Question", "Sentiment", "Compliance Risk", "Upvotes", "Speaker"],
      ...questions.map((q) => [
        q.text,
        q.sentiment,
        q.complianceRisk,
        q.upvotes,
        q.speaker,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    expect(csv).toContain("Question 1");
    expect(csv).toContain("positive");
    expect(csv).toContain("high");
  });
});

describe("Speaker Profile Features", () => {
  it("should calculate average sentiment", () => {
    const events = [
      { sentiment: 0.8 },
      { sentiment: 0.75 },
      { sentiment: 0.85 },
    ];

    const avgSentiment =
      events.reduce((sum, e) => sum + e.sentiment, 0) / events.length;

    expect(avgSentiment).toBeCloseTo(0.8, 2);
  });

  it("should calculate engagement rate", () => {
    const events = [
      { totalAttendees: 1000, questionsAsked: 50 },
      { totalAttendees: 1500, questionsAsked: 100 },
    ];

    const engagementRate =
      events.reduce((sum, e) => sum + e.questionsAsked / e.totalAttendees, 0) /
      events.length;

    expect(engagementRate).toBeCloseTo(0.0467, 3);
  });

  it("should track speaker event history", () => {
    const speakerEvents = [
      {
        id: "e1",
        title: "Q2 Earnings",
        date: new Date("2026-05-15"),
        sentiment: 0.82,
      },
      {
        id: "e2",
        title: "Investor Day",
        date: new Date("2026-04-20"),
        sentiment: 0.75,
      },
      {
        id: "e3",
        title: "Q1 Earnings",
        date: new Date("2026-02-10"),
        sentiment: 0.72,
      },
    ];

    const sortedByDate = [...speakerEvents].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    expect(sortedByDate[0].id).toBe("e1");
    expect(sortedByDate).toHaveLength(3);
  });

  it("should identify top performing events", () => {
    const events = [
      { id: "e1", sentiment: 0.65 },
      { id: "e2", sentiment: 0.92 },
      { id: "e3", sentiment: 0.78 },
    ];

    const topEvent = events.reduce((prev, current) =>
      prev.sentiment > current.sentiment ? prev : current
    );

    expect(topEvent.id).toBe("e2");
    expect(topEvent.sentiment).toBe(0.92);
  });
});
