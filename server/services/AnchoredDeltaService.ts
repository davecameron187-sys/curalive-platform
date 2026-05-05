import OpenAI from "openai";

export interface AnchoredDeltaInput {
  topic: string;
  speaker: string;
  priorStatement: string;
  priorCommitmentLevel: "explicit" | "implied" | "hedged" | "absent";
  currentStatement: string;
  currentCommitmentLevel?: "explicit" | "implied" | "hedged" | "absent";
}

export type ChangeType = "strengthened" | "softened" | "qualified" | "delayed" | "unchanged" | "suppress";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface AnchoredDeltaResult {
  suppress: false;
  change_type: Exclude<ChangeType, "suppress">;
  confidence: ConfidenceLevel;
  summary: string;
  why_it_matters: string;
  prior_quote: string;
  current_quote: string;
  ir_framing: string;
}

export interface AnchoredDeltaSuppressed {
  suppress: true;
  reason: string;
}


export type AnchoredDeltaOutput = AnchoredDeltaResult | AnchoredDeltaSuppressed;

export function preSuppressionCheck(
  priorStatement: string,
  currentStatement: string
): { suppress: boolean; reason?: string } {
  if (!priorStatement || !currentStatement)
    return { suppress: true, reason: "missing_statement" };
  if (priorStatement.toLowerCase().trim() === currentStatement.toLowerCase().trim())
    return { suppress: true, reason: "no_change" };
  if (currentStatement.trim().split(" ").length < 5)
    return { suppress: true, reason: "low_information" };
  return { suppress: false };
}

const SYSTEM_PROMPT = `You are a senior IR intelligence analyst.
Compare two management statements and classify the shift as one of:
strengthened | softened | qualified | delayed | unchanged | suppress
Rules:
- NEVER use scores, percentages, or sentiment language
- NEVER give advice
- IR framing must begin with "IR may" or "This may prompt"
- Return ONLY valid JSON. No preamble. No markdown.
Output when not suppressed:
{"suppress":false,"change_type":"softened","confidence":"high","summary":"...","why_it_matters":"...","prior_quote":"...","current_quote":"...","ir_framing":"..."}
If suppressing:
{"suppress":true,"reason":"..."}`;

function buildUserPrompt(input: AnchoredDeltaInput): string {
  return `Topic: ${input.topic}
Speaker: ${input.speaker}
Prior statement: "${input.priorStatement}"
Prior commitment level: ${input.priorCommitmentLevel}
Current statement: "${input.currentStatement}"
Current commitment level: ${input.currentCommitmentLevel ?? "unknown"}
Classify the shift and return the JSON object.`;
}

export async function generateAnchoredDelta(
  input: AnchoredDeltaInput
): Promise<AnchoredDeltaOutput> {
  const preCheck = preSuppressionCheck(input.priorStatement, input.currentStatement);
  if (preCheck.suppress) {
    console.log("[AnchoredDelta] DELTA_SUPPRESSED reason=" + preCheck.reason + " topic=" + input.topic);
    return { suppress: true, reason: preCheck.reason ?? "pre_suppression" };
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let raw: string;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });
    raw = response.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[AnchoredDelta] LLM call failed:", err);
    return { suppress: true, reason: "LLM_ERROR" };
  }

  let parsed: AnchoredDeltaOutput;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    console.error("[AnchoredDelta] JSON parse failed");
    return { suppress: true, reason: "PARSE_ERROR" };
  }
  if (parsed.suppress === true) {
    console.log("[AnchoredDelta] DELTA_SUPPRESSED reason=" + (parsed as AnchoredDeltaSuppressed).reason + " topic=" + input.topic);
    return parsed;
  }
  const result = parsed as AnchoredDeltaResult;
  const required = ["change_type","confidence","summary","why_it_matters","prior_quote","current_quote","ir_framing"] as const;
  for (const f of required) {
    if (!result[f]) return { suppress: true, reason: "VALIDATION_ERROR_missing_" + f };
  }
  console.log("[AnchoredDelta] DELTA_GENERATED topic=" + input.topic + " change_type=" + result.change_type + " confidence=" + result.confidence);
  return result;
}
