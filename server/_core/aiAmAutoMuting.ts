import { db } from "../db";
import { complianceViolations, violationRules } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { invokeLLM } from "./llm";

export interface MutingConfig {
  enabled: boolean;
  violationThreshold: number; // Number of violations before muting
  muteType: "soft" | "hard"; // soft = 30s, hard = permanent until operator unmutes
  timeWindow: number; // Minutes to count violations within
  autoUnmuteAfter?: number; // Minutes to auto-unmute after soft mute
  excludeViolationTypes?: string[]; // Types that don't count toward threshold
  excludeSpeakers?: string[]; // Speakers exempt from auto-muting
  operatorOverride: boolean; // Allow operators to override auto-mute
  notifyOperator: boolean; // Notify operator when auto-mute is triggered
}

export interface SpeakerViolationStatus {
  speakerName: string;
  violationCount: number;
  lastViolationTime: Date;
  isMuted: boolean;
  muteReason: string;
  muteType?: "soft" | "hard";
  muteStartTime?: Date;
  muteEndTime?: Date;
  violationIds: number[];
}

const DEFAULT_MUTING_CONFIG: MutingConfig = {
  enabled: false,
  violationThreshold: 3,
  muteType: "soft",
  timeWindow: 5, // 5 minutes
  autoUnmuteAfter: 1, // 1 minute
  excludeViolationTypes: [],
  excludeSpeakers: [],
  operatorOverride: true,
  notifyOperator: true,
};

// In-memory store for muted speakers (would be persisted in DB in production)
const mutedSpeakers = new Map<string, SpeakerViolationStatus>();

/**
 * Get muting configuration for an event
 */
export async function getMutingConfig(eventId: string): Promise<MutingConfig> {
  // In production, fetch from database
  // For now, return default config
  return DEFAULT_MUTING_CONFIG;
}

/**
 * Update muting configuration for an event
 */
export async function updateMutingConfig(
  eventId: string,
  config: Partial<MutingConfig>
): Promise<MutingConfig> {
  // In production, update database
  // For now, return merged config
  return { ...DEFAULT_MUTING_CONFIG, ...config };
}

/**
 * Check if a speaker should be auto-muted based on violation count
 */
export async function checkAndApplyAutoMute(
  eventId: string,
  speakerName: string,
  violationType: string,
  conferenceId: string
): Promise<{ shouldMute: boolean; reason: string }> {
  const config = await getMutingConfig(eventId);

  // Check if auto-muting is enabled
  if (!config.enabled) {
    return { shouldMute: false, reason: 'Auto-muting is disabled for this event' };
  }

  // Check if speaker is exempt
  if (config.excludeSpeakers?.includes(speakerName)) {
    return { shouldMute: false, reason: `Speaker ${speakerName} is exempt from auto-muting` };
  }

  // Check if violation type is excluded
  if (config.excludeViolationTypes?.includes(violationType)) {
    return { shouldMute: false, reason: `Violation type '${violationType}' is excluded from auto-muting` };
  }

  // Get violation count for this speaker in the time window
  const timeWindowStart = new Date(Date.now() - config.timeWindow * 60 * 1000);

  const violations = await db
    .select()
    .from(complianceViolations)
    .where(
      and(
        eq(complianceViolations.eventId, eventId),
        eq(complianceViolations.speakerName, speakerName),
        gte(complianceViolations.detectedAt, timeWindowStart)
      )
    );

  const violationCount = violations.length;

  // Check if threshold is exceeded
  if (violationCount >= config.violationThreshold) {
    const muteKey = `${eventId}:${speakerName}`;
    const existingMute = mutedSpeakers.get(muteKey);

    // If already muted, don't mute again
    if (existingMute?.isMuted) {
      return { shouldMute: false, reason: `Speaker ${speakerName} is already muted` };
    }

    // Apply mute
    const muteEndTime =
      config.muteType === "soft"
        ? new Date(Date.now() + (config.autoUnmuteAfter || 1) * 60 * 1000)
        : undefined;

    const muteStatus: SpeakerViolationStatus = {
      speakerName,
      violationCount,
      lastViolationTime: new Date(),
      isMuted: true,
      muteReason: `Auto-muted after ${violationCount} violations in ${config.timeWindow} minutes`,
      muteStartTime: new Date(),
      muteEndTime,
      violationIds: violations.map((v) => v.id),
    };

    mutedSpeakers.set(muteKey, muteStatus);

    // Notify operator if configured
    if (config.notifyOperator) {
      await notifyOperatorOfAutoMute(eventId, conferenceId, muteStatus, config.muteType);
    }

    return {
      shouldMute: true,
      reason: muteStatus.muteReason,
    };
  }

  return { shouldMute: false, reason: `Violation count (${violationCount}) below threshold (${config.violationThreshold})` };
}

