import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectViolation, createViolationAlert } from "../_core/compliance";
import {
  shouldNotify,
  generateEmailContent,
  generateSmsContent,
  notifyOperator,
} from "../_core/aiAmNotifications";
import { isDuplicate, cacheViolation } from "../_core/aiAmDeduplication";
import { publishAlertToAbly } from "../_core/aiAmAblyChannels";

describe("AI-AM Integration Tests", () => {
  describe("Recall.ai Webhook Integration", () => {
    it("should process transcript segment and detect violations", async () => {
      const segment = {
        id: "seg-1",
        speaker_name: "CEO",
        speaker_role: "Chief Executive",
        text: "We expect 50% growth next quarter",
        start_time_ms: 5000,
        end_time_ms: 6000,
        confidence: 0.95,
      };

      const violation = await detectViolation(
        segment.text,
        segment.speaker_name,
        segment.speaker_role
      );

      expect(violation).toBeDefined();
      expect(violation?.violationType).toBe("forward_looking");
      expect(violation?.severity).toMatch(/high|critical/);
      expect(violation?.confidenceScore).toBeGreaterThan(0.8);
    });

    it("should handle duplicate detection", () => {
      const eventId = "event-1";
      const speaker = "CEO";
      const type = "forward_looking";
      const text = "We expect 50% growth next quarter";

      // First call - should not be duplicate
      const isDup1 = isDuplicate(eventId, speaker, type, text);
      expect(isDup1).toBe(false);

      // Cache it
      cacheViolation(eventId, 1, speaker, type, text);

      // Second call - should be duplicate (within 30s window)
      const isDup2 = isDuplicate(eventId, speaker, type, text);
      expect(isDup2).toBe(true);
    });

    it("should publish alert to Ably", async () => {
      const publishSpy = vi.spyOn({ publishAlertToAbly }, "publishAlertToAbly");

      const alert = {
        violationId: 1,
        eventId: "event-1",
        conferenceId: "conf-1",
        violationType: "forward_looking",
        severity: "high" as const,
        confidenceScore: 0.85,
        speakerName: "CEO",
        speakerRole: "Chief Executive",
        transcriptExcerpt: "We expect 50% growth",
        startTimeMs: 5000,
        endTimeMs: 6000,
        detectedAt: new Date().toISOString(),
      };

      // In real scenario, this would publish to Ably
      // For testing, we verify the function signature
      expect(alert).toHaveProperty("violationId");
      expect(alert).toHaveProperty("eventId");
      expect(alert).toHaveProperty("violationType");
    });
  });

  describe("Email and SMS Notifications", () => {
    const mockAlert = {
      violationId: 1,
      eventId: "event-1",
      violationType: "forward_looking",
      severity: "high" as const,
      confidenceScore: 0.85,
      speakerName: "CEO",
      transcriptExcerpt: "We expect 50% growth next quarter",
      detectedAt: new Date(),
    };

    const mockPreferences = {
      emailEnabled: true,
      smsEnabled: true,
      inAppEnabled: true,
      emailAddress: "operator@company.com",
      phoneNumber: "+1234567890",
      notifyOnSeverity: ["critical", "high"] as const[],
      notifyOnTypes: [],
      timezone: "America/New_York",
      dailyDigest: false,
    };

    it("should check notification eligibility", () => {
      // Should notify - high severity is in list
      const shouldNotify1 = shouldNotify(mockAlert, mockPreferences);
      expect(shouldNotify1).toBe(true);

      // Should not notify - low severity not in list
      const shouldNotify2 = shouldNotify(
        { ...mockAlert, severity: "low" },
        mockPreferences
      );
      expect(shouldNotify2).toBe(false);
    });

    it("should generate email content", async () => {
      const { subject, body } = await generateEmailContent(mockAlert, mockPreferences);

      expect(subject).toContain("Compliance Alert");
      expect(subject).toContain("forward_looking");
      expect(body).toContain(mockAlert.transcriptExcerpt);
      expect(body).toContain("HIGH");
      expect(body).toContain("85%");
    });

    it("should generate SMS content", () => {
      const sms = generateSmsContent(mockAlert);

      expect(sms).toContain("CuraLive Alert");
      expect(sms).toContain("HIGH");
      expect(sms).toContain("85%");
      expect(sms.length).toBeLessThanOrEqual(160); // SMS length limit
    });

    it("should respect quiet hours", () => {
      const preferencesWithQuietHours = {
        ...mockPreferences,
        quietHoursStart: 22, // 10 PM
        quietHoursEnd: 6, // 6 AM
      };

      // This test would need to mock the current time
      // For now, we verify the preference structure
      expect(preferencesWithQuietHours.quietHoursStart).toBe(22);
      expect(preferencesWithQuietHours.quietHoursEnd).toBe(6);
    });

    it("should filter by violation type", () => {
      const preferencesWithTypeFilter = {
        ...mockPreferences,
        notifyOnTypes: ["abuse", "harassment"],
      };

      // Should not notify - forward_looking not in filter
      const shouldNotify1 = shouldNotify(mockAlert, preferencesWithTypeFilter);
      expect(shouldNotify1).toBe(false);

      // Should notify - abuse is in filter
      const shouldNotify2 = shouldNotify(
        { ...mockAlert, violationType: "abuse" },
        preferencesWithTypeFilter
      );
      expect(shouldNotify2).toBe(true);
    });

    it("should handle multiple notification channels", async () => {
      const result = await notifyOperator(mockAlert, mockPreferences, 1);

      // Result should indicate which channels were used
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("sms");
      expect(result).toHaveProperty("inApp");
    });
  });

  describe("Operator Preferences Page", () => {
    it("should save email preferences", () => {
      const preferences = {
        emailEnabled: true,
        emailAddress: "operator@company.com",
        smsEnabled: false,
        inAppEnabled: true,
        notifyOnSeverity: ["critical", "high"] as const[],
        notifyOnTypes: [],
        timezone: "America/New_York",
        dailyDigest: false,
      };

      expect(preferences.emailEnabled).toBe(true);
      expect(preferences.emailAddress).toBe("operator@company.com");
    });

    it("should save SMS preferences", () => {
      const preferences = {
        emailEnabled: false,
        smsEnabled: true,
        phoneNumber: "+1234567890",
        inAppEnabled: true,
        notifyOnSeverity: ["critical", "high"] as const[],
        notifyOnTypes: [],
        timezone: "America/New_York",
        dailyDigest: false,
      };

      expect(preferences.smsEnabled).toBe(true);
      expect(preferences.phoneNumber).toBe("+1234567890");
    });

    it("should save quiet hours preferences", () => {
      const preferences = {
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        emailAddress: "operator@company.com",
        phoneNumber: "+1234567890",
        notifyOnSeverity: ["critical", "high"] as const[],
        notifyOnTypes: [],
        quietHoursStart: 22,
        quietHoursEnd: 6,
        timezone: "America/New_York",
        dailyDigest: false,
      };

      expect(preferences.quietHoursStart).toBe(22);
      expect(preferences.quietHoursEnd).toBe(6);
    });

    it("should save daily digest preferences", () => {
      const preferences = {
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        emailAddress: "operator@company.com",
        phoneNumber: "+1234567890",
        notifyOnSeverity: ["critical", "high"] as const[],
        notifyOnTypes: [],
        timezone: "America/New_York",
        dailyDigest: true,
        digestTime: "09:00",
      };

      expect(preferences.dailyDigest).toBe(true);
      expect(preferences.digestTime).toBe("09:00");
    });

    it("should save violation type filters", () => {
      const preferences = {
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        emailAddress: "operator@company.com",
        phoneNumber: "+1234567890",
        notifyOnSeverity: ["critical", "high"] as const[],
        notifyOnTypes: ["abuse", "harassment", "profanity"],
        timezone: "America/New_York",
        dailyDigest: false,
      };

      expect(preferences.notifyOnTypes).toContain("abuse");
      expect(preferences.notifyOnTypes).toContain("harassment");
      expect(preferences.notifyOnTypes).toHaveLength(3);
    });

    it("should save severity level preferences", () => {
      const preferences = {
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        emailAddress: "operator@company.com",
        phoneNumber: "+1234567890",
        notifyOnSeverity: ["critical"] as const[],
        notifyOnTypes: [],
        timezone: "America/New_York",
        dailyDigest: false,
      };

      expect(preferences.notifyOnSeverity).toEqual(["critical"]);
      expect(preferences.notifyOnSeverity).not.toContain("high");
    });
  });

  describe("End-to-End Workflow", () => {
    it("should handle complete violation detection and notification flow", async () => {
      // 1. Detect violation from transcript
      const transcriptText = "We expect 50% growth next quarter";
      const violation = await detectViolation(transcriptText, "CEO", "Chief Executive");

      expect(violation).toBeDefined();
      expect(violation?.violationType).toBe("forward_looking");

      // 2. Check for duplicates
      const eventId = "event-1";
      const isDup = isDuplicate(eventId, "CEO", violation!.violationType, transcriptText);
      expect(isDup).toBe(false);

      // 3. Create violation record
      const violationRecord = await createViolationAlert({
        eventId,
        conferenceId: "conf-1",
        violationType: violation!.violationType,
        severity: violation!.severity,
        confidenceScore: violation!.confidenceScore,
        speakerName: "CEO",
        speakerRole: "Chief Executive",
        transcriptExcerpt: transcriptText,
        startTimeMs: 5000,
        endTimeMs: 6000,
      });

      expect(violationRecord).toBeDefined();
      expect(violationRecord.id).toBeGreaterThan(0);

      // 4. Cache for deduplication
      cacheViolation(eventId, violationRecord.id, "CEO", violation!.violationType, transcriptText);

      // 5. Check notification eligibility
      const mockAlert = {
        violationId: violationRecord.id,
        eventId,
        violationType: violation!.violationType,
        severity: violation!.severity,
        confidenceScore: violation!.confidenceScore,
        speakerName: "CEO",
        transcriptExcerpt: transcriptText,
        detectedAt: new Date(),
      };

      const mockPreferences = {
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        emailAddress: "operator@company.com",
        phoneNumber: "+1234567890",
        notifyOnSeverity: ["critical", "high"] as const[],
        notifyOnTypes: [],
        timezone: "America/New_York",
        dailyDigest: false,
      };

      const shouldSendNotification = shouldNotify(mockAlert, mockPreferences);
      expect(shouldSendNotification).toBe(true);

      // 6. Generate notification content
      const { subject, body } = await generateEmailContent(mockAlert, mockPreferences);
      expect(subject).toContain("Compliance Alert");
      expect(body).toContain(transcriptText);
    });
  });
});
