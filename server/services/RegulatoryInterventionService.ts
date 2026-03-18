// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

export class RegulatoryInterventionService {
  static async analyzeAndEvolve(input: {
    eventTranscript: string;
    regulatoryOutcomes?: { type: string; result: string; details: string }[];
    currentThresholds?: Record<string, number>;
    jurisdiction?: string;
    companyTicker?: string;
  }) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a self-evolving regulatory compliance AI. You analyze event transcripts and historical regulatory outcomes to autonomously improve detection thresholds, classifiers, and response templates.

Your reinforcement learning loop:
1. Analyze the transcript for compliance issues
2. Compare against historical regulatory outcomes (SEC comments, JSE queries, enforcement actions)
3. Determine if current thresholds need adjustment
4. Propose updated detection parameters
5. Generate improved response templates

Return JSON with:
- currentRiskAssessment: { overallRisk: number, topIssues: string[] }
- thresholdAdjustments: { parameter: string, currentValue: number, proposedValue: number, reasoning: string }[]
- classifierUpdates: { classifierName: string, updateType: string, details: string, expectedImprovement: number }[]
- newResponseTemplates: { trigger: string, template: string, jurisdiction: string }[]
- regulatoryLearnings: { outcome: string, lesson: string, appliedTo: string }[]
- evolutionStage: "observing" | "learning" | "adapting" | "calibrated" | "autonomous"
- confidenceInUpdates: number (0.000-1.000)
- deploymentRecommendation: "deploy_immediately" | "review_first" | "needs_more_data"
- falsePositiveReduction: number (estimated % reduction in false positives)
- explanation: string`
          },
          {
            role: "user",
            content: `Analyze and evolve compliance parameters:

TRANSCRIPT EXCERPT: "${input.eventTranscript}"
JURISDICTION: ${input.jurisdiction || "multi"}
COMPANY: ${input.companyTicker || "Unknown"}

${input.regulatoryOutcomes?.length ? `HISTORICAL REGULATORY OUTCOMES:\n${input.regulatoryOutcomes.map(o => `- ${o.type}: ${o.result} — ${o.details}`).join("\n")}` : "No prior regulatory outcomes available."}

${input.currentThresholds ? `CURRENT THRESHOLDS:\n${Object.entries(input.currentThresholds).map(([k, v]) => `${k}: ${v}`).join("\n")}` : ""}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "regulatory_evolution",
            strict: true,
            schema: {
              type: "object",
              properties: {
                currentRiskAssessment: { type: "object", properties: { overallRisk: { type: "number" }, topIssues: { type: "array", items: { type: "string" } } }, required: ["overallRisk", "topIssues"], additionalProperties: false },
                thresholdAdjustments: { type: "array", items: { type: "object", properties: { parameter: { type: "string" }, currentValue: { type: "number" }, proposedValue: { type: "number" }, reasoning: { type: "string" } }, required: ["parameter", "currentValue", "proposedValue", "reasoning"], additionalProperties: false } },
                classifierUpdates: { type: "array", items: { type: "object", properties: { classifierName: { type: "string" }, updateType: { type: "string" }, details: { type: "string" }, expectedImprovement: { type: "number" } }, required: ["classifierName", "updateType", "details", "expectedImprovement"], additionalProperties: false } },
                newResponseTemplates: { type: "array", items: { type: "object", properties: { trigger: { type: "string" }, template: { type: "string" }, jurisdiction: { type: "string" } }, required: ["trigger", "template", "jurisdiction"], additionalProperties: false } },
                regulatoryLearnings: { type: "array", items: { type: "object", properties: { outcome: { type: "string" }, lesson: { type: "string" }, appliedTo: { type: "string" } }, required: ["outcome", "lesson", "appliedTo"], additionalProperties: false } },
                evolutionStage: { type: "string" },
                confidenceInUpdates: { type: "number" },
                deploymentRecommendation: { type: "string" },
                falsePositiveReduction: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["currentRiskAssessment", "thresholdAdjustments", "classifierUpdates", "newResponseTemplates", "regulatoryLearnings", "evolutionStage", "confidenceInUpdates", "deploymentRecommendation", "falsePositiveReduction", "explanation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No LLM response");
      return JSON.parse(content);
    } catch (err) {
      console.error("[RegulatoryIntervention] LLM error:", err);
      return {
        currentRiskAssessment: { overallRisk: 0.3, topIssues: ["Analysis incomplete"] },
        thresholdAdjustments: [],
        classifierUpdates: [],
        newResponseTemplates: [],
        regulatoryLearnings: [],
        evolutionStage: "observing",
        confidenceInUpdates: 0.2,
        deploymentRecommendation: "needs_more_data",
        falsePositiveReduction: 0,
        explanation: "Insufficient data for autonomous evolution."
      };
    }
  }

  static async logEvolution(eventId: number, sessionId: number, result: any) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        `INSERT INTO regulatory_evolution_logs (event_id, session_id, evolution_stage, confidence, deployment_recommendation, threshold_adjustments_count, classifier_updates_count, false_positive_reduction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, sessionId, result.evolutionStage, result.confidenceInUpdates, result.deploymentRecommendation, result.thresholdAdjustments.length, result.classifierUpdates.length, result.falsePositiveReduction]
      );
    } catch (e) {
      console.error("[RegulatoryIntervention] Log error:", e);
    }
  }
}
