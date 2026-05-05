import { rawSql } from "../db";
import { invokeLLM } from "../_core/llm";

export interface NarrativeStatement {
  statement: string;
  source: "anchored_delta" | "narrative_delta";
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

export async function generateNarrativeOutput(
  sessionId: number,
  orgId: number
): Promise<NarrativeOutput> {
  console.log("[NarrativeOutput] Starting for session=" + sessionId + " org=" + orgId);

  const [anchoredRows] = await rawSql(`
    SELECT topic, change_type, confidence, summary, why_it_matters, prior_quote, current_quote, ir_framing
    FROM anchored_deltas
    WHERE session_id = $1 AND org_id = $2
    ORDER BY created_at ASC
  `, [sessionId, orgId]);

  const shadowId = "shadow-" + sessionId;
  const [deltaRows] = await rawSql(`
    SELECT title, body, severity, pipeline
    FROM intelligence_feed
    WHERE session_id = $1
      AND pipeline IN ('correlation', 'compliance')
      AND severity IN ('high', 'critical')
    ORDER BY created_at ASC
    LIMIT 5
  `, [shadowId]);

  const anchoredDeltas = anchoredRows ?? [];
  const narrativeDeltas = deltaRows ?? [];
  const totalInputs = anchoredDeltas.length + narrativeDeltas.length;

  console.log("[NarrativeOutput] Inputs — anchored_deltas=" + anchoredDeltas.length + " narrative_deltas=" + narrativeDeltas.length);

  if (totalInputs === 0) {
    console.log("[NarrativeOutput] No inputs — no narrative generated");
    return {
      sessionId,
      orgId,
      narratives: [],
      inputSignals: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  const inputBlocks: string[] = [];

  if (anchoredDeltas.length > 0) {
    inputBlocks.push("ANCHORED DELTAS (primary — cross-session commitment shifts):");
    for (const d of anchoredDeltas) {
      inputBlocks.push(
        "Topic: " + d.topic + "\n" +
        "Change: " + d.change_type + " (" + d.confidence + " confidence)\n" +
        "Summary: " + d.summary + "\n" +
        "Why it matters: " + d.why_it_matters + "\n" +
        "Prior: \"" + d.prior_quote + "\"\n" +
        "Current: \"" + d.current_quote + "\""
      );
    }
  }

  if (narrativeDeltas.length > 0) {
    inputBlocks.push("\nMATERIAL SIGNALS (secondary — within-session patterns):");
    for (const d of narrativeDeltas) {
      inputBlocks.push("[" + d.pipeline + "] " + d.title + ": " + d.body);
    }
  }

  const prompt = inputBlocks.join("\n");

  const system = `You are a senior IR strategist writing a real-time intelligence briefing for a communications team during a live earnings call or investor event.

Your job is to convert analytical signals into 1-3 clear, complete narrative statements that a communications professional can act on immediately.

Rules:
- Write in calm, precise, professional IR language
- Each statement must be a complete thought — not a fragment, not a label
- Ground every statement in the evidence provided — do not manufacture insight
- Never use: "sentiment score", "dropped X points", "pattern detected", "signal", "pipeline"
- Never use bullet points or lists — write in full sentences only
- Maximum 3 statements. Minimum 1.
- If evidence is thin, write fewer statements. Never pad.
- Output ONLY the narrative statements, one per line, nothing else.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: "Generate the narrative briefing from these inputs:\n\n" + prompt },
    ],
  });

  const raw = response?.choices?.[0]?.message?.content ?? "";
  const lines = raw
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 20);

  const narratives: NarrativeStatement[] = lines.slice(0, 3).map((line: string) => ({
    statement: line,
    source: anchoredDeltas.length > 0 ? "anchored_delta" : "narrative_delta",
  }));

  console.log("[NarrativeOutput] Generated " + narratives.length + " narrative(s)");
  for (const n of narratives) {
    console.log("[NarrativeOutput] — " + n.statement);
  }

  return {
    sessionId,
    orgId,
    narratives,
    inputSignals: totalInputs,
    generatedAt: new Date().toISOString(),
  };
}
