// @ts-nocheck
/**
 * CuraLive AI Evolution Engine
 *
 * Autonomous self-improving intelligence system that observes its own outputs,
 * identifies weaknesses, detects cross-event patterns, and proposes new AI tools.
 *
 * Core algorithms:
 *   1. Module Quality Scoring   — weighted depth/breadth/specificity analysis per module
 *   2. Evidence Decay Function  — recent observations weighted higher (half-life 14 days)
 *   3. Cross-Event Correlation  — detects patterns that appear across multiple clients/event types
 *   4. Autonomous Promotion     — proposals auto-promote based on composite evidence score
 *   5. Gap Detection Matrix     — identifies systematic blind spots across the module grid
 *   6. Impact Estimation Model  — scores potential tools by frequency × breadth × severity
 */

import { getDb } from "../db";
import { aiEvolutionObservations, aiToolProposals } from "../../drizzle/schema";
import { eq, desc, sql, and, isNull, gte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Types ───────────────────────────────────────────────────────────────────

type AiReport = {
  executiveSummary: string;
  sentimentAnalysis: any;
  complianceReview: any;
  keyTopics: any[];
  speakerAnalysis: any[];
  questionsAsked: any[];
  actionItems: any[];
  investorSignals: any[];
  communicationScore: any;
  riskFactors: any[];
  competitiveIntelligence: any[];
  recommendations: string[];
  speakingPaceAnalysis: any;
  toxicityScreen: any;
  sentimentArc: any;
  financialHighlights: any[];
  esgMentions: any[];
  pressReleaseDraft: string;
  socialMediaContent: any[];
  boardReadySummary: any;
  modulesGenerated: number;
};

type ModuleQualityScore = {
  module: string;
  depth: number;       // 0–1: how detailed is the output
  breadth: number;     // 0–1: how many sub-fields populated
  specificity: number; // 0–1: does it reference actual transcript content vs generic
  composite: number;   // weighted composite score
  weak: boolean;
  reason: string;
};

type Observation = {
  sourceType: "live_session" | "archive_upload" | "transcript_paste";
  sourceId: number;
  eventType: string;
  clientName: string;
  observationType: "weak_module" | "missing_capability" | "repeated_pattern" | "operator_friction" | "data_gap" | "cross_event_trend";
  moduleName: string | null;
  observation: string;
  confidence: number;
  suggestedCapability: string | null;
  rawContext: any;
};

// ─── Constants & Weights ─────────────────────────────────────────────────────

const MODULE_NAMES = [
  "executiveSummary", "sentimentAnalysis", "complianceReview", "keyTopics",
  "speakerAnalysis", "questionsAsked", "actionItems", "investorSignals",
  "communicationScore", "riskFactors", "competitiveIntelligence", "recommendations",
  "speakingPaceAnalysis", "toxicityScreen", "sentimentArc", "financialHighlights",
  "esgMentions", "pressReleaseDraft", "socialMediaContent", "boardReadySummary",
];

const MODULE_WEIGHTS: Record<string, number> = {
  executiveSummary: 1.0, sentimentAnalysis: 0.9, complianceReview: 0.95,
  keyTopics: 0.8, speakerAnalysis: 0.85, questionsAsked: 0.7,
  actionItems: 0.8, investorSignals: 0.9, communicationScore: 0.75,
  riskFactors: 0.85, competitiveIntelligence: 0.7, recommendations: 0.8,
  speakingPaceAnalysis: 0.6, toxicityScreen: 0.9, sentimentArc: 0.65,
  financialHighlights: 0.85, esgMentions: 0.5, pressReleaseDraft: 0.7,
  socialMediaContent: 0.5, boardReadySummary: 0.95,
};

const EVIDENCE_HALF_LIFE_DAYS = 14;
const PROMOTION_THRESHOLDS = {
  emerging_to_proposed: { minEvidence: 5, minScore: 0.55 },
  proposed_to_approved: { minEvidence: 12, minScore: 0.70 },
};
const QUALITY_WEIGHTS = { depth: 0.4, breadth: 0.3, specificity: 0.3 };

// ─── Algorithm 1: Module Quality Scoring ─────────────────────────────────────

const GENERIC_PHRASES = [
  "the company", "management team", "key stakeholders", "various factors",
  "going forward", "in the future", "as discussed", "overall positive",
  "no significant", "not applicable", "n/a", "no data available",
  "insufficient data", "could not determine", "unable to analyze",
];

function scoreModuleQuality(moduleName: string, value: any): ModuleQualityScore {
  let depth = 0, breadth = 0, specificity = 0;
  let reason = "";

  if (value === null || value === undefined) {
    return { module: moduleName, depth: 0, breadth: 0, specificity: 0, composite: 0, weak: true, reason: "Null output" };
  }

  // Depth: how much content is there?
  if (typeof value === "string") {
    const len = value.length;
    depth = Math.min(1, len / 600);
    breadth = len > 100 ? 0.5 : 0.1;
    const genericHits = GENERIC_PHRASES.filter(p => value.toLowerCase().includes(p)).length;
    specificity = Math.max(0, 1 - (genericHits * 0.2));
    if (len < 30) reason = `Very short (${len} chars)`;
  } else if (Array.isArray(value)) {
    depth = Math.min(1, value.length / 5);
    const populatedItems = value.filter(item => {
      if (typeof item === "object" && item !== null) {
        const vals = Object.values(item).filter(v => v !== null && v !== "" && v !== undefined);
        return vals.length >= 2;
      }
      return typeof item === "string" && item.length > 10;
    });
    breadth = value.length > 0 ? populatedItems.length / value.length : 0;
    const allText = JSON.stringify(value);
    const genericHits = GENERIC_PHRASES.filter(p => allText.toLowerCase().includes(p)).length;
    specificity = Math.max(0, 1 - (genericHits * 0.15));
    if (value.length === 0) reason = "Empty array";
  } else if (typeof value === "object") {
    const entries = Object.entries(value);
    const populated = entries.filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== 0);
    breadth = entries.length > 0 ? populated.length / entries.length : 0;
    const hasNumbers = populated.some(([, v]) => typeof v === "number" && v > 0);
    const hasStrings = populated.some(([, v]) => typeof v === "string" && (v as string).length > 20);
    depth = (hasNumbers ? 0.4 : 0) + (hasStrings ? 0.4 : 0) + (populated.length > 3 ? 0.2 : 0);
    const allText = JSON.stringify(value);
    const genericHits = GENERIC_PHRASES.filter(p => allText.toLowerCase().includes(p)).length;
    specificity = Math.max(0, 1 - (genericHits * 0.15));
    if (populated.length <= 1) reason = "Mostly empty fields";
  }

  const composite =
    (depth * QUALITY_WEIGHTS.depth) +
    (breadth * QUALITY_WEIGHTS.breadth) +
    (specificity * QUALITY_WEIGHTS.specificity);

  const weight = MODULE_WEIGHTS[moduleName] ?? 0.5;
  const threshold = 0.3 * weight;
  const weak = composite < threshold;

  if (!reason && weak) reason = `Low composite score (${composite.toFixed(2)} < ${threshold.toFixed(2)})`;

  return { module: moduleName, depth, breadth, specificity, composite, weak, reason };
}

