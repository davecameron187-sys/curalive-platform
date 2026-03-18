// @ts-nocheck
/**
 * CuraLive Bastion Investor Intelligence AI Service
 *
 * Autonomous self-evolving intelligence system purpose-built for institutional investor events
 * (earnings calls, investor days, roadshows, capital markets days).
 * Integrates with the core AI Evolution Engine (Module M) to self-improve after every event.
 *
 * 6 Autonomous Algorithms:
 *   1. Earnings Sentiment Decoder          — management tone vs actual financial results; detects spin
 *   2. Forward Guidance Tracker            — captures, scores, and cross-references guidance statements
 *   3. Analyst Question Intelligence       — identifies analysts, categorises questions, flags hostility
 *   4. Management Credibility Scorer       — cross-quarter consistency; tracks moved goalposts
 *   5. Market-Moving Statement Detector    — flags statements likely to impact share price
 *   6. Investment Brief Generator          — autonomous portfolio-manager-ready post-event report
 */

import { getDb } from "../db";
import {
  bastionIntelligenceSessions, bastionInvestorObservations,
  bastionGuidanceTracker, aiEvolutionObservations,
} from "../../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const EVIDENCE_HALF_LIFE_DAYS = 14;

function decayWeight(date: Date | string): number {
  const ageDays = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / EVIDENCE_HALF_LIFE_DAYS);
}

async function assertSessionOwnership(sessionId: number, userId: number) {
  const db = await getDb();
  const [session] = await db.select().from(bastionIntelligenceSessions)
    .where(and(eq(bastionIntelligenceSessions.id, sessionId), eq(bastionIntelligenceSessions.userId, userId)))
    .limit(1);
  if (!session) throw new Error("Session not found or access denied");
  return session;
}

// ─── Algorithm 1: Earnings Sentiment Decoder ──────────────────────────────────

const TONE_BASELINE: Record<string, number> = {
  earnings_call: 65, agm: 60, investor_day: 75, roadshow: 72,
  capital_markets_day: 70, special_call: 50, other: 60,
};

