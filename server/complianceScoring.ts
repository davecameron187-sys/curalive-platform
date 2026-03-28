/**
 * Compliance Risk Scoring Module
 * AI-powered compliance analysis for Q&A questions
 * Flags high-risk questions before operator review
 */

export enum ComplianceRiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ComplianceFlagType {
  MARKET_SENSITIVE = "market_sensitive",
  INSIDER_INFO = "insider_info",
  REGULATORY = "regulatory",
  REPUTATIONAL = "reputational",
  OTHER = "other",
}

export interface ComplianceAnalysis {
  riskScore: number;
  riskLevel: ComplianceRiskLevel;
  flagTypes: ComplianceFlagType[];
  reasoning: string;
  recommendation: "auto_approve" | "auto_reject" | "manual_review";
}

/**
 * Mock helper: Calculate risk score based on keyword analysis
 */
function calculateMockRiskScore(questionText: string): number {
  const lowerText = questionText.toLowerCase();
  let score = 0.2;

  if (lowerText.includes("guidance") || lowerText.includes("forecast")) score += 0.2;
  if (lowerText.includes("acquisition") || lowerText.includes("merger")) score += 0.3;
  if (lowerText.includes("insider") || lowerText.includes("confidential")) score += 0.4;
  if (lowerText.includes("lawsuit") || lowerText.includes("investigation")) score += 0.2;

  return Math.min(score, 1.0);
}

/**
 * Mock helper: Determine risk level from score
 */
function determineMockRiskLevel(questionText: string): ComplianceRiskLevel {
  const score = calculateMockRiskScore(questionText);
  if (score >= 0.7) return ComplianceRiskLevel.CRITICAL;
  if (score >= 0.5) return ComplianceRiskLevel.HIGH;
  if (score >= 0.3) return ComplianceRiskLevel.MEDIUM;
  return ComplianceRiskLevel.LOW;
}

/**
 * Mock helper: Identify flag types from question text
 */
function identifyMockFlagTypes(questionText: string): ComplianceFlagType[] {
  const flags: ComplianceFlagType[] = [];
  const lowerText = questionText.toLowerCase();

  if (lowerText.includes("guidance") || lowerText.includes("forecast")) {
    flags.push(ComplianceFlagType.MARKET_SENSITIVE);
  }
  if (lowerText.includes("insider") || lowerText.includes("confidential")) {
    flags.push(ComplianceFlagType.INSIDER_INFO);
  }
  if (lowerText.includes("sec") || lowerText.includes("regulation")) {
    flags.push(ComplianceFlagType.REGULATORY);
  }
  if (lowerText.includes("lawsuit") || lowerText.includes("scandal")) {
    flags.push(ComplianceFlagType.REPUTATIONAL);
  }

  return flags.length > 0 ? flags : [ComplianceFlagType.OTHER];
}

/**
 * Analyze question for compliance risks
 * Currently uses keyword-based mock analysis
 * In production, would use LLM with structured JSON response
 */
export async function analyzeQuestionCompliance(
  questionText: string,
  companyName: string,
  eventType: string
): Promise<ComplianceAnalysis> {
  try {
    const riskScore = calculateMockRiskScore(questionText);
    const riskLevel = determineMockRiskLevel(questionText);
    const flagTypes = identifyMockFlagTypes(questionText);

    return {
      riskScore,
      riskLevel,
      flagTypes,
      reasoning: `Compliance analysis for ${companyName} ${eventType}. Risk level: ${riskLevel}`,
      recommendation: riskLevel === ComplianceRiskLevel.CRITICAL ? "auto_reject" : "manual_review",
    };
  } catch (error) {
    console.error("[Compliance Scoring] Error analyzing question:", error);
    return {
      riskScore: 0.5,
      riskLevel: ComplianceRiskLevel.MEDIUM,
      flagTypes: [ComplianceFlagType.OTHER],
      reasoning: "Unable to analyze - manual review recommended",
      recommendation: "manual_review",
    };
  }
}

/**
 * Batch analyze multiple questions
 */
export async function analyzeQuestionsCompliance(
  questions: Array<{ id: number; text: string }>,
  companyName: string,
  eventType: string
): Promise<Map<number, ComplianceAnalysis>> {
  const results = new Map<number, ComplianceAnalysis>();

  for (const question of questions) {
    const analysis = await analyzeQuestionCompliance(question.text, companyName, eventType);
    results.set(question.id, analysis);

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(riskLevel: ComplianceRiskLevel): string {
  switch (riskLevel) {
    case ComplianceRiskLevel.LOW:
      return "bg-green-500";
    case ComplianceRiskLevel.MEDIUM:
      return "bg-yellow-500";
    case ComplianceRiskLevel.HIGH:
      return "bg-orange-500";
    case ComplianceRiskLevel.CRITICAL:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get risk level icon for UI display
 */
export function getRiskLevelIcon(riskLevel: ComplianceRiskLevel): string {
  switch (riskLevel) {
    case ComplianceRiskLevel.LOW:
      return "✓";
    case ComplianceRiskLevel.MEDIUM:
      return "⚠";
    case ComplianceRiskLevel.HIGH:
      return "⚠⚠";
    case ComplianceRiskLevel.CRITICAL:
      return "🚫";
    default:
      return "?";
  }
}

/**
 * Format flag types for display
 */
export function formatFlagTypes(flagTypes: ComplianceFlagType[]): string {
  return flagTypes
    .map((flag) => flag.replace(/_/g, " ").toUpperCase())
    .join(", ");
}
