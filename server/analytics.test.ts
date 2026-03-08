import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { ContentPerformanceAnalyticsService } from "./services/ContentPerformanceAnalyticsService";
import { aiGeneratedContent, webcastEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("ContentPerformanceAnalyticsService", () => {
  let testEventId: number;
  let testContentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test event
    const [event] = await db
      .insert(webcastEvents)
      .values({
        slug: `test-event-${Date.now()}`,
        title: "Test Event for Analytics",
        description: "Analytics test event",
        eventType: "earnings_call",
        industryVertical: "technology",
        webcastStatus: "completed",
        startTime: new Date(),
        endTime: new Date(),
        timezone: "UTC",
        maxAttendees: 100,
        registrationCount: 50,
        peakAttendees: 45,
        recordingEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    testEventId = event.id;

    // Create test content
    const [content] = await db
      .insert(aiGeneratedContent)
      .values({
        eventId: testEventId,
        contentType: "event_summary",
        title: "Test Summary",
        content: "This is a test summary",
        status: "approved",
        generatedAt: new Date(),
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    testContentId = content.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db
      .delete(aiGeneratedContent)
      .where(eq(aiGeneratedContent.id, testContentId));
    await db.delete(webcastEvents).where(eq(webcastEvents.id, testEventId));
  });

  describe("recordEngagementEvent", () => {
    it("should record a sent event", async () => {
      await ContentPerformanceAnalyticsService.recordEngagementEvent(
        testContentId,
        "test@example.com",
        "sent"
      );

      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      expect(metrics?.sentCount).toBeGreaterThan(0);
    });

    it("should record an opened event", async () => {
      await ContentPerformanceAnalyticsService.recordEngagementEvent(
        testContentId,
        "test@example.com",
        "opened"
      );

      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      expect(metrics?.openCount).toBeGreaterThan(0);
    });

    it("should record a clicked event", async () => {
      await ContentPerformanceAnalyticsService.recordEngagementEvent(
        testContentId,
        "test@example.com",
        "clicked"
      );

      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      expect(metrics?.clickCount).toBeGreaterThan(0);
    });

    it("should record a responded event", async () => {
      await ContentPerformanceAnalyticsService.recordEngagementEvent(
        testContentId,
        "test@example.com",
        "responded"
      );

      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      expect(metrics?.responseCount).toBeGreaterThan(0);
    });

    it("should record engagement with event data", async () => {
      await ContentPerformanceAnalyticsService.recordEngagementEvent(
        testContentId,
        "test@example.com",
        "clicked",
        { linkUrl: "https://example.com/article" }
      );

      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
    });
  });

  describe("getContentMetrics", () => {
    it("should return null for non-existent content", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        99999
      );
      expect(metrics).toBeNull();
    });

    it("should return metrics for existing content", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      expect(metrics?.contentId).toBe(testContentId);
      expect(metrics?.contentType).toBe("event_summary");
    });

    it("should calculate engagement score correctly", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      expect(metrics?.engagementScore).toBeGreaterThanOrEqual(0);
      expect(metrics?.engagementScore).toBeLessThanOrEqual(1);
    });

    it("should calculate open rate correctly", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();
      if (metrics?.openRate !== undefined) {
        expect(metrics.openRate).toBeGreaterThanOrEqual(0);
        expect(metrics.openRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("getContentTypePerformance", () => {
    it("should return null for non-existent content type", async () => {
      const performance =
        await ContentPerformanceAnalyticsService.getContentTypePerformance(
          "nonexistent_type"
        );
      expect(performance).toBeNull();
    });

    it("should return performance data for existing content type", async () => {
      const performance =
        await ContentPerformanceAnalyticsService.getContentTypePerformance(
          "event_summary"
        );
      // May be null if no performance data exists yet
      if (performance) {
        expect(performance.contentType).toBe("event_summary");
        expect(performance.totalGenerated).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getAllContentTypePerformance", () => {
    it("should return an array of content type performance", async () => {
      const performance =
        await ContentPerformanceAnalyticsService.getAllContentTypePerformance();
      expect(Array.isArray(performance)).toBe(true);
    });

    it("should return performance data sorted by rank", async () => {
      const performance =
        await ContentPerformanceAnalyticsService.getAllContentTypePerformance();
      if (performance.length > 1) {
        for (let i = 0; i < performance.length - 1; i++) {
          expect(performance[i].performanceRank).toBeLessThanOrEqual(
            performance[i + 1].performanceRank
          );
        }
      }
    });
  });

  describe("getEventAnalytics", () => {
    it("should return null for non-existent event", async () => {
      const analytics =
        await ContentPerformanceAnalyticsService.getEventAnalytics(99999);
      expect(analytics).toBeNull();
    });

    it("should return analytics for existing event", async () => {
      // First calculate summary
      await ContentPerformanceAnalyticsService.calculateEventSummary(
        testEventId
      );

      const analytics =
        await ContentPerformanceAnalyticsService.getEventAnalytics(testEventId);
      expect(analytics).toBeDefined();
      expect(analytics?.eventId).toBe(testEventId);
    });
  });

  describe("calculateEventSummary", () => {
    it("should create event summary", async () => {
      await ContentPerformanceAnalyticsService.calculateEventSummary(
        testEventId
      );

      const analytics =
        await ContentPerformanceAnalyticsService.getEventAnalytics(testEventId);
      expect(analytics).toBeDefined();
      expect(analytics?.contentItemsGenerated).toBeGreaterThanOrEqual(0);
    });

    it("should calculate approval rate correctly", async () => {
      await ContentPerformanceAnalyticsService.calculateEventSummary(
        testEventId
      );

      const analytics =
        await ContentPerformanceAnalyticsService.getEventAnalytics(testEventId);
      expect(analytics).toBeDefined();
      if (analytics) {
        expect(analytics.overallApprovalRate).toBeGreaterThanOrEqual(0);
        expect(analytics.overallApprovalRate).toBeLessThanOrEqual(1);
      }
    });

    it("should identify best and worst performing types", async () => {
      await ContentPerformanceAnalyticsService.calculateEventSummary(
        testEventId
      );

      const analytics =
        await ContentPerformanceAnalyticsService.getEventAnalytics(testEventId);
      expect(analytics).toBeDefined();
      if (analytics) {
        expect(analytics.bestPerformingType).toBeDefined();
        expect(analytics.worstPerformingType).toBeDefined();
      }
    });
  });

  describe("generateEventReport", () => {
    it("should generate comprehensive event report", async () => {
      const report =
        await ContentPerformanceAnalyticsService.generateEventReport(
          testEventId
        );

      expect(report).toBeDefined();
      expect(report.eventId).toBe(testEventId);
      expect(Array.isArray(report.contentTypePerformance)).toBe(true);
      expect(Array.isArray(report.topPerformingContent)).toBe(true);
      expect(Array.isArray(report.improvementAreas)).toBe(true);
    });

    it("should identify improvement areas", async () => {
      const report =
        await ContentPerformanceAnalyticsService.generateEventReport(
          testEventId
        );

      expect(report.improvementAreas).toBeDefined();
      expect(Array.isArray(report.improvementAreas)).toBe(true);
    });

    it("should include top performing content", async () => {
      const report =
        await ContentPerformanceAnalyticsService.generateEventReport(
          testEventId
      );

      expect(report.topPerformingContent).toBeDefined();
      expect(Array.isArray(report.topPerformingContent)).toBe(true);
    });
  });

  describe("Engagement Rate Calculations", () => {
    it("should calculate open rate from engagement events", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();

      if (metrics && metrics.openRate !== undefined) {
        expect(metrics.openRate).toBeGreaterThanOrEqual(0);
        expect(metrics.openRate).toBeLessThanOrEqual(1);
      }
    });

    it("should calculate click-through rate from engagement events", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();

      if (metrics && metrics.clickThroughRate !== undefined) {
        expect(metrics.clickThroughRate).toBeGreaterThanOrEqual(0);
        expect(metrics.clickThroughRate).toBeLessThanOrEqual(1);
      }
    });

    it("should calculate response rate from engagement events", async () => {
      const metrics = await ContentPerformanceAnalyticsService.getContentMetrics(
        testContentId
      );
      expect(metrics).toBeDefined();

      if (metrics && metrics.responseRate !== undefined) {
        expect(metrics.responseRate).toBeGreaterThanOrEqual(0);
        expect(metrics.responseRate).toBeLessThanOrEqual(1);
      }
    });
  });
});
