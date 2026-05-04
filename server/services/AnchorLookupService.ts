import { invokeLLM } from "../_core/llm";
import { rawSql } from "../db";

const TOPIC_TAXONOMY = [
  "FY_GUIDANCE", "H1_GUIDANCE", "H2_GUIDANCE", "DIVIDEND_POLICY",
  "CAPITAL_ALLOCATION", "DEBT_POSITION", "MARGIN_OUTLOOK", "REVENUE_OUTLOOK",
  "COST_STRUCTURE", "HEADCOUNT", "STRATEGIC_DIRECTION", "MARKET_CONDITIONS",
  "REGULATORY_ENVIRONMENT", "ESG_COMMITMENTS", "ACQUISITION_STRATEGY",
  "OPERATIONAL_PERFORMANCE", "CASH_FLOW", "LIQUIDITY_POSITION",
] as const;

type Topic = typeof TOPIC_TAXONOMY[number];
const WRITE_ELIGIBLE_LEVELS = ["CONFIRMED", "INDICATED", "QUALIFIED"] as const;
type CommitmentLevel = "CONFIRMED" | "INDICATED" | "QUALIFIED" | "HEDGED" | "AVOIDED";

export interface DisclosureFeatures {
  topic: Topic | null;
  commitmentLevel: CommitmentLevel | null;
  statementVerbatim: string;
}

export interface DisclosureWriteInput {
  orgId: number;
  sessionId: number;
  speakerId: string | null;
  segmentRef: number;
  sourceEvent: string;
  sourceDate: string;
}

function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  return content.map((p) => (p.type === "text" ? (p.text ?? "") : "")).join("");
}

export async function extractDisclosureFeatures(
  segmentText: string
): Promise<DisclosureFeatures> {
  const fallback: DisclosureFeatures = {
    topic: null,
    commitmentLevel: null,
    statementVerbatim: segmentText,
  };
  try {
    const response = await invokeLLM({
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "You are an expert in investor relations and corporate disclosure analysis.",
            "Analyse a single transcript segment from an investor event.",
            "1. TOPIC: Does this segment contain a substantive management position on one of these topics?",
            "   FY_GUIDANCE, H1_GUIDANCE, H2_GUIDANCE, DIVIDEND_POLICY, CAPITAL_ALLOCATION,",
            "   DEBT_POSITION, MARGIN_OUTLOOK, REVENUE_OUTLOOK, COST_STRUCTURE, HEADCOUNT,",
            "   STRATEGIC_DIRECTION, MARKET_CONDITIONS, REGULATORY_ENVIRONMENT, ESG_COMMITMENTS,",
            "   ACQUISITION_STRATEGY, OPERATIONAL_PERFORMANCE, CASH_FLOW, LIQUIDITY_POSITION",
            "   Return the exact label if yes. Return null if: no match, it is a question, procedural, or filler.",
            "2. COMMITMENT_LEVEL: If topic found, classify commitment strength:",
            "   CONFIRMED — definitive, unqualified.",
            "   INDICATED — strong directional.",
            "   QUALIFIED — conditional with caveats.",
            "   HEDGED — preserves flexibility.",
            "   AVOIDED — no substantive response.",
            "   Return null if no topic identified.",
            "3. STATEMENT_VERBATIM: Exact verbatim quote representing the position. Not a summary.",
            "Return only JSON.",
          ].join("\n"),
        },
        {
          role: "user",
          content: "Transcript segment:\n\n\"" + segmentText.slice(0, 1200) + "\"",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "disclosure_features",
          strict: true,
          schema: {
            type: "object",
            properties: {
              topic: { anyOf: [{ type: "string", enum: ["FY_GUIDANCE","H1_GUIDANCE","H2_GUIDANCE","DIVIDEND_POLICY","CAPITAL_ALLOCATION","DEBT_POSITION","MARGIN_OUTLOOK","REVENUE_OUTLOOK","COST_STRUCTURE","HEADCOUNT","STRATEGIC_DIRECTION","MARKET_CONDITIONS","REGULATORY_ENVIRONMENT","ESG_COMMITMENTS","ACQUISITION_STRATEGY","OPERATIONAL_PERFORMANCE","CASH_FLOW","LIQUIDITY_POSITION"] }, { type: "null" }] },
              commitmentLevel: { anyOf: [{ type: "string", enum: ["CONFIRMED","INDICATED","QUALIFIED","HEDGED","AVOIDED"] }, { type: "null" }] },
              statementVerbatim: { type: "string" },
            },
            required: ["topic", "commitmentLevel", "statementVerbatim"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices?.[0]?.message?.content;
    if (!raw) { console.warn("[AnchorLookup] Empty LLM response"); return fallback; }
    const parsed = JSON.parse(extractContent(raw));
    const topic = TOPIC_TAXONOMY.includes(parsed.topic) ? parsed.topic as Topic : null;
    return { topic, commitmentLevel: parsed.commitmentLevel as CommitmentLevel | null, statementVerbatim: parsed.statementVerbatim ?? segmentText };
  } catch (err: any) {
    console.warn("[AnchorLookup] Feature extraction failed:", err?.message);
    return fallback;
  }
}

export async function writeDisclosureRecord(
  features: DisclosureFeatures,
  input: DisclosureWriteInput
): Promise<void> {
  const { topic, commitmentLevel, statementVerbatim } = features;
  if (!topic) return;
  if (!commitmentLevel) return;
  if (!(WRITE_ELIGIBLE_LEVELS as readonly string[]).includes(commitmentLevel)) {
    console.log("[AnchorLookup] Skipped — level " + commitmentLevel + " not write-eligible");
    return;
  }
  const wordCount = statementVerbatim.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 8) {
    console.log("[AnchorLookup] Skipped — statement too short (" + wordCount + " words)");
    return;
  }
  try {
    await rawSql(
      "INSERT INTO organisation_disclosure_record (org_id, session_id, speaker_id, topic, statement, commitment_level, source_event, source_date, segment_ref, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())",
      [input.orgId, input.sessionId, input.speakerId ?? null, topic, statementVerbatim, commitmentLevel, input.sourceEvent, input.sourceDate, input.segmentRef]
    );
    console.log("[AnchorLookup] ODR written — session=" + input.sessionId + " topic=" + topic + " level=" + commitmentLevel);
  } catch (err: any) {
    console.error("[AnchorLookup] ODR write FAILED — session=" + input.sessionId + ":", err?.message);
  }
}

export async function processSegmentForODR(
  segmentText: string,
  input: DisclosureWriteInput
): Promise<void> {
  try {
    const rows = await rawSql("SELECT org_id FROM shadow_sessions WHERE id = $1", [input.sessionId]);
    const resolvedOrgId = rows[0]?.org_id ?? input.orgId;
    const resolvedInput = { ...input, orgId: resolvedOrgId };
    const features = await extractDisclosureFeatures(segmentText);
    await writeDisclosureRecord(features, resolvedInput);
  } catch (err: any) {
    console.error("[AnchorLookup] Unexpected error — session=" + input.sessionId + ":", err?.message);
  }
}