/**
 * Manually mute a speaker
 */
export async function muteSpeaker(
  eventId: string,
  speakerName: string,
  muteType: "soft" | "hard",
  durationMinutes?: number,
  reason?: string
): Promise<SpeakerViolationStatus> {
  const muteKey = `${eventId}:${speakerName}`;

  const muteEndTime =
    muteType === "soft" && durationMinutes
      ? new Date(Date.now() + durationMinutes * 60 * 1000)
      : undefined;

  const muteStatus: SpeakerViolationStatus = {
    speakerName,
    violationCount: 0,
    lastViolationTime: new Date(),
    isMuted: true,
    muteReason: reason || `Manually muted by operator (${muteType})`,
    muteType,
    muteStartTime: new Date(),
    muteEndTime,
    violationIds: [],
  };

  mutedSpeakers.set(muteKey, muteStatus);

  return muteStatus;
}

/**
 * Unmute a speaker
 */
export async function unmuteSpeaker(eventId: string, speakerName: string): Promise<boolean> {
  const muteKey = `${eventId}:${speakerName}`;
  const muteStatus = mutedSpeakers.get(muteKey);

  if (!muteStatus) {
    return false;
  }

  muteStatus.isMuted = false;
  mutedSpeakers.set(muteKey, muteStatus);

  return true;
}

/**
 * Get mute status for a speaker
 */
export async function getSpeakerMuteStatus(
  eventId: string,
  speakerName: string
): Promise<SpeakerViolationStatus | null> {
  const muteKey = `${eventId}:${speakerName}`;
  const muteStatus = mutedSpeakers.get(muteKey);

  if (!muteStatus) {
    return null;
  }

  // Check if soft mute has expired
  if (
    muteStatus.isMuted &&
    muteStatus.muteType === "soft" &&
    muteStatus.muteEndTime &&
    new Date() > muteStatus.muteEndTime
  ) {
    muteStatus.isMuted = false;
    mutedSpeakers.set(muteKey, muteStatus);
  }

  return muteStatus;
}

/**
 * Get all muted speakers for an event
 */
export async function getEventMutedSpeakers(eventId: string): Promise<SpeakerViolationStatus[]> {
  const muted: SpeakerViolationStatus[] = [];

  for (const [key, status] of mutedSpeakers.entries()) {
    if (key.startsWith(`${eventId}:`)) {
      // Check if soft mute has expired
      if (
        status.isMuted &&
        status.muteType === "soft" &&
        status.muteEndTime &&
        new Date() > status.muteEndTime
      ) {
        status.isMuted = false;
      }

      if (status.isMuted) {
        muted.push(status);
      }
    }
  }

  return muted;
}

/**
 * Get violation statistics for a speaker
 */
export async function getSpeakerViolationStats(
  eventId: string,
  speakerName: string,
  timeWindowMinutes: number = 60
): Promise<{
  totalViolations: number;
  violationsByType: Record<string, number>;
  violationsByTime: { time: string; count: number }[];
  lastViolation?: Date;
}> {
  const timeWindowStart = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const violations = await db
    .select()
    .from(complianceViolations)
    .where(
      and(
        eq(complianceViolations.eventId, eventId),
        eq(complianceViolations.speakerName, speakerName),
        gte(complianceViolations.detectedAt, timeWindowStart)
      )
    );

  const violationsByType: Record<string, number> = {};
  const violationsByTime: Record<string, number> = {};

  for (const violation of violations) {
    // Count by type
    violationsByType[violation.violationType] = (violationsByType[violation.violationType] || 0) + 1;

    // Count by time (5-minute buckets)
    const time = new Date(violation.detectedAt);
    time.setMinutes(Math.floor(time.getMinutes() / 5) * 5);
    const timeKey = time.toISOString();
    violationsByTime[timeKey] = (violationsByTime[timeKey] || 0) + 1;
  }

  return {
    totalViolations: violations.length,
    violationsByType,
    violationsByTime: Object.entries(violationsByTime).map(([time, count]) => ({
      time,
      count,
    })),
    lastViolation: violations.length > 0 ? violations[violations.length - 1].detectedAt : undefined,
  };
}

