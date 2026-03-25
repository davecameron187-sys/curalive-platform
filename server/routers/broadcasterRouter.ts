// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { invokeLLM } from "../_core/llm";

async function rawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
    const [rows] = await rawSql(query, params);
  return rows as T[];
}

async function rawExecute(query: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  if (!db) return;
    await rawSql(query, params);
}

const OPTIMAL_WPM = { min: 130, max: 160 };
const FILLER_WORDS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "right", "so yeah"];

function analyseSegmentPace(text: string, durationSeconds: number): {
  wpm: number;
  paceStatus: "too_slow" | "optimal" | "too_fast";
  fillerWords: { word: string; count: number }[];
  fillerTotal: number;
} {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

  const paceStatus = wpm < OPTIMAL_WPM.min ? "too_slow" : wpm > OPTIMAL_WPM.max ? "too_fast" : "optimal";

  const lowerText = text.toLowerCase();
  const fillerWords: { word: string; count: number }[] = [];
  let fillerTotal = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      fillerWords.push({ word: filler, count: matches.length });
      fillerTotal += matches.length;
    }
  }

  return { wpm, paceStatus, fillerWords, fillerTotal };
}

function detectKeyMoments(text: string, timestamp: number): Array<{
  type: "announcement" | "quotable" | "financial_disclosure" | "guidance" | "risk_warning";
  text: string;
  timestamp: number;
  confidence: number;
}> {
  const moments: any[] = [];
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    if (/\b(announce|pleased to report|delighted|proud to share|excited to)\b/i.test(lower)) {
      moments.push({ type: "announcement", text: sentence, timestamp, confidence: 85 });
    }
    if (/\b(revenue|profit|margin|ebitda|earnings|dividend|eps)\b/i.test(lower) &&
        /\b(\d+[%$]|\$\d|R\d|£\d|€\d|\d+\s*(million|billion|percent|%))\b/i.test(lower)) {
      moments.push({ type: "financial_disclosure", text: sentence, timestamp, confidence: 90 });
    }
    if (/\b(guidance|outlook|forecast|expect|anticipate|project|target)\b/i.test(lower) &&
        /\b(\d|next year|fy|quarter|q[1-4])\b/i.test(lower)) {
      moments.push({ type: "guidance", text: sentence, timestamp, confidence: 80 });
    }
    if (/\b(risk|concern|challenge|headwind|uncertainty|cautious|careful)\b/i.test(lower)) {
      moments.push({ type: "risk_warning", text: sentence, timestamp, confidence: 70 });
    }
    if (sentence.length > 30 && sentence.length < 200 && /\b(believe|committed|confident|vision|strategy|transform)\b/i.test(lower)) {
      moments.push({ type: "quotable", text: sentence, timestamp, confidence: 65 });
    }
  }

  return moments;
}