export async function analyzeEarningsSentiment(
  userId: number,
  sessionId: number,
  transcriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  managementToneScore: number;
  substanceScore: number;
  toneSubstanceGap: number;
  spinIndex: number;
  confidence: number;
  reasoning: string;
}> {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const baseline = TONE_BASELINE[session.eventType] ?? 65;
  let managementToneScore = baseline;
  let substanceScore = baseline;
  let reasoning = "Insufficient transcript data for analysis.";

  if (transcriptSegments.length > 0) {
    try {
      const text = transcriptSegments.map(s => `${s.speaker}: ${s.text}`).join("\n").slice(0, 6000);
      const resp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an institutional investor analyst specialising in earnings call analysis. Analyze management's tone versus the substance of what they're actually reporting.

Score two dimensions (0–100):
1. managementTone: How positive/confident is management's language, delivery, and framing? (100 = extremely bullish, 0 = extremely bearish)
2. substanceScore: How strong are the ACTUAL results, metrics, and outlook being discussed? (100 = excellent results, 0 = terrible results)

A large gap between tone and substance indicates management spin.

Return ONLY JSON: {"managementTone": <number>, "substanceScore": <number>, "reasoning": "<2-3 sentences>", "keyDisconnects": ["<specific examples where tone didn't match substance>"]}`,
          },
          { role: "user", content: `Event: "${session.eventTitle}" (${session.eventType})\nCompany: ${session.clientName}\n\nTranscript:\n${text}` },
        ],
        model: "gpt-4o-mini",
      });
      const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      managementToneScore = Math.max(0, Math.min(100, parsed.managementTone ?? baseline));
      substanceScore = Math.max(0, Math.min(100, parsed.substanceScore ?? baseline));
      reasoning = parsed.reasoning ?? reasoning;
    } catch { /* fallback to baseline */ }
  }

  const toneSubstanceGap = managementToneScore - substanceScore;
  const spinIndex = Math.max(0, Math.min(100, Math.abs(toneSubstanceGap) * 2));

  const confidence = Math.min(0.95, 0.3 + (transcriptSegments.length > 10 ? 0.3 : transcriptSegments.length * 0.03));

  await db.update(bastionIntelligenceSessions).set({
    managementToneScore,
    overallSentiment: Math.round((managementToneScore + substanceScore) / 2),
  }).where(eq(bastionIntelligenceSessions.id, sessionId));

  await db.insert(bastionInvestorObservations).values({
    sessionId,
    algorithmSource: "earnings_sentiment",
    observationType: spinIndex > 30 ? "risk_detected" : "prediction_made",
    severity: spinIndex > 50 ? "high" : spinIndex > 30 ? "medium" : "info",
    title: `Tone-Substance Analysis: ${spinIndex > 30 ? "Spin Detected" : "Aligned"} (Gap: ${toneSubstanceGap > 0 ? "+" : ""}${Math.round(toneSubstanceGap)})`,
    detail: `Management tone: ${managementToneScore}/100. Substance score: ${substanceScore}/100. Spin index: ${spinIndex}/100. ${reasoning}`,
    confidence,
    rawData: { managementToneScore, substanceScore, toneSubstanceGap, spinIndex },
  });

  return { managementToneScore, substanceScore, toneSubstanceGap, spinIndex, confidence, reasoning };
}

// ─── Algorithm 2: Forward Guidance Tracker ────────────────────────────────────

export async function trackForwardGuidance(
  userId: number,
  sessionId: number,
  transcriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  guidanceItems: number;
  raised: number;
  lowered: number;
  maintained: number;
  newGuidance: number;
  confidence: number;
}> {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  let guidanceStatements: Array<{
    type: string;
    statement: string;
    confidence: string;
    numericValue: string;
    timeframe: string;
  }> = [];

  if (transcriptSegments.length > 0) {
    try {
      const text = transcriptSegments.map(s => `${s.speaker}: ${s.text}`).join("\n").slice(0, 6000);
      const resp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a financial analyst extracting forward guidance from earnings calls. Identify every forward-looking statement made by management.

For each guidance statement, extract:
- type: one of "revenue", "earnings", "margins", "capex", "headcount", "market_share", "other"
- statement: the exact or near-exact quote
- confidence: "firm" (specific numbers committed to), "tentative" (ranges or hedged language), "aspirational" (targets/goals)
- numericValue: the specific number/range if given (e.g. "$4.2B–$4.5B", "18–20%")
- timeframe: the period referenced (e.g. "FY2026", "Q2 2026", "medium-term")

Return ONLY JSON: {"guidance": [<array of objects>]}`,
          },
          { role: "user", content: `Event: "${session.eventTitle}"\nCompany: ${session.clientName} (${session.ticker ?? "N/A"})\n\nTranscript:\n${text}` },
        ],
        model: "gpt-4o-mini",
      });
      const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      guidanceStatements = parsed.guidance ?? [];
    } catch { /* empty */ }
  }

  const priorGuidance = await db.select().from(bastionGuidanceTracker)
    .where(and(
      eq(bastionGuidanceTracker.clientName, session.clientName),
      sql`met_or_missed = 'pending'`,
    ))
    .orderBy(desc(bastionGuidanceTracker.createdAt))
    .limit(50);

  let raised = 0, lowered = 0, maintained = 0, newGuidance = 0;

  for (const g of guidanceStatements) {
    const guidanceType = (["revenue", "earnings", "margins", "capex", "headcount", "market_share"].includes(g.type) ? g.type : "other") as any;

    const prior = priorGuidance.find(p => p.guidanceType === guidanceType);

    let delta: string | null = null;
    let priorValue: string | null = null;
    let priorGuidanceId: number | null = null;

    if (prior) {
      priorGuidanceId = prior.id;
      priorValue = prior.numericValue;
      if (g.numericValue && prior.numericValue) {
        const currentNum = parseFloat(g.numericValue.replace(/[^0-9.-]/g, ""));
        const priorNum = parseFloat(prior.numericValue.replace(/[^0-9.-]/g, ""));
        if (!isNaN(currentNum) && !isNaN(priorNum)) {
          const pctChange = ((currentNum - priorNum) / Math.abs(priorNum)) * 100;
          delta = `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}%`;
          if (pctChange > 1) raised++;
          else if (pctChange < -1) lowered++;
          else maintained++;
        } else {
          delta = "qualitative change";
          maintained++;
        }
      } else {
        maintained++;
      }
    } else {
      newGuidance++;
    }

    await db.insert(bastionGuidanceTracker).values({
      clientName: session.clientName,
      ticker: session.ticker,
      sessionId,
      guidanceType,
      statement: g.statement?.slice(0, 2000) ?? "",
      confidenceLevel: (["firm", "tentative", "aspirational"].includes(g.confidence) ? g.confidence : "tentative") as any,
      numericValue: g.numericValue ?? null,
      timeframe: g.timeframe ?? null,
      priorGuidanceId,
      priorValue,
      delta,
    });
  }

  await db.update(bastionIntelligenceSessions).set({
    forwardGuidanceCount: guidanceStatements.length,
  }).where(eq(bastionIntelligenceSessions.id, sessionId));

  const severity = lowered > 0 ? "high" : raised > 0 ? "info" : "low";

  await db.insert(bastionInvestorObservations).values({
    sessionId,
    algorithmSource: "forward_guidance",
    observationType: lowered > 0 ? "risk_detected" : "prediction_made",
    severity,
    title: `Forward Guidance: ${guidanceStatements.length} items tracked (${raised} raised, ${lowered} lowered, ${maintained} maintained, ${newGuidance} new)`,
    detail: `Extracted ${guidanceStatements.length} forward-looking guidance statements. ${raised} raised vs prior, ${lowered} lowered, ${maintained} maintained, ${newGuidance} new guidance. Cross-referenced against ${priorGuidance.length} prior statements.`,
    confidence: Math.min(0.9, 0.3 + guidanceStatements.length * 0.05),
    rawData: { raised, lowered, maintained, newGuidance, total: guidanceStatements.length },
  });

  return { guidanceItems: guidanceStatements.length, raised, lowered, maintained, newGuidance, confidence: Math.min(0.9, 0.3 + guidanceStatements.length * 0.05) };
}

