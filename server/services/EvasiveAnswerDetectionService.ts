// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface EvasivenessScore {
  score: number;
  explanation: string;
  flags: string[];
  hedgingPhrases: string[];
  directnessIndex: number;
  topicShiftDetected: boolean;
}

export class EvasiveAnswerDetectionService {
  static async scoreResponse(
    responseText: string,
    questionText: string,
    speakerRole?: string
  ): Promise<EvasivenessScore> {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert forensic linguist specializing in detecting evasive language in earnings calls, AGMs, and investor Q&A sessions. You understand SEC Regulation FD, JSE Listing Requirements, and FCA disclosure obligations. Your analysis must be precise, evidence-based, and actionable for compliance officers.`,
        },
        {
          role: "user",
          content: `Analyze the executive RESPONSE in context of the investor/analyst QUESTION.

Score evasiveness from 0.0 (completely direct & transparent) to 1.0 (highly evasive / non-answer).

Detection criteria:
1. HEDGING: Weak modals ("might", "possibly", "could potentially"), excessive qualifiers
2. TOPIC SHIFT: Answer pivots to unrelated topic, deflects to generic corporate messaging
3. NON-ANSWER: Appears to respond but provides no substantive information
4. REPETITION: Restates question or previous talking points without new data
5. SELECTIVE FRAMING: Only addresses favorable aspects, ignores core question
6. TEMPORAL DEFLECTION: "We'll address that in future quarters" without commitment
7. AUTHORITY DEFLECTION: "I'll have my team follow up" on questions they should answer
8. JARGON FLOODING: Excessive technical language to obscure a simple point

Speaker role: ${speakerRole || "Executive"}

QUESTION: ${questionText}

RESPONSE: ${responseText}

Output JSON only:
{
  "score": number (0.0-1.0),
  "explanation": "concise evidence-based reason",
  "flags": ["hedging", "topic_shift", "non_answer", "repetition", "selective_framing", "temporal_deflection", "authority_deflection", "jargon_flooding"],
  "hedgingPhrases": ["exact phrases from response that indicate hedging"],
  "directnessIndex": number (0-100, how directly the question was addressed),
  "topicShiftDetected": boolean
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices?.[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        score: Math.min(1, Math.max(0, parsed.score ?? 0.5)),
        explanation: parsed.explanation || "Analysis unavailable",
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        hedgingPhrases: Array.isArray(parsed.hedgingPhrases) ? parsed.hedgingPhrases : [],
        directnessIndex: parsed.directnessIndex ?? 50,
        topicShiftDetected: parsed.topicShiftDetected ?? false,
      };
    } catch {
      return {
        score: 0.5,
        explanation: "Analysis parsing failed — manual review recommended",
        flags: [],
        hedgingPhrases: [],
        directnessIndex: 50,
        topicShiftDetected: false,
      };
    }
  }

  static async batchAnalyzeQA(
    qaExchanges: Array<{ questionText: string; responseText: string; speakerRole?: string; questionId?: number }>
  ): Promise<Array<EvasivenessScore & { questionId?: number }>> {
    const results = await Promise.all(
      qaExchanges.map(async (qa) => {
        const score = await this.scoreResponse(qa.responseText, qa.questionText, qa.speakerRole);
        return { ...score, questionId: qa.questionId };
      })
    );
    return results;
  }

  static async logEvasiveness(
    eventId: number,
    sessionId: number,
    questionText: string,
    responseText: string,
    scoreData: EvasivenessScore
  ) {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO evasiveness_logs (event_id, session_id, question_text, response_text, score, directness_index, explanation, flags, hedging_phrases, topic_shift_detected, created_at)
      VALUES (${eventId}, ${sessionId}, ${questionText}, ${responseText}, ${scoreData.score}, ${scoreData.directnessIndex}, ${scoreData.explanation}, ${JSON.stringify(scoreData.flags)}, ${JSON.stringify(scoreData.hedgingPhrases)}, ${scoreData.topicShiftDetected ? 1 : 0}, NOW())
    `);
  }

  static async getEventEvasiveness(eventId: number) {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`
      SELECT * FROM evasiveness_logs WHERE event_id = ${eventId} ORDER BY created_at DESC
    `);
    return rows;
  }

  static async getAggregateStats(eventId: number) {
    const db = await getDb();
    if (!db) return null;
    const [rows] = await db.execute(sql`
      SELECT 
        COUNT(*) as total_analyzed,
        AVG(score) as avg_evasiveness,
        AVG(directness_index) as avg_directness,
        SUM(CASE WHEN score > 0.7 THEN 1 ELSE 0 END) as high_evasion_count,
        SUM(CASE WHEN topic_shift_detected = 1 THEN 1 ELSE 0 END) as topic_shifts
      FROM evasiveness_logs 
      WHERE event_id = ${eventId}
    `);
    return (rows as any)?.[0] || null;
  }
}
