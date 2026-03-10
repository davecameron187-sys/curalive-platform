/**
 * AI Automated Moderator (AI-AM) Phase 2: Auto-Muting System
 * Implements configurable violation thresholds and automatic speaker muting
 */

import { db } from "./index";
import { complianceViolations } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

export interface MutingConfig {
  eventId: string;
  enabled: boolean;
  softMuteThreshold: number; // Violations before soft mute (warning)
  hardMuteThreshold: number; // Violations before hard mute (audio disabled)
  muteDuration: number; // Duration in seconds (0 = permanent until operator unmutes)
  autoUnmuteAfter?: number; // Auto-unmute after N minutes
  violationTypes: string[]; // Types of violations that trigger muting
  excludedSpeakers?: string[]; // Speakers exempt from auto-muting
  operatorOverride: boolean; // Allow operators to override muting
}

export interface SpeakerViolationCount {
  speakerId: string;
  speakerName: string;
  violationCount: number;
  lastViolationTime: Date;
  isMuted: boolean;
  muteType?: "soft" | "hard";
  muteStartTime?: Date;
}

/**
 * Get current muting configuration for an event
 */
export async function getMutingConfig(eventId: string): Promise<MutingConfig | null> {
  // In production, fetch from database
  // For now, return default config
  return {
    eventId,
    enabled: true,
    softMuteThreshold: 2,
    hardMuteThreshold: 5,
    muteDuration: 300, // 5 minutes
    autoUnmuteAfter: 10,
    violationTypes: ["abuse", "harassment", "profanity"],
    operatorOverride: true,
  };
}

/**
 * Check if speaker should be muted based on violation count
 */
export async function evaluateSpeakerForMuting(
  eventId: string,
  speakerId: string,
  speakerName: string
): Promise<{
  shouldMute: boolean;
  muteType?: "soft" | "hard";
  reason?: string;
}> {
  const config = await getMutingConfig(eventId);
  if (!config || !config.enabled) {
    return { shouldMute: false };
  }

  // Check if speaker is in exclusion list
  if (config.excludedSpeakers?.includes(speakerId)) {
    return { shouldMute: false, reason: "Speaker is excluded from auto-muting" };
  }

  // Count violations for this speaker in the last 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const violations = await db
    .select()
    .from(complianceViolations)
    .where(
      and(
        eq(complianceViolations.eventId, eventId),
        eq(complianceViolations.speaker, speakerName),
        gte(complianceViolations.createdAt, thirtyMinutesAgo)
      )
    );

  const violationCount = violations.length;

  // Determine mute type
  if (violationCount >= config.hardMuteThreshold) {
    return {
      shouldMute: true,
      muteType: "hard",
      reason: `Speaker exceeded hard mute threshold (${violationCount} violations)`,
    };
  }

  if (violationCount >= config.softMuteThreshold) {
    return {
      shouldMute: true,
      muteType: "soft",
      reason: `Speaker exceeded soft mute threshold (${violationCount} violations)`,
    };
  }

  return { shouldMute: false };
}

/**
 * Apply muting action to speaker
 */
export async function applyMuting(
  eventId: string,
  speakerId: string,
  speakerName: string,
  muteType: "soft" | "hard",
  operatorId?: string
): Promise<{
  success: boolean;
  message: string;
  muteStartTime: Date;
  estimatedUnmuteTime?: Date;
}> {
  const config = await getMutingConfig(eventId);
  if (!config) {
    return {
      success: false,
      message: "Muting configuration not found",
      muteStartTime: new Date(),
    };
  }

  const muteStartTime = new Date();
  const estimatedUnmuteTime = config.autoUnmuteAfter
    ? new Date(muteStartTime.getTime() + config.autoUnmuteAfter * 60 * 1000)
    : undefined;

  console.log(`[AI-AM Phase 2] Applying ${muteType} mute to ${speakerName}`, {
    eventId,
    speakerId,
    muteType,
    duration: config.muteDuration,
    operatorId,
  });

  // In production, would integrate with Recall.ai or Zoom API to actually mute the speaker
  // For now, just log the action

  return {
    success: true,
    message: `${muteType.toUpperCase()} mute applied to ${speakerName}`,
    muteStartTime,
    estimatedUnmuteTime,
  };
}

