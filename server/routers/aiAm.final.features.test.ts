import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { notificationDispatcher } from "@/server/_core/aiAmNotificationDispatch";
import { autoMutingThresholds } from "@/server/_core/aiAmAutoMutingThresholds";
import { db } from "@/server/db";
import { complianceViolations, alertPreferences } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

describe("AI Automated Moderator - Final Features", () => {
  const testEventId = "test-event-final";
  const testOperatorId = "test-operator-final";

  beforeEach(async () => {
    // Clean up test data
    await db.delete(alertPreferences).where(eq(alertPreferences.operatorId, testOperatorId));
    await db.delete(complianceViolations).where(eq(complianceViolations.eventId, testEventId));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(alertPreferences).where(eq(alertPreferences.operatorId, testOperatorId));
    await db.delete(complianceViolations).where(eq(complianceViolations.eventId, testEventId));
  });

  describe("Notification Dispatch", () => {
    it("should dispatch email notification when enabled", async () => {
      // Set up operator preferences
      await db.insert(alertPreferences).values({
        operatorId: testOperatorId,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
        emailAddress: "test@example.com",
        phoneNumber: null,
        criticalOnly: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "UTC",
        monitoredViolationTypes: JSON.stringify(["abuse", "harassment"]),
      });

      const payload = {
        eventId: testEventId,
        operatorId: testOperatorId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high" as const,
        speaker: "Speaker1",
        transcript: "Test violation",
        timestamp: Date.now(),
      };

      const results = await notificationDispatcher.dispatchNotification(payload);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.channel === "email")).toBe(true);
    });

    it("should respect quiet hours", async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const quietStart = (currentHour + 1) % 24;
      const quietEnd = (currentHour + 2) % 24;

      await db.insert(alertPreferences).values({
        operatorId: testOperatorId,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        inAppNotificationsEnabled: false,
        emailAddress: "test@example.com",
        phoneNumber: null,
        criticalOnly: false,
        quietHoursEnabled: true,
        quietHoursStart: `${quietStart.toString().padStart(2, "0")}:00`,
        quietHoursEnd: `${quietEnd.toString().padStart(2, "0")}:00`,
        timezone: "UTC",
        monitoredViolationTypes: JSON.stringify(["abuse"]),
      });

      const payload = {
        eventId: testEventId,
        operatorId: testOperatorId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high" as const,
        speaker: "Speaker1",
        transcript: "Test violation",
        timestamp: Date.now(),
      };

      const results = await notificationDispatcher.dispatchNotification(payload);

      // Should not send during quiet hours
      expect(results.length).toBe(0);
    });

    it("should filter by violation type", async () => {
      await db.insert(alertPreferences).values({
        operatorId: testOperatorId,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        inAppNotificationsEnabled: false,
        emailAddress: "test@example.com",
        phoneNumber: null,
        criticalOnly: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "UTC",
        monitoredViolationTypes: JSON.stringify(["abuse"]), // Only monitor abuse
      });

      const payload = {
        eventId: testEventId,
        operatorId: testOperatorId,
        violationId: "v1",
        violationType: "price_sensitive", // Different type
        severity: "high" as const,
        speaker: "Speaker1",
        transcript: "Test violation",
        timestamp: Date.now(),
      };

      const results = await notificationDispatcher.dispatchNotification(payload);

      // Should not send for unmonitored violation type
      expect(results.length).toBe(0);
    });

    it("should send test notification", async () => {
      await db.insert(alertPreferences).values({
        operatorId: testOperatorId,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        inAppNotificationsEnabled: false,
        emailAddress: "test@example.com",
        phoneNumber: null,
        criticalOnly: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "UTC",
        monitoredViolationTypes: JSON.stringify([]),
      });

      const result = await notificationDispatcher.sendTestNotification(testOperatorId, "email");

      expect(result.channel).toBe("email");
      // Result will depend on Resend API availability
    });

    it("should get notification history", async () => {
      const payload = {
        eventId: testEventId,
        operatorId: testOperatorId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high" as const,
        speaker: "Speaker1",
        transcript: "Test violation",
        timestamp: Date.now(),
      };

      // Dispatch notification
      await notificationDispatcher.dispatchNotification(payload);

      // Get history
      const history = await notificationDispatcher.getNotificationHistory(testOperatorId, testEventId);

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Automatic Muting Thresholds", () => {
    it("should initialize muting thresholds", async () => {
      const thresholds = await autoMutingThresholds.initializeMutingThresholds(testEventId, {
        violationThreshold: 2,
      });

      expect(thresholds.eventId).toBe(testEventId);
      expect(thresholds.violationThreshold).toBe(2);
      expect(thresholds.enabled).toBe(true);
    });

    it("should apply soft mute", async () => {
      const mute = await autoMutingThresholds.applySoftMute(testEventId, "Speaker1", "speaker-1", 30);

      expect(mute.muteType).toBe("soft");
      expect(mute.muteDuration).toBe(30);
      expect(mute.speaker).toBe("Speaker1");
    });

    it("should apply hard mute", async () => {
      const mute = await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 60, testOperatorId);

      expect(mute.muteType).toBe("hard");
      expect(mute.muteDuration).toBe(60);
      expect(mute.operatorId).toBe(testOperatorId);
    });

    it("should get mute status", async () => {
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 60);

      const status = autoMutingThresholds.getMuteStatus(testEventId, "speaker-1");

      expect(status).not.toBeNull();
      expect(status?.muteType).toBe("hard");
    });

    it("should unmute speaker", async () => {
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 60);

      const unmuted = await autoMutingThresholds.unmuteSpeaker(testEventId, "speaker-1", testOperatorId);

      expect(unmuted).toBe(true);

      const status = autoMutingThresholds.getMuteStatus(testEventId, "speaker-1");
      expect(status).toBeNull();
    });

    it("should calculate mute time remaining", async () => {
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 60);

      const remaining = autoMutingThresholds.getMuteTimeRemaining(testEventId, "speaker-1");

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60000); // 60 seconds in ms
    });

    it("should get active mutes for event", async () => {
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 60);
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker2", "speaker-2", 60);

      const activeMutes = autoMutingThresholds.getActiveMutesForEvent(testEventId);

      expect(activeMutes.length).toBe(2);
    });

    it("should validate muting configuration", () => {
      const validConfig = {
        violationThreshold: 3,
        timeWindow: 300,
        muteDuration: 30,
        violationTypes: ["abuse"],
      };

      const result = autoMutingThresholds.validateConfiguration(validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject invalid configuration", () => {
      const invalidConfig = {
        violationThreshold: 0, // Invalid
        timeWindow: 30, // Too short
        muteDuration: 5, // Too short
        violationTypes: [], // Empty
      };

      const result = autoMutingThresholds.validateConfiguration(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reset muting for event", async () => {
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 60);
      await autoMutingThresholds.applyHardMute(testEventId, "Speaker2", "speaker-2", 60);

      autoMutingThresholds.resetMutingForEvent(testEventId);

      const activeMutes = autoMutingThresholds.getActiveMutesForEvent(testEventId);

      expect(activeMutes.length).toBe(0);
    });

    it("should get muting statistics", async () => {
      // Create test violations
      const now = new Date();
      await db.insert(complianceViolations).values({
        eventId: testEventId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high",
        confidence: 0.95,
        speaker: "Speaker1",
        transcript: "Test",
        detectedAt: now,
        acknowledgedAt: null,
      });

      await db.insert(complianceViolations).values({
        eventId: testEventId,
        violationId: "v2",
        violationType: "abuse",
        severity: "high",
        confidence: 0.95,
        speaker: "Speaker1",
        transcript: "Test",
        detectedAt: now,
        acknowledgedAt: null,
      });

      const stats = await autoMutingThresholds.getMutingStatistics(testEventId);

      expect(stats.totalViolations).toBe(2);
      expect(stats.speakerStats.length).toBeGreaterThan(0);
    });

    it("should get muting history for speaker", async () => {
      const now = new Date();
      await db.insert(complianceViolations).values({
        eventId: testEventId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high",
        confidence: 0.95,
        speaker: "Speaker1",
        transcript: "Test",
        detectedAt: now,
        acknowledgedAt: null,
      });

      const history = await autoMutingThresholds.getMutingHistory(testEventId, "Speaker1");

      expect(history.speaker).toBe("Speaker1");
      expect(history.totalViolations).toBe(1);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete notification and muting workflow", async () => {
      // Set up preferences
      await db.insert(alertPreferences).values({
        operatorId: testOperatorId,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
        emailAddress: "test@example.com",
        phoneNumber: null,
        criticalOnly: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "UTC",
        monitoredViolationTypes: JSON.stringify(["abuse"]),
      });

      // Create violation
      const now = new Date();
      await db.insert(complianceViolations).values({
        eventId: testEventId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high",
        confidence: 0.95,
        speaker: "Speaker1",
        transcript: "Test violation",
        detectedAt: now,
        acknowledgedAt: null,
      });

      // Dispatch notification
      const payload = {
        eventId: testEventId,
        operatorId: testOperatorId,
        violationId: "v1",
        violationType: "abuse",
        severity: "high" as const,
        speaker: "Speaker1",
        transcript: "Test violation",
        timestamp: Date.now(),
      };

      const notificationResults = await notificationDispatcher.dispatchNotification(payload);
      expect(notificationResults.length).toBeGreaterThan(0);

      // Apply mute
      const mute = await autoMutingThresholds.applyHardMute(testEventId, "Speaker1", "speaker-1", 30, testOperatorId);
      expect(mute.muteType).toBe("hard");

      // Verify mute is active
      const status = autoMutingThresholds.getMuteStatus(testEventId, "speaker-1");
      expect(status).not.toBeNull();

      // Unmute
      await autoMutingThresholds.unmuteSpeaker(testEventId, "speaker-1", testOperatorId);

      // Verify unmute
      const finalStatus = autoMutingThresholds.getMuteStatus(testEventId, "speaker-1");
      expect(finalStatus).toBeNull();
    });
  });
});
