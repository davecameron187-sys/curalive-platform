// @ts-nocheck
/**
 * CuraLive AGM Governance AI Service
 *
 * Autonomous self-evolving intelligence system purpose-built for Annual General Meetings.
 * Integrates with the core AI Evolution Engine (Module M) to self-improve after every AGM.
 *
 * 6 Autonomous Algorithms:
 *   1. Resolution Sentiment Predictor    — predicts approval % from debate sentiment; learns from outcomes
 *   2. Shareholder Dissent Pattern Engine — detects recurring dissent across AGMs; builds institutional memory
 *   3. Q&A Governance Triage             — classifies shareholder questions by governance significance
 *   4. Quorum & Participation Intelligence — monitors thresholds + benchmarks against history
 *   5. Regulatory Speech Guardian         — flags Companies Act 71, JSE, King IV deviations in real-time
 *   6. Post-AGM Governance Report Generator — autonomous board-ready reports that improve each cycle
 */

import { getDb } from "../db";
import {
  agmResolutions, agmIntelligenceSessions, agmDissentPatterns,
  agmGovernanceObservations, aiEvolutionObservations,
} from "../../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const EVIDENCE_HALF_LIFE_DAYS = 14;

function decayWeight(date: Date | string): number {
  const ageDays = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / EVIDENCE_HALF_LIFE_DAYS);
}

// ─── Algorithm 1: Resolution Sentiment Predictor ─────────────────────────────

const CATEGORY_BASE_APPROVAL: Record<string, number> = {
  ordinary: 92, special: 78, advisory: 85,
  remuneration: 72, board_election: 88, auditor_appointment: 95,
  share_repurchase: 80, dividend: 94, esg: 76, other: 85,
};

const SENTIMENT_WEIGHT_CURVE = [
  { sentimentFloor: 80, approvalDelta: +5 },
  { sentimentFloor: 60, approvalDelta: 0 },
  { sentimentFloor: 40, approvalDelta: -8 },
  { sentimentFloor: 20, approvalDelta: -18 },
  { sentimentFloor: 0, approvalDelta: -30 },
];

export async function predictResolutionApproval(
  userId: number,
  sessionId: number,
  resolutionId: number,
  liveTranscriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  predictedApprovalPct: number;
  sentimentScore: number;
  confidence: number;
  reasoning: string;
}> {
  await assertSessionOwnership(sessionId, userId);
  await assertResolutionBelongsToSession(resolutionId, sessionId);
  const db = await getDb();
  const [resolution] = await db.select().from(agmResolutions).where(eq(agmResolutions.id, resolutionId)).limit(1);
  if (!resolution) throw new Error("Resolution not found");

  const baseApproval = CATEGORY_BASE_APPROVAL[resolution.category] ?? 85;

  const historicalResolutions = await db.select().from(agmResolutions)
    .where(and(eq(agmResolutions.category, resolution.category), sql`actual_approval_pct IS NOT NULL`))
    .orderBy(desc(agmResolutions.createdAt))
    .limit(50);

  let historicalAvg = baseApproval;
  if (historicalResolutions.length > 0) {
    let weightedSum = 0, totalWeight = 0;
    for (const hr of historicalResolutions) {
      const w = decayWeight(hr.createdAt);
      weightedSum += (hr.actualApprovalPct ?? baseApproval) * w;
      totalWeight += w;
    }
    historicalAvg = totalWeight > 0 ? weightedSum / totalWeight : baseApproval;
  }

  let sentimentScore = 65;
  if (liveTranscriptSegments.length > 0) {
    try {
      const debateText = liveTranscriptSegments.map(s => `${s.speaker}: ${s.text}`).join("\n").slice(0, 4000);
      const resp = await invokeLLM({
        messages: [
          { role: "system", content: `You are an AGM sentiment analyst. Score the shareholder sentiment about this resolution on a scale of 0–100. Consider tone, language, objections raised, and support expressed. Return ONLY a JSON object: {"score": <number>, "reasoning": "<1 sentence>"}` },
          { role: "user", content: `Resolution: "${resolution.title}" (Category: ${resolution.category})\n\nDebate transcript:\n${debateText}` },
        ],
        model: "gpt-4o-mini",
      });
      const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      sentimentScore = Math.max(0, Math.min(100, parsed.score ?? 65));
    } catch { /* fallback to default */ }
  }

  const sentimentDelta = SENTIMENT_WEIGHT_CURVE.find(c => sentimentScore >= c.sentimentFloor)?.approvalDelta ?? 0;

  const blendedPrediction = Math.max(0, Math.min(100,
    (historicalAvg * 0.4) + (baseApproval * 0.2) + ((baseApproval + sentimentDelta) * 0.4)
  ));

  const confidence = Math.min(0.95, 0.3 + (historicalResolutions.length * 0.03) + (liveTranscriptSegments.length > 5 ? 0.2 : 0));

  await db.update(agmResolutions).set({
    sentimentDuringDebate: sentimentScore,
    predictedApprovalPct: Math.round(blendedPrediction * 10) / 10,
  }).where(eq(agmResolutions.id, resolutionId));

  await db.insert(agmGovernanceObservations).values({
    sessionId,
    algorithmSource: "resolution_sentiment",
    observationType: "prediction_made",
    severity: blendedPrediction < 60 ? "high" : blendedPrediction < 75 ? "medium" : "info",
    title: `Resolution ${resolution.resolutionNumber}: Predicted ${Math.round(blendedPrediction)}% approval`,
    detail: `Sentiment score ${sentimentScore}/100 during debate. Historical average for ${resolution.category}: ${Math.round(historicalAvg)}%. Based on ${historicalResolutions.length} prior resolutions.`,
    confidence,
    relatedResolutionId: resolutionId,
    rawData: { sentimentScore, historicalAvg, baseApproval, sentimentDelta, historicalCount: historicalResolutions.length },
  });

  return {
    predictedApprovalPct: Math.round(blendedPrediction * 10) / 10,
    sentimentScore,
    confidence,
    reasoning: `Base ${resolution.category} approval: ${Math.round(historicalAvg)}%. Debate sentiment ${sentimentScore}/100 applied ${sentimentDelta > 0 ? "+" : ""}${sentimentDelta}% adjustment. Confidence: ${Math.round(confidence * 100)}% (${historicalResolutions.length} historical data points).`,
  };
}