// ─── Algorithm 2: Evidence Decay Function ────────────────────────────────────

function decayWeight(createdAt: Date | string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / EVIDENCE_HALF_LIFE_DAYS);
}

function computeDecayedEvidenceScore(observations: Array<{ confidence: number | null; createdAt: Date | string }>): number {
  if (observations.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const obs of observations) {
    const decay = decayWeight(obs.createdAt);
    const conf = obs.confidence ?? 0.5;
    weightedSum += conf * decay;
    totalWeight += decay;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ─── Algorithm 3: Cross-Event Correlation ────────────────────────────────────

type CorrelationResult = {
  pattern: string;
  clientCount: number;
  eventTypeCount: number;
  frequency: number;
  breadthScore: number;  // 0–1: appears across different contexts
  severityScore: number; // 0–1: how consistently confident
};

function detectCrossEventPatterns(observations: Array<{
  clientName: string | null;
  eventType: string | null;
  suggestedCapability: string | null;
  observation: string;
  confidence: number | null;
}>): CorrelationResult[] {
  const capGroups: Record<string, typeof observations> = {};

  for (const obs of observations) {
    const key = obs.suggestedCapability?.toLowerCase().trim() ?? obs.observation.slice(0, 60).toLowerCase();
    if (!capGroups[key]) capGroups[key] = [];
    capGroups[key].push(obs);
  }

  const results: CorrelationResult[] = [];
  for (const [pattern, group] of Object.entries(capGroups)) {
    if (group.length < 2) continue;
    const clients = new Set(group.map(o => o.clientName).filter(Boolean));
    const eventTypes = new Set(group.map(o => o.eventType).filter(Boolean));
    const avgConf = group.reduce((s, o) => s + (o.confidence ?? 0.5), 0) / group.length;

    const breadthScore = Math.min(1, ((clients.size - 1) * 0.3 + (eventTypes.size - 1) * 0.3 + Math.min(group.length, 10) / 10 * 0.4));

    results.push({
      pattern,
      clientCount: clients.size,
      eventTypeCount: eventTypes.size,
      frequency: group.length,
      breadthScore,
      severityScore: avgConf,
    });
  }

  return results.sort((a, b) => (b.breadthScore * b.severityScore * b.frequency) - (a.breadthScore * a.severityScore * a.frequency));
}

// ─── Algorithm 4: Autonomous Promotion ───────────────────────────────────────

const GOVERNANCE_GATEWAY = {
  stabilityThreshold: 0.65,
  minConsistentObservations: 3,
  maxFailureRate: 0.30,
  complianceBoundaryModules: ["complianceReview", "toxicityScreen", "riskFactors", "boardReadySummary"],
};

type GovernanceResult = {
  passed: boolean;
  stabilityScore: number;
  consistencyRate: number;
  complianceBoundaryCheck: boolean;
  reason: string;
};

function evaluateGovernanceGateway(
  observations: Array<{ confidence: number | null; createdAt: Date | string; moduleName?: string | null; observationType?: string }>,
  proposalCategory?: string | null
): GovernanceResult {
  if (observations.length === 0) {
    return { passed: false, stabilityScore: 0, consistencyRate: 0, complianceBoundaryCheck: false, reason: "No observations — insufficient evidence for governance clearance" };
  }

  const decayedScore = computeDecayedEvidenceScore(observations);
  const recentObs = observations.filter(o => decayWeight(o.createdAt) > 0.25);
  const consistentObs = recentObs.filter(o => (o.confidence ?? 0) >= 0.5);
  const consistencyRate = recentObs.length > 0 ? consistentObs.length / recentObs.length : 0;
  const failureRate = recentObs.length > 0 ? recentObs.filter(o => (o.confidence ?? 0) < 0.3).length / recentObs.length : 1;

  const stabilityScore = (decayedScore * 0.5) + (consistencyRate * 0.3) + ((1 - failureRate) * 0.2);

  const complianceModules = GOVERNANCE_GATEWAY.complianceBoundaryModules;
  const touchesCompliance = observations.some(o =>
    o.moduleName && complianceModules.includes(o.moduleName)
  );
  const complianceBoundaryCheck = !touchesCompliance || stabilityScore >= 0.75;

  const passed =
    stabilityScore >= GOVERNANCE_GATEWAY.stabilityThreshold &&
    consistentObs.length >= GOVERNANCE_GATEWAY.minConsistentObservations &&
    failureRate <= GOVERNANCE_GATEWAY.maxFailureRate &&
    complianceBoundaryCheck;

  let reason: string;
  if (passed) {
    reason = `Governance gateway passed: stability ${stabilityScore.toFixed(3)}, consistency ${(consistencyRate * 100).toFixed(0)}%, failure rate ${(failureRate * 100).toFixed(0)}%`;
  } else if (stabilityScore < GOVERNANCE_GATEWAY.stabilityThreshold) {
    reason = `Blocked: stability score ${stabilityScore.toFixed(3)} below threshold ${GOVERNANCE_GATEWAY.stabilityThreshold}`;
  } else if (!complianceBoundaryCheck) {
    reason = `Blocked: tool impacts compliance-critical modules but stability ${stabilityScore.toFixed(3)} below compliance threshold 0.75`;
  } else if (failureRate > GOVERNANCE_GATEWAY.maxFailureRate) {
    reason = `Blocked: failure rate ${(failureRate * 100).toFixed(0)}% exceeds maximum ${(GOVERNANCE_GATEWAY.maxFailureRate * 100).toFixed(0)}%`;
  } else {
    reason = `Blocked: insufficient consistent observations (${consistentObs.length} < ${GOVERNANCE_GATEWAY.minConsistentObservations})`;
  }

  return { passed, stabilityScore, consistencyRate, complianceBoundaryCheck, reason };
}

async function runAutonomousPromotion(): Promise<{ promoted: string[]; governanceResults: Array<{ title: string; governance: GovernanceResult }> }> {
  const db = await getDb();
  const promoted: string[] = [];
  const governanceResults: Array<{ title: string; governance: GovernanceResult }> = [];

  const proposals = await db
    .select()
    .from(aiToolProposals)
    .where(sql`status IN ('emerging', 'proposed')`);

  for (const proposal of proposals) {
    const obsIds: number[] = Array.isArray(proposal.observationIds) ? proposal.observationIds : [];
    if (obsIds.length === 0) continue;

    const observations = await db
      .select()
      .from(aiEvolutionObservations)
      .where(sql`id IN (${sql.join(obsIds.map(id => sql`${id}`), sql`,`)})`);

    const decayedScore = computeDecayedEvidenceScore(observations);
    const activeEvidence = observations.filter(o => decayWeight(o.createdAt) > 0.25).length;

    let newStatus = proposal.status;

    if (proposal.status === "emerging") {
      const t = PROMOTION_THRESHOLDS.emerging_to_proposed;
      if (activeEvidence >= t.minEvidence && decayedScore >= t.minScore) {
        newStatus = "proposed";
      }
    } else if (proposal.status === "proposed") {
      const t = PROMOTION_THRESHOLDS.proposed_to_approved;
      if (activeEvidence >= t.minEvidence && decayedScore >= t.minScore) {
        const governance = evaluateGovernanceGateway(observations, proposal.category);
        governanceResults.push({ title: proposal.title, governance });
        if (!governance.passed) {
          console.log(`[AiEvolution] Governance gateway BLOCKED "${proposal.title}": ${governance.reason}`);
          newStatus = proposal.status;
        } else {
          console.log(`[AiEvolution] Governance gateway PASSED "${proposal.title}": stability=${governance.stabilityScore.toFixed(3)}`);
          newStatus = "approved";
        }
      }
    }

    if (newStatus !== proposal.status) {
      await db.update(aiToolProposals)
        .set({ status: newStatus, avgConfidence: decayedScore })
        .where(eq(aiToolProposals.id, proposal.id));
      promoted.push(`${proposal.title}: ${proposal.status} → ${newStatus}`);
      console.log(`[AiEvolution] Auto-promoted "${proposal.title}": ${proposal.status} → ${newStatus} (evidence: ${activeEvidence}, score: ${decayedScore.toFixed(3)})`);
    } else {
      await db.update(aiToolProposals)
        .set({ avgConfidence: decayedScore })
        .where(eq(aiToolProposals.id, proposal.id));
    }
  }

  return { promoted, governanceResults };
}

// ─── Algorithm 5: Gap Detection Matrix ───────────────────────────────────────

type GapMatrixEntry = {
  module: string;
  weight: number;
  avgQuality: number;
  failRate: number;
  gapScore: number; // higher = bigger gap
  eventTypesAffected: string[];
};

function buildGapMatrix(
  qualityScores: ModuleQualityScore[],
  historicalObservations: Array<{ moduleName: string | null; eventType: string | null }>
): GapMatrixEntry[] {
  const moduleFailCounts: Record<string, { total: number; fails: number; eventTypes: Set<string> }> = {};

  for (const mod of MODULE_NAMES) {
    moduleFailCounts[mod] = { total: 0, fails: 0, eventTypes: new Set() };
  }

  for (const obs of historicalObservations) {
    if (obs.moduleName && moduleFailCounts[obs.moduleName]) {
      moduleFailCounts[obs.moduleName].fails++;
      if (obs.eventType) moduleFailCounts[obs.moduleName].eventTypes.add(obs.eventType);
    }
  }

  for (const qs of qualityScores) {
    if (moduleFailCounts[qs.module]) {
      moduleFailCounts[qs.module].total++;
      if (qs.weak) moduleFailCounts[qs.module].fails++;
    }
  }

  const matrix: GapMatrixEntry[] = [];
  for (const mod of MODULE_NAMES) {
    const stats = moduleFailCounts[mod];
    const weight = MODULE_WEIGHTS[mod] ?? 0.5;
    const currentQuality = qualityScores.find(q => q.module === mod);
    const avgQuality = currentQuality?.composite ?? 0.5;
    const failRate = stats.total > 0 ? stats.fails / Math.max(stats.total, 1) : 0;

    // Gap Score = importance × failure_rate × (1 - quality) × breadth_factor
    const breadthFactor = 1 + (stats.eventTypes.size * 0.1);
    const gapScore = weight * failRate * (1 - avgQuality) * breadthFactor;

    matrix.push({
      module: mod,
      weight,
      avgQuality,
      failRate,
      gapScore,
      eventTypesAffected: [...stats.eventTypes],
    });
  }

  return matrix.sort((a, b) => b.gapScore - a.gapScore);
}

// ─── Algorithm 6: Impact Estimation Model ────────────────────────────────────

type ImpactScore = {
  frequency: number;    // how often this gap appears (0–1)
  breadth: number;      // across how many clients/event types (0–1)
  severity: number;     // avg confidence of observations (0–1)
  urgency: number;      // time-decay weighted recency (0–1)
  composite: number;    // weighted final score
  label: "low" | "medium" | "high" | "transformative";
};

function estimateImpact(
  observations: Array<{ confidence: number | null; createdAt: Date | string; clientName: string | null; eventType: string | null }>,
  totalEventsAnalyzed: number
): ImpactScore {
  const frequency = Math.min(1, observations.length / Math.max(totalEventsAnalyzed, 1));
  const clients = new Set(observations.map(o => o.clientName).filter(Boolean));
  const eventTypes = new Set(observations.map(o => o.eventType).filter(Boolean));
  const breadth = Math.min(1, (clients.size * 0.4 + eventTypes.size * 0.3) / 3);
  const severity = observations.length > 0
    ? observations.reduce((s, o) => s + (o.confidence ?? 0.5), 0) / observations.length
    : 0;
  const recentObs = observations.filter(o => decayWeight(o.createdAt) > 0.5);
  const urgency = Math.min(1, recentObs.length / Math.max(observations.length, 1));

  const composite = (frequency * 0.25) + (breadth * 0.25) + (severity * 0.25) + (urgency * 0.25);

  const label = composite >= 0.75 ? "transformative" : composite >= 0.55 ? "high" : composite >= 0.35 ? "medium" : "low";

  return { frequency, breadth, severity, urgency, composite, label };
}

// ─── Main Entry Points ──────────────────────────────────────────────────────

export async function runMetaObserver(
  report: AiReport,
  sourceType: "live_session" | "archive_upload" | "transcript_paste",
  sourceId: number,
  eventType: string,
  clientName: string,
  transcriptLength: number
): Promise<{ observationCount: number; qualityScores: ModuleQualityScore[]; gapMatrix: GapMatrixEntry[] }> {
  const db = await getDb();
  const observations: Observation[] = [];

  // ── Step 1: Score every module ──
  const qualityScores: ModuleQualityScore[] = [];
  for (const mod of MODULE_NAMES) {
    const score = scoreModuleQuality(mod, (report as any)[mod]);
    qualityScores.push(score);
    if (score.weak) {
      observations.push({
        sourceType, sourceId, eventType, clientName,
        observationType: "weak_module",
        moduleName: mod,
        observation: `Module "${mod}" scored ${score.composite.toFixed(2)} — ${score.reason}. Depth: ${score.depth.toFixed(2)}, Breadth: ${score.breadth.toFixed(2)}, Specificity: ${score.specificity.toFixed(2)}`,
        confidence: 1 - score.composite,
        suggestedCapability: null,
        rawContext: { depth: score.depth, breadth: score.breadth, specificity: score.specificity, composite: score.composite },
      });
    }
  }

  // ── Step 2: Build gap matrix using historical data ──
  const historicalObs = await db
    .select({ moduleName: aiEvolutionObservations.moduleName, eventType: aiEvolutionObservations.eventType })
    .from(aiEvolutionObservations)
    .where(eq(aiEvolutionObservations.observationType, "weak_module"))
    .limit(500);

  const gapMatrix = buildGapMatrix(qualityScores, historicalObs);

  // ── Step 3: AI-powered gap analysis ──
  try {
    const reportFingerprint = {
      modulesStrong: qualityScores.filter(q => !q.weak).map(q => q.module),
      modulesWeak: qualityScores.filter(q => q.weak).map(q => `${q.module} (${q.reason})`),
      avgComposite: (qualityScores.reduce((s, q) => s + q.composite, 0) / qualityScores.length).toFixed(3),
      topGaps: gapMatrix.slice(0, 3).map(g => `${g.module}: gap=${g.gapScore.toFixed(3)}, failRate=${(g.failRate * 100).toFixed(0)}%`),
      eventType, transcriptLength,
      hasFinancials: (report.financialHighlights?.length ?? 0) > 0,
      hasQuestions: (report.questionsAsked?.length ?? 0) > 0,
      speakerCount: report.speakerAnalysis?.length ?? 0,
      topicCount: report.keyTopics?.length ?? 0,
      boardVerdict: report.boardReadySummary?.verdict ?? "N/A",
    };

    const resp = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are CuraLive's Autonomous AI Meta-Observer. You analyze intelligence report quality to identify what the platform CANNOT yet do.

Your observations must be specific and actionable. Think like a product strategist:
- What would a fund manager still need to look up manually after reading this report?
- What cross-event trends are invisible because they're not tracked longitudinally?
- What operational workflows could be fully automated but aren't?
- What adjacent data sources would multiply the report's value if integrated?

For each observation, suggest a concrete new AI tool with a clear name.

Return ONLY valid JSON array (no markdown):
[
  {
    "type": "missing_capability|repeated_pattern|data_gap|cross_event_trend",
    "observation": "Specific description of the gap",
    "suggestedCapability": "Concrete Tool Name",
    "confidence": 0.0-1.0,
    "category": "analysis|tracking|automation|reporting|integration"
  }
]`
        },
        {
          role: "user",
          content: `Report fingerprint for "${clientName}" ${eventType}:\n${JSON.stringify(reportFingerprint, null, 2)}\n\nExecutive summary excerpt: ${report.executiveSummary?.slice(0, 400)}`
        },
      ],
      model: "gpt-4o-mini",
    });

    const raw = (resp.choices?.[0]?.message?.content ?? "").trim();
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const aiObs = JSON.parse(cleaned);

    if (Array.isArray(aiObs)) {
      for (const obs of aiObs.slice(0, 5)) {
        const validType = ["missing_capability", "repeated_pattern", "data_gap", "cross_event_trend"].includes(obs.type) ? obs.type : "missing_capability";
        observations.push({
          sourceType, sourceId, eventType, clientName,
          observationType: validType,
          moduleName: null,
          observation: obs.observation ?? "Unspecified",
          confidence: Math.min(1, Math.max(0, obs.confidence ?? 0.5)),
          suggestedCapability: obs.suggestedCapability ?? null,
          rawContext: { category: obs.category ?? "analysis", aiGenerated: true },
        });
      }
    }
  } catch (err) {
    console.error("[AiEvolution] Meta-observer AI analysis failed:", err);
  }

  // ── Step 4: Persist observations ──
  if (observations.length > 0) {
    for (const obs of observations) {
      await db.insert(aiEvolutionObservations).values(obs);
    }
    console.log(`[AiEvolution] ${observations.length} observations recorded for ${sourceType} #${sourceId} (avg module quality: ${(qualityScores.reduce((s, q) => s + q.composite, 0) / qualityScores.length).toFixed(3)})`);
  }

  return { observationCount: observations.length, qualityScores, gapMatrix };
}

export async function runAccumulationEngine(): Promise<{
  proposalsCreated: number;
  proposalsUpdated: number;
  promoted: string[];
  crossEventPatterns: CorrelationResult[];
}> {
  const db = await getDb();

  // ── Gather unclustered observations ──
  const unclustered = await db
    .select()
    .from(aiEvolutionObservations)
    .where(isNull(aiEvolutionObservations.clusterId))
    .orderBy(desc(aiEvolutionObservations.createdAt))
    .limit(200);

  if (unclustered.length < 2) {
    const { promoted } = await runAutonomousPromotion();
    return { proposalsCreated: 0, proposalsUpdated: 0, promoted, crossEventPatterns: [] };
  }

  // ── Run cross-event correlation ──
  const allRecent = await db
    .select()
    .from(aiEvolutionObservations)
    .where(sql`observation_type != 'weak_module'`)
    .orderBy(desc(aiEvolutionObservations.createdAt))
    .limit(300);

  const crossEventPatterns = detectCrossEventPatterns(allRecent);

  // ── Gather existing proposals ──
  const existingProposals = await db
    .select()
    .from(aiToolProposals)
    .where(sql`status NOT IN ('rejected', 'live')`)
    .orderBy(desc(aiToolProposals.evidenceCount));

  let proposalsCreated = 0;
  let proposalsUpdated = 0;

  try {
    const observationSummaries = unclustered.map(o => ({
      id: o.id,
      type: o.observationType,
      observation: o.observation,
      suggestedCapability: o.suggestedCapability,
      confidence: o.confidence,
      eventType: o.eventType,
      category: (o.rawContext as any)?.category ?? "analysis",
    }));

    const existingSummaries = existingProposals.map(p => ({
      id: p.id, title: p.title, category: p.category, evidenceCount: p.evidenceCount, status: p.status,
    }));

    const correlationContext = crossEventPatterns.slice(0, 5).map(c => ({
      pattern: c.pattern,
      frequency: c.frequency,
      clientCount: c.clientCount,
      eventTypeCount: c.eventTypeCount,
      breadthScore: c.breadthScore.toFixed(2),
    }));

    const resp = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are CuraLive's AI Accumulation Engine. Cluster observations into tool proposals.

RULES:
1. Match observations to existing proposals if they describe the same capability gap
2. Create NEW proposals only for genuinely distinct capability gaps
3. Each proposal should be a specific, buildable AI tool — not a vague improvement
4. Use cross-event correlation data to identify the highest-impact proposals

Return ONLY valid JSON:
{
  "matches": [{ "observationId": <int>, "proposalId": <int> }],
  "newProposals": [{
    "title": "Specific Tool Name",
    "description": "What it does and why it matters (2-3 sentences)",
    "category": "analysis|tracking|automation|reporting|integration",
    "rationale": "Evidence-based reasoning",
    "estimatedImpact": "low|medium|high|transformative",
    "observationIds": [<int>, ...],
    "promptTemplate": "System prompt that would power this tool (2-4 sentences)"
  }]
}`
        },
        {
          role: "user",
          content: `Observations:\n${JSON.stringify(observationSummaries, null, 2)}\n\nExisting proposals:\n${JSON.stringify(existingSummaries, null, 2)}\n\nCross-event patterns:\n${JSON.stringify(correlationContext, null, 2)}`
        },
      ],
      model: "gpt-4o-mini",
    });

    const raw = (resp.choices?.[0]?.message?.content ?? "").trim();
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleaned);

    // Process matches — group by proposal to avoid overwrite corruption
    if (Array.isArray(result.matches)) {
      const matchesByProposal: Record<number, number[]> = {};
      for (const match of result.matches) {
        if (!match.observationId || !match.proposalId) continue;
        if (!matchesByProposal[match.proposalId]) matchesByProposal[match.proposalId] = [];
        matchesByProposal[match.proposalId].push(match.observationId);
      }

      for (const [proposalIdStr, newObsIds] of Object.entries(matchesByProposal)) {
        const proposalId = Number(proposalIdStr);
        const prop = existingProposals.find(p => p.id === proposalId);
        if (!prop) continue;

        for (const obsId of newObsIds) {
          await db.update(aiEvolutionObservations)
            .set({ clusterId: proposalId })
            .where(eq(aiEvolutionObservations.id, obsId));
        }

        const existingIds: number[] = Array.isArray(prop.observationIds) ? [...prop.observationIds] : [];
        const mergedIds = [...new Set([...existingIds, ...newObsIds])];

        const linkedObs = await db.select()
          .from(aiEvolutionObservations)
          .where(eq(aiEvolutionObservations.clusterId, proposalId));
        const totalEvents = new Set(linkedObs.map(o => `${o.sourceType}-${o.sourceId}`)).size;
        const impact = estimateImpact(linkedObs, totalEvents);

        await db.update(aiToolProposals)
          .set({ evidenceCount: mergedIds.length, observationIds: mergedIds, avgConfidence: impact.composite, estimatedImpact: impact.label })
          .where(eq(aiToolProposals.id, proposalId));
        proposalsUpdated++;
      }
    }

    // Process new proposals
    if (Array.isArray(result.newProposals)) {
      for (const np of result.newProposals.slice(0, 3)) {
        const validCat = ["analysis", "tracking", "automation", "reporting", "integration"].includes(np.category) ? np.category : "analysis";
        const obsIds: number[] = Array.isArray(np.observationIds) ? np.observationIds : [];

        const linkedObs = unclustered.filter(o => obsIds.includes(o.id));
        const impact = estimateImpact(linkedObs, Math.max(1, new Set(linkedObs.map(o => `${o.sourceType}-${o.sourceId}`)).size));

        const [inserted] = await db.insert(aiToolProposals).values({
          title: np.title ?? "Unnamed Tool",
          description: np.description ?? "",
          category: validCat,
          rationale: np.rationale ?? "",
          evidenceCount: obsIds.length,
          avgConfidence: impact.composite,
          observationIds: obsIds,
          status: obsIds.length >= 5 ? "proposed" : "emerging",
          estimatedImpact: impact.label,
          promptTemplate: np.promptTemplate ?? null,
        });

        const proposalId = (inserted as any).insertId;
        for (const obsId of obsIds) {
          await db.update(aiEvolutionObservations)
            .set({ clusterId: proposalId })
            .where(eq(aiEvolutionObservations.id, obsId));
        }
        proposalsCreated++;
      }
    }

    // Mark remaining unclustered as processed (cluster_id = 0)
    for (const obs of unclustered) {
      const [check] = await db.select({ clusterId: aiEvolutionObservations.clusterId })
        .from(aiEvolutionObservations).where(eq(aiEvolutionObservations.id, obs.id)).limit(1);
      if (check?.clusterId === null) {
        await db.update(aiEvolutionObservations).set({ clusterId: 0 }).where(eq(aiEvolutionObservations.id, obs.id));
      }
    }
  } catch (err) {
    console.error("[AiEvolution] Accumulation engine failed:", err);
  }

  // ── Run autonomous promotion ──
  const { promoted } = await runAutonomousPromotion();

  console.log(`[AiEvolution] Accumulation complete: ${proposalsCreated} new, ${proposalsUpdated} updated, ${promoted.length} promoted, ${crossEventPatterns.length} cross-event patterns`);
  return { proposalsCreated, proposalsUpdated, promoted, crossEventPatterns };
}

// ─── Dashboard Data ──────────────────────────────────────────────────────────

export async function getEvolutionDashboard() {
  const db = await getDb();

  const observations = await db.select().from(aiEvolutionObservations)
    .orderBy(desc(aiEvolutionObservations.createdAt)).limit(200);

  const proposals = await db.select().from(aiToolProposals)
    .orderBy(desc(aiToolProposals.evidenceCount)).limit(50);

  // Stats
  const byType: Record<string, number> = {};
  for (const o of observations) byType[o.observationType] = (byType[o.observationType] ?? 0) + 1;

  const weakModules: Record<string, { count: number; avgComposite: number }> = {};
  for (const o of observations.filter(o => o.observationType === "weak_module" && o.moduleName)) {
    if (!weakModules[o.moduleName!]) weakModules[o.moduleName!] = { count: 0, avgComposite: 0 };
    weakModules[o.moduleName!].count++;
    const ctx = o.rawContext as any;
    weakModules[o.moduleName!].avgComposite += ctx?.composite ?? 0;
  }
  for (const [, v] of Object.entries(weakModules)) {
    if (v.count > 0) v.avgComposite /= v.count;
  }

  const topWeakModules = Object.entries(weakModules)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([name, data]) => ({ module: name, failCount: data.count, avgQuality: data.avgComposite }));

  const statusCounts: Record<string, number> = {};
  for (const p of proposals) statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;

  const eventsAnalyzed = new Set(observations.map(o => `${o.sourceType}-${o.sourceId}`)).size;

  // Cross-event patterns
  const nonWeakObs = observations.filter(o => o.observationType !== "weak_module");
  const crossEventPatterns = detectCrossEventPatterns(nonWeakObs).slice(0, 10);

  // Gap matrix from most recent event
  const recentWeak = observations.filter(o => o.observationType === "weak_module");
  const gapMatrix = MODULE_NAMES.map(mod => {
    const fails = recentWeak.filter(o => o.moduleName === mod);
    const weight = MODULE_WEIGHTS[mod] ?? 0.5;
    const failRate = eventsAnalyzed > 0 ? fails.length / eventsAnalyzed : 0;
    return { module: mod, weight, failRate, gapScore: weight * failRate };
  }).sort((a, b) => b.gapScore - a.gapScore);

  // Evolution velocity: how fast is the system learning?
  const now = Date.now();
  const last7days = observations.filter(o => (now - new Date(o.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length;
  const last30days = observations.filter(o => (now - new Date(o.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000).length;

  return {
    totalObservations: observations.length,
    eventsAnalyzed,
    observationsByType: byType,
    topWeakModules,
    proposals,
    proposalsByStatus: statusCounts,
    recentObservations: observations.slice(0, 30),
    crossEventPatterns,
    gapMatrix,
    velocity: { last7days, last30days },
    algorithmStats: {
      evidenceDecayHalfLife: EVIDENCE_HALF_LIFE_DAYS,
      promotionThresholds: PROMOTION_THRESHOLDS,
      qualityWeights: QUALITY_WEIGHTS,
      moduleWeights: MODULE_WEIGHTS,
    },
  };
}
