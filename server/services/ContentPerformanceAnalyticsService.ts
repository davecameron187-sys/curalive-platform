// @ts-nocheck
import { getDb } from "../db";
import {
  contentPerformanceMetrics,
  contentTypePerformance,
  eventPerformanceSummary,
  contentEngagementEvents,
  aiGeneratedContent,
} from "../../drizzle/schema";
import { eq, and, desc, avg, count, sum } from "drizzle-orm";

export interface ContentMetrics {
  contentId: number;
  contentType: string;
  approvalRate: number;
  engagementScore: number;
  openRate: number;
  clickThroughRate: number;
  responseRate: number;
  qualityScore?: number;
}

export interface ContentTypeAnalytics {
  contentType: string;
  totalGenerated: number;
  approvalRate: number;
  avgOpenRate: number;
  avgClickThroughRate: number;
  avgResponseRate: number;
  avgQualityScore: number;
  performanceRank: number;
  trendDirection: "improving" | "stable" | "declining";
}

export interface EventAnalytics {
  eventId: number;
  contentItemsGenerated: number;
  contentItemsApproved: number;
  overallApprovalRate: number;
  totalEngagements: number;
  avgEngagementRate: number;
  bestPerformingType: string;
  worstPerformingType: string;
  avgContentQuality: number;
}

export class ContentPerformanceAnalyticsService {
  /**
   * Record content engagement event (sent, opened, clicked, etc)
   */
  static async recordEngagementEvent(
    contentId: number,
    recipientEmail: string,
    eventType: "sent" | "opened" | "clicked" | "responded" | "bounced" | "unsubscribed",
    eventData?: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(contentEngagementEvents).values({
      contentId,
      recipientEmail,
      eventType,
      eventData: eventData || null,
      timestamp: new Date(),
    });

    // Update content performance metrics
    await this.updateContentMetrics(contentId);
  }

