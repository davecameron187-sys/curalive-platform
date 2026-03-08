import { getDb } from "../db";
import { speakingPaceAnalysis, occTranscriptionSegments } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export type PaceLabel = "too_slow" | "slow" | "normal" | "fast" | "too_fast";
export type CoachingLevel = "excellent" | "good" | "needs_improvement" | "critical";

export interface PaceAnalysisResult {
  wpm: number;
  paceLabel: PaceLabel;
  paceScore: number;
  averagePauseMs: number;
  pauseScore: number;
  fillerWordCount: number;
  fillerScore: number;
  overallScore: number;
  coachingTip: string;
  coachingLevel: CoachingLevel;
}

const IDEAL_WPM = 130; // 120-150 is ideal for presentations
const IDEAL_PAUSE_MS = 500; // 300-800ms is ideal
const MAX_FILLER_WORDS = 5; // Per minute

/**
 * Speaking-Pace Coach Service
 * Analyzes speaker pace, pauses, and filler words in real-time
 * Provides coaching feedback to help speakers improve delivery
 */
export class SpeakingPaceCoachService {
  /**
   * Analyze speaking pace for a time window
   * Calculates WPM, pause patterns, filler words, and generates coaching
   */
  static async analyzeWindowPace(
    conferenceId: number,
    participantId: number | null,
    speakerName: string,
    speakerRole: "moderator" | "participant" | "presenter",
    windowStartMs: number,
    windowEndMs: number
  ): Promise<PaceAnalysisResult | null> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all transcription segments for this speaker in the time window
      const segments = await db
        .select()
        .from(occTranscriptionSegments)
        .where(
          and(
            eq(occTranscriptionSegments.conferenceId, conferenceId),
            eq(occTranscriptionSegments.speakerName, speakerName),
            gte(occTranscriptionSegments.startTime, windowStartMs),
            lte(occTranscriptionSegments.endTime, windowEndMs)
          )
        );

      if (segments.length === 0) {
        return null;
      }

      // Calculate metrics from segments
      const durationMs = windowEndMs - windowStartMs;
      const durationMinutes = durationMs / 60000;

      // Count total words
      const totalWords = segments.reduce((sum: number, seg: any) => {
        return sum + (seg.text?.split(/\s+/).length || 0);
      }, 0);

      const wpm = Math.round(totalWords / durationMinutes);

      // Analyze pauses (gaps between segments)
      const pauses: number[] = [];
      for (let i = 0; i < segments.length - 1; i++) {
        const gap = segments[i + 1].startTime - segments[i].endTime;
        if (gap > 0) {
          pauses.push(gap);
        }
      }

      const averagePauseMs = pauses.length > 0 ? Math.round(pauses.reduce((a: number, b: number) => a + b, 0) / pauses.length) : 0;
      const pauseCount = pauses.length;

      // Count filler words
      const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of"];
      const fillerWordCounts: { [key: string]: number } = {};
      let totalFillerWords = 0;

      segments.forEach((seg: any) => {
        const text = (seg.text || "").toLowerCase();
        fillerWords.forEach((filler) => {
          const regex = new RegExp(`\\b${filler}\\b`, "g");
          const matches = text.match(regex) || [];
          const count = matches.length;
          if (count > 0) {
            fillerWordCounts[filler] = (fillerWordCounts[filler] || 0) + count;
            totalFillerWords += count;
          }
        });
      });

      // Calculate scores
      const paceScore = this.calculatePaceScore(wpm);
      const pauseScore = this.calculatePauseScore(averagePauseMs);
      const fillerScore = this.calculateFillerScore(totalFillerWords, durationMinutes);

      // Determine pace label
      const paceLabel = this.getPaceLabel(wpm);

      // Generate coaching tip
      const coachingTip = this.generateCoachingTip(wpm, averagePauseMs, totalFillerWords, durationMinutes);

      // Calculate overall score (weighted average)
      const overallScore = Math.round(paceScore * 0.4 + pauseScore * 0.3 + fillerScore * 0.3);

      // Determine coaching level
      const coachingLevel = this.getCoachingLevel(overallScore);

      // Save analysis to database
      await db.insert(speakingPaceAnalysis).values({
        conferenceId,
        participantId: participantId || undefined,
        speakerName,
        speakerRole,
        wpm,
        paceLabel,
        paceScore,
        averagePauseMs,
        pauseCount,
        pauseScore,
        fillerWordCount: totalFillerWords,
        fillerWords: Object.entries(fillerWordCounts).map(([word, count]) => ({ word, count })),
        fillerScore,
        overallScore,
        coachingTip,
        coachingLevel,
        windowStartTime: windowStartMs,
        windowEndTime: windowEndMs,
        durationMs,
        analysisModel: "whisper-pace-v1",
        analysisVersion: "1.0",
        analysisTimestamp: Date.now(),
      });