export async function recordActualResult(userId: number, sessionId: number, resolutionId: number, actualApprovalPct: number) {
  await assertSessionOwnership(sessionId, userId);
  await assertResolutionBelongsToSession(resolutionId, sessionId);
  const db = await getDb();
  const [resolution] = await db.select().from(agmResolutions).where(eq(agmResolutions.id, resolutionId)).limit(1);
  if (!resolution) throw new Error("Resolution not found");

  const accuracy = resolution.predictedApprovalPct != null
    ? Math.max(0, 100 - Math.abs(resolution.predictedApprovalPct - actualApprovalPct))
    : null;

  await db.update(agmResolutions).set({
    actualApprovalPct,
    predictionAccuracy: accuracy,
    status: actualApprovalPct >= 50 ? "carried" : "defeated",
  }).where(eq(agmResolutions.id, resolutionId));

  if (accuracy != null && accuracy < 70) {
    await db.insert(aiEvolutionObservations).values({
      sourceType: "live_session",
      sourceId: resolution.sessionId,
      eventType: "agm",
      clientName: null,
      observationType: "weak_module",
      moduleName: "agm_resolution_predictor",
      observation: `Resolution prediction accuracy was ${Math.round(accuracy)}% for "${resolution.title}" (${resolution.category}). Predicted ${resolution.predictedApprovalPct}%, actual ${actualApprovalPct}%.`,
      confidence: 0.8,
      suggestedCapability: "improved_resolution_prediction_model",
      rawContext: { resolutionId, category: resolution.category, predicted: resolution.predictedApprovalPct, actual: actualApprovalPct, accuracy },
    });
  }

  return { accuracy, status: actualApprovalPct >= 50 ? "carried" : "defeated" };
}

// ─── Algorithm 2: Shareholder Dissent Pattern Engine ─────────────────────────