// ─── Algorithm 3: Analyst Question Intelligence ──────────────────────────────

export async function analyzeAnalystQuestions(
  userId: number,
  sessionId: number,
  transcriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  totalQuestions: number;
  hostileCount: number;
  topThemes: string[];
  confidence: number;
}> {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  let analysis = { questions: [] as any[], themes: [] as string[] };

  if (transcriptSegments.length > 0) {
    try {
      const text = transcriptSegments.map(s => `${s.speaker}: ${s.text}`).join("\n").slice(0, 6000);
      const resp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing Q&A sessions during investor events. Identify every question asked during the Q&A section.

For each question:
- analyst: name and firm if identifiable, otherwise "Unknown Analyst"
- question: the question text (summarised)
- theme: one of "financial_performance", "guidance", "strategy", "operations", "capital_allocation", "esg", "regulation", "competitive", "management", "other"
- hostility: "neutral", "probing", "hostile" (hostile = aggressive, confrontational, or designed to expose problems)
- significance: "high", "medium", "low"

Also identify the top 3 recurring themes across all questions.

Return ONLY JSON: {"questions": [<array>], "themes": ["<top 3 themes>"]}`,
          },
          { role: "user", content: `Event: "${session.eventTitle}"\nCompany: ${session.clientName}\n\nTranscript:\n${text}` },
        ],
        model: "gpt-4o-mini",
      });
      const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      analysis = JSON.parse(raw);
    } catch { /* empty */ }
  }

  const questions = analysis.questions ?? [];
  const hostileCount = questions.filter((q: any) => q.hostility === "hostile").length;
  const probingCount = questions.filter((q: any) => q.hostility === "probing").length;

  await db.update(bastionIntelligenceSessions).set({
    analystQuestionsTotal: questions.length,
    analystQuestionsHostile: hostileCount,
  }).where(eq(bastionIntelligenceSessions.id, sessionId));

  const severity = hostileCount > 2 ? "high" : hostileCount > 0 ? "medium" : probingCount > 3 ? "low" : "info";

  await db.insert(bastionInvestorObservations).values({
    sessionId,
    algorithmSource: "analyst_question_intel",
    observationType: hostileCount > 0 ? "risk_detected" : "pattern_identified",
    severity,
    title: `Analyst Q&A: ${questions.length} questions (${hostileCount} hostile, ${probingCount} probing)`,
    detail: `Top themes: ${(analysis.themes ?? []).join(", ")}. ${hostileCount > 0 ? `Hostile questioning detected — management under pressure on ${(analysis.themes ?? [])[0] ?? "multiple topics"}.` : "Q&A session was constructive."}`,
    confidence: Math.min(0.9, 0.3 + questions.length * 0.04),
    rawData: { questions: questions.slice(0, 20), themes: analysis.themes },
  });

  return {
    totalQuestions: questions.length,
    hostileCount,
    topThemes: analysis.themes ?? [],
    confidence: Math.min(0.9, 0.3 + questions.length * 0.04),
  };
}

// ─── Algorithm 4: Management Credibility Scorer ──────────────────────────────

export async function scoreManagementCredibility(
  userId: number,
  sessionId: number,
  transcriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  credibilityScore: number;
  consistencyRating: string;
  contradictions: number;
  confidence: number;
  reasoning: string;
}> {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const priorGuidance = await db.select().from(bastionGuidanceTracker)
    .where(eq(bastionGuidanceTracker.clientName, session.clientName))
    .orderBy(desc(bastionGuidanceTracker.createdAt))
    .limit(30);

  const priorSessions = await db.select().from(bastionIntelligenceSessions)
    .where(and(
      eq(bastionIntelligenceSessions.clientName, session.clientName),
      sql`id != ${sessionId}`,
    ))
    .orderBy(desc(bastionIntelligenceSessions.createdAt))
    .limit(5);

  let credibilityScore = 70;
  let contradictions = 0;
  let reasoning = "Insufficient historical data for cross-quarter comparison.";

  if (transcriptSegments.length > 0 && (priorGuidance.length > 0 || priorSessions.length > 0)) {
    try {
      const text = transcriptSegments.map(s => `${s.speaker}: ${s.text}`).join("\n").slice(0, 4000);
      const priorContext = priorGuidance.slice(0, 10).map(g =>
        `[${g.guidanceType}] "${g.statement?.slice(0, 200)}" (Value: ${g.numericValue ?? "N/A"}, Confidence: ${g.confidenceLevel})`
      ).join("\n");

      const resp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an institutional investor analyst assessing management credibility. Compare what management is saying NOW versus what they said in PRIOR quarters.

Score management credibility (0–100):
- 90–100: Highly consistent, delivered on promises, transparent about misses
- 70–89: Generally consistent with minor adjustments
- 50–69: Some contradictions or quietly moved goalposts
- 30–49: Significant credibility concerns — frequent contradictions
- 0–29: Unreliable — systematic pattern of misleading guidance

Return ONLY JSON: {"credibilityScore": <number>, "contradictions": <count of specific contradictions found>, "consistencyRating": "excellent"|"good"|"mixed"|"poor"|"unreliable", "reasoning": "<2-3 sentences>", "specificIssues": ["<list of contradictions or moved goalposts>"]}`,
          },
          {
            role: "user",
            content: `Company: ${session.clientName} (${session.ticker ?? "N/A"})\nEvent: ${session.eventTitle}\n\nCURRENT TRANSCRIPT:\n${text}\n\nPRIOR GUIDANCE:\n${priorContext || "No prior guidance on record."}`,
          },
        ],
        model: "gpt-4o-mini",
      });
      const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      credibilityScore = Math.max(0, Math.min(100, parsed.credibilityScore ?? 70));
      contradictions = parsed.contradictions ?? 0;
      reasoning = parsed.reasoning ?? reasoning;
    } catch { /* fallback */ }
  }

  const consistencyRating = credibilityScore >= 90 ? "excellent" : credibilityScore >= 70 ? "good" : credibilityScore >= 50 ? "mixed" : credibilityScore >= 30 ? "poor" : "unreliable";

  await db.update(bastionIntelligenceSessions).set({
    credibilityScore,
  }).where(eq(bastionIntelligenceSessions.id, sessionId));

  const severity = credibilityScore < 40 ? "critical" : credibilityScore < 60 ? "high" : credibilityScore < 75 ? "medium" : "info";

  await db.insert(bastionInvestorObservations).values({
    sessionId,
    algorithmSource: "credibility_scorer",
    observationType: credibilityScore < 60 ? "risk_detected" : "prediction_made",
    severity,
    title: `Management Credibility: ${credibilityScore}/100 (${consistencyRating})${contradictions > 0 ? ` — ${contradictions} contradiction(s)` : ""}`,
    detail: `${reasoning} Based on ${priorGuidance.length} prior guidance statements and ${priorSessions.length} historical sessions.`,
    confidence: Math.min(0.9, 0.2 + priorGuidance.length * 0.04 + priorSessions.length * 0.08),
    rawData: { credibilityScore, contradictions, consistencyRating, priorGuidanceCount: priorGuidance.length },
  });

  if (credibilityScore < 50) {
    await db.insert(aiEvolutionObservations).values({
      sourceType: "live_session",
      sourceId: sessionId,
      eventType: session.eventType,
      clientName: session.clientName,
      observationType: "repeated_pattern",
      moduleName: "bastion_credibility_scorer",
      observation: `Management credibility score ${credibilityScore}/100 for ${session.clientName}. ${contradictions} contradictions detected vs prior guidance. Pattern suggests systematic credibility risk.`,
      confidence: 0.8,
      suggestedCapability: "pre_event_credibility_warning",
      rawContext: { sessionId, credibilityScore, contradictions, ticker: session.ticker },
    });
  }

  return { credibilityScore, consistencyRating, contradictions, confidence: Math.min(0.9, 0.2 + priorGuidance.length * 0.04), reasoning };
}

