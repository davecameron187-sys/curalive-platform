import { rawSql } from "../db";

async function getCachedNarrative(sessionId: number, orgId: number): Promise<NarrativeOutput | null> {
  const [rows] = await rawSql(
    `SELECT narratives, input_signals, created_at FROM session_narrative_cache WHERE session_id = $1 AND org_id = $2`,
    [sessionId, orgId]
  );
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    sessionId,
    orgId,
    narratives: row.narratives,
    inputSignals: row.input_signals,
    generatedAt: row.created_at,
  };
}

async function setCachedNarrative(output: NarrativeOutput): Promise<void> {
  await rawSql(
    `INSERT INTO session_narrative_cache (session_id, org_id, narratives, input_signals)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (session_id) DO UPDATE SET narratives = $3, input_signals = $4, created_at = now()`,
    [output.sessionId, output.orgId, JSON.stringify(output.narratives), output.inputSignals]
  ).catch(() => {});
}
import { invokeLLM } from "../_core/llm";

export interface NarrativeStatement {
  statement: string;
  source: "anchored_delta" | "intra_session_shift";
  topic?: string;
  confidence?: string;
}

export interface NarrativeOutput {
  sessionId: number;
  orgId: number;
  narratives: NarrativeStatement[];
  inputSignals: number;
  generatedAt: string;
}

const GENERIC_PHRASES = [
  "sentiment has",
  "sentiment became",
  "recent segments",
  "communication dynamic",
  "pattern emerging",
  "pattern detected",
  "signals indicate",
  "overall sentiment",
  "sentiment deteriorat",
  "stress pattern",
  "communication challenges",
  "mood shifted",
];

function isGeneric(text: string): boolean {
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some(phrase => lower.includes(phrase));
}

function isSpecific(text: string): boolean {
  const lower = text.toLowerCase();
  const hasSpeaker = /\b(ceo|cfo|coo|chairman|director|management|speaker|he|she|they)\b/.test(lower) || /[A-Z][a-z]+ [A-Z][a-z]+/.test(text);
  const hasChangeLanguage = /\b(shifted|moved|changed|softened|strengthened|revised|qualified|withdrew|confirmed|indicated|previously|prior|earlier|now|current|from|to)\b/.test(lower);
  const hasTopic = /\b(debt|leverage|margin|revenue|guidance|dividend|capital|cost|headcount|strategy|acquisition|cash|liquidity|regulatory|esg|outlook|target|ratio|growth|earnings)\b/.test(lower);
  return hasSpeaker && hasChangeLanguage && hasTopic;
}