export async function analyzeDissentPatterns(userId: number, sessionId: number, _clientName?: string): Promise<{
  patternsFound: number;
  newPatterns: number;
  updatedPatterns: number;
  riskLevel: string;
}> {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const [session] = await db.select().from(agmIntelligenceSessions)
    .where(eq(agmIntelligenceSessions.id, sessionId)).limit(1);
  if (!session) throw new Error("AGM session not found");
  const clientName = session.clientName;

  const resolutions = await db.select().from(agmResolutions)
    .where(eq(agmResolutions.sessionId, sessionId));

  const highDissentResolutions = resolutions.filter(r =>
    (r.actualApprovalPct != null && r.actualApprovalPct < 80) ||
    (r.predictedApprovalPct != null && r.predictedApprovalPct < 70) ||
    (r.dissenterCount ?? 0) > 0
  );

  const existingPatterns = await db.select().from(agmDissentPatterns)
    .where(eq(agmDissentPatterns.clientName, clientName));

  let newPatterns = 0, updatedPatterns = 0;

  const categoryDissent: Record<string, number> = {};
  for (const r of highDissentResolutions) {
    categoryDissent[r.category] = (categoryDissent[r.category] ?? 0) + 1;
  }

  for (const [category, count] of Object.entries(categoryDissent)) {
    if (count < 1) continue;

    const existing = existingPatterns.find(p =>
      p.patternType === "category_dissent" && p.category === category
    );

    if (existing) {
      const existingSessionIds: number[] = Array.isArray(existing.sessionIds) ? existing.sessionIds : [];
      if (!existingSessionIds.includes(sessionId)) {
        existingSessionIds.push(sessionId);
      }
      await db.update(agmDissentPatterns).set({
        frequency: (existing.frequency ?? 0) + count,
        lastSeen: new Date(),
        sessionIds: existingSessionIds,
        confidence: Math.min(0.95, (existing.confidence ?? 0.5) + 0.05),
        decayedScore: decayWeight(existing.firstSeen) * Math.min(0.95, (existing.confidence ?? 0.5) + 0.05) * ((existing.frequency ?? 0) + count),
      }).where(eq(agmDissentPatterns.id, existing.id));
      updatedPatterns++;
    } else {
      await db.insert(agmDissentPatterns).values({
        clientName,
        patternType: "category_dissent",
        category,
        description: `Dissent detected on ${count} ${category} resolution(s) at this AGM. Monitor for recurring shareholder opposition in this governance area.`,
        frequency: count,
        confidence: 0.4 + (count * 0.1),
        sessionIds: [sessionId],
        evidenceData: { resolutionIds: highDissentResolutions.filter(r => r.category === category).map(r => r.id) },
        actionRecommendation: `Review ${category} policy ahead of next AGM. Consider proactive shareholder engagement on this topic.`,
        decayedScore: 0.5 * count,
      });
      newPatterns++;
    }
  }

  const lowApprovalResolutions = resolutions.filter(r => r.actualApprovalPct != null && r.actualApprovalPct < 50);
  if (lowApprovalResolutions.length > 0) {
    for (const r of lowApprovalResolutions) {
      await db.insert(agmDissentPatterns).values({
        clientName,
        patternType: "threshold_breach",
        category: r.category,
        description: `Resolution "${r.title}" defeated with only ${r.actualApprovalPct}% approval. This represents a governance failure requiring board attention.`,
        frequency: 1,
        confidence: 0.9,
        sessionIds: [sessionId],
        evidenceData: { resolutionId: r.id, approvalPct: r.actualApprovalPct },
        actionRecommendation: `Mandatory board review required. Engage dissenting shareholders before next AGM.`,
        decayedScore: 0.9,
      });
      newPatterns++;
    }
  }

  await db.insert(agmGovernanceObservations).values({
    sessionId,
    algorithmSource: "dissent_pattern",
    observationType: "pattern_identified",
    severity: lowApprovalResolutions.length > 0 ? "critical" : highDissentResolutions.length > 2 ? "high" : "info",
    title: `Dissent analysis: ${newPatterns} new, ${updatedPatterns} updated patterns`,
    detail: `Analyzed ${resolutions.length} resolutions. ${highDissentResolutions.length} showed elevated dissent. ${lowApprovalResolutions.length} defeated.`,
    confidence: 0.7,
    rawData: { categoryDissent, highDissentCount: highDissentResolutions.length, defeatedCount: lowApprovalResolutions.length },
  });

  const riskLevel = lowApprovalResolutions.length > 0 ? "critical"
    : highDissentResolutions.length > resolutions.length * 0.3 ? "high"
    : highDissentResolutions.length > 0 ? "medium" : "low";

  if (highDissentResolutions.length > 0) {
    await db.insert(aiEvolutionObservations).values({
      sourceType: "live_session",
      sourceId: sessionId,
      eventType: "agm",
      observationType: "repeated_pattern",
      moduleName: "agm_dissent_engine",
      observation: `Dissent engine detected ${highDissentResolutions.length} high-dissent resolutions across categories: ${Object.keys(categoryDissent).join(", ")}. Risk level: ${riskLevel}.`,
      confidence: 0.7,
      suggestedCapability: "pre_agm_shareholder_engagement_tool",
      rawContext: { sessionId, categoryDissent, riskLevel, defeatedCount: lowApprovalResolutions.length },
    });
  }

  return { patternsFound: newPatterns + updatedPatterns, newPatterns, updatedPatterns, riskLevel };
}

// ─── Algorithm 3: Q&A Governance Triage ──────────────────────────────────────

const GOVERNANCE_CATEGORIES = [
  "remuneration", "board_composition", "audit_concerns", "esg_sustainability",
  "shareholder_rights", "capital_allocation", "risk_management", "executive_conduct",
  "related_party_transactions", "regulatory_compliance", "strategic_direction", "general",
];