// ─── Algorithm 5: Market-Moving Statement Detector ───────────────────────────

export async function detectMarketMovingStatements(
  userId: number,
  sessionId: number,
  transcriptSegments: Array<{ speaker: string; text: string; timestamp: number }>
): Promise<{
  marketMovingCount: number;
  statements: Array<{ statement: string; impact: string; direction: string; confidence: number }>;
  overallImpact: string;
}> {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  let statements: Array<{ statement: string; impact: string; direction: string; confidence: number }> = [];

  if (transcriptSegments.length > 0) {
    try {
      const text = transcriptSegments.map(s => `${s.speaker}: ${s.text}`).join("\n").slice(0, 6000);
      const resp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a market intelligence analyst. Identify statements from this investor event that could move the share price.

Categories of market-moving statements:
- Earnings surprise (beat or miss vs consensus)
- Guidance change (raised, lowered, or new guidance)
- M&A activity (acquisitions, divestitures, strategic review)
- Capital allocation (buybacks, dividends, debt)
- Material contract wins/losses
- Regulatory developments
- Leadership changes
- Restructuring or cost actions
- Product/market developments

For each statement:
- statement: the quote or near-quote
- impact: "major" (could move stock >3%), "moderate" (1-3%), "minor" (<1%)
- direction: "positive", "negative", "uncertain"
- confidence: 0.0–1.0 how confident this is market-moving

Return ONLY JSON: {"statements": [<array>], "overallImpact": "positive"|"negative"|"neutral"|"mixed"}`,
          },
          { role: "user", content: `Company: ${session.clientName} (${session.ticker ?? "N/A"})\nEvent: ${session.eventTitle}\nSector: ${session.sector ?? "N/A"}\n\nTranscript:\n${text}` },
        ],
        model: "gpt-4o-mini",
      });
      const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(raw);
      statements = parsed.statements ?? [];
    } catch { /* empty */ }
  }

  const majorCount = statements.filter(s => s.impact === "major").length;
  const negativeCount = statements.filter(s => s.direction === "negative").length;
  const overallImpact = statements.length === 0 ? "neutral"
    : negativeCount > statements.length / 2 ? "negative"
    : negativeCount === 0 && majorCount > 0 ? "positive" : "mixed";

  await db.update(bastionIntelligenceSessions).set({
    marketMovingStatements: statements.length,
  }).where(eq(bastionIntelligenceSessions.id, sessionId));

  const severity = majorCount > 0 && negativeCount > 0 ? "critical" : majorCount > 0 ? "high" : statements.length > 0 ? "medium" : "info";

  await db.insert(bastionInvestorObservations).values({
    sessionId,
    algorithmSource: "market_moving_detector",
    observationType: majorCount > 0 ? "risk_detected" : "pattern_identified",
    severity,
    title: `Market-Moving: ${statements.length} statement(s) detected (${majorCount} major, overall: ${overallImpact})`,
    detail: statements.slice(0, 5).map(s => `[${s.impact.toUpperCase()}/${s.direction}] ${s.statement?.slice(0, 150)}`).join("\n") || "No market-moving statements detected.",
    confidence: Math.min(0.9, 0.3 + statements.length * 0.05),
    rawData: { statements: statements.slice(0, 20), overallImpact },
  });

  return { marketMovingCount: statements.length, statements: statements.slice(0, 20), overallImpact };
}

// ─── Algorithm 6: Investment Brief Generator ─────────────────────────────────

export async function generateInvestmentBrief(
  userId: number,
  sessionId: number
): Promise<{
  brief: any;
  overallRating: string;
  confidence: number;
}> {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const observations = await db.select().from(bastionInvestorObservations)
    .where(eq(bastionInvestorObservations.sessionId, sessionId))
    .orderBy(desc(bastionInvestorObservations.createdAt))
    .limit(50);

  const guidance = await db.select().from(bastionGuidanceTracker)
    .where(eq(bastionGuidanceTracker.sessionId, sessionId))
    .orderBy(bastionGuidanceTracker.guidanceType);

  const historicalSessions = await db.select().from(bastionIntelligenceSessions)
    .where(and(
      eq(bastionIntelligenceSessions.clientName, session.clientName),
      sql`id != ${sessionId}`,
    ))
    .orderBy(desc(bastionIntelligenceSessions.createdAt))
    .limit(4);

  const sentimentObs = observations.filter(o => o.algorithmSource === "earnings_sentiment");
  const marketObs = observations.filter(o => o.algorithmSource === "market_moving_detector");
  const credibilityObs = observations.filter(o => o.algorithmSource === "credibility_scorer");
  const analystObs = observations.filter(o => o.algorithmSource === "analyst_question_intel");

  let brief: any = null;

  try {
    const resp = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a senior portfolio analyst at an institutional investment firm. Generate a comprehensive post-event investment brief for the portfolio management team.

The brief must include:
1. executiveSummary: 3-4 paragraph digest for the PM
2. investmentThesis: has anything changed? bull/bear case update
3. keyTakeaways: 5-8 bullet points ranked by importance
4. guidanceAnalysis: summary of all forward guidance, changes from prior, credibility assessment
5. managementAssessment: tone, credibility, areas of concern
6. analystSentiment: what analysts were focused on, hostile questions, unresolved concerns
7. marketImpact: statements likely to move the stock, overall direction
8. riskFactors: new or elevated risks identified
9. catalysts: upcoming events or milestones to watch
10. recommendation: "overweight", "equal_weight", or "underweight" with reasoning
11. confidenceLevel: 0-100 in the overall assessment
12. quarterOverQuarter: trends vs prior events (if historical data available)

Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            session: { client: session.clientName, title: session.eventTitle, type: session.eventType, date: session.eventDate, sector: session.sector, ticker: session.ticker },
            scores: { sentiment: session.overallSentiment, managementTone: session.managementToneScore, credibility: session.credibilityScore },
            observations: observations.slice(0, 30).map(o => ({ algorithm: o.algorithmSource, type: o.observationType, severity: o.severity, title: o.title })),
            guidance: guidance.map(g => ({ type: g.guidanceType, statement: g.statement?.slice(0, 200), value: g.numericValue, confidence: g.confidenceLevel, delta: g.delta, timeframe: g.timeframe })),
            historical: historicalSessions.map(h => ({ date: h.eventDate, type: h.eventType, sentiment: h.overallSentiment, credibility: h.credibilityScore, tone: h.managementToneScore })),
          }, null, 2),
        },
      ],
      model: "gpt-4o-mini",
    });

    const raw = (resp.choices?.[0]?.message?.content ?? "").replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
    brief = JSON.parse(raw);
  } catch {
    brief = {
      executiveSummary: `Investment brief for ${session.clientName} ${session.eventTitle}. Analysis based on ${observations.length} algorithm observations and ${guidance.length} guidance items.`,
      recommendation: "equal_weight",
      confidenceLevel: 50,
    };
  }

  const overallRating = brief.recommendation ?? "equal_weight";

  await db.update(bastionIntelligenceSessions).set({
    investmentBrief: brief,
    status: "completed",
  }).where(eq(bastionIntelligenceSessions.id, sessionId));

  await db.insert(bastionInvestorObservations).values({
    sessionId,
    algorithmSource: "investment_brief",
    observationType: "prediction_made",
    severity: overallRating === "underweight" ? "high" : "info",
    title: `Investment Brief Generated — Recommendation: ${overallRating.replace(/_/g, " ").toUpperCase()}`,
    detail: typeof brief.executiveSummary === "string" ? brief.executiveSummary.slice(0, 1000) : "Brief generated successfully.",
    confidence: Math.min(0.9, (brief.confidenceLevel ?? 50) / 100),
    rawData: { recommendation: overallRating, confidenceLevel: brief.confidenceLevel },
  });

  let fedCount = 0;
  const evolutionObs = [];

  if ((session.managementToneScore ?? 65) - (session.overallSentiment ?? 65) > 20) {
    evolutionObs.push({
      sourceType: "live_session" as const,
      sourceId: sessionId,
      eventType: session.eventType,
      clientName: session.clientName,
      observationType: "weak_module" as const,
      moduleName: "bastion_earnings_sentiment",
      observation: `Large tone-substance gap detected for ${session.clientName}. Management spin index elevated. Sentiment decoder should weight substance more heavily for this client.`,
      confidence: 0.75,
      suggestedCapability: "client_specific_spin_calibration",
      rawContext: { sessionId, tone: session.managementToneScore, sentiment: session.overallSentiment, ticker: session.ticker },
    });
  }

  const criticalObs = observations.filter(o => o.severity === "critical" || o.severity === "high");
  if (criticalObs.length > 3) {
    evolutionObs.push({
      sourceType: "live_session" as const,
      sourceId: sessionId,
      eventType: session.eventType,
      clientName: session.clientName,
      observationType: "missing_capability" as const,
      moduleName: "bastion_risk_aggregator",
      observation: `${criticalObs.length} critical/high alerts across algorithms for ${session.clientName}. Need cross-algorithm risk aggregation to surface compound risks earlier.`,
      confidence: 0.8,
      suggestedCapability: "cross_algorithm_risk_aggregation",
      rawContext: { criticalCount: criticalObs.length, sessionId },
    });
  }

  if (evolutionObs.length > 0) {
    for (const obs of evolutionObs) {
      await db.insert(aiEvolutionObservations).values(obs);
      fedCount++;
    }
    await db.update(bastionIntelligenceSessions).set({
      evolutionObservationsGenerated: fedCount,
    }).where(eq(bastionIntelligenceSessions.id, sessionId));
  }

  return { brief, overallRating, confidence: Math.min(0.9, (brief.confidenceLevel ?? 50) / 100) };
}

// ─── Session Management ──────────────────────────────────────────────────────

export async function createBastionSession(userId: number, input: {
  clientName: string;
  eventTitle: string;
  eventType?: string;
  eventDate?: string;
  sector?: string;
  ticker?: string;
  shadowSessionId?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(bastionIntelligenceSessions).values({
    userId,
    shadowSessionId: input.shadowSessionId ?? null,
    clientName: input.clientName,
    eventTitle: input.eventTitle,
    eventType: (input.eventType as any) ?? "earnings_call",
    eventDate: input.eventDate ?? null,
    sector: input.sector ?? null,
    ticker: input.ticker ?? null,
  });
  return { sessionId: (result as any).insertId };
}

export async function getSessionDashboard(userId: number, sessionId: number) {
  const session = await assertSessionOwnership(sessionId, userId);
  const db = await getDb();

  const observations = await db.select().from(bastionInvestorObservations)
    .where(eq(bastionInvestorObservations.sessionId, sessionId))
    .orderBy(desc(bastionInvestorObservations.createdAt))
    .limit(50);

  const guidance = await db.select().from(bastionGuidanceTracker)
    .where(eq(bastionGuidanceTracker.sessionId, sessionId))
    .orderBy(bastionGuidanceTracker.guidanceType);

  const algorithmStats: Record<string, number> = {};
  for (const o of observations) {
    algorithmStats[o.algorithmSource] = (algorithmStats[o.algorithmSource] ?? 0) + 1;
  }

  return {
    session,
    observations,
    guidance,
    algorithmStats,
    summary: {
      totalObservations: observations.length,
      criticalAlerts: observations.filter(o => o.severity === "critical").length,
      highAlerts: observations.filter(o => o.severity === "high").length,
      guidanceItems: guidance.length,
      guidanceRaised: guidance.filter(g => g.delta && g.delta.startsWith("+")).length,
      guidanceLowered: guidance.filter(g => g.delta && g.delta.startsWith("-")).length,
    },
  };
}

export async function listBastionSessions(userId: number, limit: number = 20) {
  const db = await getDb();
  return db.select().from(bastionIntelligenceSessions)
    .where(eq(bastionIntelligenceSessions.userId, userId))
    .orderBy(desc(bastionIntelligenceSessions.createdAt))
    .limit(limit);
}
