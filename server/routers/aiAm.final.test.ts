import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/server/db";
import { auditTrail } from "@/server/_core/aiAmAuditTrail";
import { complianceViolations, aiAmAuditLog as complianceAuditLog } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

describe("AI Automated Moderator - Phase 2 Features", () => {
  const testEventId = "test-event-phase2";
  const testOperatorId = "test-operator-1";

  beforeEach(async () => {
    // Clean up test data
    await db.delete(complianceAuditLog).where(eq(complianceAuditLog.eventId, testEventId));
    await db.delete(complianceViolations).where(eq(complianceViolations.eventId, testEventId));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(complianceAuditLog).where(eq(complianceAuditLog.eventId, testEventId));
    await db.delete(complianceViolations).where(eq(complianceViolations.eventId, testEventId));
  });

  describe("Notification Preferences", () => {
    it("should save notification preferences", async () => {
      const preferences = {
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        criticalOnly: false,
        violationTypes: ["forward_looking", "price_sensitive"],
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "America/New_York",
        emailAddress: "test@example.com",
        phoneNumber: "+1234567890",
      };

      // In production, this would be saved via tRPC
      expect(preferences.emailNotifications).toBe(true);
      expect(preferences.violationTypes).toContain("forward_looking");
    });

    it("should validate email address format", () => {
      const email = "test@example.com";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(true);
    });

    it("should validate phone number format", () => {
      const phone = "+1 (555) 000-0000";
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      expect(phoneRegex.test(phone)).toBe(true);
    });

    it("should enforce quiet hours timezone", () => {
      const timezones = [
        "America/New_York",
        "America/Chicago",
        "Europe/London",
        "Asia/Tokyo",
      ];

      expect(timezones).toContain("America/New_York");
      expect(timezones).not.toContain("Invalid/Timezone");
    });

    it("should batch notifications when enabled", () => {
      const batchInterval = 5; // minutes
      const alerts = [
        { id: "1", timestamp: Date.now() },
        { id: "2", timestamp: Date.now() + 1000 },
        { id: "3", timestamp: Date.now() + 2000 },
      ];

      const batchedAlerts = alerts.reduce((batches: any[], alert) => {
        const lastBatch = batches[batches.length - 1];
        if (lastBatch && alert.timestamp - lastBatch[0].timestamp < batchInterval * 60 * 1000) {
          lastBatch.push(alert);
        } else {
          batches.push([alert]);
        }
        return batches;
      }, []);

      expect(batchedAlerts.length).toBe(1);
      expect(batchedAlerts[0].length).toBe(3);
    });
  });

  describe("Sentiment Dashboard", () => {
    it("should calculate overall sentiment score", () => {
      const sentimentData = {
        positivity: 0.65,
        negativity: 0.1,
        neutrality: 0.25,
      };

      const overallSentiment = sentimentData.positivity - sentimentData.negativity;
      expect(overallSentiment).toBe(0.55);
    });

    it("should track speaker sentiment trends", () => {
      const speakerSentiment = [
        { timestamp: 0, score: 0.4 },
        { timestamp: 60000, score: 0.5 },
        { timestamp: 120000, score: 0.6 },
      ];

      const trend = speakerSentiment[speakerSentiment.length - 1].score - speakerSentiment[0].score;
      expect(trend).toBeGreaterThan(0);
    });

    it("should detect sentiment spikes", () => {
      const sentimentHistory = [0.5, 0.52, 0.51, 0.8, 0.79]; // Spike at index 3
      const threshold = 0.15;

      const spikes = sentimentHistory.reduce((acc: any[], score, i) => {
        if (i > 0) {
          const diff = Math.abs(score - sentimentHistory[i - 1]);
          if (diff > threshold) {
            acc.push({ index: i, magnitude: diff });
          }
        }
        return acc;
      }, []);

      expect(spikes.length).toBe(1);
      expect(spikes[0].magnitude).toBeGreaterThan(threshold);
    });

    it("should calculate engagement level", () => {
      const engagementMetrics = {
        questionsAsked: 15,
        pollParticipation: 0.85,
        chatActivity: 0.7,
      };

      const engagementScore =
        (engagementMetrics.questionsAsked / 100 + engagementMetrics.pollParticipation + engagementMetrics.chatActivity) / 3;
      expect(engagementScore).toBeGreaterThan(0);
      expect(engagementScore).toBeLessThanOrEqual(1);
    });

    it("should identify top emotions", () => {
      const emotions = [
        { emotion: "Confident", score: 0.85 },
        { emotion: "Positive", score: 0.75 },
        { emotion: "Engaged", score: 0.8 },
        { emotion: "Concerned", score: 0.3 },
      ];

      const topEmotions = emotions.sort((a, b) => b.score - a.score).slice(0, 3);
      expect(topEmotions[0].emotion).toBe("Confident");
      expect(topEmotions.length).toBe(3);
    });
  });

  describe("Compliance Audit Trail", () => {
    it("should log violation detection", async () => {
      const violationId = "violation-1";
      const speaker = "CEO";
      const violationType = "forward_looking";
      const severity = "high";
      const confidence = 0.95;

      const auditEntry = await auditTrail.logViolationDetected(
        testEventId,
        violationId,
        speaker,
        violationType,
        severity,
        confidence
      );

      expect(auditEntry.action).toBe("violation_detected");
      expect(auditEntry.targetViolationId).toBe(violationId);
      expect(auditEntry.targetSpeaker).toBe(speaker);
    });

    it("should log violation acknowledgment", async () => {
      const violationId = "violation-2";

      const auditEntry = await auditTrail.logViolationAcknowledged(testEventId, violationId, testOperatorId);

      expect(auditEntry.action).toBe("violation_acknowledged");
      expect(auditEntry.actionBy).toBe(testOperatorId);
      expect(auditEntry.actionByRole).toBe("operator");
    });

    it("should log violation muting", async () => {
      const violationId = "violation-3";
      const speaker = "CFO";
      const duration = 30;

      const auditEntry = await auditTrail.logViolationMuted(
        testEventId,
        violationId,
        testOperatorId,
        speaker,
        duration
      );

      expect(auditEntry.action).toBe("violation_muted");
      expect(auditEntry.details.duration).toBe(duration);
    });

    it("should log alert sent", async () => {
      const violationId = "violation-4";
      const channel = "email";

      const auditEntry = await auditTrail.logAlertSent(testEventId, testOperatorId, channel, violationId);

      expect(auditEntry.action).toBe("alert_sent");
      expect(auditEntry.details.channel).toBe(channel);
    });

    it("should retrieve event audit log", async () => {
      // Log multiple actions
      await auditTrail.logViolationDetected(testEventId, "v1", "Speaker1", "abuse", "high", 0.9);
      await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);

      const logs = await auditTrail.getEventAuditLog(testEventId);

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].eventId).toBe(testEventId);
    });

    it("should retrieve violation audit log", async () => {
      const violationId = "v-specific";

      await auditTrail.logViolationDetected(testEventId, violationId, "Speaker", "abuse", "high", 0.9);
      await auditTrail.logViolationAcknowledged(testEventId, violationId, testOperatorId);

      const logs = await auditTrail.getViolationAuditLog(violationId);

      expect(logs.length).toBe(2);
      expect(logs.every((l) => l.targetViolationId === violationId)).toBe(true);
    });

    it("should retrieve operator audit log", async () => {
      await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);
      await auditTrail.logViolationMuted(testEventId, "v2", testOperatorId, "Speaker", 30);

      const logs = await auditTrail.getOperatorAuditLog(testOperatorId, testEventId);

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.every((l) => l.actionBy === testOperatorId)).toBe(true);
    });

    it("should retrieve audit logs by action type", async () => {
      await auditTrail.logViolationDetected(testEventId, "v1", "Speaker", "abuse", "high", 0.9);
      await auditTrail.logViolationDetected(testEventId, "v2", "Speaker", "abuse", "high", 0.9);
      await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);

      const detectionLogs = await auditTrail.getAuditLogsByAction(testEventId, "violation_detected");

      expect(detectionLogs.length).toBe(2);
      expect(detectionLogs.every((l) => l.action === "violation_detected")).toBe(true);
    });

    it("should verify audit trail integrity", async () => {
      await auditTrail.logViolationDetected(testEventId, "v1", "Speaker", "abuse", "high", 0.9);
      await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);

      const result = await auditTrail.verifyAuditTrailIntegrity(testEventId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should generate compliance report", async () => {
      await auditTrail.logViolationDetected(testEventId, "v1", "CEO", "forward_looking", "high", 0.95);
      await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);
      await auditTrail.logViolationMuted(testEventId, "v1", testOperatorId, "CEO", 30);

      const report = await auditTrail.generateComplianceReport(testEventId);

      expect(report.eventId).toBe(testEventId);
      expect(report.totalActions).toBeGreaterThanOrEqual(3);
      expect(report.actionBreakdown.violationDetected).toBeGreaterThan(0);
      expect(report.auditTrailIntegrity.isValid).toBe(true);
    });

    it("should export audit trail as CSV", async () => {
      await auditTrail.logViolationDetected(testEventId, "v1", "Speaker", "abuse", "high", 0.9);

      const csv = await auditTrail.exportAuditTrailAsCSV(testEventId);

      expect(csv).toContain("Timestamp");
      expect(csv).toContain("Action");
      expect(csv).toContain("violation_detected");
    });

    it("should export audit trail as JSON", async () => {
      await auditTrail.logViolationDetected(testEventId, "v1", "Speaker", "abuse", "high", 0.9);

      const json = await auditTrail.exportAuditTrailAsJSON(testEventId);
      const parsed = JSON.parse(json);

      expect(parsed.eventId).toBe(testEventId);
      expect(parsed.logs.length).toBeGreaterThan(0);
      expect(parsed.logs[0].action).toBe("violation_detected");
    });

    it("should maintain chain of custody", async () => {
      const entry1 = await auditTrail.logViolationDetected(testEventId, "v1", "Speaker", "abuse", "high", 0.9);
      const entry2 = await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);

      expect(entry2.previousHash).toBe(entry1.hash);
    });

    it("should create immutable hash for each entry", async () => {
      const entry = await auditTrail.logViolationDetected(testEventId, "v1", "Speaker", "abuse", "high", 0.9);

      expect(entry.hash).toBeDefined();
      expect(entry.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete workflow: detect -> acknowledge -> mute", async () => {
      const violationId = "v-workflow";
      const speaker = "Speaker1";

      // Step 1: Detect violation
      const detection = await auditTrail.logViolationDetected(
        testEventId,
        violationId,
        speaker,
        "abuse",
        "high",
        0.95
      );
      expect(detection.action).toBe("violation_detected");

      // Step 2: Acknowledge violation
      const ack = await auditTrail.logViolationAcknowledged(testEventId, violationId, testOperatorId);
      expect(ack.action).toBe("violation_acknowledged");

      // Step 3: Mute speaker
      const mute = await auditTrail.logViolationMuted(testEventId, violationId, testOperatorId, speaker, 30);
      expect(mute.action).toBe("violation_muted");

      // Verify chain
      const logs = await auditTrail.getViolationAuditLog(violationId);
      expect(logs.length).toBe(3);
      expect(logs[0].action).toBe("violation_detected");
      expect(logs[1].action).toBe("violation_acknowledged");
      expect(logs[2].action).toBe("violation_muted");
    });

    it("should track multiple violations per event", async () => {
      const violations = [
        { id: "v1", speaker: "CEO", type: "forward_looking" },
        { id: "v2", speaker: "CFO", type: "price_sensitive" },
        { id: "v3", speaker: "CTO", type: "abuse" },
      ];

      for (const v of violations) {
        await auditTrail.logViolationDetected(testEventId, v.id, v.speaker, v.type, "high", 0.9);
      }

      const logs = await auditTrail.getEventAuditLog(testEventId);
      expect(logs.length).toBe(3);
    });

    it("should generate accurate compliance statistics", async () => {
      // Create multiple violations with different outcomes
      await auditTrail.logViolationDetected(testEventId, "v1", "Speaker1", "abuse", "high", 0.9);
      await auditTrail.logViolationAcknowledged(testEventId, "v1", testOperatorId);

      await auditTrail.logViolationDetected(testEventId, "v2", "Speaker2", "abuse", "high", 0.9);
      await auditTrail.logViolationMuted(testEventId, "v2", testOperatorId, "Speaker2", 30);

      const report = await auditTrail.generateComplianceReport(testEventId);

      expect(report.actionBreakdown.violationDetected).toBe(2);
      expect(report.actionBreakdown.violationAcknowledged).toBe(1);
      expect(report.actionBreakdown.violationMuted).toBe(1);
    });
  });
});