/**
 * Remove muting from speaker
 */
export async function removeMuting(
  eventId: string,
  speakerId: string,
  speakerName: string,
  operatorId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(`[AI-AM Phase 2] Removing mute from ${speakerName}`, {
    eventId,
    speakerId,
    operatorId,
  });

  // In production, would integrate with Recall.ai or Zoom API to unmute
  // For now, just log the action

  return {
    success: true,
    message: `Mute removed from ${speakerName}`,
  };
}

/**
 * Get current speaker violation counts for an event
 */
export async function getSpeakerViolationCounts(
  eventId: string
): Promise<SpeakerViolationCount[]> {
  const violations = await db
    .select()
    .from(complianceViolations)
    .where(eq(complianceViolations.eventId, eventId));

  // Group by speaker
  const speakerMap = new Map<string, SpeakerViolationCount>();

  for (const violation of violations) {
    const key = violation.speaker;
    if (!speakerMap.has(key)) {
      speakerMap.set(key, {
        speakerId: key,
        speakerName: violation.speaker,
        violationCount: 0,
        lastViolationTime: violation.createdAt,
        isMuted: false,
      });
    }

    const count = speakerMap.get(key)!;
    count.violationCount += 1;
    count.lastViolationTime = violation.createdAt;
  }

  return Array.from(speakerMap.values()).sort(
    (a, b) => b.violationCount - a.violationCount
  );
}

/**
 * Batch evaluate all speakers for muting
 */
export async function evaluateAllSpeakersForMuting(
  eventId: string
): Promise<
  Array<{
    speakerId: string;
    speakerName: string;
    shouldMute: boolean;
    muteType?: "soft" | "hard";
    reason?: string;
  }>
> {
  const speakerCounts = await getSpeakerViolationCounts(eventId);
  const results = [];

  for (const speaker of speakerCounts) {
    const evaluation = await evaluateSpeakerForMuting(
      eventId,
      speaker.speakerId,
      speaker.speakerName
    );
    results.push({
      speakerId: speaker.speakerId,
      speakerName: speaker.speakerName,
      ...evaluation,
    });
  }

  return results;
}

/**
 * Configure muting settings for an event
 */
export async function configureMutingSettings(
  eventId: string,
  config: Partial<MutingConfig>
): Promise<MutingConfig> {
  // In production, would save to database
  // For now, just return merged config
  const currentConfig = await getMutingConfig(eventId);
  return {
    ...currentConfig!,
    ...config,
    eventId,
  };
}

/**
 * Get muting statistics for an event
 */
export async function getMutingStatistics(eventId: string): Promise<{
  totalSpeakers: number;
  speakersWithViolations: number;
  softMutedCount: number;
  hardMutedCount: number;
  totalMutingActions: number;
  averageViolationsPerSpeaker: number;
}> {
  const speakers = await getSpeakerViolationCounts(eventId);
  const config = await getMutingConfig(eventId);

  const speakersWithViolations = speakers.filter((s) => s.violationCount > 0).length;
  const softMutedCount = speakers.filter(
    (s) => config && s.violationCount >= config.softMuteThreshold && s.violationCount < config.hardMuteThreshold
  ).length;
  const hardMutedCount = speakers.filter(
    (s) => config && s.violationCount >= config.hardMuteThreshold
  ).length;

  return {
    totalSpeakers: speakers.length,
    speakersWithViolations,
    softMutedCount,
    hardMutedCount,
    totalMutingActions: softMutedCount + hardMutedCount,
    averageViolationsPerSpeaker:
      speakers.length > 0
        ? speakers.reduce((sum, s) => sum + s.violationCount, 0) / speakers.length
        : 0,
  };
}

export default {
  getMutingConfig,
  evaluateSpeakerForMuting,
  applyMuting,
  removeMuting,
  getSpeakerViolationCounts,
  evaluateAllSpeakersForMuting,
  configureMutingSettings,
  getMutingStatistics,
};
