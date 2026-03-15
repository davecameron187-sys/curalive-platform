// @ts-nocheck
import { db } from "@/server/db";
import { complianceViolations, webcastEvents } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { auditTrail } from "./aiAmAuditTrail";

export interface MutingThreshold {
  eventId: string;
  enabled: boolean;
  violationThreshold: number; // Number of violations before muting
  timeWindow: number; // Time window in seconds to count violations
  muteDuration: number; // Duration to mute in seconds
  violationTypes: string[]; // Which violation types trigger muting
  allowOperatorOverride: boolean;
  softMuteFirst: boolean; // Warn before hard mute
}

export interface MutingAction {
  speakerId: string;
  speaker: string;
  violationCount: number;
  lastViolationTime: number;
  muteStartTime: number;
  muteDuration: number;
  muteType: "soft" | "hard"; // soft = warning, hard = actual mute
  operatorId?: string; // If overridden by operator
}

class AutoMutingThresholdSystem {
  private activeMutes = new Map<string, MutingAction>(); // key: eventId:speakerId

  /**
   * Initialize muting thresholds for an event
   */
  async initializeMutingThresholds(eventId: string, thresholds: Partial<MutingThreshold>) {
    const defaults: MutingThreshold = {
      eventId,
      enabled: true,
      violationThreshold: 3, // Mute after 3 violations
      timeWindow: 300, // Within 5 minutes
      muteDuration: 30, // Mute for 30 seconds
      violationTypes: ["abuse", "harassment", "profanity"],
      allowOperatorOverride: true,
      softMuteFirst: true,
    };

    return { ...defaults, ...thresholds };
  }

  /**
   * Check if speaker should be muted based on violation history
   */
  async checkAndApplyMuting(
    eventId: string,
    speaker: string,
    speakerId: string,
    violationType: string,
    thresholds: MutingThreshold
  ): Promise<MutingAction | null> {
    // Check if muting is enabled
    if (!thresholds.enabled) {
      return null;
    }

    // Check if violation type triggers muting
    if (thresholds.violationTypes.length > 0 && !thresholds.violationTypes.includes(violationType)) {
      return null;
    }

    // Check if speaker is already muted
    const muteKey = `${eventId}:${speakerId}`;
    const existingMute = this.activeMutes.get(muteKey);

    if (existingMute) {
      const muteExpired = Date.now() - existingMute.muteStartTime > existingMute.muteDuration * 1000;
      if (!muteExpired) {
        return existingMute;
      } else {
        this.activeMutes.delete(muteKey);
      }
    }

    // Get recent violations for this speaker
    const recentViolations = await db
      .select()
      .from(complianceViolations)
      .where(
        and(
          eq(complianceViolations.eventId, eventId),
          eq(complianceViolations.speaker, speaker)
        )
      )
      .orderBy(desc(complianceViolations.detectedAt))
      .limit(10);

    // Count violations within time window
    const now = Date.now();
    const windowStart = now - thresholds.timeWindow * 1000;

    const violationsInWindow = recentViolations.filter((v) => v.detectedAt.getTime() >= windowStart);

    // Check if threshold is exceeded
    if (violationsInWindow.length >= thresholds.violationThreshold) {
      const muteAction: MutingAction = {
        speakerId,
        speaker,
        violationCount: violationsInWindow.length,
        lastViolationTime: now,
        muteStartTime: now,
        muteDuration: thresholds.muteDuration,
        muteType: thresholds.softMuteFirst ? "soft" : "hard",
      };

      // Store active mute
      this.activeMutes.set(muteKey, muteAction);

      // Log muting action
      await auditTrail.logViolationMuted(eventId, recentViolations[0].id, "system", speaker, thresholds.muteDuration);

      return muteAction;
    }

    return null;
  }

  /**
   * Apply soft mute (warning) to speaker
   */
  async applySoftMute(eventId: string, speaker: string, speakerId: string, duration: number): Promise<MutingAction> {
    const muteKey = `${eventId}:${speakerId}`;

    const muteAction: MutingAction = {
      speakerId,
      speaker,
      violationCount: 0,
      lastViolationTime: Date.now(),
      muteStartTime: Date.now(),
      muteDuration: duration,
      muteType: "soft",
    };

    this.activeMutes.set(muteKey, muteAction);

    return muteAction;
  }

  /**
   * Apply hard mute (actual mute) to speaker
   */
  async applyHardMute(
    eventId: string,
    speaker: string,
    speakerId: string,
    duration: number,
    operatorId?: string
  ): Promise<MutingAction> {
    const muteKey = `${eventId}:${speakerId}`;

    const muteAction: MutingAction = {
      speakerId,
      speaker,
      violationCount: 0,
      lastViolationTime: Date.now(),
      muteStartTime: Date.now(),
      muteDuration: duration,
      muteType: "hard",
      operatorId,
    };

    this.activeMutes.set(muteKey, muteAction);

    // Log hard mute
    if (operatorId) {
      await auditTrail.logAction({
        eventId,
        action: "violation_muted",
        actionBy: operatorId,
        actionByRole: "operator",
        targetSpeaker: speaker,
        details: {
          muteType: "hard",
          duration,
          reason: "operator_override",
        },
      });
    }

    return muteAction;
  }