export async function generateNarrativeOutput(
  sessionId: number,
  orgId: number
): Promise<NarrativeOutput> {
  console.log("[NarrativeOutput] Starting for session=" + sessionId + " org=" + orgId);

  const cached = await getCachedNarrative(sessionId, orgId);
  if (cached) {
    console.log("[NarrativeOutput] Cache hit for session=" + sessionId);
    return cached;
  }

  const empty: NarrativeOutput = {
    sessionId,
    orgId,
    narratives: [],
    inputSignals: 0,
    generatedAt: new Date().toISOString(),
  };

  // PRIMARY: anchored deltas — cross-session commitment shifts with verbatim quotes
  const [anchoredRows] = await rawSql(`
    SELECT topic, change_type, confidence, summary, why_it_matters,
           prior_quote, current_quote, ir_framing, anchor_source_date
    FROM anchored_deltas
    WHERE session_id = $1 AND org_id = $2
      AND prior_quote IS NOT NULL
      AND current_quote IS NOT NULL
      AND confidence IN ('high', 'medium')
    ORDER BY created_at ASC
  `, [sessionId, orgId]);

  const anchoredDeltas = anchoredRows ?? [];

  // FALLBACK: intra-session ODR shifts — real language from same session
  // Only used if no anchored deltas exist
  // Must have actual statement language — no boilerplate
  let intraSessionShifts: any[] = [];
  if (anchoredDeltas.length === 0) {
    const [odrRows] = await rawSql(`
      SELECT topic, commitment_level, statement, speaker_id, source_date
      FROM organisation_disclosure_record
      WHERE session_id = $1 AND org_id = $2
        AND commitment_level IN ('CONFIRMED', 'INDICATED')
        AND LENGTH(statement) > 30
      ORDER BY id ASC
    `, [sessionId, orgId]);
    intraSessionShifts = odrRows ?? [];
  }

  const totalInputs = anchoredDeltas.length + intraSessionShifts.length;

  // HARD EVIDENCE GATE — no evidence, no output
  if (totalInputs === 0) {
    console.log("[NarrativeOutput] GATED — no anchored deltas or ODR statements available");
    return empty;
  }

  console.log("[NarrativeOutput] Inputs — anchored_deltas=" + anchoredDeltas.length + " intra_session_odr=" + intraSessionShifts.length);

  const inputBlocks: string[] = [];

  if (anchoredDeltas.length > 0) {
    inputBlocks.push("CROSS-SESSION COMMITMENT SHIFTS (primary evidence):");
    for (const d of anchoredDeltas) {
      inputBlocks.push(
        "Topic: " + d.topic + "\n" +
        "Change type: " + d.change_type + " (" + d.confidence + " confidence)\n" +
        "Prior statement: \"" + d.prior_quote + "\"\n" +
        "Current statement: \"" + d.current_quote + "\"\n" +
        "Why it matters: " + d.why_it_matters
      );
    }
  }

  if (intraSessionShifts.length > 0) {
    inputBlocks.push("INTRA-SESSION DISCLOSURES (use only if speaker and topic are clear):");
    for (const s of intraSessionShifts) {
      inputBlocks.push(
        "Speaker: " + (s.speaker_id || "Unknown") + "\n" +
        "Topic: " + s.topic + "\n" +
        "Commitment: " + s.commitment_level + "\n" +
        "Statement: \"" + s.statement + "\""
      );
    }
  }

  const prompt = inputBlocks.join("\n\n");

  const system = `You are a senior IR strategist writing a real-time intelligence briefing.

STRICT RULES — every rule is mandatory:
1. Every statement MUST name a specific actor (CEO, CFO, management, speaker name)
2. Every statement MUST name a specific topic (debt, margins, guidance, leverage, revenue)
3. Every statement MUST describe a specific change (what shifted, from what, to what)
4. Use verbatim quote fragments where provided — do not paraphrase if you have the actual words
5. Time anchor every statement — use "previously", "earlier", "in prior sessions", "now", "in this session"
6. Maximum 2 statements. Only include statements you can fully ground in the evidence above.
7. If you cannot write a statement that satisfies rules 1-5, write nothing.
8. NEVER write: "sentiment", "pattern", "segment", "signal", "stress", "deterioration", "noticeable", "potential"
9. Output ONLY the statements, one per line. No preamble. No labels. No explanation.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: "Write the briefing from this evidence:\n\n" + prompt },
    ],
  });

  const raw = response?.choices?.[0]?.message?.content ?? "";

  const lines = raw
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 30)
    .filter((l: string) => !isGeneric(l))
    .filter((l: string) => {
      if (!isSpecific(l)) {
        console.log("[NarrativeOutput] REJECTED — not specific enough: " + l);
        return false;
      }
      return true;
    });

  const narratives: NarrativeStatement[] = lines.slice(0, 2).map((line: string) => ({
    statement: line,
    source: anchoredDeltas.length > 0 ? "anchored_delta" : "intra_session_shift",
  }));

  console.log("[NarrativeOutput] Generated " + narratives.length + " narrative(s)");
  for (const n of narratives) {
    console.log("[NarrativeOutput] — " + n.statement);
  }

  const output: NarrativeOutput = {
    sessionId,
    orgId,
    narratives,
    inputSignals: totalInputs,
    generatedAt: new Date().toISOString(),
  };
  await setCachedNarrative(output);
  return output;
}
