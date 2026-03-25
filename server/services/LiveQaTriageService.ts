import { invokeLLM } from "../_core/llm";
import { generateComplianceSafeResponse } from "./AgiComplianceService";

function extractLLMText(result: any): string {
  if (result?.text) return result.text;
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((p: any) => p.text || "").join("");
  return "";
}

export interface SentimentPolarity {
  polarity: "positive" | "neutral" | "negative" | "adversarial";
  polarityScore: number;
  disclosureUrgency: number;
  p2pRank: number;
}

export interface GoLiveAuthorisation {
  authorised: boolean;
  triageScore: number;
  complianceCleared: boolean;
  minimumThreshold: number;
  reason: string;
}

const DEFAULT_GO_LIVE_THRESHOLD = 40;

export function computeP2P(
  sentimentPolarity: "positive" | "neutral" | "negative" | "adversarial",
  polarityScore: number,
  disclosureUrgency: number
): number {
  const polarityWeights: Record<string, number> = {
    adversarial: 1.0,
    negative: 0.75,
    neutral: 0.4,
    positive: 0.2,
  };
  const polarityWeight = polarityWeights[sentimentPolarity] ?? 0.4;
  const normalizedPolarity = Math.min(1, Math.max(0, polarityScore / 100));
  const normalizedUrgency = Math.min(1, Math.max(0, disclosureUrgency / 100));
  const p2pRank = (polarityWeight * 0.4) + (normalizedPolarity * 0.25) + (normalizedUrgency * 0.35);
  return Math.round(p2pRank * 100);
}

export function authoriseGoLive(
  triageScore: number,
  complianceRiskScore: number,
  threshold: number = DEFAULT_GO_LIVE_THRESHOLD
): GoLiveAuthorisation {
  const complianceCleared = complianceRiskScore <= 70;
  const meetsThreshold = triageScore >= threshold;
  const authorised = meetsThreshold && complianceCleared;

  let reason: string;
  if (authorised) {
    reason = `Authorised: triage score ${triageScore} meets threshold ${threshold}, compliance risk ${complianceRiskScore} within limits`;
  } else if (!complianceCleared) {
    reason = `Blocked: compliance risk score ${complianceRiskScore} exceeds safety limit (max 70). Manual review required.`;
  } else {
    reason = `Blocked: triage score ${triageScore} below minimum threshold ${threshold}. Operator override available.`;
  }

  return { authorised, triageScore, complianceCleared, minimumThreshold: threshold, reason };
}

export interface TriageResult {
  category: "financial" | "operational" | "esg" | "governance" | "strategy" | "general";
  triageScore: number;
  triageClassification: "high_priority" | "standard" | "low_priority" | "duplicate" | "hostile";
  triageReason: string;
  complianceRiskScore: number;
  priorityScore: number;
  complianceFlags: ComplianceFlag[];
  sentimentPolarity: SentimentPolarity;
  goLiveAuthorisation: GoLiveAuthorisation;
}

export interface ComplianceFlag {
  jurisdiction: string;
  riskScore: number;
  riskType: string;
  riskDescription: string;
  recommendedAction: "forward" | "route_to_bot" | "legal_review" | "delay_24h";
  autoRemediationSuggestion: string;
}

export interface AutoDraftResult {
  answerText: string;
  reasoning: string;
}