      return {
        wpm,
        paceLabel,
        paceScore,
        averagePauseMs,
        pauseScore,
        fillerWordCount: totalFillerWords,
        fillerScore,
        overallScore,
        coachingTip,
        coachingLevel,
      };
    } catch (error) {
      console.error("[SpeakingPaceCoach] Error analyzing pace:", error);
      return null;
    }
  }

  /**
   * Get all pace analyses for a conference
   */
  static async getConferencePaceAnalyses(conferenceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const analyses = await db
        .select()
        .from(speakingPaceAnalysis)
        .where(eq(speakingPaceAnalysis.conferenceId, conferenceId));

      return analyses;
    } catch (error) {
      console.error("[SpeakingPaceCoach] Error fetching analyses:", error);
      return [];
    }
  }

  /**
   * Get pace analysis for a specific speaker
   */
  static async getSpeakerPaceAnalyses(conferenceId: number, speakerName: string) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const analyses = await db
        .select()
        .from(speakingPaceAnalysis)
        .where(
          and(
            eq(speakingPaceAnalysis.conferenceId, conferenceId),
            eq(speakingPaceAnalysis.speakerName, speakerName)
          )
        );

      return analyses;
    } catch (error) {
      console.error("[SpeakingPaceCoach] Error fetching speaker analyses:", error);
      return [];
    }
  }

  /**
   * Get latest pace analysis for a speaker (most recent window)
   */
  static async getLatestSpeakerPace(conferenceId: number, speakerName: string) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const latest = await db
        .select()
        .from(speakingPaceAnalysis)
        .where(
          and(
            eq(speakingPaceAnalysis.conferenceId, conferenceId),
            eq(speakingPaceAnalysis.speakerName, speakerName)
          )
        )
        .orderBy((table: any) => table.createdAt)
        .limit(1);

      return latest[0] || null;
    } catch (error) {
      console.error("[SpeakingPaceCoach] Error fetching latest pace:", error);
      return null;
    }
  }

  /**
   * Calculate pace score (0-100)
   * 100 = ideal pace (120-150 WPM)
   */
  private static calculatePaceScore(wpm: number): number {
    const minIdeal = 120;
    const maxIdeal = 150;

    if (wpm >= minIdeal && wpm <= maxIdeal) {
      return 100;
    }

    if (wpm < minIdeal) {
      // Too slow: 0 at 60 WPM, 100 at 120 WPM
      return Math.max(0, Math.round(((wpm - 60) / (minIdeal - 60)) * 100));
    } else {
      // Too fast: 100 at 150 WPM, 0 at 200 WPM
      return Math.max(0, Math.round((1 - (wpm - maxIdeal) / (200 - maxIdeal)) * 100));
    }
  }

  /**
   * Calculate pause score (0-100)
   * 100 = ideal pause length (300-800ms)
   */
  private static calculatePauseScore(pauseMs: number): number {
    const minIdeal = 300;
    const maxIdeal = 800;

    if (pauseMs >= minIdeal && pauseMs <= maxIdeal) {
      return 100;
    }

    if (pauseMs < minIdeal) {
      // Too short: 0 at 0ms, 100 at 300ms
      return Math.round((pauseMs / minIdeal) * 100);
    } else {
      // Too long: 100 at 800ms, 0 at 2000ms
      return Math.max(0, Math.round((1 - (pauseMs - maxIdeal) / (2000 - maxIdeal)) * 100));
    }
  }

  /**
   * Calculate filler score (0-100)
   * 100 = no filler words
   * Penalizes based on filler words per minute
   */
  private static calculateFillerScore(fillerCount: number, durationMinutes: number): number {
    const fillerPerMinute = fillerCount / durationMinutes;
    const maxAcceptable = MAX_FILLER_WORDS;

    if (fillerPerMinute === 0) {
      return 100;
    }

    if (fillerPerMinute <= maxAcceptable) {
      return Math.round(100 - (fillerPerMinute / maxAcceptable) * 30); // 70-100 range
    } else {
      return Math.max(0, Math.round(70 - ((fillerPerMinute - maxAcceptable) / maxAcceptable) * 70));
    }
  }

  /**
   * Get pace label based on WPM
   */
  private static getPaceLabel(wpm: number): PaceLabel {
    if (wpm < 100) return "too_slow";
    if (wpm < 120) return "slow";
    if (wpm <= 150) return "normal";
    if (wpm <= 170) return "fast";
    return "too_fast";
  }

  /**
   * Get coaching level based on overall score
   */
  private static getCoachingLevel(score: number): CoachingLevel {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "needs_improvement";
    return "critical";
  }

  /**
   * Generate personalized coaching tip
   */
  private static generateCoachingTip(wpm: number, pauseMs: number, fillerCount: number, durationMinutes: number): string {
    const tips: string[] = [];

    // Pace feedback
    if (wpm < 100) {
      tips.push("Increase your speaking pace - you're speaking too slowly. Aim for 120-150 WPM.");
    } else if (wpm > 170) {
      tips.push("Slow down your speaking pace - you're speaking too fast. Aim for 120-150 WPM.");
    }

    // Pause feedback
    if (pauseMs < 300) {
      tips.push("Add more pauses between thoughts - let your audience absorb the information.");
    } else if (pauseMs > 800) {
      tips.push("Reduce pause length - long silences can lose audience engagement.");
    }

    // Filler word feedback
    const fillerPerMinute = fillerCount / durationMinutes;
    if (fillerPerMinute > MAX_FILLER_WORDS) {
      tips.push(`Reduce filler words (um, uh, like) - you're using ${Math.round(fillerPerMinute)} per minute.`);
    }

    if (tips.length === 0) {
      return "Great delivery! Maintain this pace and pause pattern.";
    }

    return tips.join(" ");
  }
}
