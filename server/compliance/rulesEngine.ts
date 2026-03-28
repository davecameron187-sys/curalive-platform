/**
 * Custom Compliance Rules Engine for Chorus.AI
 * 
 * Evaluates questions against user-defined compliance rules in real-time
 * Supports four rule types:
 * 1. Keyword Rules — Match specific words/phrases
 * 2. Pattern Rules — Regex-based matching
 * 3. Sentiment Rules — Sentiment score thresholds
 * 4. Custom Rules — User-defined logic
 */

// ============================================================================
// RULE TYPES & INTERFACES
// ============================================================================

export enum RuleType {
  KEYWORD = "keyword",
  PATTERN = "pattern",
  SENTIMENT = "sentiment",
  CUSTOM = "custom",
}

export enum RuleSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ComplianceRule {
  id: string;
  eventId: string;
  name: string;
  description: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  enabled: boolean;
  
  // Rule configuration (varies by type)
  config: {
    // For KEYWORD rules
    keywords?: string[];
    caseSensitive?: boolean;
    wholeWordOnly?: boolean;
    
    // For PATTERN rules
    pattern?: string;
    flags?: string;
    
    // For SENTIMENT rules
    minSentiment?: number;
    maxSentiment?: number;
    
    // For CUSTOM rules
    customLogic?: string; // JavaScript function as string
  };
  
  // Actions when rule matches
  actions: {
    autoHold?: boolean;
    autoReject?: boolean;
    flagForReview?: boolean;
    notifyModerator?: boolean;
    complianceScore?: number; // 0-1
  };
  
  // Metadata
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  jurisdiction?: string; // "jse", "sec", "eu_mar", "popia"
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  severity: RuleSeverity;
  complianceScore: number; // 0-1
  reasoning: string;
  matchedContent?: string;
  actions: ComplianceRule["actions"];
}

export interface QuestionComplianceResult {
  questionId: number;
  totalComplianceScore: number; // 0-1 (highest severity rule)
  ruleMatches: RuleEvaluationResult[];
  recommendedAction: "approve" | "hold" | "reject";
  requiresLegalReview: boolean;
}

// ============================================================================
// COMPLIANCE RULES ENGINE
// ============================================================================

export class ComplianceRulesEngine {
  private rules: Map<string, ComplianceRule> = new Map();
  private compiledPatterns: Map<string, RegExp> = new Map();