  /**
   * Update metrics for a specific content item
   */
  static async updateContentMetrics(contentId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get content details
    const [content] = await db
      .select()
      .from(aiGeneratedContent)
      .where(eq(aiGeneratedContent.id, contentId))
      .limit(1);

    if (!content) return;

    // Get engagement events for this content
    const events = await db
      .select()
      .from(contentEngagementEvents)
      .where(eq(contentEngagementEvents.contentId, contentId));

    // Calculate metrics
    const sentCount = events.filter((e) => e.eventType === "sent").length;
    const openCount = events.filter((e) => e.eventType === "opened").length;
    const clickCount = events.filter((e) => e.eventType === "clicked").length;
    const responseCount = events.filter((e) => e.eventType === "responded").length;

    const openRate = sentCount > 0 ? openCount / sentCount : 0;
    const clickThroughRate = openCount > 0 ? clickCount / openCount : 0;
    const responseRate = sentCount > 0 ? responseCount / sentCount : 0;

    // Calculate engagement score (weighted average)
    const engagementScore =
      openRate * 0.4 + clickThroughRate * 0.35 + responseRate * 0.25;

    // Calculate approval score
    let approvalScore = 0;
    if (content.approvedAt && content.generatedAt) {
      const approvalTime =
        new Date(content.approvedAt).getTime() -
        new Date(content.generatedAt).getTime();
      // Score: 1.0 if approved within 5 minutes, decreases over time
      approvalScore = Math.max(0, 1 - approvalTime / (1000 * 60 * 30)); // 30 min = 0 score
    }

    // Upsert metrics
    const existingMetrics = await db
      .select()
      .from(contentPerformanceMetrics)
      .where(eq(contentPerformanceMetrics.contentId, contentId))
      .limit(1);

    if (existingMetrics.length > 0) {
      await db
        .update(contentPerformanceMetrics)
        .set({
          sentCount,
          openCount,
          clickCount,
          responseCount,
          openRate: openRate.toString(),
          clickThroughRate: clickThroughRate.toString(),
          responseRate: responseRate.toString(),
          engagementScore: engagementScore.toString(),
          approvalScore: approvalScore.toString(),
          updatedAt: new Date(),
        })
        .where(eq(contentPerformanceMetrics.contentId, contentId));
    } else {
      await db.insert(contentPerformanceMetrics).values({
        contentId,
        eventId: content.eventId,
        contentType: content.contentType,
        approvalStatus: content.status === "sent" ? "approved" : "pending",
        sentCount,
        openCount,
        clickCount,
        responseCount,
        openRate: openRate.toString(),
        clickThroughRate: clickThroughRate.toString(),
        responseRate: responseRate.toString(),
        engagementScore: engagementScore.toString(),
        approvalScore: approvalScore.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Get metrics for a specific content item
   */
  static async getContentMetrics(contentId: number): Promise<ContentMetrics | null> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [metrics] = await db
      .select()
      .from(contentPerformanceMetrics)
      .where(eq(contentPerformanceMetrics.contentId, contentId))
      .limit(1);

    if (!metrics) return null;

    return {
      contentId: metrics.contentId,
      contentType: metrics.contentType,
      approvalRate: metrics.approvalStatus === "approved" ? 1 : 0,
      engagementScore: parseFloat(metrics.engagementScore?.toString() || "0"),
      openRate: parseFloat(metrics.openRate?.toString() || "0"),
      clickThroughRate: parseFloat(metrics.clickThroughRate?.toString() || "0"),
      responseRate: parseFloat(metrics.responseRate?.toString() || "0"),
      qualityScore: metrics.qualityScore
        ? parseFloat(metrics.qualityScore.toString())
        : undefined,
    };
  }

  /**
   * Get performance analytics for a content type
   */
  static async getContentTypePerformance(
    contentType: string
  ): Promise<ContentTypeAnalytics | null> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [performance] = await db
      .select()
      .from(contentTypePerformance)
      .where(eq(contentTypePerformance.contentType, contentType))
      .limit(1);

    if (!performance) return null;

    return {
      contentType: performance.contentType,
      totalGenerated: performance.totalGenerated || 0,
      approvalRate: parseFloat(performance.approvalRate?.toString() || "0"),
      avgOpenRate: parseFloat(performance.avgOpenRate?.toString() || "0"),
      avgClickThroughRate: parseFloat(
        performance.avgClickThroughRate?.toString() || "0"
      ),
      avgResponseRate: parseFloat(performance.avgResponseRate?.toString() || "0"),
      avgQualityScore: parseFloat(
        performance.avgQualityScore?.toString() || "0"
      ),
      performanceRank: performance.performanceRank || 0,
      trendDirection: (performance.trendDirection as any) || "stable",
    };
  }

  /**
   * Get all content type performance rankings
   */
  static async getAllContentTypePerformance(): Promise<ContentTypeAnalytics[]> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const performances = await db
      .select()
      .from(contentTypePerformance)
      .orderBy(desc(contentTypePerformance.performanceRank));

    return performances.map((p) => ({
      contentType: p.contentType,
      totalGenerated: p.totalGenerated || 0,
      approvalRate: parseFloat(p.approvalRate?.toString() || "0"),
      avgOpenRate: parseFloat(p.avgOpenRate?.toString() || "0"),
      avgClickThroughRate: parseFloat(
        p.avgClickThroughRate?.toString() || "0"
      ),
      avgResponseRate: parseFloat(p.avgResponseRate?.toString() || "0"),
      avgQualityScore: parseFloat(p.avgQualityScore?.toString() || "0"),
      performanceRank: p.performanceRank || 0,
      trendDirection: (p.trendDirection as any) || "stable",
    }));
  }

  /**
   * Get event performance summary
   */
  static async getEventAnalytics(eventId: number): Promise<EventAnalytics | null> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [summary] = await db
      .select()
      .from(eventPerformanceSummary)
      .where(eq(eventPerformanceSummary.eventId, eventId))
      .limit(1);

    if (!summary) return null;

    return {
      eventId: summary.eventId,
      contentItemsGenerated: summary.contentItemsGenerated || 0,
      contentItemsApproved: summary.contentItemsApproved || 0,
      overallApprovalRate: parseFloat(
        summary.overallApprovalRate?.toString() || "0"
      ),
      totalEngagements: summary.totalEngagements || 0,
      avgEngagementRate: parseFloat(
        summary.avgEngagementRate?.toString() || "0"
      ),
      bestPerformingType: summary.bestPerformingType || "unknown",
      worstPerformingType: summary.worstPerformingType || "unknown",
      avgContentQuality: parseFloat(
        summary.avgContentQuality?.toString() || "0"
      ),
    };
  }

