// @ts-nocheck
/**
 * CuraLive IPO & M&A Intelligence Service
 *
 * Specialised AI intelligence modules for high-value, high-fee event types:
 *
 * IPO Intelligence (4 algorithms):
 *   1. Pricing Sensitivity Analyzer — detects pricing signals, valuation anchoring, demand cues
 *   2. Book-Building Signal Detector — identifies institutional demand patterns, allocation fairness
 *   3. IPO Readiness Scorecard — composite readiness assessment for listing
 *   4. Regulatory Red Flag Scanner — IPO-specific compliance (prospectus accuracy, quiet period)
 *
 * M&A Intelligence (5 algorithms):
 *   5. Offer Period Compliance Monitor — takeover code compliance, mandatory offer triggers
 *   6. Leak Detection Engine — unusual language patterns suggesting information asymmetry
 *   7. Synergy Validation Analyzer — management synergy claims vs industry benchmarks
 *   8. Stakeholder Impact Mapper — maps impact on employees, customers, suppliers, regulators
 *   9. Deal Certainty Predictor — probability of completion based on language/regulatory signals
 *
 * Credit & Bondholder Intelligence (2 algorithms):
 *  10. Credit Spread Impact Analyzer — predicted impact on credit spreads from event language
 *  11. Covenant Compliance Scanner — detects references to covenant thresholds and breaches
 *
 * Activist & Proxy Intelligence (2 algorithms):
 *  12. Activist Campaign Detector — identifies activist language patterns and escalation signals
 *  13. Vote Prediction Engine — predicts proxy vote outcomes from shareholder sentiment
 */

import { invokeLLM } from "../_core/llm";

function extractLLMText(response: any): string {
  return response?.choices?.[0]?.message?.content || "{}";
}

export class IpoIntelligenceService {