  /**
   * Register a compliance rule
   */
  registerRule(rule: ComplianceRule): void {
    if (!rule.enabled) return;

    this.rules.set(rule.id, rule);

    // Pre-compile regex patterns for performance
    if (rule.ruleType === RuleType.PATTERN && rule.config.pattern) {
      try {
        const flags = rule.config.flags || "i";
        this.compiledPatterns.set(rule.id, new RegExp(rule.config.pattern, flags));
      } catch (error) {
        console.error(`[Compliance] Failed to compile pattern for rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Unregister a compliance rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.compiledPatterns.delete(ruleId);
  }

  /**
   * Update a compliance rule
   */
  updateRule(rule: ComplianceRule): void {
    this.unregisterRule(rule.id);
    this.registerRule(rule);
  }

  /**
   * Evaluate a question against all registered rules
   */
  async evaluateQuestion(
    questionId: number,
    questionText: string,
    sentimentScore: number = 0.5
  ): Promise<QuestionComplianceResult> {
    const ruleMatches: RuleEvaluationResult[] = [];
    let maxComplianceScore = 0;
    let requiresLegalReview = false;

    for (const [ruleId, rule] of Array.from(this.rules.entries())) {
      const result = await this.evaluateRule(
        rule,
        questionText,
        sentimentScore
      );

      if (result.matched) {
        ruleMatches.push(result);
        maxComplianceScore = Math.max(maxComplianceScore, result.complianceScore);

        if (result.severity === RuleSeverity.CRITICAL) {
          requiresLegalReview = true;
        }
      }
    }

    // Determine recommended action
    let recommendedAction: "approve" | "hold" | "reject" = "approve";
    if (maxComplianceScore >= 0.8) {
      recommendedAction = "reject";
    } else if (maxComplianceScore >= 0.5) {
      recommendedAction = "hold";
    }

    return {
      questionId,
      totalComplianceScore: maxComplianceScore,
      ruleMatches,
      recommendedAction,
      requiresLegalReview,
    };
  }

  /**
   * Evaluate a single rule against question text
   */
  private async evaluateRule(
    rule: ComplianceRule,
    questionText: string,
    sentimentScore: number
  ): Promise<RuleEvaluationResult> {
    let matched = false;
    let matchedContent = "";
    let reasoning = "";

    switch (rule.ruleType) {
      case RuleType.KEYWORD:
        ({ matched, matchedContent, reasoning } = this.evaluateKeywordRule(
          rule,
          questionText
        ));
        break;

      case RuleType.PATTERN:
        ({ matched, matchedContent, reasoning } = this.evaluatePatternRule(
          rule,
          questionText
        ));
        break;

      case RuleType.SENTIMENT:
        ({ matched, reasoning } = this.evaluateSentimentRule(
          rule,
          sentimentScore
        ));
        break;

      case RuleType.CUSTOM:
        ({ matched, reasoning } = await this.evaluateCustomRule(
          rule,
          questionText,
          sentimentScore
        ));
        break;
    }

    const complianceScore = matched
      ? this.severityToScore(rule.severity)
      : 0;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      severity: rule.severity,
      complianceScore,
      reasoning,
      matchedContent,
      actions: rule.actions,
    };
  }

  /**
   * Evaluate keyword rule
   */
  private evaluateKeywordRule(
    rule: ComplianceRule,
    questionText: string
  ): { matched: boolean; matchedContent: string; reasoning: string } {
    const keywords = rule.config.keywords || [];
    const caseSensitive = rule.config.caseSensitive || false;
    const wholeWordOnly = rule.config.wholeWordOnly || false;

    const searchText = caseSensitive ? questionText : questionText.toLowerCase();
    let matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();

      if (wholeWordOnly) {
        const wordRegex = new RegExp(`\\b${this.escapeRegex(searchKeyword)}\\b`, "g");
        if (wordRegex.test(searchText)) {
          matchedKeywords.push(keyword);
        }
      } else {
        if (searchText.includes(searchKeyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    const matched = matchedKeywords.length > 0;
    return {
      matched,
      matchedContent: matchedKeywords.join(", "),
      reasoning: matched
        ? `Matched keywords: ${matchedKeywords.join(", ")}`
        : "No keywords matched",
    };
  }

  /**
   * Evaluate pattern rule
   */
  private evaluatePatternRule(
    rule: ComplianceRule,
    questionText: string
  ): { matched: boolean; matchedContent: string; reasoning: string } {
    const pattern = this.compiledPatterns.get(rule.id);
    if (!pattern) {
      return {
        matched: false,
        matchedContent: "",
        reasoning: "Pattern failed to compile",
      };
    }

    const matches = questionText.match(pattern);
    const matched = matches !== null;

    return {
      matched,
      matchedContent: matches ? matches.join(", ") : "",
      reasoning: matched
        ? `Pattern matched: ${matches?.join(", ")}`
        : "Pattern did not match",
    };
  }

  /**
   * Evaluate sentiment rule
   */
  private evaluateSentimentRule(
    rule: ComplianceRule,
    sentimentScore: number
  ): { matched: boolean; reasoning: string } {
    const minSentiment = rule.config.minSentiment ?? -1;
    const maxSentiment = rule.config.maxSentiment ?? 1;

    const matched =
      sentimentScore >= minSentiment && sentimentScore <= maxSentiment;

    return {
      matched,
      reasoning: matched
        ? `Sentiment score ${sentimentScore.toFixed(2)} within range [${minSentiment}, ${maxSentiment}]`
        : `Sentiment score ${sentimentScore.toFixed(2)} outside range [${minSentiment}, ${maxSentiment}]`,
    };
  }

  /**
   * Evaluate custom rule (user-defined logic)
   */
  private async evaluateCustomRule(
    rule: ComplianceRule,
    questionText: string,
    sentimentScore: number
  ): Promise<{ matched: boolean; reasoning: string }> {
    try {
      const customLogic = rule.config.customLogic;
      if (!customLogic) {
        return { matched: false, reasoning: "No custom logic defined" };
      }

      // Create safe evaluation context
      const evaluateFunction = new Function(
        "questionText",
        "sentimentScore",
        `return (${customLogic})`
      );

      const matched = await evaluateFunction(questionText, sentimentScore);

      return {
        matched: Boolean(matched),
        reasoning: matched
          ? "Custom logic evaluated to true"
          : "Custom logic evaluated to false",
      };
    } catch (error) {
      console.error(`[Compliance] Error evaluating custom rule ${rule.id}:`, error);
      return {
        matched: false,
        reasoning: `Error evaluating custom logic: ${error}`,
      };
    }
  }

  /**
   * Get all rules for an event
   */
  getRulesForEvent(eventId: string): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.eventId === eventId
    );
  }

  /**
   * Get rule statistics
   */
  getRuleStatistics(): {
    totalRules: number;
    rulesByType: Record<string, number>;
    rulesBySeverity: Record<string, number>;
  } {
    const rulesByType: Record<string, number> = {
      [RuleType.KEYWORD]: 0,
      [RuleType.PATTERN]: 0,
      [RuleType.SENTIMENT]: 0,
      [RuleType.CUSTOM]: 0,
    };

    const rulesBySeverity: Record<string, number> = {
      [RuleSeverity.LOW]: 0,
      [RuleSeverity.MEDIUM]: 0,
      [RuleSeverity.HIGH]: 0,
      [RuleSeverity.CRITICAL]: 0,
    };

    for (const rule of Array.from(this.rules.values())) {
      rulesByType[rule.ruleType]++;
      rulesBySeverity[rule.severity]++;
    }

    return {
      totalRules: this.rules.size,
      rulesByType,
      rulesBySeverity,
    };
  }

  /**
   * Utility: Convert severity to compliance score
   */
  private severityToScore(severity: RuleSeverity): number {
    switch (severity) {
      case RuleSeverity.LOW:
        return 0.25;
      case RuleSeverity.MEDIUM:
        return 0.5;
      case RuleSeverity.HIGH:
        return 0.75;
      case RuleSeverity.CRITICAL:
        return 1.0;
    }
  }

  /**
   * Utility: Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

// ============================================================================
// GLOBAL RULES ENGINE INSTANCE
// ============================================================================

export const complianceRulesEngine = new ComplianceRulesEngine();

export default complianceRulesEngine;