export async function triageGovernanceQuestions(
  userId: number,
  sessionId: number,
  questions: Array<{ speaker: string; question: string; timestamp?: number }>
): Promise<{
  triaged: Array<{
    question: string;
    speaker: string;
    category: string;
    regulatorySignificance: "must_address" | "should_address" | "optional";
    priority: number;
    reasoning: string;
  }>;
  governanceQuestionCount: number;
}> {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  if (questions.length === 0) return { triaged: [], governanceQuestionCount: 0 };

  try {
    const resp = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a corporate governance Q&A triage specialist for AGMs under South African law (Companies Act 71 of 2008, JSE Listings Requirements, King IV).

Classify each shareholder question into:
- category: one of [${GOVERNANCE_CATEGORIES.join(", ")}]
- regulatorySignificance: "must_address" (legally required to answer under Companies Act/JSE rules), "should_address" (governance best practice under King IV), "optional" (general interest)
- priority: 1-10 (10 = highest urgency)
- reasoning: brief explanation of why this classification

Return ONLY valid JSON array: [{"questionIndex": <int>, "category": "<string>", "regulatorySignificance": "<string>", "priority": <int>, "reasoning": "<string>"}]`,
        },
        {
          role: "user",
          content: `Questions from the AGM Q&A:\n${questions.map((q, i) => `${i}. [${q.speaker}]: ${q.question}`).join("\n")}`,
        },
      ],
      model: "gpt-4o-mini",
    });

    const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(raw);

    const triaged = (Array.isArray(parsed) ? parsed : []).map((t: any) => {
      const q = questions[t.questionIndex];
      if (!q) return null;
      return {
        question: q.question,
        speaker: q.speaker,
        category: GOVERNANCE_CATEGORIES.includes(t.category) ? t.category : "general",
        regulatorySignificance: ["must_address", "should_address", "optional"].includes(t.regulatorySignificance) ? t.regulatorySignificance : "optional",
        priority: Math.max(1, Math.min(10, t.priority ?? 5)),
        reasoning: t.reasoning ?? "",
      };
    }).filter(Boolean).sort((a: any, b: any) => b.priority - a.priority);

    const governanceCount = triaged.filter((t: any) => t.category !== "general").length;
    const mustAddress = triaged.filter((t: any) => t.regulatorySignificance === "must_address").length;

    await db.insert(agmGovernanceObservations).values({
      sessionId,
      algorithmSource: "qa_governance_triage",
      observationType: mustAddress > 0 ? "compliance_flag" : "prediction_made",
      severity: mustAddress > 2 ? "high" : mustAddress > 0 ? "medium" : "info",
      title: `Q&A Triage: ${questions.length} questions, ${mustAddress} require mandatory response`,
      detail: `${governanceCount} governance-related questions identified. ${mustAddress} must be addressed under Companies Act/JSE rules. Top category: ${triaged[0]?.category ?? "none"}.`,
      confidence: 0.75,
      rawData: { totalQuestions: questions.length, governanceCount, mustAddress, categories: triaged.map((t: any) => t.category) },
    });

    if (mustAddress > 0) {
      await db.insert(aiEvolutionObservations).values({
        sourceType: "live_session",
        sourceId: sessionId,
        eventType: "agm",
        observationType: "repeated_pattern",
        moduleName: "agm_qa_triage",
        observation: `Q&A triage found ${mustAddress} must-address governance questions out of ${questions.length} total. Top category: ${triaged[0]?.category ?? "none"}.`,
        confidence: 0.75,
        suggestedCapability: "pre_agm_qa_preparation_tool",
        rawContext: { totalQuestions: questions.length, governanceCount, mustAddress, topCategory: triaged[0]?.category ?? "none" },
      });
    }

    return { triaged, governanceQuestionCount: governanceCount };
  } catch (err) {
    console.error("[AGM-AI] Q&A triage failed:", err);
    return { triaged: questions.map(q => ({
      question: q.question, speaker: q.speaker, category: "general",
      regulatorySignificance: "optional" as const, priority: 5, reasoning: "Auto-classification unavailable",
    })), governanceQuestionCount: 0 };
  }
}

// ─── Algorithm 4: Quorum & Participation Intelligence ────────────────────────

const JURISDICTION_QUORUM_RULES: Record<string, { minPct: number; description: string }> = {
  south_africa: { minPct: 25, description: "Companies Act 71 s64(1): At least 25% of voting rights at any time during the meeting" },
  united_kingdom: { minPct: 25, description: "Model Articles: Two qualifying persons present at the meeting" },
  united_states: { minPct: 33.33, description: "Typical: majority of shares outstanding or as per bylaws" },
  australia: { minPct: 25, description: "Corporations Act 2001 s249T: Two shareholders present" },
  other: { minPct: 25, description: "Default minimum: 25% of voting rights" },
};

export async function analyzeQuorumAndParticipation(
  userId: number,
  sessionId: number,
  attendanceCount: number,
  proxyCount: number,
  totalEligibleShares: number,
  sharesRepresented: number,
  jurisdiction: string = "south_africa",
): Promise<{
  quorumMet: boolean;
  quorumPercentage: number;
  requiredPercentage: number;
  participationScore: number;
  benchmark: { avgAttendance: number; avgProxies: number; avgParticipation: number };
  alerts: string[];
  recommendation: string;
}> {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();
  const rule = JURISDICTION_QUORUM_RULES[jurisdiction] ?? JURISDICTION_QUORUM_RULES.other;
  const quorumPct = totalEligibleShares > 0 ? (sharesRepresented / totalEligibleShares) * 100 : 0;
  const quorumMet = quorumPct >= rule.minPct;

  const historicalSessions = await db.select().from(agmIntelligenceSessions)
    .where(sql`status = 'completed'`)
    .orderBy(desc(agmIntelligenceSessions.createdAt))
    .limit(20);

  let avgAttendance = attendanceCount, avgProxies = proxyCount, avgParticipation = quorumPct;
  if (historicalSessions.length > 0) {
    let wSum = 0, wProxy = 0, wPart = 0, wTotal = 0;
    for (const hs of historicalSessions) {
      const w = decayWeight(hs.createdAt);
      wSum += (hs.attendanceCount ?? 0) * w;
      wProxy += (hs.proxyCount ?? 0) * w;
      wPart += (hs.quorumPercentage ?? 0) * w;
      wTotal += w;
    }
    if (wTotal > 0) {
      avgAttendance = Math.round(wSum / wTotal);
      avgProxies = Math.round(wProxy / wTotal);
      avgParticipation = Math.round((wPart / wTotal) * 10) / 10;
    }
  }

  const participationScore = Math.min(100, Math.round(
    (quorumPct / 100) * 40 +
    (attendanceCount > avgAttendance ? 30 : (attendanceCount / Math.max(1, avgAttendance)) * 30) +
    (proxyCount > 0 ? 20 : 0) +
    (historicalSessions.length > 0 ? 10 : 0)
  ));

  const alerts: string[] = [];
  if (!quorumMet) alerts.push(`QUORUM NOT MET: ${quorumPct.toFixed(1)}% < required ${rule.minPct}%. ${rule.description}`);
  if (quorumPct < rule.minPct * 1.2 && quorumMet) alerts.push(`Quorum margin thin: ${quorumPct.toFixed(1)}% (only ${(quorumPct - rule.minPct).toFixed(1)}% above minimum)`);
  if (attendanceCount < avgAttendance * 0.7) alerts.push(`Attendance ${Math.round((1 - attendanceCount / Math.max(1, avgAttendance)) * 100)}% below historical average`);
  if (proxyCount === 0 && historicalSessions.some(s => (s.proxyCount ?? 0) > 0)) alerts.push("No proxy votes received — unusual vs historical pattern");

  const severity = !quorumMet ? "critical" : alerts.length > 1 ? "high" : alerts.length > 0 ? "medium" : "info";

  await db.update(agmIntelligenceSessions).set({
    quorumMet,
    quorumPercentage: Math.round(quorumPct * 10) / 10,
    attendanceCount,
    proxyCount,
  }).where(eq(agmIntelligenceSessions.id, sessionId));

  await db.insert(agmGovernanceObservations).values({
    sessionId,
    algorithmSource: "quorum_intelligence",
    observationType: !quorumMet ? "risk_detected" : quorumPct < rule.minPct * 1.5 ? "benchmark_deviation" : "prediction_made",
    severity,
    title: `Quorum ${quorumMet ? "met" : "NOT MET"}: ${quorumPct.toFixed(1)}% (${rule.minPct}% required)`,
    detail: `${attendanceCount} attendees, ${proxyCount} proxies. ${sharesRepresented.toLocaleString()} of ${totalEligibleShares.toLocaleString()} shares represented. Participation score: ${participationScore}/100.`,
    confidence: 0.95,
    rawData: { quorumPct, attendanceCount, proxyCount, participationScore, alerts, jurisdiction },
  });

  if (!quorumMet || participationScore < 50) {
    await db.insert(aiEvolutionObservations).values({
      sourceType: "live_session",
      sourceId: sessionId,
      eventType: "agm",
      observationType: !quorumMet ? "data_gap" : "cross_event_trend",
      moduleName: "agm_quorum_intelligence",
      observation: `Quorum ${quorumMet ? "met" : "NOT MET"} at ${quorumPct.toFixed(1)}% (${rule.minPct}% required). Participation score: ${participationScore}/100. ${alerts.length} alerts.`,
      confidence: 0.95,
      suggestedCapability: "proxy_solicitation_optimizer",
      rawContext: { quorumMet, quorumPct, participationScore, attendanceCount, proxyCount, jurisdiction, alertCount: alerts.length },
    });
  }

  const recommendation = !quorumMet
    ? "URGENT: Meeting cannot proceed. Adjourn and reschedule with enhanced proxy solicitation."
    : alerts.length > 0
    ? `Quorum achieved but with concerns: ${alerts.join("; ")}. Review shareholder engagement strategy.`
    : "Healthy quorum and participation levels. No action required.";

  return {
    quorumMet,
    quorumPercentage: Math.round(quorumPct * 10) / 10,
    requiredPercentage: rule.minPct,
    participationScore,
    benchmark: { avgAttendance, avgProxies, avgParticipation },
    alerts,
    recommendation,
  };
}

// ─── Algorithm 5: Regulatory Speech Guardian ─────────────────────────────────

const REGULATORY_RULES: Array<{
  id: string;
  name: string;
  framework: string;
  keywords: string[];
  context: string;
  severity: "medium" | "high" | "critical";
}> = [
  {
    id: "ca71_s63_notice", name: "Notice Period Deviation", framework: "Companies Act 71 s63",
    keywords: ["short notice", "waive notice", "less than 15 days", "didn't receive notice"],
    context: "AGM notice must be given at least 15 business days before the meeting",
    severity: "critical",
  },
  {
    id: "ca71_s66_director_duty", name: "Director Duty of Care", framework: "Companies Act 71 s76",
    keywords: ["personal interest", "conflict of interest", "related party", "benefit personally", "family member"],
    context: "Directors must declare personal financial interests and recuse from conflicted votes",
    severity: "high",
  },
  {
    id: "jse_3_84_price_sensitive", name: "Price-Sensitive Information", framework: "JSE Listings 3.4/3.84",
    keywords: ["not yet announced", "confidential", "haven't disclosed", "off the record", "between us", "inside information"],
    context: "Price-sensitive information must not be selectively disclosed at shareholder meetings",
    severity: "critical",
  },
  {
    id: "jse_cautionary", name: "Cautionary Announcement", framework: "JSE Listings 3.5",
    keywords: ["cautionary", "potential transaction", "in discussions", "exploring acquisition", "possible merger"],
    context: "Undisclosed material corporate actions require formal cautionary announcements",
    severity: "high",
  },
  {
    id: "king4_governance", name: "King IV Governance Deviation", framework: "King IV Principle 16",
    keywords: ["override the board", "ignore shareholders", "don't need to explain", "not accountable", "no obligation to disclose"],
    context: "King IV requires transparent governance with stakeholder-inclusive approach",
    severity: "medium",
  },
  {
    id: "ca71_s65_resolution_form", name: "Resolution Procedure", framework: "Companies Act 71 s65",
    keywords: ["show of hands only", "don't need a poll", "no need to vote", "chairman decides", "I'll decide"],
    context: "Shareholders can demand a poll vote; chair cannot unilaterally deny voting rights",
    severity: "high",
  },
  {
    id: "ca71_s61_shareholder_rights", name: "Shareholder Rights Suppression", framework: "Companies Act 71 s61",
    keywords: ["can't ask that", "not allowed to question", "move on from this", "we won't answer", "irrelevant question", "out of order"],
    context: "Shareholders have the right to participate in and raise matters at AGMs",
    severity: "high",
  },
  {
    id: "forward_looking", name: "Forward-Looking Statement", framework: "JSE / SEC Safe Harbor",
    keywords: ["we expect to", "forecast", "guidance", "we predict", "next year we will", "projected", "anticipated revenue"],
    context: "Forward-looking statements must include appropriate disclaimers and safe harbor language",
    severity: "medium",
  },
];

export async function scanRegulatoryCompliance(
  userId: number,
  sessionId: number,
  transcriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  alerts: Array<{
    ruleId: string;
    ruleName: string;
    framework: string;
    severity: string;
    matchedText: string;
    speaker: string;
    timestamp: number;
    recommendation: string;
  }>;
  complianceScore: number;
  totalSegmentsScanned: number;
}> {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();
  const alerts: Array<{
    ruleId: string; ruleName: string; framework: string; severity: string;
    matchedText: string; speaker: string; timestamp: number; recommendation: string;
  }> = [];

  for (const segment of transcriptSegments) {
    const textLower = segment.text.toLowerCase();
    for (const rule of REGULATORY_RULES) {
      const matchedKeywords = rule.keywords.filter(kw => textLower.includes(kw));
      if (matchedKeywords.length > 0) {
        alerts.push({
          ruleId: rule.id,
          ruleName: rule.name,
          framework: rule.framework,
          severity: rule.severity,
          matchedText: segment.text.slice(0, 200),
          speaker: segment.speaker,
          timestamp: segment.timestamp,
          recommendation: `Review statement against ${rule.framework}: ${rule.context}`,
        });
      }
    }
  }

  const deduped = alerts.filter((a, i) =>
    alerts.findIndex(x => x.ruleId === a.ruleId && x.speaker === a.speaker) === i
  );

  const criticalCount = deduped.filter(a => a.severity === "critical").length;
  const highCount = deduped.filter(a => a.severity === "high").length;
  const complianceScore = Math.max(0, 100 - (criticalCount * 25) - (highCount * 10) - (deduped.length * 3));

  if (deduped.length > 0) {
    for (const alert of deduped.slice(0, 10)) {
      await db.insert(agmGovernanceObservations).values({
        sessionId,
        algorithmSource: "regulatory_guardian",
        observationType: "compliance_flag",
        severity: alert.severity as any,
        title: `${alert.framework}: ${alert.ruleName}`,
        detail: `Speaker "${alert.speaker}" triggered ${alert.ruleName} — "${alert.matchedText.slice(0, 100)}…" ${alert.recommendation}`,
        confidence: 0.7 + (alert.severity === "critical" ? 0.2 : alert.severity === "high" ? 0.1 : 0),
        rawData: alert,
      });
    }
  }

  if (criticalCount > 0) {
    await db.insert(aiEvolutionObservations).values({
      sourceType: "live_session",
      sourceId: sessionId,
      eventType: "agm",
      observationType: "missing_capability",
      observation: `AGM regulatory scan detected ${criticalCount} critical compliance flags. Real-time intervention capability could prevent regulatory exposure.`,
      confidence: 0.85,
      suggestedCapability: "agm_real_time_compliance_intervention",
      rawContext: { criticalCount, highCount, totalAlerts: deduped.length, complianceScore },
    });
  }

  return { alerts: deduped, complianceScore, totalSegmentsScanned: transcriptSegments.length };
}

// ─── Algorithm 6: Post-AGM Governance Report Generator ──────────────────────

export async function generateGovernanceReport(userId: number, sessionId: number): Promise<{
  report: any;
  observationsFedToEvolution: number;
}> {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const [session] = await db.select().from(agmIntelligenceSessions)
    .where(eq(agmIntelligenceSessions.id, sessionId)).limit(1);
  if (!session) throw new Error("AGM session not found");

  const resolutions = await db.select().from(agmResolutions)
    .where(eq(agmResolutions.sessionId, sessionId));

  const observations = await db.select().from(agmGovernanceObservations)
    .where(eq(agmGovernanceObservations.sessionId, sessionId))
    .orderBy(desc(agmGovernanceObservations.createdAt));

  const dissentPatterns = await db.select().from(agmDissentPatterns)
    .where(eq(agmDissentPatterns.clientName, session.clientName))
    .orderBy(desc(agmDissentPatterns.decayedScore))
    .limit(10);

  const historicalSessions = await db.select().from(agmIntelligenceSessions)
    .where(and(
      eq(agmIntelligenceSessions.clientName, session.clientName),
      eq(agmIntelligenceSessions.status, "completed"),
    ))
    .orderBy(desc(agmIntelligenceSessions.createdAt))
    .limit(5);

  const predictionAccuracies = resolutions
    .filter(r => r.predictionAccuracy != null)
    .map(r => r.predictionAccuracy as number);
  const avgPredictionAccuracy = predictionAccuracies.length > 0
    ? predictionAccuracies.reduce((a, b) => a + b, 0) / predictionAccuracies.length : null;

  const carried = resolutions.filter(r => r.status === "carried").length;
  const defeated = resolutions.filter(r => r.status === "defeated").length;
  const criticalObs = observations.filter(o => o.severity === "critical" || o.severity === "high");
  const complianceObs = observations.filter(o => o.algorithmSource === "regulatory_guardian");

  try {
    const resp = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a corporate governance reporting specialist. Generate a comprehensive board-ready AGM governance report.

The report must include these sections:
1. executiveSummary: 3-4 paragraph board digest
2. resolutionOutcomes: array of {title, category, predictedPct, actualPct, accuracy, status, analysis}
3. governanceHealthScore: 0-100 with breakdown
4. dissentAnalysis: key patterns, year-over-year trends, risk areas
5. complianceIncidents: flagged items with severity and recommendation
6. participationMetrics: quorum, attendance, proxy analysis
7. shareholderEngagement: Q&A quality, governance question patterns
8. benchmarkComparison: how this AGM compares to historical data
9. aiPredictionPerformance: accuracy metrics, confidence calibration
10. strategicRecommendations: 5-8 prioritised action items for the board
11. yearOverYearTrends: comparing with previous AGMs (if data available)
12. nextAgmPreparation: proactive recommendations

Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            session: { id: session.id, client: session.clientName, title: session.agmTitle, date: session.agmDate, jurisdiction: session.jurisdiction },
            resolutions: resolutions.map(r => ({ number: r.resolutionNumber, title: r.title, category: r.category, predicted: r.predictedApprovalPct, actual: r.actualApprovalPct, accuracy: r.predictionAccuracy, status: r.status })),
            quorum: { met: session.quorumMet, pct: session.quorumPercentage, attendance: session.attendanceCount, proxies: session.proxyCount },
            observations: observations.slice(0, 30).map(o => ({ algorithm: o.algorithmSource, type: o.observationType, severity: o.severity, title: o.title })),
            dissentPatterns: dissentPatterns.map(p => ({ type: p.patternType, category: p.category, frequency: p.frequency, confidence: p.confidence, recommendation: p.actionRecommendation })),
            historicalComparison: historicalSessions.map(hs => ({ date: hs.agmDate, resolutions: hs.totalResolutions, carried: hs.resolutionsCarried, defeated: hs.resolutionsDefeated, sentiment: hs.overallSentiment, governanceScore: hs.governanceScore })),
            predictionAccuracy: avgPredictionAccuracy,
          }, null, 2),
        },
      ],
      model: "gpt-4o-mini",
    });

    const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
    const report = JSON.parse(raw);

    const governanceScore = report.governanceHealthScore?.overall ?? report.governanceHealthScore ?? (
      Math.max(0, 100 - (defeated * 15) - (criticalObs.length * 10) - (!session.quorumMet ? 20 : 0))
    );

    await db.update(agmIntelligenceSessions).set({
      aiGovernanceReport: report,
      governanceScore,
      totalResolutions: resolutions.length,
      resolutionsCarried: carried,
      resolutionsDefeated: defeated,
      overallSentiment: resolutions.length > 0
        ? resolutions.reduce((s, r) => s + (r.sentimentDuringDebate ?? 65), 0) / resolutions.length : null,
      dissentIndex: resolutions.length > 0
        ? resolutions.filter(r => (r.actualApprovalPct ?? 100) < 80).length / resolutions.length : 0,
      regulatoryAlerts: complianceObs.length,
      status: "completed",
    }).where(eq(agmIntelligenceSessions.id, sessionId));

    let fedCount = 0;
    const evolutionObservations = [];

    if (avgPredictionAccuracy != null && avgPredictionAccuracy < 75) {
      evolutionObservations.push({
        sourceType: "live_session" as const,
        sourceId: sessionId,
        eventType: "agm",
        observationType: "weak_module" as const,
        moduleName: "agm_resolution_predictor",
        observation: `AGM prediction accuracy was ${Math.round(avgPredictionAccuracy)}% — below 75% threshold. Model needs recalibration on ${session.jurisdiction} governance patterns.`,
        confidence: 0.8,
        suggestedCapability: "resolution_prediction_calibration",
        rawContext: { sessionId, accuracy: avgPredictionAccuracy, jurisdiction: session.jurisdiction },
      });
    }

    if (defeated > 0) {
      evolutionObservations.push({
        sourceType: "live_session" as const,
        sourceId: sessionId,
        eventType: "agm",
        observationType: "repeated_pattern" as const,
        moduleName: "agm_dissent_engine",
        observation: `${defeated} resolution(s) defeated at ${session.clientName} AGM. Early warning system should have flagged higher risk.`,
        confidence: 0.75,
        suggestedCapability: "pre_agm_dissent_forecasting",
        rawContext: { defeated, carried, total: resolutions.length },
      });
    }

    if (criticalObs.length > 2) {
      evolutionObservations.push({
        sourceType: "live_session" as const,
        sourceId: sessionId,
        eventType: "agm",
        observationType: "missing_capability" as const,
        moduleName: "agm_regulatory_guardian",
        observation: `${criticalObs.length} critical/high severity governance observations. Automated real-time intervention system would reduce risk exposure.`,
        confidence: 0.7,
        suggestedCapability: "agm_automated_governance_intervention",
        rawContext: { criticalCount: criticalObs.length, sessionId },
      });
    }

    for (const obs of evolutionObservations) {
      await db.insert(aiEvolutionObservations).values(obs);
      fedCount++;
    }

    await db.update(agmIntelligenceSessions).set({
      evolutionObservationsGenerated: fedCount,
    }).where(eq(agmIntelligenceSessions.id, sessionId));

    return { report, observationsFedToEvolution: fedCount };
  } catch (err) {
    console.error("[AGM-AI] Governance report generation failed:", err);
    throw new Error("Failed to generate governance report");
  }
}

// ─── Session Management ─────────────────────────────────────────────────────

async function assertSessionOwnership(sessionId: number, userId: number) {
  const db = await getDb();
  const [session] = await db.select({ userId: agmIntelligenceSessions.userId })
    .from(agmIntelligenceSessions).where(eq(agmIntelligenceSessions.id, sessionId)).limit(1);
  if (!session) throw new Error("AGM session not found");
  if (session.userId !== userId) throw new Error("Access denied: you do not own this AGM session");
}

async function assertResolutionBelongsToSession(resolutionId: number, sessionId: number) {
  const db = await getDb();
  const [res] = await db.select({ sessionId: agmResolutions.sessionId })
    .from(agmResolutions).where(eq(agmResolutions.id, resolutionId)).limit(1);
  if (!res) throw new Error("Resolution not found");
  if (res.sessionId !== sessionId) throw new Error("Resolution does not belong to this session");
}

export async function createAgmSession(userId: number, data: {
  clientName: string;
  agmTitle: string;
  agmDate?: string;
  jurisdiction?: string;
  shadowSessionId?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(agmIntelligenceSessions).values({
    userId,
    clientName: data.clientName,
    agmTitle: data.agmTitle,
    agmDate: data.agmDate ?? null,
    jurisdiction: (data.jurisdiction as any) ?? "south_africa",
    shadowSessionId: data.shadowSessionId ?? null,
    status: "setup",
  });
  return { sessionId: (result as any).insertId };
}

export async function addResolution(userId: number, sessionId: number, data: {
  resolutionNumber: number;
  title: string;
  category?: string;
  proposedBy?: string;
}) {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();
  const [result] = await db.insert(agmResolutions).values({
    sessionId,
    resolutionNumber: data.resolutionNumber,
    title: data.title,
    category: (data.category as any) ?? "ordinary",
    proposedBy: data.proposedBy ?? null,
  });
  return { resolutionId: (result as any).insertId };
}

export async function getSessionDashboard(userId: number, sessionId: number) {
  await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const [session] = await db.select().from(agmIntelligenceSessions)
    .where(eq(agmIntelligenceSessions.id, sessionId)).limit(1);
  if (!session) throw new Error("Session not found");

  const resolutions = await db.select().from(agmResolutions)
    .where(eq(agmResolutions.sessionId, sessionId))
    .orderBy(agmResolutions.resolutionNumber);

  const observations = await db.select().from(agmGovernanceObservations)
    .where(eq(agmGovernanceObservations.sessionId, sessionId))
    .orderBy(desc(agmGovernanceObservations.createdAt))
    .limit(50);

  const dissentPatterns = await db.select().from(agmDissentPatterns)
    .where(eq(agmDissentPatterns.clientName, session.clientName))
    .orderBy(desc(agmDissentPatterns.decayedScore))
    .limit(10);

  const algorithmStats: Record<string, number> = {};
  for (const o of observations) {
    algorithmStats[o.algorithmSource] = (algorithmStats[o.algorithmSource] ?? 0) + 1;
  }

  const predictionAccuracies = resolutions
    .filter(r => r.predictionAccuracy != null)
    .map(r => r.predictionAccuracy as number);

  return {
    session,
    resolutions,
    observations,
    dissentPatterns,
    algorithmStats,
    summary: {
      totalResolutions: resolutions.length,
      carried: resolutions.filter(r => r.status === "carried").length,
      defeated: resolutions.filter(r => r.status === "defeated").length,
      pending: resolutions.filter(r => ["pending", "debating"].includes(r.status)).length,
      avgPredictionAccuracy: predictionAccuracies.length > 0
        ? Math.round(predictionAccuracies.reduce((a, b) => a + b, 0) / predictionAccuracies.length) : null,
      criticalAlerts: observations.filter(o => o.severity === "critical").length,
      highAlerts: observations.filter(o => o.severity === "high").length,
    },
  };
}

export async function listAgmSessions(userId: number, limit: number = 20) {
  const db = await getDb();
  return db.select().from(agmIntelligenceSessions)
    .where(eq(agmIntelligenceSessions.userId, userId))
    .orderBy(desc(agmIntelligenceSessions.createdAt))
    .limit(limit);
}
