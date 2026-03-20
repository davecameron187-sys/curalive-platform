import { invokeLLM } from "../_core/llm";

export interface GeneratedTool {
  toolName: string;
  description: string;
  category: "compliance" | "analytics" | "communication" | "automation" | "risk";
  implementation: string;
  triggerConditions: string[];
  estimatedImpact: string;
  confidence: number;
}

export interface ToolGenerationResult {
  tools: GeneratedTool[];
  reasoning: string;
  sessionContext: string;
}

export async function generateAutonomousTools(
  sessionContext: {
    eventName: string;
    clientName: string;
    totalQuestions: number;
    categories: Record<string, number>;
    avgComplianceRisk: number;
    flaggedCount: number;
    topThemes: string[];
  }
): Promise<ToolGenerationResult> {
  try {
    const result = await invokeLLM({
      model: "openai:gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are CuraLive's AGI Tool Generator Engine. Based on real-time Q&A session data, autonomously propose new micro-tools that would improve the operator's workflow.

Analyze the session context and propose 2-4 tools that would be most valuable RIGHT NOW based on the patterns you detect.

Tool categories: compliance, analytics, communication, automation, risk

Return ONLY valid JSON:
{
  "tools": [
    {
      "toolName": "short_snake_case_name",
      "description": "What this tool does",
      "category": "compliance|analytics|communication|automation|risk",
      "implementation": "Brief technical description of how it works",
      "triggerConditions": ["when X happens", "when Y exceeds threshold"],
      "estimatedImpact": "Expected improvement description",
      "confidence": 0.0-1.0
    }
  ],
  "reasoning": "Why these tools were proposed based on session patterns",
  "sessionContext": "Summary of detected patterns"
}`
        },
        {
          role: "user",
          content: `Session: "${sessionContext.eventName}" | Client: "${sessionContext.clientName}"
Questions: ${sessionContext.totalQuestions} | Flagged: ${sessionContext.flaggedCount}
Avg Compliance Risk: ${sessionContext.avgComplianceRisk.toFixed(1)}%
Categories: ${JSON.stringify(sessionContext.categories)}
Top Themes: ${sessionContext.topThemes.join(", ")}`
        }
      ],
      temperature: 0.4,
    });

    const parsed = JSON.parse(result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return {
      tools: Array.isArray(parsed.tools) ? parsed.tools.map((t: any) => ({
        toolName: t.toolName || "unnamed_tool",
        description: t.description || "",
        category: t.category || "automation",
        implementation: t.implementation || "",
        triggerConditions: Array.isArray(t.triggerConditions) ? t.triggerConditions : [],
        estimatedImpact: t.estimatedImpact || "",
        confidence: Math.min(1, Math.max(0, t.confidence || 0.5)),
      })) : [],
      reasoning: parsed.reasoning || "",
      sessionContext: parsed.sessionContext || "",
    };
  } catch (err) {
    console.error("[AgiToolGenerator] Generation failed:", err);
    return { tools: [], reasoning: "Tool generation unavailable", sessionContext: "" };
  }
}

export async function evaluateToolEffectiveness(
  toolName: string,
  toolDescription: string,
  sessionMetrics: { before: Record<string, number>; after: Record<string, number> }
): Promise<{ score: number; recommendation: "deploy" | "iterate" | "discard"; feedback: string }> {
  try {
    const result = await invokeLLM({
      model: "openai:gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Evaluate if a proposed Q&A tool would be effective. Return JSON: { "score": 0-100, "recommendation": "deploy|iterate|discard", "feedback": "explanation" }`
        },
        {
          role: "user",
          content: `Tool: ${toolName}\nDescription: ${toolDescription}\nMetrics Before: ${JSON.stringify(sessionMetrics.before)}\nMetrics After: ${JSON.stringify(sessionMetrics.after)}`
        }
      ],
      temperature: 0.2,
    });

    const parsed = JSON.parse(result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return {
      score: parsed.score || 50,
      recommendation: parsed.recommendation || "iterate",
      feedback: parsed.feedback || "",
    };
  } catch {
    return { score: 50, recommendation: "iterate", feedback: "Evaluation unavailable" };
  }
}
