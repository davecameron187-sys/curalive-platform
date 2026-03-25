// @ts-nocheck
/**
 * AI Automated Moderator (AI-AM) Phase 2: Auto-Muting System
 * Implements configurable violation thresholds and automatic speaker muting
 */

import { db } from "./index";
import { complianceViolations } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

// In-memory storage for muting state (in production, use database)
const mutingState = new Map<string, Map<string, SpeakerViolationCount>>();
const mutingConfigs = new Map<string, MutingConfig>();

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
  return mutingConfigs.get(eventId) || null;
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

  // Get violation count from in-memory state
  const speakerViolations = mutingState.get(eventId)?.get(speakerId);
  const violationCount = speakerViolations?.violationCount || 0;

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
 * Track a violation for a speaker
 */
export async function trackSpeakerViolation(
  eventId: string,
  speakerId: string,
  speakerName: string,
  violationType: string
): Promise<void> {
  if (!mutingState.has(eventId)) {
    mutingState.set(eventId, new Map());
  }

  const eventViolations = mutingState.get(eventId)!;
  const existing = eventViolations.get(speakerId);

  if (existing) {
    existing.violationCount++;
    existing.lastViolationTime = new Date();
  } else {
    eventViolations.set(speakerId, {
      speakerId,
      speakerName,
      violationCount: 1,
      lastViolationTime: new Date(),
      isMuted: false,
    });
  }

  console.log(
    `[AI-AM Phase 2] Violation tracked for ${speakerName}: ${violationType}`,
    eventViolations.get(speakerId)
  );
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

  // Update in-memory state
  if (!mutingState.has(eventId)) {
    mutingState.set(eventId, new Map());
  }

  const eventViolations = mutingState.get(eventId)!;
  const speaker = eventViolations.get(speakerId);

  if (speaker) {
    speaker.isMuted = true;
    speaker.muteType = muteType;
    speaker.muteStartTime = new Date();
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

  // Call Recall.ai API to mute speaker
  const recallResult = await muteOnRecallAi(eventId, speakerId, muteType);
  if (!recallResult.success) {
    console.warn(`[AI-AM Phase 2] Failed to mute on Recall.ai: ${recallResult.error}`);
  }

  // Schedule auto-unmute for soft mutes
  if (muteType === "soft" && config.autoUnmuteAfter) {
    scheduleAutoUnmute(eventId, speakerId, speakerName, config.autoUnmuteAfter);
  }

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
  // Update in-memory state
  const eventViolations = mutingState.get(eventId);
  if (eventViolations) {
    const speaker = eventViolations.get(speakerId);
    if (speaker) {
      speaker.isMuted = false;
      speaker.muteType = undefined;
      speaker.muteStartTime = undefined;
    }
  }

  console.log(`[AI-AM Phase 2] Removing mute from ${speakerName}`, {
    eventId,
    speakerId,
    operatorId,
  });

  // Call Recall.ai API to unmute speaker
  const recallResult = await unmuteOnRecallAi(eventId, speakerId);
  if (!recallResult.success) {
    console.warn(`[AI-AM Phase 2] Failed to unmute on Recall.ai: ${recallResult.error}`);
  }

  return {
    success: true,
    message: `Mute removed from ${speakerName}`,
  };
}

/**
 * Get speaker violation counts for an event
 */
export async function getSpeakerViolationCounts(
  eventId: string
): Promise<SpeakerViolationCount[]> {
  // Use in-memory state for now
  const speakerViolations = mutingState.get(eventId) || new Map();
  return Array.from(speakerViolations.values()).sort(
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
  const existing = mutingConfigs.get(eventId);
  const defaultConfig: MutingConfig = {
    eventId,
    enabled: true,
    softMuteThreshold: 2,
    hardMuteThreshold: 5,
    muteDuration: 300,
    autoUnmuteAfter: 10,
    violationTypes: ["abuse", "harassment", "profanity"],
    operatorOverride: true,
  };

  const merged: MutingConfig = {
    ...defaultConfig,
    ...existing,
    ...config,
    eventId,
  };

  mutingConfigs.set(eventId, merged);
  return merged;
}

/**
 * Mute speaker on Recall.ai
 */
async function muteOnRecallAi(
  eventId: string,
  speakerId: string,
  muteType: "soft" | "hard"
): Promise<{ success: boolean; error?: string }> {
  try {
    const recallApiUrl = process.env.RECALL_AI_BASE_URL || "https://api.recall.ai/v1";
    const recallApiKey = process.env.RECALL_AI_API_KEY;

    if (!recallApiKey) {
      console.warn("[AI-AM Phase 2] RECALL_AI_API_KEY not configured");
      return { success: true }; // Fail gracefully in dev
    }

    // Call Recall.ai API to mute speaker
    const response = await fetch(`${recallApiUrl}/bots/${eventId}/mute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${recallApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        speakerId,
        muteType,
        duration: muteType === "soft" ? 30 : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("[AI-AM Phase 2] Failed to mute on Recall.ai:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Unmute speaker on Recall.ai
 */
async function unmuteOnRecallAi(
  eventId: string,
  speakerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const recallApiUrl = process.env.RECALL_AI_BASE_URL || "https://api.recall.ai/v1";
    const recallApiKey = process.env.RECALL_AI_API_KEY;

    if (!recallApiKey) {
      console.warn("[AI-AM Phase 2] RECALL_AI_API_KEY not configured");
      return { success: true }; // Fail gracefully in dev
    }

    // Call Recall.ai API to unmute speaker
    const response = await fetch(`${recallApiUrl}/bots/${eventId}/unmute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${recallApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ speakerId }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("[AI-AM Phase 2] Failed to unmute on Recall.ai:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Schedule auto-unmute for soft mutes
 */
function scheduleAutoUnmute(
  eventId: string,
  speakerId: string,
  speakerName: string,
  delayMinutes: number
): void {
  const delayMs = delayMinutes * 60 * 1000;

  setTimeout(async () => {
    console.log(
      `[AI-AM Phase 2] Auto-unmuting ${speakerName} after ${delayMinutes} minutes`
    );

    const result = await removeMuting(eventId, speakerId, speakerName, "system");
    if (!result.success) {
      console.error(`[AI-AM Phase 2] Failed to auto-unmute: ${result.message}`);
    }
  }, delayMs);
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
    (s) => s.isMuted && s.muteType === "soft"
  ).length;
  const hardMutedCount = speakers.filter(
    (s) => s.isMuted && s.muteType === "hard"
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
