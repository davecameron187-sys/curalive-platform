/**
 * Vitest tests for Round 56 features
 * Check-In Kiosk, SMS Retry Automation, Advanced Reporting
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  startCheckInSession,
  getCheckInSessionById,
  recordAttendeeCheckIn,
  getCheckInStats,
  createReportConfig,
  getReportConfigById,
  getReportConfigsByEvent,
  createGeneratedReport,
  getGeneratedReportById,
} from "./db.round56";

describe("Round 56 — Check-In Kiosk", () => {
  describe("Check-In Sessions", () => {
    it("should create a new check-in session", async () => {
      const session = await startCheckInSession({
        eventId: "test-event-001",
        kioskId: "kiosk-001",
        status: "active",
        totalScanned: 0,
        successfulScans: 0,
        failedScans: 0,
      });

      expect(session).toBeDefined();
      expect(session?.eventId).toBe("test-event-001");
      expect(session?.kioskId).toBe("kiosk-001");
      expect(session?.status).toBe("active");
    });

    it("should retrieve a check-in session by ID", async () => {
      const created = await startCheckInSession({
        eventId: "test-event-002",
        kioskId: "kiosk-002",
        status: "active",
        totalScanned: 0,
        successfulScans: 0,
        failedScans: 0,
      });

      if (!created) throw new Error("Failed to create session");

      const retrieved = await getCheckInSessionById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.eventId).toBe("test-event-002");
    });
  });

  describe("Attendee Check-Ins", () => {
    let sessionId: number;

    beforeEach(async () => {
      const session = await startCheckInSession({
        eventId: "test-event-checkin",
        kioskId: "kiosk-checkin",
        status: "active",
        totalScanned: 0,
        successfulScans: 0,
        failedScans: 0,
      });
      if (!session) throw new Error("Failed to create session");
      sessionId = session.id;
    });

    it("should record a successful attendee check-in", async () => {
      const checkIn = await recordAttendeeCheckIn({
        sessionId,
        eventId: "test-event-checkin",
        passCode: "QR-001",
        registrationId: 1,
        attendeeName: "John Doe",
        attendeeEmail: "john@example.com",
        company: "Acme Corp",
        result: "success",
      });

      expect(checkIn).toBeDefined();
      expect(checkIn?.result).toBe("success");
      expect(checkIn?.attendeeName).toBe("John Doe");
    });

    it("should record a duplicate check-in attempt", async () => {
      const checkIn = await recordAttendeeCheckIn({
        sessionId,
        eventId: "test-event-checkin",
        passCode: "QR-DUP",
        result: "duplicate",
        errorMessage: "Already checked in",
      });

      expect(checkIn).toBeDefined();
      expect(checkIn?.result).toBe("duplicate");
      expect(checkIn?.errorMessage).toContain("Already checked in");
    });

    it("should record a not-found check-in", async () => {
      const checkIn = await recordAttendeeCheckIn({
        sessionId,
        eventId: "test-event-checkin",
        passCode: "QR-NOTFOUND",
        result: "not_found",
        errorMessage: "QR code not found",
      });

      expect(checkIn).toBeDefined();
      expect(checkIn?.result).toBe("not_found");
    });

    it("should calculate check-in statistics", async () => {
      // Record multiple check-ins
      await recordAttendeeCheckIn({
        sessionId,
        eventId: "test-event-checkin",
        passCode: "QR-STAT-001",
        result: "success",
      });
      await recordAttendeeCheckIn({
        sessionId,
        eventId: "test-event-checkin",
        passCode: "QR-STAT-002",
        result: "success",
      });
      await recordAttendeeCheckIn({
        sessionId,
        eventId: "test-event-checkin",
        passCode: "QR-STAT-003",
        result: "duplicate",
      });

      const stats = await getCheckInStats(sessionId);
      expect(stats).toBeDefined();
      expect(stats?.totalScanned).toBe(3);
      expect(stats?.successCount).toBe(2);
      expect(stats?.duplicateCount).toBe(1);
      expect(stats?.successRate).toBeGreaterThan(60);
    });
  });
});

describe("Round 56 — Advanced Reporting", () => {
  describe("Report Configurations", () => {
    it("should create a report configuration", async () => {
      const config = await createReportConfig({
        eventId: "test-event-report",
        name: "Weekly Sentiment Report",
        description: "Track sentiment trends weekly",
        metrics: ["sentiment", "transcription"],
        dateRangeType: "last_7_days",
        exportFormats: ["pdf", "csv"],
        scheduleFrequency: "weekly",
        scheduleTime: "09:00",
        recipientEmails: ["admin@example.com"],
        isActive: true,
        createdBy: 1,
      });

      expect(config).toBeDefined();
      expect(config?.name).toBe("Weekly Sentiment Report");
      expect(config?.isActive).toBe(true);
    });

    it("should retrieve a report configuration by ID", async () => {
      const created = await createReportConfig({
        eventId: "test-event-report-2",
        name: "Daily Analytics",
        metrics: ["sentiment", "qa", "attendees"],
        dateRangeType: "last_7_days",
        exportFormats: ["pdf"],
        scheduleFrequency: "daily",
        scheduleTime: "08:00",
        isActive: true,
        createdBy: 1,
      });

      if (!created) throw new Error("Failed to create config");

      const retrieved = await getReportConfigById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Daily Analytics");
      expect(retrieved?.scheduleFrequency).toBe("daily");
    });

    it("should list report configurations for an event", async () => {
      const eventId = "test-event-list-configs";

      // Create multiple configs
      await createReportConfig({
        eventId,
        name: "Config 1",
        metrics: ["sentiment"],
        dateRangeType: "last_7_days",
        exportFormats: ["pdf"],
        scheduleFrequency: "once",
        isActive: true,
        createdBy: 1,
      });

      await createReportConfig({
        eventId,
        name: "Config 2",
        metrics: ["qa"],
        dateRangeType: "last_30_days",
        exportFormats: ["csv"],
        scheduleFrequency: "weekly",
        isActive: true,
        createdBy: 1,
      });

      const configs = await getReportConfigsByEvent(eventId);
      expect(configs.length).toBeGreaterThanOrEqual(2);
      expect(configs.some((c) => c.name === "Config 1")).toBe(true);
      expect(configs.some((c) => c.name === "Config 2")).toBe(true);
    });
  });

  describe("Generated Reports", () => {
    it("should create a generated report", async () => {
      const report = await createGeneratedReport({
        configId: 1,
        eventId: "test-event-gen-report",
        reportType: "custom",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-08"),
        reportData: {
          sentiment: {
            averageScore: 7.5,
            totalAnalyzed: 100,
            emotionBreakdown: {
              joy: 45,
              sadness: 10,
              anger: 5,
              fear: 2,
              surprise: 30,
              disgust: 8,
            },
          },
        },
      });

      expect(report).toBeDefined();
      expect(report?.reportType).toBe("custom");
      expect(report?.eventId).toBe("test-event-gen-report");
    });

    it("should retrieve a generated report by ID", async () => {
      const created = await createGeneratedReport({
        configId: 1,
        eventId: "test-event-gen-report-2",
        reportType: "sentiment",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-08"),
        reportData: { sentiment: { averageScore: 8.0 } },
      });

      if (!created) throw new Error("Failed to create report");

      const retrieved = await getGeneratedReportById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.reportType).toBe("sentiment");
    });

    it("should handle report data with multiple metrics", async () => {
      const reportData = {
        sentiment: {
          averageScore: 7.8,
          totalAnalyzed: 150,
          emotionBreakdown: {
            joy: 60,
            sadness: 15,
            anger: 8,
            fear: 3,
            surprise: 50,
            disgust: 14,
          },
        },
        transcription: {
          totalSummaries: 5,
          summaries: [
            {
              id: 1,
              summary: "Key discussion points...",
              keyPoints: ["Point 1", "Point 2"],
              actionItems: ["Action 1"],
            },
          ],
        },
      };

      const report = await createGeneratedReport({
        configId: 1,
        eventId: "test-event-multi-metric",
        reportType: "comprehensive",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-08"),
        reportData,
      });

      expect(report).toBeDefined();
      expect(report?.reportData).toEqual(reportData);
    });
  });
});

describe("Round 56 — Data Integrity", () => {
  it("should maintain referential integrity for check-in sessions", async () => {
    const session = await startCheckInSession({
      eventId: "integrity-test-event",
      kioskId: "integrity-kiosk",
      status: "active",
      totalScanned: 0,
      successfulScans: 0,
      failedScans: 0,
    });

    expect(session).toBeDefined();
    expect(session?.eventId).toBe("integrity-test-event");
    expect(session?.kioskId).toBe("integrity-kiosk");
  });

  it("should validate report configuration metrics", async () => {
    const config = await createReportConfig({
      eventId: "validation-test",
      name: "Validation Test",
      metrics: ["sentiment", "qa", "attendees"],
      dateRangeType: "custom",
      customStartDate: new Date("2026-03-01"),
      customEndDate: new Date("2026-03-31"),
      exportFormats: ["pdf", "csv", "json"],
      scheduleFrequency: "monthly",
      isActive: true,
      createdBy: 1,
    });

    expect(config).toBeDefined();
    expect(Array.isArray(config?.metrics)).toBe(true);
    expect(config?.metrics).toContain("sentiment");
  });
});

describe("Round 56 — Error Handling", () => {
  it("should handle missing session gracefully", async () => {
    const session = await getCheckInSessionById(999999);
    expect(session).toBeNull();
  });

  it("should handle missing report config gracefully", async () => {
    const config = await getReportConfigById(999999);
    expect(config).toBeNull();
  });

  it("should handle missing generated report gracefully", async () => {
    const report = await getGeneratedReportById(999999);
    expect(report).toBeNull();
  });
});