  static async analyzePricingSensitivity(input: {
    transcript: string;
    companyName: string;
    sector: string;
    proposedRange?: string;
    comparableIPOs?: string[];
  }): Promise<{
    pricingSignals: Array<{ statement: string; signal: "bullish" | "bearish" | "neutral"; strength: number }>;
    valuationAnchors: Array<{ metric: string; value: string; impliedRange: string }>;
    demandCues: Array<{ indicator: string; interpretation: string; confidence: number }>;
    overallPricingSentiment: number;
    suggestedPriceAction: string;
    riskToIPOPricing: "high" | "medium" | "low";
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an IPO pricing specialist at a bulge-bracket investment bank. Analyze roadshow/IPO event transcripts to detect pricing signals, valuation anchoring language, and demand cues from institutional investors.

Return JSON:
- pricingSignals: array of { statement, signal ("bullish"/"bearish"/"neutral"), strength (0-100) }
- valuationAnchors: array of { metric, value, impliedRange }
- demandCues: array of { indicator, interpretation, confidence (0-1) }
- overallPricingSentiment: 0-100
- suggestedPriceAction: recommendation for pricing
- riskToIPOPricing: "high"/"medium"/"low"`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\nSECTOR: ${input.sector}\n${input.proposedRange ? `PROPOSED RANGE: ${input.proposedRange}` : ""}\n${input.comparableIPOs?.length ? `COMPARABLE IPOs: ${input.comparableIPOs.join(", ")}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pricing_sensitivity",
          strict: true,
          schema: {
            type: "object",
            properties: {
              pricingSignals: { type: "array", items: { type: "object", properties: { statement: { type: "string" }, signal: { type: "string" }, strength: { type: "number" } }, required: ["statement", "signal", "strength"], additionalProperties: false } },
              valuationAnchors: { type: "array", items: { type: "object", properties: { metric: { type: "string" }, value: { type: "string" }, impliedRange: { type: "string" } }, required: ["metric", "value", "impliedRange"], additionalProperties: false } },
              demandCues: { type: "array", items: { type: "object", properties: { indicator: { type: "string" }, interpretation: { type: "string" }, confidence: { type: "number" } }, required: ["indicator", "interpretation", "confidence"], additionalProperties: false } },
              overallPricingSentiment: { type: "number" },
              suggestedPriceAction: { type: "string" },
              riskToIPOPricing: { type: "string" },
            },
            required: ["pricingSignals", "valuationAnchors", "demandCues", "overallPricingSentiment", "suggestedPriceAction", "riskToIPOPricing"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async detectBookBuildingSignals(input: {
    transcript: string;
    companyName: string;
    targetRaise: string;
  }): Promise<{
    demandIndicators: Array<{ source: string; signal: string; implied: "oversubscribed" | "balanced" | "undersubscribed"; confidence: number }>;
    allocationFairnessScore: number;
    cornerStoneIndicators: Array<{ investor: string; signalStrength: number; commitment: string }>;
    institutionalVsRetailBalance: { institutional: number; retail: number; assessment: string };
    bookBuildingMomentum: "accelerating" | "steady" | "decelerating";
    riskFlags: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an equity capital markets (ECM) specialist analyzing IPO book-building dynamics. Detect demand patterns, allocation fairness signals, and cornerstone investor indicators.

Return JSON:
- demandIndicators: array of { source, signal, implied ("oversubscribed"/"balanced"/"undersubscribed"), confidence (0-1) }
- allocationFairnessScore: 0-100
- cornerStoneIndicators: array of { investor, signalStrength (0-100), commitment }
- institutionalVsRetailBalance: { institutional (%), retail (%), assessment }
- bookBuildingMomentum: "accelerating"/"steady"/"decelerating"
- riskFlags: array of risk items`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\nTARGET RAISE: ${input.targetRaise}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "book_building",
          strict: true,
          schema: {
            type: "object",
            properties: {
              demandIndicators: { type: "array", items: { type: "object", properties: { source: { type: "string" }, signal: { type: "string" }, implied: { type: "string" }, confidence: { type: "number" } }, required: ["source", "signal", "implied", "confidence"], additionalProperties: false } },
              allocationFairnessScore: { type: "number" },
              cornerStoneIndicators: { type: "array", items: { type: "object", properties: { investor: { type: "string" }, signalStrength: { type: "number" }, commitment: { type: "string" } }, required: ["investor", "signalStrength", "commitment"], additionalProperties: false } },
              institutionalVsRetailBalance: { type: "object", properties: { institutional: { type: "number" }, retail: { type: "number" }, assessment: { type: "string" } }, required: ["institutional", "retail", "assessment"], additionalProperties: false },
              bookBuildingMomentum: { type: "string" },
              riskFlags: { type: "array", items: { type: "string" } },
            },
            required: ["demandIndicators", "allocationFairnessScore", "cornerStoneIndicators", "institutionalVsRetailBalance", "bookBuildingMomentum", "riskFlags"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async assessIPOReadiness(input: {
    companyName: string;
    sector: string;
    financialSummary: string;
    governanceNotes: string;
    marketConditions?: string;
  }): Promise<{
    overallReadinessScore: number;
    dimensions: Array<{ name: string; score: number; assessment: string; gaps: string[] }>;
    criticalBlockers: string[];
    timelineEstimate: string;
    recommendedExchange: string;
    comparableListings: string[];
    verdict: "ready" | "conditionally_ready" | "not_ready";
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an IPO readiness advisor at a leading investment bank. Assess listing readiness across 6 dimensions: Financial Strength, Governance & Board, Regulatory Compliance, Market Conditions, Management Team, and Investor Story.

Return JSON:
- overallReadinessScore: 0-100
- dimensions: array of { name, score (0-100), assessment, gaps: string[] }
- criticalBlockers: string[]
- timelineEstimate: estimated time to listing
- recommendedExchange: JSE/NYSE/LSE/NASDAQ etc
- comparableListings: recent comparable IPOs
- verdict: "ready"/"conditionally_ready"/"not_ready"`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\nSECTOR: ${input.sector}\nFINANCIALS: ${input.financialSummary}\nGOVERNANCE: ${input.governanceNotes}\n${input.marketConditions ? `MARKET: ${input.marketConditions}` : ""}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ipo_readiness",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallReadinessScore: { type: "number" },
              dimensions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, score: { type: "number" }, assessment: { type: "string" }, gaps: { type: "array", items: { type: "string" } } }, required: ["name", "score", "assessment", "gaps"], additionalProperties: false } },
              criticalBlockers: { type: "array", items: { type: "string" } },
              timelineEstimate: { type: "string" },
              recommendedExchange: { type: "string" },
              comparableListings: { type: "array", items: { type: "string" } },
              verdict: { type: "string" },
            },
            required: ["overallReadinessScore", "dimensions", "criticalBlockers", "timelineEstimate", "recommendedExchange", "comparableListings", "verdict"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async scanRegulatoryRedFlags(input: {
    transcript: string;
    jurisdiction: "JSE" | "SEC" | "FCA" | "HKEX" | "ASX";
    isQuietPeriod: boolean;
  }): Promise<{
    redFlags: Array<{ statement: string; rule: string; severity: "critical" | "high" | "medium" | "low"; recommendation: string }>;
    quietPeriodViolations: Array<{ statement: string; violation: string }>;
    prospectusConsistency: { score: number; inconsistencies: string[] };
    overallComplianceRisk: "critical" | "high" | "medium" | "low";
    regulatoryActions: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a securities regulation expert specializing in IPO compliance for ${input.jurisdiction}. Scan event transcripts for regulatory red flags, quiet period violations, and prospectus inconsistencies.

Jurisdiction-specific rules:
- JSE: Companies Act 71/2008, JSE Listings Requirements, FSCA regulations
- SEC: Securities Act 1933, Regulation S-K, gun-jumping rules
- FCA: FCA Handbook, UK Prospectus Regulation, MAR
- HKEX: Main Board Listing Rules, SFO
- ASX: ASX Listing Rules, Corporations Act 2001

Return JSON:
- redFlags: array of { statement, rule, severity, recommendation }
- quietPeriodViolations: array of { statement, violation }
- prospectusConsistency: { score (0-100), inconsistencies: string[] }
- overallComplianceRisk: "critical"/"high"/"medium"/"low"
- regulatoryActions: recommended actions`
        },
        {
          role: "user",
          content: `JURISDICTION: ${input.jurisdiction}\nQUIET PERIOD: ${input.isQuietPeriod ? "YES" : "NO"}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ipo_regulatory",
          strict: true,
          schema: {
            type: "object",
            properties: {
              redFlags: { type: "array", items: { type: "object", properties: { statement: { type: "string" }, rule: { type: "string" }, severity: { type: "string" }, recommendation: { type: "string" } }, required: ["statement", "rule", "severity", "recommendation"], additionalProperties: false } },
              quietPeriodViolations: { type: "array", items: { type: "object", properties: { statement: { type: "string" }, violation: { type: "string" } }, required: ["statement", "violation"], additionalProperties: false } },
              prospectusConsistency: { type: "object", properties: { score: { type: "number" }, inconsistencies: { type: "array", items: { type: "string" } } }, required: ["score", "inconsistencies"], additionalProperties: false },
              overallComplianceRisk: { type: "string" },
              regulatoryActions: { type: "array", items: { type: "string" } },
            },
            required: ["redFlags", "quietPeriodViolations", "prospectusConsistency", "overallComplianceRisk", "regulatoryActions"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }
}

export class MandAIntelligenceService {

  static async monitorOfferPeriodCompliance(input: {
    transcript: string;
    dealType: "friendly" | "hostile" | "merger_of_equals" | "scheme_of_arrangement";
    jurisdiction: "JSE" | "SEC" | "FCA" | "EU";
    offerPrice?: string;
    targetCompany: string;
    acquirerCompany: string;
  }): Promise<{
    complianceIssues: Array<{ statement: string; rule: string; severity: "critical" | "warning" | "info"; remediation: string }>;
    mandatoryOfferTriggers: Array<{ trigger: string; threshold: string; status: "triggered" | "approaching" | "clear" }>;
    dealCertaintyLanguage: Array<{ phrase: string; implication: string; bindingLevel: "binding" | "indicative" | "exploratory" }>;
    overallComplianceStatus: "compliant" | "at_risk" | "non_compliant";
    recommendedActions: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an M&A regulatory compliance expert for ${input.jurisdiction} jurisdiction. Monitor takeover code compliance, mandatory offer triggers, and deal certainty language.

Jurisdiction rules:
- JSE: JSE Listings Requirements Chapter 10, Companies Regulation 81-90 (mandatory offers)
- SEC: Williams Act, Regulation 14D/14E, Hart-Scott-Rodino Act
- FCA: UK Takeover Code, Panel on Takeovers and Mergers
- EU: Directive 2004/25/EC

Return JSON:
- complianceIssues: array of { statement, rule, severity, remediation }
- mandatoryOfferTriggers: array of { trigger, threshold, status }
- dealCertaintyLanguage: array of { phrase, implication, bindingLevel }
- overallComplianceStatus: "compliant"/"at_risk"/"non_compliant"
- recommendedActions: string[]`
        },
        {
          role: "user",
          content: `TARGET: ${input.targetCompany}\nACQUIRER: ${input.acquirerCompany}\nDEAL TYPE: ${input.dealType}\n${input.offerPrice ? `OFFER PRICE: ${input.offerPrice}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "offer_compliance",
          strict: true,
          schema: {
            type: "object",
            properties: {
              complianceIssues: { type: "array", items: { type: "object", properties: { statement: { type: "string" }, rule: { type: "string" }, severity: { type: "string" }, remediation: { type: "string" } }, required: ["statement", "rule", "severity", "remediation"], additionalProperties: false } },
              mandatoryOfferTriggers: { type: "array", items: { type: "object", properties: { trigger: { type: "string" }, threshold: { type: "string" }, status: { type: "string" } }, required: ["trigger", "threshold", "status"], additionalProperties: false } },
              dealCertaintyLanguage: { type: "array", items: { type: "object", properties: { phrase: { type: "string" }, implication: { type: "string" }, bindingLevel: { type: "string" } }, required: ["phrase", "implication", "bindingLevel"], additionalProperties: false } },
              overallComplianceStatus: { type: "string" },
              recommendedActions: { type: "array", items: { type: "string" } },
            },
            required: ["complianceIssues", "mandatoryOfferTriggers", "dealCertaintyLanguage", "overallComplianceStatus", "recommendedActions"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async detectInformationLeaks(input: {
    transcript: string;
    isPreAnnouncement: boolean;
    knownInsiders: string[];
  }): Promise<{
    leakIndicators: Array<{ statement: string; speaker: string; suspicionLevel: "high" | "medium" | "low"; pattern: string }>;
    informationAsymmetry: { score: number; evidence: string[] };
    unusualKnowledgePatterns: Array<{ speaker: string; topic: string; anomaly: string }>;
    tradingWindowConcerns: string[];
    overallLeakRisk: "critical" | "elevated" | "normal";
    forensicRecommendations: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a financial fraud investigator specializing in information leakage detection during M&A transactions. Analyze transcripts for unusual language patterns suggesting information asymmetry, pre-knowledge of deal terms, or insider trading indicators.

Detection patterns:
- Certainty language where uncertainty is expected
- Specific knowledge of terms not yet publicly disclosed
- Questions that reveal foreknowledge
- Unusual specificity about timing, pricing, or structure
- Pattern breaks in questioning (someone asking surprisingly targeted questions)

Return JSON:
- leakIndicators: array of { statement, speaker, suspicionLevel, pattern }
- informationAsymmetry: { score (0-100), evidence: string[] }
- unusualKnowledgePatterns: array of { speaker, topic, anomaly }
- tradingWindowConcerns: string[]
- overallLeakRisk: "critical"/"elevated"/"normal"
- forensicRecommendations: string[]`
        },
        {
          role: "user",
          content: `PRE-ANNOUNCEMENT: ${input.isPreAnnouncement ? "YES" : "NO"}\nKNOWN INSIDERS: ${input.knownInsiders.join(", ") || "Not specified"}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "leak_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              leakIndicators: { type: "array", items: { type: "object", properties: { statement: { type: "string" }, speaker: { type: "string" }, suspicionLevel: { type: "string" }, pattern: { type: "string" } }, required: ["statement", "speaker", "suspicionLevel", "pattern"], additionalProperties: false } },
              informationAsymmetry: { type: "object", properties: { score: { type: "number" }, evidence: { type: "array", items: { type: "string" } } }, required: ["score", "evidence"], additionalProperties: false },
              unusualKnowledgePatterns: { type: "array", items: { type: "object", properties: { speaker: { type: "string" }, topic: { type: "string" }, anomaly: { type: "string" } }, required: ["speaker", "topic", "anomaly"], additionalProperties: false } },
              tradingWindowConcerns: { type: "array", items: { type: "string" } },
              overallLeakRisk: { type: "string" },
              forensicRecommendations: { type: "array", items: { type: "string" } },
            },
            required: ["leakIndicators", "informationAsymmetry", "unusualKnowledgePatterns", "tradingWindowConcerns", "overallLeakRisk", "forensicRecommendations"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async analyzeSynergyValidation(input: {
    transcript: string;
    acquirerCompany: string;
    targetCompany: string;
    statedSynergies?: string;
    sector: string;
  }): Promise<{
    synergyClaims: Array<{ claim: string; amount: string; type: "revenue" | "cost" | "operational" | "strategic"; realism: number; industryBenchmark: string }>;
    overallCredibility: number;
    integrationRisks: Array<{ risk: string; severity: "high" | "medium" | "low"; mitigation: string }>;
    timelineAssessment: { stated: string; realistic: string; gap: string };
    historicalComparison: string;
    verdict: string;
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an M&A integration specialist. Evaluate synergy claims from management against industry benchmarks and historical M&A outcomes in the ${input.sector} sector.

Return JSON:
- synergyClaims: array of { claim, amount, type, realism (0-100), industryBenchmark }
- overallCredibility: 0-100
- integrationRisks: array of { risk, severity, mitigation }
- timelineAssessment: { stated, realistic, gap }
- historicalComparison: comparison to similar deals
- verdict: overall assessment`
        },
        {
          role: "user",
          content: `ACQUIRER: ${input.acquirerCompany}\nTARGET: ${input.targetCompany}\nSECTOR: ${input.sector}\n${input.statedSynergies ? `STATED SYNERGIES: ${input.statedSynergies}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "synergy_validation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              synergyClaims: { type: "array", items: { type: "object", properties: { claim: { type: "string" }, amount: { type: "string" }, type: { type: "string" }, realism: { type: "number" }, industryBenchmark: { type: "string" } }, required: ["claim", "amount", "type", "realism", "industryBenchmark"], additionalProperties: false } },
              overallCredibility: { type: "number" },
              integrationRisks: { type: "array", items: { type: "object", properties: { risk: { type: "string" }, severity: { type: "string" }, mitigation: { type: "string" } }, required: ["risk", "severity", "mitigation"], additionalProperties: false } },
              timelineAssessment: { type: "object", properties: { stated: { type: "string" }, realistic: { type: "string" }, gap: { type: "string" } }, required: ["stated", "realistic", "gap"], additionalProperties: false },
              historicalComparison: { type: "string" },
              verdict: { type: "string" },
            },
            required: ["synergyClaims", "overallCredibility", "integrationRisks", "timelineAssessment", "historicalComparison", "verdict"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async mapStakeholderImpact(input: {
    transcript: string;
    acquirerCompany: string;
    targetCompany: string;
    dealSize: string;
    sector: string;
  }): Promise<{
    stakeholderGroups: Array<{
      group: string;
      impact: "positive" | "negative" | "neutral" | "mixed";
      severity: number;
      keyIssues: string[];
      managementCommitments: string[];
      riskOfOpposition: number;
    }>;
    employeeImpact: { headcountRisk: string; retentionRisks: string[]; culturalFit: number };
    regulatoryHurdles: Array<{ authority: string; likelihood: "certain" | "likely" | "possible" | "unlikely"; timeline: string }>;
    publicSentimentForecast: string;
    overallStakeholderRisk: number;
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a stakeholder impact analyst for M&A transactions. Map the impact on all stakeholder groups: employees, customers, suppliers, regulators, shareholders (both acquirer and target), communities, and competitors.

Return JSON:
- stakeholderGroups: array of { group, impact, severity (0-100), keyIssues, managementCommitments, riskOfOpposition (0-100) }
- employeeImpact: { headcountRisk, retentionRisks, culturalFit (0-100) }
- regulatoryHurdles: array of { authority, likelihood, timeline }
- publicSentimentForecast: prediction
- overallStakeholderRisk: 0-100`
        },
        {
          role: "user",
          content: `ACQUIRER: ${input.acquirerCompany}\nTARGET: ${input.targetCompany}\nDEAL SIZE: ${input.dealSize}\nSECTOR: ${input.sector}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "stakeholder_impact",
          strict: true,
          schema: {
            type: "object",
            properties: {
              stakeholderGroups: { type: "array", items: { type: "object", properties: { group: { type: "string" }, impact: { type: "string" }, severity: { type: "number" }, keyIssues: { type: "array", items: { type: "string" } }, managementCommitments: { type: "array", items: { type: "string" } }, riskOfOpposition: { type: "number" } }, required: ["group", "impact", "severity", "keyIssues", "managementCommitments", "riskOfOpposition"], additionalProperties: false } },
              employeeImpact: { type: "object", properties: { headcountRisk: { type: "string" }, retentionRisks: { type: "array", items: { type: "string" } }, culturalFit: { type: "number" } }, required: ["headcountRisk", "retentionRisks", "culturalFit"], additionalProperties: false },
              regulatoryHurdles: { type: "array", items: { type: "object", properties: { authority: { type: "string" }, likelihood: { type: "string" }, timeline: { type: "string" } }, required: ["authority", "likelihood", "timeline"], additionalProperties: false } },
              publicSentimentForecast: { type: "string" },
              overallStakeholderRisk: { type: "number" },
            },
            required: ["stakeholderGroups", "employeeImpact", "regulatoryHurdles", "publicSentimentForecast", "overallStakeholderRisk"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async predictDealCertainty(input: {
    transcript: string;
    acquirerCompany: string;
    targetCompany: string;
    dealType: string;
    jurisdiction: string;
    announcedDate?: string;
  }): Promise<{
    completionProbability: number;
    confidenceInterval: { lower: number; upper: number };
    positiveFactors: Array<{ factor: string; weight: number }>;
    negativeFactors: Array<{ factor: string; weight: number }>;
    regulatoryRisk: number;
    financingRisk: number;
    shareholderApprovalRisk: number;
    materialAdverseChangeRisk: number;
    estimatedTimeline: string;
    verdict: "highly_likely" | "likely" | "uncertain" | "unlikely" | "highly_unlikely";
    keyWatchItems: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a deal certainty analyst. Based on transcript language, regulatory landscape, and deal structure, predict the probability of M&A deal completion.

Factors to weight:
- Regulatory language confidence (approval risk)
- Financing certainty (committed vs conditional)
- Board/shareholder support signals
- Condition precedent complexity
- Historical completion rates for similar deals
- MAC clause triggers
- Competition authority risk

Return JSON:
- completionProbability: 0-100
- confidenceInterval: { lower, upper }
- positiveFactors: array of { factor, weight (0-1) }
- negativeFactors: array of { factor, weight (0-1) }
- regulatoryRisk: 0-100
- financingRisk: 0-100
- shareholderApprovalRisk: 0-100
- materialAdverseChangeRisk: 0-100
- estimatedTimeline: string
- verdict: "highly_likely"/"likely"/"uncertain"/"unlikely"/"highly_unlikely"
- keyWatchItems: string[]`
        },
        {
          role: "user",
          content: `ACQUIRER: ${input.acquirerCompany}\nTARGET: ${input.targetCompany}\nTYPE: ${input.dealType}\nJURISDICTION: ${input.jurisdiction}\n${input.announcedDate ? `ANNOUNCED: ${input.announcedDate}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "deal_certainty",
          strict: true,
          schema: {
            type: "object",
            properties: {
              completionProbability: { type: "number" },
              confidenceInterval: { type: "object", properties: { lower: { type: "number" }, upper: { type: "number" } }, required: ["lower", "upper"], additionalProperties: false },
              positiveFactors: { type: "array", items: { type: "object", properties: { factor: { type: "string" }, weight: { type: "number" } }, required: ["factor", "weight"], additionalProperties: false } },
              negativeFactors: { type: "array", items: { type: "object", properties: { factor: { type: "string" }, weight: { type: "number" } }, required: ["factor", "weight"], additionalProperties: false } },
              regulatoryRisk: { type: "number" },
              financingRisk: { type: "number" },
              shareholderApprovalRisk: { type: "number" },
              materialAdverseChangeRisk: { type: "number" },
              estimatedTimeline: { type: "string" },
              verdict: { type: "string" },
              keyWatchItems: { type: "array", items: { type: "string" } },
            },
            required: ["completionProbability", "confidenceInterval", "positiveFactors", "negativeFactors", "regulatoryRisk", "financingRisk", "shareholderApprovalRisk", "materialAdverseChangeRisk", "estimatedTimeline", "verdict", "keyWatchItems"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }
}

export class CreditBondholderIntelligenceService {

  static async analyzeCreditSpreadImpact(input: {
    transcript: string;
    companyName: string;
    currentRating: string;
    sector: string;
  }): Promise<{
    spreadImpactPrediction: "widening" | "tightening" | "neutral";
    magnitudeEstimate: string;
    creditPositiveSignals: Array<{ signal: string; impact: string }>;
    creditNegativeSignals: Array<{ signal: string; impact: string }>;
    ratingActionRisk: "upgrade_possible" | "stable" | "downgrade_watch" | "downgrade_likely";
    keyMetricsDiscussed: Array<{ metric: string; value: string; trend: string }>;
    overallCreditSentiment: number;
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a fixed income credit analyst. Analyze event transcripts for their likely impact on credit spreads and credit ratings.

Return JSON:
- spreadImpactPrediction: "widening"/"tightening"/"neutral"
- magnitudeEstimate: estimated basis point impact
- creditPositiveSignals: array of { signal, impact }
- creditNegativeSignals: array of { signal, impact }
- ratingActionRisk: "upgrade_possible"/"stable"/"downgrade_watch"/"downgrade_likely"
- keyMetricsDiscussed: array of { metric, value, trend }
- overallCreditSentiment: 0-100 (100 = most positive for creditors)`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\nRATING: ${input.currentRating}\nSECTOR: ${input.sector}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "credit_spread",
          strict: true,
          schema: {
            type: "object",
            properties: {
              spreadImpactPrediction: { type: "string" },
              magnitudeEstimate: { type: "string" },
              creditPositiveSignals: { type: "array", items: { type: "object", properties: { signal: { type: "string" }, impact: { type: "string" } }, required: ["signal", "impact"], additionalProperties: false } },
              creditNegativeSignals: { type: "array", items: { type: "object", properties: { signal: { type: "string" }, impact: { type: "string" } }, required: ["signal", "impact"], additionalProperties: false } },
              ratingActionRisk: { type: "string" },
              keyMetricsDiscussed: { type: "array", items: { type: "object", properties: { metric: { type: "string" }, value: { type: "string" }, trend: { type: "string" } }, required: ["metric", "value", "trend"], additionalProperties: false } },
              overallCreditSentiment: { type: "number" },
            },
            required: ["spreadImpactPrediction", "magnitudeEstimate", "creditPositiveSignals", "creditNegativeSignals", "ratingActionRisk", "keyMetricsDiscussed", "overallCreditSentiment"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async scanCovenantCompliance(input: {
    transcript: string;
    companyName: string;
    knownCovenants?: string[];
  }): Promise<{
    covenantReferences: Array<{ covenant: string; currentStatus: string; headroom: string; trend: "improving" | "stable" | "deteriorating"; breachRisk: number }>;
    implicitCovenantConcerns: string[];
    managementToneOnDebt: "comfortable" | "cautious" | "defensive" | "evasive";
    refinancingSignals: string[];
    overallCovenantRisk: number;
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a covenant compliance analyst for fixed income investors. Scan transcripts for references to debt covenants, leverage ratios, interest coverage, and other bondholder protections.

Return JSON:
- covenantReferences: array of { covenant, currentStatus, headroom, trend, breachRisk (0-100) }
- implicitCovenantConcerns: string[]
- managementToneOnDebt: "comfortable"/"cautious"/"defensive"/"evasive"
- refinancingSignals: string[]
- overallCovenantRisk: 0-100`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\n${input.knownCovenants?.length ? `KNOWN COVENANTS: ${input.knownCovenants.join(", ")}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "covenant_compliance",
          strict: true,
          schema: {
            type: "object",
            properties: {
              covenantReferences: { type: "array", items: { type: "object", properties: { covenant: { type: "string" }, currentStatus: { type: "string" }, headroom: { type: "string" }, trend: { type: "string" }, breachRisk: { type: "number" } }, required: ["covenant", "currentStatus", "headroom", "trend", "breachRisk"], additionalProperties: false } },
              implicitCovenantConcerns: { type: "array", items: { type: "string" } },
              managementToneOnDebt: { type: "string" },
              refinancingSignals: { type: "array", items: { type: "string" } },
              overallCovenantRisk: { type: "number" },
            },
            required: ["covenantReferences", "implicitCovenantConcerns", "managementToneOnDebt", "refinancingSignals", "overallCovenantRisk"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }
}

export class ActivistProxyIntelligenceService {

  static async detectActivistCampaign(input: {
    transcript: string;
    companyName: string;
    knownActivists?: string[];
  }): Promise<{
    activistIndicators: Array<{ speaker: string; statement: string; tactic: string; escalationLevel: "exploratory" | "assertive" | "aggressive" | "hostile"; confidence: number }>;
    campaignThemes: Array<{ theme: string; frequency: number; coordination: boolean }>;
    boardPressureSignals: Array<{ target: string; pressure: string; severity: number }>;
    overallActivistThreatLevel: "critical" | "elevated" | "moderate" | "low" | "none";
    defensiveRecommendations: string[];
    predictedNextMoves: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an activist defense advisor. Analyze event transcripts for signs of activist investor campaigns, proxy fights, and coordinated shareholder pressure.

Activist patterns to detect:
- Governance criticism (board composition, executive compensation, capital allocation)
- "Value unlock" language (spin-offs, asset sales, buybacks)
- Direct board challenges or nomination threats
- Coalition building among shareholders
- Public letter / white paper references
- Historical pattern escalation

Return JSON:
- activistIndicators: array of { speaker, statement, tactic, escalationLevel, confidence (0-1) }
- campaignThemes: array of { theme, frequency, coordination (boolean) }
- boardPressureSignals: array of { target, pressure, severity (0-100) }
- overallActivistThreatLevel: "critical"/"elevated"/"moderate"/"low"/"none"
- defensiveRecommendations: string[]
- predictedNextMoves: string[]`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\n${input.knownActivists?.length ? `KNOWN ACTIVISTS: ${input.knownActivists.join(", ")}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "activist_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              activistIndicators: { type: "array", items: { type: "object", properties: { speaker: { type: "string" }, statement: { type: "string" }, tactic: { type: "string" }, escalationLevel: { type: "string" }, confidence: { type: "number" } }, required: ["speaker", "statement", "tactic", "escalationLevel", "confidence"], additionalProperties: false } },
              campaignThemes: { type: "array", items: { type: "object", properties: { theme: { type: "string" }, frequency: { type: "number" }, coordination: { type: "boolean" } }, required: ["theme", "frequency", "coordination"], additionalProperties: false } },
              boardPressureSignals: { type: "array", items: { type: "object", properties: { target: { type: "string" }, pressure: { type: "string" }, severity: { type: "number" } }, required: ["target", "pressure", "severity"], additionalProperties: false } },
              overallActivistThreatLevel: { type: "string" },
              defensiveRecommendations: { type: "array", items: { type: "string" } },
              predictedNextMoves: { type: "array", items: { type: "string" } },
            },
            required: ["activistIndicators", "campaignThemes", "boardPressureSignals", "overallActivistThreatLevel", "defensiveRecommendations", "predictedNextMoves"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }

  static async predictProxyVote(input: {
    transcript: string;
    companyName: string;
    resolutions: Array<{ id: string; description: string; managementRecommendation: "for" | "against" }>;
    shareholderBase?: string;
  }): Promise<{
    predictions: Array<{
      resolutionId: string;
      predictedFor: number;
      predictedAgainst: number;
      predictedAbstain: number;
      confidence: number;
      keyInfluencers: string[];
      riskOfDefeat: number;
    }>;
    overallGovernanceRisk: number;
    dissidentVoiceCount: number;
    managementCredibilityOnVotes: number;
    recommendations: string[];
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a proxy advisory analyst. Based on shareholder sentiment from event transcripts and resolution details, predict proxy vote outcomes.

Return JSON:
- predictions: array of { resolutionId, predictedFor (%), predictedAgainst (%), predictedAbstain (%), confidence (0-1), keyInfluencers, riskOfDefeat (0-100) }
- overallGovernanceRisk: 0-100
- dissidentVoiceCount: number of distinct dissenting voices detected
- managementCredibilityOnVotes: 0-100
- recommendations: string[]`
        },
        {
          role: "user",
          content: `COMPANY: ${input.companyName}\nRES: ${JSON.stringify(input.resolutions)}\n${input.shareholderBase ? `SHAREHOLDER BASE: ${input.shareholderBase}` : ""}\n\nTRANSCRIPT:\n${input.transcript.slice(0, 8000)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "proxy_vote",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictions: { type: "array", items: { type: "object", properties: { resolutionId: { type: "string" }, predictedFor: { type: "number" }, predictedAgainst: { type: "number" }, predictedAbstain: { type: "number" }, confidence: { type: "number" }, keyInfluencers: { type: "array", items: { type: "string" } }, riskOfDefeat: { type: "number" } }, required: ["resolutionId", "predictedFor", "predictedAgainst", "predictedAbstain", "confidence", "keyInfluencers", "riskOfDefeat"], additionalProperties: false } },
              overallGovernanceRisk: { type: "number" },
              dissidentVoiceCount: { type: "number" },
              managementCredibilityOnVotes: { type: "number" },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["predictions", "overallGovernanceRisk", "dissidentVoiceCount", "managementCredibilityOnVotes", "recommendations"],
            additionalProperties: false,
          }
        }
      }
    });
    return JSON.parse(extractLLMText(response));
  }
}