  /**
   * Calculate and update event performance summary
   */
  static async calculateEventSummary(eventId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get all content for this event
    const contentItems = await db
      .select()
      .from(aiGeneratedContent)
      .where(eq(aiGeneratedContent.eventId, eventId));

    // Get metrics for all content
    const metrics = await db
      .select()
      .from(contentPerformanceMetrics)
      .where(eq(contentPerformanceMetrics.eventId, eventId));

    // Calculate aggregates
    const totalGenerated = contentItems.length;
    const totalApproved = contentItems.filter(
      (c) => c.status === "approved" || c.status === "sent"
    ).length;
    const totalRejected = contentItems.filter(
      (c) => c.status === "rejected"
    ).length;
    const overallApprovalRate =
      totalGenerated > 0 ? totalApproved / totalGenerated : 0;

    const totalEngagements = metrics.reduce(
      (sum, m) => sum + (m.openCount || 0) + (m.clickCount || 0) + (m.responseCount || 0),
      0
    );
    const avgEngagementRate =
      metrics.length > 0
        ? metrics.reduce(
            (sum, m) =>
              sum +
              parseFloat(m.engagementScore?.toString() || "0"),
            0
          ) / metrics.length
        : 0;

    // Find best and worst performing types
    const typePerformance: Record<string, number> = {};
    metrics.forEach((m) => {
      const score = parseFloat(m.engagementScore?.toString() || "0");
      if (!typePerformance[m.contentType]) {
        typePerformance[m.contentType] = score;
      } else {
        typePerformance[m.contentType] =
          (typePerformance[m.contentType] + score) / 2;
      }
    });

    const sortedTypes = Object.entries(typePerformance).sort(
      (a, b) => b[1] - a[1]
    );
    const bestPerformingType = sortedTypes[0]?.[0] || "unknown";
    const worstPerformingType = sortedTypes[sortedTypes.length - 1]?.[0] || "unknown";

    const avgContentQuality =
      metrics.length > 0
        ? metrics.reduce(
            (sum, m) =>
              sum +
              parseFloat(m.qualityScore?.toString() || "0"),
            0
          ) / metrics.length
        : 0;

    // Upsert summary
    const existing = await db
      .select()
      .from(eventPerformanceSummary)
      .where(eq(eventPerformanceSummary.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(eventPerformanceSummary)
        .set({
          contentItemsGenerated: totalGenerated,
          contentItemsApproved: totalApproved,
          contentItemsRejected: totalRejected,
          overallApprovalRate: overallApprovalRate.toString(),
          totalEngagements,
          avgEngagementRate: avgEngagementRate.toString(),
          bestPerformingType,
          worstPerformingType,
          avgContentQuality: avgContentQuality.toString(),
          updatedAt: new Date(),
        })
        .where(eq(eventPerformanceSummary.eventId, eventId));
    } else {
      await db.insert(eventPerformanceSummary).values({
        eventId,
        contentItemsGenerated: totalGenerated,
        contentItemsApproved: totalApproved,
        contentItemsRejected: totalRejected,
        overallApprovalRate: overallApprovalRate.toString(),
        totalEngagements,
        avgEngagementRate: avgEngagementRate.toString(),
        bestPerformingType,
        worstPerformingType,
        avgContentQuality: avgContentQuality.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Generate performance report for an event
   */
  static async generateEventReport(eventId: number): Promise<{
    eventId: number;
    summary: EventAnalytics | null;
    contentTypePerformance: ContentTypeAnalytics[];
    topPerformingContent: ContentMetrics[];
    improvementAreas: string[];
  }> {
    const summary = await this.getEventAnalytics(eventId);
    const contentTypePerformance = await this.getAllContentTypePerformance();

    // Get top performing content
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const topContent = await db
      .select()
      .from(contentPerformanceMetrics)
      .where(eq(contentPerformanceMetrics.eventId, eventId))
      .orderBy(desc(contentPerformanceMetrics.engagementScore))
      .limit(5);

    const topPerformingContent = topContent.map((m) => ({
      contentId: m.contentId,
      contentType: m.contentType,
      approvalRate: m.approvalStatus === "approved" ? 1 : 0,
      engagementScore: parseFloat(m.engagementScore?.toString() || "0"),
      openRate: parseFloat(m.openRate?.toString() || "0"),
      clickThroughRate: parseFloat(m.clickThroughRate?.toString() || "0"),
      responseRate: parseFloat(m.responseRate?.toString() || "0"),
    }));

    // Identify improvement areas
    const improvementAreas: string[] = [];
    if (summary && summary.overallApprovalRate < 0.7) {
      improvementAreas.push(
        "Low approval rate - consider improving content generation quality"
      );
    }
    if (summary && summary.avgEngagementRate < 0.3) {
      improvementAreas.push(
        "Low engagement - consider more targeted content distribution"
      );
    }
    const lowPerformers = contentTypePerformance.filter(
      (c) => c.avgOpenRate < 0.2
    );
    if (lowPerformers.length > 0) {
      improvementAreas.push(
        `Low open rates for: ${lowPerformers.map((c) => c.contentType).join(", ")}`
      );
    }

    return {
      eventId,
      summary,
      contentTypePerformance,
      topPerformingContent,
      improvementAreas,
    };
  }
}