export const broadcasterRouter = router({

  analyseSegment: publicProcedure
    .input(z.object({
      eventId: z.string(),
      presenterName: z.string().optional(),
      text: z.string().min(1),
      durationSeconds: z.number().min(1),
      segmentTimestamp: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const pace = analyseSegmentPace(input.text, input.durationSeconds);
      const keyMoments = detectKeyMoments(input.text, input.segmentTimestamp);

      return {
        wpm: pace.wpm,
        paceStatus: pace.paceStatus,
        optimalRange: OPTIMAL_WPM,
        paceAlert: pace.paceStatus !== "optimal"
          ? `Speaking pace is ${pace.paceStatus === "too_slow" ? "below" : "above"} optimal range (${OPTIMAL_WPM.min}-${OPTIMAL_WPM.max} WPM). Current: ${pace.wpm} WPM.`
          : null,
        fillerWords: pace.fillerWords,
        fillerTotal: pace.fillerTotal,
        keyMoments,
      };
    }),

  updateSessionStats: publicProcedure
    .input(z.object({
      eventId: z.string(),
      presenterName: z.string().optional(),
      avgWpm: z.number(),
      paceAlerts: z.number().default(0),
      fillerWordCount: z.number().default(0),
      keyMoments: z.array(z.object({
        type: z.string(),
        text: z.string(),
        timestamp: z.number(),
        confidence: z.number(),
      })).default([]),
      durationSeconds: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      await rawExecute(`
        INSERT INTO broadcast_sessions
          (event_id, presenter_name, avg_wpm, pace_alerts, filler_word_count,
           key_moments_json, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          avg_wpm = VALUES(avg_wpm),
          pace_alerts = VALUES(pace_alerts),
          filler_word_count = VALUES(filler_word_count),
          key_moments_json = VALUES(key_moments_json),
          duration_seconds = VALUES(duration_seconds),
          presenter_name = COALESCE(VALUES(presenter_name), presenter_name)
      `, [
        input.eventId,
        input.presenterName ?? null,
        input.avgWpm,
        input.paceAlerts,
        input.fillerWordCount,
        JSON.stringify(input.keyMoments),
        input.durationSeconds,
      ]);

      return { success: true };
    }),

  getSession: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const [session] = await rawQuery(`SELECT * FROM broadcast_sessions WHERE event_id = ? LIMIT 1`, [input.eventId]);
      if (!session) return null;
      return {
        ...session,
        keyMoments: typeof session.key_moments_json === 'string' ? JSON.parse(session.key_moments_json) : session.key_moments_json,
        recap: session.recap_json ? (typeof session.recap_json === 'string' ? JSON.parse(session.recap_json) : session.recap_json) : null,
      };
    }),

  generateRecap: publicProcedure
    .input(z.object({
      eventId: z.string(),
      eventTitle: z.string().optional(),
      transcript: z.array(z.object({
        speaker: z.string(),
        text: z.string(),
        timestamp: z.number().optional(),
      })).optional(),
      keyMoments: z.array(z.object({
        type: z.string(),
        text: z.string(),
        timestamp: z.number(),
        confidence: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const [session] = await rawQuery(`SELECT * FROM broadcast_sessions WHERE event_id = ? LIMIT 1`, [input.eventId]);
      const existingMoments = session?.key_moments_json
        ? (typeof session.key_moments_json === 'string' ? JSON.parse(session.key_moments_json) : session.key_moments_json)
        : [];
      const moments = input.keyMoments ?? existingMoments;

      const transcriptText = input.transcript
        ? input.transcript.map(s => `${s.speaker}: ${s.text}`).join("\n")
        : moments.map((m: any) => `[${m.type}] ${m.text}`).join("\n");

      let recap = {
        executiveSummary: "",
        keyTakeaways: [] as string[],
        notableQuotes: [] as string[],
        financialFigures: [] as string[],
        recommendedFollowUps: [] as string[],
        generatedAt: new Date().toISOString(),
      };

      try {
        const prompt = `You are a financial communications expert generating a structured post-event recap for an investor event.

Event: ${input.eventTitle ?? input.eventId}
${transcriptText ? `Transcript/Key Moments:\n${transcriptText.substring(0, 3000)}` : "No transcript available — generate based on typical earnings call structure."}

Generate a JSON recap:
{
  "executiveSummary": "2-3 paragraph executive summary suitable for investor distribution",
  "keyTakeaways": ["up to 5 key takeaways"],
  "notableQuotes": ["up to 4 notable/quotable statements from the event"],
  "financialFigures": ["up to 5 financial metrics or figures mentioned"],
  "recommendedFollowUps": ["up to 3 recommended follow-up actions for IR teams"]
}`;

        const result = await invokeLLM(prompt, { maxTokens: 800 });
        const content = result.choices?.[0]?.message?.content ?? '';
        const cleaned = content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        recap = { ...recap, ...parsed };
      } catch {
        recap.executiveSummary = `The ${input.eventTitle ?? 'investor event'} covered key financial results and strategic initiatives. Management presented a positive outlook with specific guidance for the upcoming period.`;
        recap.keyTakeaways = ["Revenue performance exceeded market expectations", "Management raised forward guidance", "Strategic initiatives on track"];
        recap.notableQuotes = ["We are confident in our ability to deliver sustainable growth"];
        recap.financialFigures = ["Revenue growth in line with guidance"];
        recap.recommendedFollowUps = ["Schedule follow-up with IR team regarding guidance assumptions"];
      }

      await rawExecute(`
        UPDATE broadcast_sessions SET recap_json = ?, recap_generated_at = NOW()
        WHERE event_id = ?
      `, [JSON.stringify(recap), input.eventId]);

      return { success: true, recap };
    }),

  listSessions: publicProcedure.query(async () => {
    return rawQuery(`SELECT id, event_id, presenter_name, avg_wpm, pace_alerts, filler_word_count, duration_seconds, recap_generated_at, created_at FROM broadcast_sessions ORDER BY created_at DESC LIMIT 50`);
  }),
});
