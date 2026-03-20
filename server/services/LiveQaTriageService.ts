import { invokeLLM } from "../_core/llm";
import { generateComplianceSafeResponse } from "./AgiComplianceService";

export interface TriageResult {
  category: "financial" | "operational" | "esg" | "governance" | "strategy" | "general";
  triageScore: number;
  triageClassification: "high_priority" | "standard" | "low_priority" | "duplicate" | "hostile";
  triageReason: string;
  complianceRiskScore: number;
  priorityScore: number;
  complianceFlags: ComplianceFlag[];
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

    const parsed = JSON.parse(result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return {
      category: parsed.category || "general",
      triageScore: Math.min(100, Math.max(0, parsed.triageScore || 50)),
      triageClassification: parsed.triageClassification || "standard",
      triageReason: parsed.triageReason || "Auto-triaged",
      complianceRiskScore: Math.min(100, Math.max(0, parsed.complianceRiskScore || 0)),
      priorityScore: Math.min(100, Math.max(0, parsed.priorityScore || 50)),
      complianceFlags: Array.isArray(parsed.complianceFlags) ? parsed.complianceFlags : [],
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

    const parsed = JSON.parse(result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
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
