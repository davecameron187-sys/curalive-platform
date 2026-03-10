import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { detectViolation, createViolationAlert, acknowledgeViolation } from "../_core/compliance";
import {
  isDuplicate,
  cacheViolation,
  generateViolationHash,
  getCacheStats,
  clearEventCache,
} from "../_core/aiAmDeduplication";
import {
  filterViolations,
  sortViolations,
  getSeverityStats,
  getViolationTypeStats,
  getHighPriorityViolations,
  generateViolationReport,
} from "../_core/aiAmFiltering";

describe("AI Automated Moderator (AI-AM) - Week 3-4 Tests", () => {
  describe("Violation Detection", () => {
    it("should detect forward-looking statements", async () => {
      const result = await detectViolation(
        "We expect earnings to grow 50% next quarter"
      );

      expect(result).toBeTruthy();
      if (result) {
        expect(result.violationType).toBe("forward_looking");
        expect(result.severity).toMatch(/low|medium|high|critical/);
        expect(result.confidenceScore).toBeGreaterThan(0);
        expect(result.confidenceScore).toBeLessThanOrEqual(1);
      }
    });

    it("should detect price-sensitive information", async () => {
      const result = await detectViolation(
        "Our major acquisition will close next month, significantly impacting revenue"
      );

      expect(result).toBeTruthy();
      if (result) {
        expect(["price_sensitive", "insider_info"]).toContain(result.violationType);
      }
    });

    it("should detect abuse and profanity", async () => {
      const result = await detectViolation(
        "This is completely unacceptable and you're all idiots"
      );

      expect(result).toBeTruthy();
      if (result) {
        expect(["abuse", "profanity", "harassment"]).toContain(result.violationType);
      }
    });

    it("should return null for clean content", async () => {
      const result = await detectViolation(
        "Thank you for joining today's earnings call. Let's discuss our Q4 results."
      );

      expect(result).toBeNull();
    });

    it("should handle speaker context", async () => {
      const result = await detectViolation(
        "We're planning to announce a major partnership",
        "John Smith",
        "CEO"
      );

      // Should consider speaker role in detection
      expect(result).toBeTruthy();
    });
  });

  describe("Alert Deduplication", () => {
    const eventId = "test-event-123";

    beforeEach(() => {
      clearEventCache(eventId);
    });

    it("should generate consistent hash for same content", () => {
      const hash1 = generateViolationHash("Speaker A", "abuse", "Bad content");
      const hash2 = generateViolationHash("Speaker A", "abuse", "Bad content");

      expect(hash1).toBe(hash2);
    });

    it("should generate different hash for different content", () => {
      const hash1 = generateViolationHash("Speaker A", "abuse", "Bad content");
      const hash2 = generateViolationHash("Speaker B", "abuse", "Bad content");

      expect(hash1).not.toBe(hash2);
    });

    it("should detect duplicate violations within time window", () => {
      const speakerName = "Speaker A";
      const violationType = "abuse";
      const transcript = "This is offensive content";

      // First violation - not a duplicate
      expect(isDuplicate(eventId, speakerName, violationType, transcript)).toBe(false);

      // Cache it
      cacheViolation(eventId, 1, speakerName, violationType, transcript);

      // Second violation - should be duplicate
      expect(isDuplicate(eventId, speakerName, violationType, transcript)).toBe(true);
    });

    it("should not detect duplicate after time window expires", async () => {
      vi.useFakeTimers();

      const speakerName = "Speaker A";
      const violationType = "abuse";
      const transcript = "This is offensive content";

      // First violation
      expect(isDuplicate("event-1", speakerName, violationType, transcript)).toBe(false);
      cacheViolation("event-1", 1, speakerName, violationType, transcript);

      // Advance time beyond dedup window (30 seconds)
      vi.advanceTimersByTime(31000);

      // Should not be duplicate anymore
      expect(isDuplicate("event-1", speakerName, violationType, transcript)).toBe(false);

      vi.useRealTimers();
    });

    it("should track cache statistics", () => {
      cacheViolation(eventId, 1, "Speaker A", "abuse", "Content 1");
      cacheViolation(eventId, 2, "Speaker B", "forward_looking", "Content 2");

      const stats = getCacheStats();

      expect(stats.totalEvents).toBe(1);
      expect(stats.totalCachedViolations).toBe(2);
      expect(stats.eventCacheSizes[eventId]).toBe(2);
    });
  });

  describe("Alert Filtering", () => {
    const mockViolations = [
      {
        id: 1,
        eventId: "event-1",
        conferenceId: "conf-1",
        violationType: "abuse",
        severity: "critical",
        confidenceScore: 0.95,
        speakerName: "Speaker A",
        speakerRole: "CEO",
        transcriptExcerpt: "Offensive content",
        startTimeMs: 1000,
        endTimeMs: 2000,
        detectedAt: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        notes: null,
        actionTaken: "none",
        createdAt: new Date(),
      },
      {
        id: 2,
        eventId: "event-1",
        conferenceId: "conf-1",
        violationType: "forward_looking",
        severity: "high",
        confidenceScore: 0.85,
        speakerName: "Speaker B",
        speakerRole: "CFO",
        transcriptExcerpt: "We expect 50% growth",
        startTimeMs: 3000,
        endTimeMs: 4000,
        detectedAt: new Date(),
        acknowledged: true,
        acknowledgedBy: 1,
        acknowledgedAt: new Date(),
        notes: "Noted",
        actionTaken: "none",
        createdAt: new Date(),
      },
      {
        id: 3,
        eventId: "event-1",
        conferenceId: "conf-1",
        violationType: "price_sensitive",
        severity: "medium",
        confidenceScore: 0.65,
        speakerName: "Speaker C",
        speakerRole: "Analyst",
        transcriptExcerpt: "Acquisition details",
        startTimeMs: 5000,
        endTimeMs: 6000,
        detectedAt: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        notes: null,
        actionTaken: "none",
        createdAt: new Date(),
      },
    ] as any;

    it("should filter by severity", () => {
      const filtered = filterViolations(mockViolations, {
        severity: ["critical", "high"],
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((v) => ["critical", "high"].includes(v.severity))).toBe(true);
    });

    it("should filter by violation type", () => {
      const filtered = filterViolations(mockViolations, {
        violationType: ["abuse", "forward_looking"],
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((v) => ["abuse", "forward_looking"].includes(v.violationType))).toBe(
        true
      );
    });

    it("should filter by acknowledgment status", () => {
      const filtered = filterViolations(mockViolations, {
        acknowledged: false,
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((v) => !v.acknowledged)).toBe(true);
    });

    it("should filter by confidence score range", () => {
      const filtered = filterViolations(mockViolations, {
        confidenceScoreMin: 0.8,
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((v) => v.confidenceScore >= 0.8)).toBe(true);
    });

    it("should search by text", () => {
      const filtered = filterViolations(mockViolations, {
        searchText: "Speaker A",
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].speakerName).toBe("Speaker A");
    });

    it("should sort by severity", () => {
      const sorted = sortViolations(mockViolations, {
        sortBy: "severity",
        order: "desc",
      });

      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("high");
      expect(sorted[2].severity).toBe("medium");
    });

    it("should sort by confidence score", () => {
      const sorted = sortViolations(mockViolations, {
        sortBy: "confidence",
        order: "asc",
      });

      expect(sorted[0].confidenceScore).toBeLessThanOrEqual(sorted[1].confidenceScore);
      expect(sorted[1].confidenceScore).toBeLessThanOrEqual(sorted[2].confidenceScore);
    });
  });

  describe("Alert Statistics", () => {
    const mockViolations = [
      {
        severity: "critical",
        violationType: "abuse",
        speakerRole: "CEO",
        acknowledged: false,
        confidenceScore: 0.95,
      },
      {
        severity: "high",
        violationType: "forward_looking",
        speakerRole: "CFO",
        acknowledged: true,
        confidenceScore: 0.85,
      },
      {
        severity: "medium",
        violationType: "abuse",
        speakerRole: "CEO",
        acknowledged: false,
        confidenceScore: 0.65,
      },
    ] as any;

    it("should calculate severity statistics", () => {
      const stats = getSeverityStats(mockViolations);

      expect(stats.critical).toBe(1);
      expect(stats.high).toBe(1);
      expect(stats.medium).toBe(1);
      expect(stats.low).toBe(0);
    });

    it("should calculate violation type statistics", () => {
      const stats = getViolationTypeStats(mockViolations);

      expect(stats.abuse).toBe(2);
      expect(stats.forward_looking).toBe(1);
    });

    it("should identify high-priority violations", () => {
      const highPriority = getHighPriorityViolations(mockViolations);

      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].severity).toBe("critical");
      expect(highPriority[0].acknowledged).toBe(false);
    });

    it("should generate comprehensive report", () => {
      const report = generateViolationReport(mockViolations);

      expect(report.summary.totalViolations).toBe(3);
      expect(report.summary.unacknowledged).toBe(2);
      expect(report.severityStats.critical).toBe(1);
      expect(report.typeStats.abuse).toBe(2);
      expect(report.highPriority).toHaveLength(1);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete violation workflow", async () => {
      // 1. Detect violation
      const violation = await detectViolation("This is offensive content", "Speaker A", "CEO");
      expect(violation).toBeTruthy();

      if (!violation) return;

      // 2. Check for duplicates
      const isDup = isDuplicate("event-1", "Speaker A", violation.violationType, "This is offensive content");
      expect(isDup).toBe(false);

      // 3. Cache violation
      cacheViolation("event-1", 1, "Speaker A", violation.violationType, "This is offensive content");

      // 4. Verify duplicate detection
      const isDupAfter = isDuplicate("event-1", "Speaker A", violation.violationType, "This is offensive content");
      expect(isDupAfter).toBe(true);

      // 5. Verify filtering works
      const mockViolations = [
        {
          id: 1,
          severity: violation.severity,
          violationType: violation.violationType,
          acknowledged: false,
          confidenceScore: violation.confidenceScore,
        },
      ] as any;

      const filtered = filterViolations(mockViolations, {
        severity: [violation.severity],
      });

      expect(filtered).toHaveLength(1);
    });
  });
});