  /**
   * Unmute speaker
   */
  async unmuteSpeaker(eventId: string, speakerId: string, operatorId?: string): Promise<boolean> {
    const muteKey = `${eventId}:${speakerId}`;
    const mute = this.activeMutes.get(muteKey);

    if (!mute) {
      return false;
    }

    this.activeMutes.delete(muteKey);

    // Log unmute
    if (operatorId) {
      await auditTrail.logAction({
        eventId,
        action: "violation_unmuted",
        actionBy: operatorId,
        actionByRole: "operator",
        targetSpeaker: mute.speaker,
        details: {
          previousMuteDuration: mute.muteDuration,
          reason: "operator_override",
        },
      });
    }

    return true;
  }

  /**
   * Get current mute status for speaker
   */
  getMuteStatus(eventId: string, speakerId: string): MutingAction | null {
    const muteKey = `${eventId}:${speakerId}`;
    const mute = this.activeMutes.get(muteKey);

    if (!mute) {
      return null;
    }

    // Check if mute has expired
    const muteExpired = Date.now() - mute.muteStartTime > mute.muteDuration * 1000;

    if (muteExpired) {
      this.activeMutes.delete(muteKey);
      return null;
    }

    return mute;
  }

  /**
   * Get time remaining on mute
   */
  getMuteTimeRemaining(eventId: string, speakerId: string): number {
    const mute = this.getMuteStatus(eventId, speakerId);

    if (!mute) {
      return 0;
    }

    const elapsed = Date.now() - mute.muteStartTime;
    const remaining = mute.muteDuration * 1000 - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Get all active mutes for event
   */
  getActiveMutesForEvent(eventId: string): MutingAction[] {
    const activeMutes: MutingAction[] = [];

    for (const [key, mute] of this.activeMutes.entries()) {
      if (key.startsWith(`${eventId}:`)) {
        const remaining = this.getMuteTimeRemaining(eventId, mute.speakerId);
        if (remaining > 0) {
          activeMutes.push(mute);
        }
      }
    }

    return activeMutes;
  }

  /**
   * Get muting statistics for event
   */
  async getMutingStatistics(eventId: string) {
    const violations = await db
      .select()
      .from(complianceViolations)
      .where(eq(complianceViolations.eventId, eventId));

    const speakerViolationCounts = new Map<string, number>();
    const speakerMuteCounts = new Map<string, number>();

    for (const violation of violations) {
      const count = speakerViolationCounts.get(violation.speaker) || 0;
      speakerViolationCounts.set(violation.speaker, count + 1);
    }

    // Count how many times each speaker was muted
    for (const [key, mute] of this.activeMutes.entries()) {
      if (key.startsWith(`${eventId}:`)) {
        const count = speakerMuteCounts.get(mute.speaker) || 0;
        speakerMuteCounts.set(mute.speaker, count + 1);
      }
    }

    return {
      totalViolations: violations.length,
      totalMutes: Array.from(speakerMuteCounts.values()).reduce((a, b) => a + b, 0),
      speakerStats: Array.from(speakerViolationCounts.entries()).map(([speaker, violations]) => ({
        speaker,
        violations,
        mutes: speakerMuteCounts.get(speaker) || 0,
      })),
    };
  }

  /**
   * Reset muting thresholds for event (e.g., for new speaker)
   */
  resetMutingForEvent(eventId: string) {
    const keysToDelete: string[] = [];

    for (const key of this.activeMutes.keys()) {
      if (key.startsWith(`${eventId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.activeMutes.delete(key));
  }

  /**
   * Configure muting thresholds for event
   */
  async configureMutingThresholds(eventId: string, config: Partial<MutingThreshold>): Promise<MutingThreshold> {
    // In production, store in database
    // For now, return configured thresholds
    const defaults = await this.initializeMutingThresholds(eventId, {});
    return { ...defaults, ...config };
  }

  /**
   * Get muting configuration for event
   */
  async getMutingConfiguration(eventId: string): Promise<MutingThreshold> {
    // In production, fetch from database
    // For now, return defaults
    return this.initializeMutingThresholds(eventId, {});
  }

  /**
   * Check if operator can override muting
   */
  canOperatorOverride(thresholds: MutingThreshold): boolean {
    return thresholds.allowOperatorOverride;
  }

  /**
   * Get muting history for speaker
   */
  async getMutingHistory(eventId: string, speaker: string) {
    const violations = await db
      .select()
      .from(complianceViolations)
      .where(and(eq(complianceViolations.eventId, eventId), eq(complianceViolations.speaker, speaker)))
      .orderBy(desc(complianceViolations.detectedAt));

    return {
      speaker,
      totalViolations: violations.length,
      violations: violations.map((v) => ({
        id: v.id,
        type: v.violationType,
        severity: v.severity,
        detectedAt: v.detectedAt,
        acknowledgedAt: v.acknowledgedAt,
      })),
    };
  }

  /**
   * Validate muting threshold configuration
   */
  validateConfiguration(config: Partial<MutingThreshold>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.violationThreshold !== undefined && config.violationThreshold < 1) {
      errors.push("Violation threshold must be at least 1");
    }

    if (config.timeWindow !== undefined && config.timeWindow < 60) {
      errors.push("Time window must be at least 60 seconds");
    }

    if (config.muteDuration !== undefined && config.muteDuration < 10) {
      errors.push("Mute duration must be at least 10 seconds");
    }

    if (config.violationTypes !== undefined && config.violationTypes.length === 0) {
      errors.push("At least one violation type must be selected");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const autoMutingThresholds = new AutoMutingThresholdSystem();