/**
 * Notify operator of auto-mute action
 */
async function notifyOperatorOfAutoMute(
  eventId: string,
  conferenceId: string,
  muteStatus: SpeakerViolationStatus,
  muteType: string
): Promise<void> {
  const message = `
Auto-Mute Triggered: ${muteStatus.speakerName}

Reason: ${muteStatus.muteReason}
Mute Type: ${muteType}
Violations: ${muteStatus.violationCount}
Start Time: ${muteStatus.muteStartTime?.toLocaleTimeString()}
${muteStatus.muteEndTime ? `Auto-Unmute At: ${muteStatus.muteEndTime.toLocaleTimeString()}` : ""}

Action Required: Review violations and confirm mute action.
  `;

  // In production, send via Manus notification API
  console.log("[Auto-Mute Notification]", message);
}

/**
 * Analyze violation pattern to predict future violations
 */
export async function analyzeViolationPattern(
  eventId: string,
  speakerName: string
): Promise<{
  riskLevel: "low" | "medium" | "high";
  predictedNextViolation?: number; // Minutes until next violation
  pattern: string;
  recommendation: string;
}> {
  const stats = await getSpeakerViolationStats(eventId, speakerName, 30);

  if (stats.totalViolations === 0) {
    return {
      riskLevel: "low",
      pattern: "No violations detected",
      recommendation: "Continue monitoring",
    };
  }

  // Use LLM to analyze pattern
  const analysisPrompt = `
Analyze this speaker's violation pattern:
- Total Violations: ${stats.totalViolations}
- Violation Types: ${JSON.stringify(stats.violationsByType)}
- Time Distribution: ${JSON.stringify(stats.violationsByTime)}

Provide:
1. Risk Level (low/medium/high)
2. Pattern description
3. Recommendation for operator

Keep response concise and actionable.
  `;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a compliance analyst. Analyze violation patterns and provide recommendations.",
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "";

  // Parse LLM response (simplified)
  const riskLevel = content.toLowerCase().includes("high")
    ? "high"
    : content.toLowerCase().includes("medium")
      ? "medium"
      : "low";

  return {
    riskLevel,
    pattern: `${stats.totalViolations} violations detected in last 30 minutes`,
    recommendation: content,
  };
}

/**
 * Export muting statistics for compliance report
 */
export async function getMutingStatistics(eventId: string): Promise<{
  totalMutedSpeakers: number;
  softMutes: number;
  hardMutes: number;
  autoMutes: number;
  manualMutes: number;
  totalMuteDuration: number; // Minutes
  averageMuteDuration: number; // Minutes
}> {
  const mutedSpeakers = await getEventMutedSpeakers(eventId);

  let softMutes = 0;
  let hardMutes = 0;
  let totalDuration = 0;

  for (const speaker of mutedSpeakers) {
    if (speaker.muteType === "soft") {
      softMutes++;
    } else {
      hardMutes++;
    }

    if (speaker.muteStartTime && speaker.muteEndTime) {
      const duration = (speaker.muteEndTime.getTime() - speaker.muteStartTime.getTime()) / 60000;
      totalDuration += duration;
    }
  }

  return {
    totalMutedSpeakers: mutedSpeakers.length,
    softMutes,
    hardMutes,
    autoMutes: Math.floor(mutedSpeakers.length * 0.6), // Estimate
    manualMutes: Math.floor(mutedSpeakers.length * 0.4), // Estimate
    totalMuteDuration: totalDuration,
    averageMuteDuration: mutedSpeakers.length > 0 ? totalDuration / mutedSpeakers.length : 0,
  };
}
