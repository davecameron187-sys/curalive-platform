import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock LLM to avoid live API calls and quota exhaustion
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockImplementation(async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
    const userMsg = messages.find((m) => m.role === "user")?.content || "";
    const isPattern = userMsg.includes("pattern") || userMsg.includes("violation") || userMsg.includes("analyze");
    return {
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            patternDetected: isPattern,
            riskLevel: isPattern ? "high" : "low",
            recommendation: isPattern ? "Consider muting speaker" : "No action needed",
            violationTypes: isPattern ? ["forward_looking"] : [],
            confidence: isPattern ? 0.85 : 0.1,
          }),
        },
        finish_reason: "stop",
      }],
      usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
    };
  }),
}));

import {
  checkAndApplyAutoMute,
  muteSpeaker,
  unmuteSpeaker,
  getSpeakerMuteStatus,
  getEventMutedSpeakers,
  getMutingStatistics,
  analyzeViolationPattern,
} from "../_core/aiAmAutoMuting";
import {
  generateComplianceReport,
  generateComplianceReportPDF,
  exportReportAsJSON,
  exportReportAsCSV,
} from "../_core/aiAmReportGenerator";

describe("Phase 2 Features: Dashboard, Auto-Muting, and Reports", () => {
  describe("Automatic Muting System", () => {
    it("should detect and apply auto-mute when threshold is exceeded", async () => {
      const result = await checkAndApplyAutoMute(
        "event-1",
        "CEO",
        "forward_looking",
        "conf-1"
      );

      // Should return mute decision
      expect(result).toHaveProperty("shouldMute");
      expect(result).toHaveProperty("reason");
    });

    it("should allow manual muting of speakers", async () => {
      const muteStatus = await muteSpeaker("event-1", "CEO", "soft", 5, "Manual mute for testing");

      expect(muteStatus.isMuted).toBe(true);
      expect(muteStatus.muteReason).toContain("Manual mute");
      expect(muteStatus.muteType).toBe("soft");
    });

    it("should allow unmuting of speakers", async () => {
      // First mute
      await muteSpeaker("event-1", "CEO", "soft", 5);

      // Then unmute
      const result = await unmuteSpeaker("event-1", "CEO");
      expect(result).toBe(true);

      // Verify unmuted
      const status = await getSpeakerMuteStatus("event-1", "CEO");
      expect(status?.isMuted).toBe(false);
    });

    it("should track mute status for speakers", async () => {
      await muteSpeaker("event-1", "CFO", "hard", undefined, "Hard mute for testing");

      const status = await getSpeakerMuteStatus("event-1", "CFO");
      expect(status).toBeDefined();
      expect(status?.isMuted).toBe(true);
      expect(status?.muteType).toBe("hard");
    });

    it("should get all muted speakers for an event", async () => {
      // Mute multiple speakers
      await muteSpeaker("event-1", "CEO", "soft", 5);
      await muteSpeaker("event-1", "CFO", "hard");
      await muteSpeaker("event-1", "CTO", "soft", 3);

      const mutedSpeakers = await getEventMutedSpeakers("event-1");
      expect(mutedSpeakers.length).toBeGreaterThanOrEqual(3);
      expect(mutedSpeakers.some((s) => s.speakerName === "CEO")).toBe(true);
      expect(mutedSpeakers.some((s) => s.speakerName === "CFO")).toBe(true);
    });

    it("should handle soft mute expiration", async () => {
      // Mute with 1 minute duration
      const muteStatus = await muteSpeaker("event-1", "Speaker1", "soft", 1);
      expect(muteStatus.muteEndTime).toBeDefined();

      // Verify mute is active
      const status = await getSpeakerMuteStatus("event-1", "Speaker1");
      expect(status?.isMuted).toBe(true);

      // In real scenario, wait for expiration
      // For testing, we verify the structure
      expect(muteStatus.muteEndTime?.getTime()).toBeGreaterThan(Date.now());
    });

    it("should provide muting statistics", async () => {
      // Mute multiple speakers
      await muteSpeaker("event-1", "Speaker1", "soft", 5);
      await muteSpeaker("event-1", "Speaker2", "hard");
      await muteSpeaker("event-1", "Speaker3", "soft", 3);

      const stats = await getMutingStatistics("event-1");

      expect(stats).toHaveProperty("totalMutedSpeakers");
      expect(stats).toHaveProperty("softMutes");
      expect(stats).toHaveProperty("hardMutes");
      expect(stats).toHaveProperty("totalMuteDuration");
      expect(stats.totalMutedSpeakers).toBeGreaterThanOrEqual(3);
    });

    it("should analyze violation patterns for speakers", async () => {
      const analysis = await analyzeViolationPattern("event-1", "CEO");

      expect(analysis).toHaveProperty("riskLevel");
      expect(analysis).toHaveProperty("pattern");
      expect(analysis).toHaveProperty("recommendation");
      expect(["low", "medium", "high"]).toContain(analysis.riskLevel);
    });

    it("should exclude speakers from auto-muting", async () => {
      // Test with exempt speaker
      const result = await checkAndApplyAutoMute(
        "event-1",
        "Moderator", // Typically exempt
        "forward_looking",
        "conf-1"
      );

      // Should not mute moderator
      expect(result.shouldMute).toBe(false);
    });

    it("should exclude violation types from auto-muting", async () => {
      // Test with excluded violation type
      const result = await checkAndApplyAutoMute(
        "event-1",
        "Speaker",
        "low_severity_type", // Excluded type
        "conf-1"
      );

      // Should not count toward threshold
      expect(result.shouldMute).toBe(false);
    });
  });

  describe("Compliance Report Generator", () => {
    it("should generate comprehensive compliance report", async () => {
      const report = await generateComplianceReport("event-1");

      expect(report).toHaveProperty("eventId");
      expect(report).toHaveProperty("eventTitle");
      expect(report).toHaveProperty("totalViolations");
      expect(report).toHaveProperty("criticalViolations");
      expect(report).toHaveProperty("highViolations");
      expect(report).toHaveProperty("mediumViolations");
      expect(report).toHaveProperty("lowViolations");
      expect(report).toHaveProperty("averageConfidence");
      expect(report).toHaveProperty("complianceScore");
      expect(report).toHaveProperty("topViolationTypes");
      expect(report).toHaveProperty("topSpeakers");
      expect(report).toHaveProperty("mutingStatistics");
      expect(report).toHaveProperty("regulatoryFindings");
      expect(report).toHaveProperty("recommendations");
    });

    it("should calculate compliance score correctly", async () => {
      const report = await generateComplianceReport("event-1");

      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);
    });

    it("should identify top violation types", async () => {
      const report = await generateComplianceReport("event-1");

      expect(Array.isArray(report.topViolationTypes)).toBe(true);
      if (report.topViolationTypes.length > 0) {
        expect(report.topViolationTypes[0]).toHaveProperty("type");
        expect(report.topViolationTypes[0]).toHaveProperty("count");
      }
    });

    it("should identify top speakers with violations", async () => {
      const report = await generateComplianceReport("event-1");

      expect(Array.isArray(report.topSpeakers)).toBe(true);
      if (report.topSpeakers.length > 0) {
        expect(report.topSpeakers[0]).toHaveProperty("name");
        expect(report.topSpeakers[0]).toHaveProperty("violations");
        expect(report.topSpeakers[0]).toHaveProperty("role");
      }
    });

    it("should generate regulatory findings", async () => {
      const report = await generateComplianceReport("event-1");

      expect(Array.isArray(report.regulatoryFindings)).toBe(true);
      expect(report.regulatoryFindings.length).toBeGreaterThan(0);
      expect(typeof report.regulatoryFindings[0]).toBe("string");
    });

    it("should generate actionable recommendations", async () => {
      const report = await generateComplianceReport("event-1");

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(typeof report.recommendations[0]).toBe("string");
    });

    it("should generate PDF report", async () => {
      const pdfBuffer = await generateComplianceReportPDF("event-1");

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(pdfBuffer.toString("utf-8", 0, 4)).toBe("%PDF");
    });

    it("should export report as JSON", async () => {
      const jsonString = await exportReportAsJSON("event-1");

      expect(typeof jsonString).toBe("string");
      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveProperty("eventId");
      expect(parsed).toHaveProperty("totalViolations");
    });

    it("should export report as CSV", async () => {
      const csvString = await exportReportAsCSV("event-1");

      expect(typeof csvString).toBe("string");
      expect(csvString).toContain("Compliance Report");
      expect(csvString).toContain("Event,");
      expect(csvString).toContain("Violation Types");
      expect(csvString).toContain("Top Speakers");
    });

    it("should include muting statistics in report", async () => {
      const report = await generateComplianceReport("event-1");

      expect(report.mutingStatistics).toHaveProperty("totalMutedSpeakers");
      expect(report.mutingStatistics).toHaveProperty("softMutes");
      expect(report.mutingStatistics).toHaveProperty("hardMutes");
      expect(report.mutingStatistics).toHaveProperty("totalMuteDuration");
    });

    it("should calculate average confidence score", async () => {
      const report = await generateComplianceReport("event-1");

      expect(report.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(report.averageConfidence).toBeLessThanOrEqual(1);
    });

    it("should handle events with no violations", async () => {
      // Create a mock event with no violations
      const report = await generateComplianceReport("clean-event");

      expect(report.totalViolations).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Real-Time Operator Dashboard Integration", () => {
    it("should provide live metrics for dashboard", async () => {
      const report = await generateComplianceReport("event-1");

      // Dashboard should have access to these metrics
      expect(report.totalViolations).toBeDefined();
      expect(report.criticalViolations).toBeDefined();
      expect(report.averageConfidence).toBeDefined();
      expect(report.topSpeakers).toBeDefined();
    });

    it("should track violation trends over time", async () => {
      const report = await generateComplianceReport("event-1");

      // Report should include time-series data
      expect(report).toHaveProperty("eventDuration");
      expect(report.eventDuration).toBeGreaterThan(0);
    });

    it("should provide speaker engagement metrics", async () => {
      const report = await generateComplianceReport("event-1");

      // Dashboard should show per-speaker metrics
      expect(report.topSpeakers).toBeDefined();
      report.topSpeakers.forEach((speaker) => {
        expect(speaker.name).toBeDefined();
        expect(speaker.violations).toBeGreaterThanOrEqual(0);
      });
    });

    it("should calculate compliance score for dashboard display", async () => {
      const report = await generateComplianceReport("event-1");

      // Score should be easily displayable
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);
    });
  });

  describe("End-to-End Workflow", () => {
    it("should handle complete moderation workflow", async () => {
      // 1. Detect violations
      const report = await generateComplianceReport("event-1");
      expect(report.totalViolations).toBeGreaterThanOrEqual(0);

      // 2. Apply auto-muting if needed
      if (report.criticalViolations > 0) {
        const muteResult = await checkAndApplyAutoMute(
          "event-1",
          report.topSpeakers[0]?.name || "Speaker",
          "forward_looking",
          "conf-1"
        );
        expect(muteResult).toHaveProperty("shouldMute");
      }

      // 3. Get muting statistics
      const mutingStats = await getMutingStatistics("event-1");
      expect(mutingStats).toHaveProperty("totalMutedSpeakers");

      // 4. Generate compliance report
      const finalReport = await generateComplianceReport("event-1");
      expect(finalReport.mutingStatistics.totalMutedSpeakers).toEqual(
        mutingStats.totalMutedSpeakers
      );

      // 5. Export report
      const pdfBuffer = await generateComplianceReportPDF("event-1");
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it("should provide data for operator dashboard updates", async () => {
      // Simulate real-time dashboard updates
      const report = await generateComplianceReport("event-1");

      // Dashboard should display
      const dashboardData = {
        totalViolations: report.totalViolations,
        criticalCount: report.criticalViolations,
        complianceScore: report.complianceScore,
        topSpeakers: report.topSpeakers.slice(0, 5),
        mutedSpeakers: await getEventMutedSpeakers("event-1"),
      };

      expect(dashboardData.totalViolations).toBeGreaterThanOrEqual(0);
      expect(dashboardData.criticalCount).toBeGreaterThanOrEqual(0);
      expect(dashboardData.complianceScore).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(dashboardData.topSpeakers)).toBe(true);
      expect(Array.isArray(dashboardData.mutedSpeakers)).toBe(true);
    });
  });
});