export async function triageQuestion(
  questionText: string,
  eventName: string,
  clientName: string,
  existingQuestions: string[]
): Promise<TriageResult> {
  try {
    const existingContext = existingQuestions.length > 0
      ? `\nExisting questions already asked:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

    const result = await invokeLLM({
      model: "openai:gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are CuraLive's Live Q&A Triage Engine for investor events. Analyze submitted questions and return a JSON assessment.

Event: "${eventName}" | Client: "${clientName}"
${existingContext}

Return ONLY valid JSON with these fields:
{
  "category": one of "financial"|"operational"|"esg"|"governance"|"strategy"|"general",
  "triageScore": 0-100 (urgency/relevance score),
  "triageClassification": one of "high_priority"|"standard"|"low_priority"|"duplicate"|"hostile",
  "triageReason": "brief explanation",
  "complianceRiskScore": 0-100 (regulatory risk),
  "priorityScore": 0-100 (combined priority for queue ordering),
  "sentimentPolarity": one of "positive"|"neutral"|"negative"|"adversarial",
  "polarityScore": 0-100 (intensity of sentiment polarity),
  "disclosureUrgency": 0-100 (how urgently this requires a disclosure-sensitive response),
  "complianceFlags": [
    {
      "jurisdiction": "ZA_JSE|US_SEC|UK_FCA|EU_ESMA|global",
      "riskScore": 0-100,
      "riskType": "material_non_public|forward_looking|insider_trading|selective_disclosure|market_manipulation",
      "riskDescription": "explanation",
      "recommendedAction": "forward|route_to_bot|legal_review|delay_24h",
      "autoRemediationSuggestion": "suggested safe wording"
    }
  ]
}`
        },
        { role: "user", content: questionText }
      ],
      temperature: 0.2,
    });

    const llmText = extractLLMText(result);
    if (!llmText) throw new Error("Empty LLM response");
    const parsed = JSON.parse(llmText.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    const triageScore = Math.min(100, Math.max(0, parsed.triageScore || 50));
    const complianceRiskScore = Math.min(100, Math.max(0, parsed.complianceRiskScore || 0));
    const polarity = (["positive", "neutral", "negative", "adversarial"].includes(parsed.sentimentPolarity) ? parsed.sentimentPolarity : "neutral") as "positive" | "neutral" | "negative" | "adversarial";
    const polarityScore = Math.min(100, Math.max(0, parsed.polarityScore || 50));
    const disclosureUrgency = Math.min(100, Math.max(0, parsed.disclosureUrgency || 30));
    const p2pRank = computeP2P(polarity, polarityScore, disclosureUrgency);
    const goLive = authoriseGoLive(triageScore, complianceRiskScore);

    const basePriority = Math.min(100, Math.max(0, parsed.priorityScore || 50));
    const effectivePriority = Math.min(100, Math.round((basePriority * 0.6) + (p2pRank * 0.4)));

    return {
      category: parsed.category || "general",
      triageScore,
      triageClassification: parsed.triageClassification || "standard",
      triageReason: parsed.triageReason || "Auto-triaged",
      complianceRiskScore,
      priorityScore: effectivePriority,
      complianceFlags: Array.isArray(parsed.complianceFlags) ? parsed.complianceFlags : [],
      sentimentPolarity: { polarity, polarityScore, disclosureUrgency, p2pRank },
      goLiveAuthorisation: goLive,
    };
  } catch (err) {
    console.error("[LiveQaTriage] Triage failed:", err);
    return {
      category: "general",
      triageScore: 50,
      triageClassification: "standard",
      triageReason: "Auto-triage unavailable — manual review recommended",
      complianceRiskScore: 0,
      priorityScore: 50,
      complianceFlags: [],
      sentimentPolarity: { polarity: "neutral" as const, polarityScore: 50, disclosureUrgency: 30, p2pRank: computeP2P("neutral", 50, 30) },
      goLiveAuthorisation: authoriseGoLive(50, 0),
    };
  }
}

export async function generateAutoDraft(
  questionText: string,
  eventName: string,
  clientName: string,
  category: string
): Promise<AutoDraftResult> {
  try {
    const result = await invokeLLM({
      model: "openai:gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are CuraLive's Auto-Draft Response Engine. Generate a professional, compliance-safe draft answer for an investor question.

Event: "${eventName}" | Client: "${clientName}" | Category: ${category}

Guidelines:
- Be factual and measured; avoid forward-looking statements
- Include appropriate disclaimers where needed
- Flag if the question requires management/legal input
- Keep under 200 words

Return ONLY valid JSON:
{
  "answerText": "the draft response",
  "reasoning": "why this response is appropriate"
}`
        },
        { role: "user", content: questionText }
      ],
      temperature: 0.3,
    });

    const llmText = extractLLMText(result);
    if (!llmText) throw new Error("Empty LLM response");
    const parsed = JSON.parse(llmText.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    let answerText = parsed.answerText || "Draft unavailable — please compose manually.";

    try {
      const complianceCheck = await generateComplianceSafeResponse(
        questionText,
        category,
        ["ZA_JSE", "US_SEC", "UK_FCA", "EU_ESMA"],
        answerText
      );
      if (complianceCheck.safeResponse) {
        answerText = complianceCheck.safeResponse;
      }
      if (complianceCheck.disclaimers.length > 0) {
        answerText += "\n\n" + complianceCheck.disclaimers.join("\n");
      }
    } catch {
      console.log("[LiveQaTriage] AGI compliance pass skipped — using base draft");
    }

    return {
      answerText,
      reasoning: parsed.reasoning || "",
    };
  } catch (err) {
    console.error("[LiveQaTriage] Auto-draft failed:", err);
    return {
      answerText: "Auto-draft unavailable. Please compose a response manually.",
      reasoning: "AI service error",
    };
  }
}
