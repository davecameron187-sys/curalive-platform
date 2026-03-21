// @ts-nocheck
/**
 * Organizational Knowledge Graph — Digital Twin
 * CIPC Patent App ID 1773575338868 | CIP6 | Claim 72
 *
 * Stores and manages the company's "Digital Twin" — a structured representation of:
 *   1. Company Profile (personality, brand voice, risk tolerance, regulatory posture)
 *   2. Historical Intelligence (event transcripts, Q&A patterns, compliance incidents, sentiment)
 *   3. Relationship Map (Client → Event → Attendee → Question → Sentiment linkages)
 *   4. Goal Framework (client-defined KPIs tracked autonomously)
 *
 * All historical intelligence is weighted by the temporal decay function W(t) = 0.5^(age/14).
 */

const EVIDENCE_HALF_LIFE_DAYS = 14;

function decayWeight(createdAt: Date | string | number): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / EVIDENCE_HALF_LIFE_DAYS);
}

export type CompanyProfile = {
  clientId: string;
  personalityTraits: {
    communicationStyle: "conservative" | "moderate" | "aggressive";
    transparencyLevel: "minimal" | "standard" | "full_disclosure";
    crisisResponseMode: "defensive" | "proactive" | "transparent";
  };
  brandVoice: {
    tone: string;
    formalityLevel: "formal" | "semi_formal" | "conversational";
    keyPhrases: string[];
    avoidPhrases: string[];
  };
  regulatoryPosture: "reactive" | "compliant" | "proactive";
  riskTolerance: "low" | "moderate" | "high";
  jurisdictions: string[];
};

export type HistoricalIntelligence = {
  eventId: string;
  eventType: string;
  eventDate: string;
  attendeeCount: number;
  questionsProcessed: number;
  complianceIncidents: number;
  averageSentiment: number;
  sentimentTrend: "improving" | "stable" | "declining";
  keyTopics: string[];
  riskFlags: string[];
  decayWeight: number;
};

export type RelationshipNode = {
  id: string;
  type: "client" | "event" | "attendee" | "question" | "sentiment";
  label: string;
  metadata: Record<string, any>;
};

export type RelationshipEdge = {
  from: string;
  to: string;
  relationship: "hosted" | "attended" | "asked" | "expressed" | "triggered" | "followed_up";
  weight: number;
  timestamp: string;
};

export type GoalKPI = {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  trend: "improving" | "stable" | "declining";
  lastUpdated: string;
  baselineValue: number;
  baselineDate: string;
};

export type GoalFramework = {
  clientId: string;
  goals: Array<{
    id: string;
    description: string;
    category: "engagement" | "compliance" | "response_time" | "sentiment" | "coverage";
    kpis: GoalKPI[];
    status: "on_track" | "at_risk" | "behind" | "exceeded";
  }>;
};

export type CrisisBrief = {
  clientId: string;
  generatedAt: string;
  triggerReason: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  hostileQuestionPatterns: string[];
  recommendedPreparation: string[];
  historicalContext: string;
  predictedTopics: string[];
  suggestedResponses: Array<{ topic: string; response: string }>;
};

export type StaffingForecast = {
  clientId: string;
  eventType: string;
  predictedComplexity: number;
  recommendedOperators: number;
  recommendedComplianceAnalysts: number;
  reasoning: string;
};

type KnowledgeGraph = {
  profile: CompanyProfile;
  history: HistoricalIntelligence[];
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  goals: GoalFramework;
};

const clientGraphs = new Map<string, KnowledgeGraph>();

export function initializeClientGraph(clientId: string, profile: CompanyProfile): void {
  const graph: KnowledgeGraph = {
    profile,
    history: [],
    nodes: [{ id: `client-${clientId}`, type: "client", label: clientId, metadata: { created: new Date().toISOString() } }],
    edges: [],
    goals: { clientId, goals: [] },
  };
  clientGraphs.set(clientId, graph);
  console.log(`[AEOS-KG] Initialized knowledge graph for client: ${clientId}`);
}

export function getClientGraph(clientId: string): KnowledgeGraph | null {
  return clientGraphs.get(clientId) ?? null;
}

export function updateCompanyProfile(clientId: string, updates: Partial<CompanyProfile>): CompanyProfile | null {
  const graph = clientGraphs.get(clientId);
  if (!graph) return null;
  graph.profile = { ...graph.profile, ...updates };
  return graph.profile;
}

export function addEventIntelligence(clientId: string, event: Omit<HistoricalIntelligence, "decayWeight">): void {
  const graph = clientGraphs.get(clientId);
  if (!graph) return;

  const weight = decayWeight(event.eventDate);
  graph.history.push({ ...event, decayWeight: weight });

  const eventNode: RelationshipNode = {
    id: `event-${event.eventId}`,
    type: "event",
    label: `${event.eventType} (${event.eventDate})`,
    metadata: { attendeeCount: event.attendeeCount, questionsProcessed: event.questionsProcessed },
  };
  graph.nodes.push(eventNode);

  graph.edges.push({
    from: `client-${clientId}`,
    to: eventNode.id,
    relationship: "hosted",
    weight: 1,
    timestamp: event.eventDate,
  });

  console.log(`[AEOS-KG] Added event intelligence: ${event.eventId} (decay=${weight.toFixed(3)})`);
}

export function addAttendeeRelationship(
  clientId: string,
  eventId: string,
  attendeeId: string,
  attendeeName: string,
  questions: Array<{ id: string; text: string; sentiment: number; polarity: string }>
): void {
  const graph = clientGraphs.get(clientId);
  if (!graph) return;

  const attendeeNodeId = `attendee-${attendeeId}`;
  if (!graph.nodes.find(n => n.id === attendeeNodeId)) {
    graph.nodes.push({ id: attendeeNodeId, type: "attendee", label: attendeeName, metadata: {} });
  }

  graph.edges.push({
    from: `event-${eventId}`,
    to: attendeeNodeId,
    relationship: "attended",
    weight: 1,
    timestamp: new Date().toISOString(),
  });

  for (const q of questions) {
    const questionNodeId = `question-${q.id}`;
    graph.nodes.push({ id: questionNodeId, type: "question", label: q.text.slice(0, 100), metadata: { sentiment: q.sentiment, polarity: q.polarity } });

    graph.edges.push({ from: attendeeNodeId, to: questionNodeId, relationship: "asked", weight: 1, timestamp: new Date().toISOString() });

    const sentimentNodeId = `sentiment-${q.id}`;
    graph.nodes.push({ id: sentimentNodeId, type: "sentiment", label: q.polarity, metadata: { score: q.sentiment } });
    graph.edges.push({ from: questionNodeId, to: sentimentNodeId, relationship: "expressed", weight: q.sentiment, timestamp: new Date().toISOString() });
  }
}

export function getDecayWeightedHistory(clientId: string): HistoricalIntelligence[] {
  const graph = clientGraphs.get(clientId);
  if (!graph) return [];

  return graph.history
    .map(h => ({ ...h, decayWeight: decayWeight(h.eventDate) }))
    .filter(h => h.decayWeight > 0.25)
    .sort((a, b) => b.decayWeight - a.decayWeight);
}

export function detectCrossEventPatterns(clientId: string): {
  recurringTopics: string[];
  sentimentTrend: "improving" | "stable" | "declining";
  complianceRiskTrend: "increasing" | "stable" | "decreasing";
  hostileQuestionFrequency: number;
} {
  const history = getDecayWeightedHistory(clientId);
  if (history.length === 0) {
    return { recurringTopics: [], sentimentTrend: "stable", complianceRiskTrend: "stable", hostileQuestionFrequency: 0 };
  }

  const topicCounts: Record<string, number> = {};
  for (const h of history) {
    for (const topic of h.keyTopics) {
      topicCounts[topic] = (topicCounts[topic] || 0) + h.decayWeight;
    }
  }
  const recurringTopics = Object.entries(topicCounts)
    .filter(([, count]) => count > 1.0)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  const recentSentiments = history.slice(0, 5).map(h => h.averageSentiment);
  const avgRecent = recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length;
  const olderSentiments = history.slice(5).map(h => h.averageSentiment);
  const avgOlder = olderSentiments.length > 0 ? olderSentiments.reduce((a, b) => a + b, 0) / olderSentiments.length : avgRecent;

  const sentimentTrend = avgRecent > avgOlder + 0.05 ? "improving" : avgRecent < avgOlder - 0.05 ? "declining" : "stable";

  const recentIncidents = history.slice(0, 5).reduce((sum, h) => sum + h.complianceIncidents, 0);
  const olderIncidents = history.slice(5).reduce((sum, h) => sum + h.complianceIncidents, 0);
  const complianceRiskTrend = recentIncidents > olderIncidents ? "increasing" : recentIncidents < olderIncidents ? "decreasing" : "stable";

  const totalEvents = history.length;
  const eventsWithRisk = history.filter(h => h.riskFlags.length > 0).length;
  const hostileQuestionFrequency = totalEvents > 0 ? eventsWithRisk / totalEvents : 0;

  return { recurringTopics, sentimentTrend, complianceRiskTrend, hostileQuestionFrequency };
}

export function generateStaffingForecast(clientId: string, upcomingEventType: string, expectedAttendees: number): StaffingForecast {
  const history = getDecayWeightedHistory(clientId);
  const patterns = detectCrossEventPatterns(clientId);

  let complexityBase = 0.5;
  if (expectedAttendees > 100) complexityBase += 0.2;
  if (expectedAttendees > 200) complexityBase += 0.15;
  if (patterns.hostileQuestionFrequency > 0.3) complexityBase += 0.2;
  if (patterns.complianceRiskTrend === "increasing") complexityBase += 0.15;
  if (patterns.sentimentTrend === "declining") complexityBase += 0.1;

  const predictedComplexity = Math.min(1, complexityBase);
  const recommendedOperators = Math.max(1, Math.ceil(expectedAttendees / 50) + (predictedComplexity > 0.7 ? 1 : 0));
  const recommendedComplianceAnalysts = predictedComplexity > 0.6 ? Math.ceil(recommendedOperators * 0.5) : 0;

  const reasonParts: string[] = [];
  if (patterns.hostileQuestionFrequency > 0.3) reasonParts.push("elevated hostile question frequency");
  if (patterns.complianceRiskTrend === "increasing") reasonParts.push("increasing compliance risk trend");
  if (patterns.sentimentTrend === "declining") reasonParts.push("declining sentiment trend");
  if (expectedAttendees > 100) reasonParts.push(`large attendee count (${expectedAttendees})`);

  return {
    clientId,
    eventType: upcomingEventType,
    predictedComplexity,
    recommendedOperators,
    recommendedComplianceAnalysts,
    reasoning: reasonParts.length > 0
      ? `Elevated staffing recommended due to: ${reasonParts.join(", ")}`
      : "Standard staffing — no elevated risk factors detected",
  };
}

export function generateCrisisBrief(clientId: string): CrisisBrief | null {
  const graph = clientGraphs.get(clientId);
  if (!graph) return null;

  const patterns = detectCrossEventPatterns(clientId);
  const history = getDecayWeightedHistory(clientId);

  if (patterns.hostileQuestionFrequency < 0.2 && patterns.sentimentTrend !== "declining" && patterns.complianceRiskTrend !== "increasing") {
    return null;
  }

  const allRiskFlags = history.flatMap(h => h.riskFlags);
  const uniqueFlags = [...new Set(allRiskFlags)];
  const hostilePatterns = uniqueFlags.filter(f => f.toLowerCase().includes("hostile") || f.toLowerCase().includes("adversarial") || f.toLowerCase().includes("aggressive"));

  const riskLevel = patterns.hostileQuestionFrequency > 0.5 ? "critical"
    : patterns.hostileQuestionFrequency > 0.3 ? "high"
    : patterns.complianceRiskTrend === "increasing" ? "moderate"
    : "low";

  return {
    clientId,
    generatedAt: new Date().toISOString(),
    triggerReason: `Automated crisis brief: hostile frequency=${(patterns.hostileQuestionFrequency * 100).toFixed(0)}%, sentiment=${patterns.sentimentTrend}, compliance=${patterns.complianceRiskTrend}`,
    riskLevel,
    hostileQuestionPatterns: hostilePatterns.length > 0 ? hostilePatterns : ["General adversarial sentiment detected"],
    recommendedPreparation: [
      "Brief spokesperson on recurring hostile topics",
      "Prepare defensive talking points for identified risk areas",
      "Pre-screen attendee list for known adversarial questioners",
      "Have compliance analyst on standby for real-time guidance",
    ],
    historicalContext: `Based on ${history.length} decay-weighted events. Compliance incidents trending ${patterns.complianceRiskTrend}. Overall sentiment ${patterns.sentimentTrend}.`,
    predictedTopics: patterns.recurringTopics.slice(0, 5),
    suggestedResponses: patterns.recurringTopics.slice(0, 3).map(topic => ({
      topic,
      response: `[Auto-generated safe response template for "${topic}" — customize before event]`,
    })),
  };
}

export function updateGoalKPI(clientId: string, goalId: string, kpiId: string, newValue: number): boolean {
  const graph = clientGraphs.get(clientId);
  if (!graph) return false;

  const goal = graph.goals.goals.find(g => g.id === goalId);
  if (!goal) return false;

  const kpi = goal.kpis.find(k => k.id === kpiId);
  if (!kpi) return false;

  const previousValue = kpi.currentValue;
  kpi.currentValue = newValue;
  kpi.lastUpdated = new Date().toISOString();
  kpi.trend = newValue > previousValue ? "improving" : newValue < previousValue ? "declining" : "stable";

  const allOnTrack = goal.kpis.every(k => k.currentValue >= k.targetValue * 0.9);
  const anyBehind = goal.kpis.some(k => k.currentValue < k.targetValue * 0.7);
  const anyExceeded = goal.kpis.every(k => k.currentValue >= k.targetValue);
  goal.status = anyExceeded ? "exceeded" : allOnTrack ? "on_track" : anyBehind ? "behind" : "at_risk";

  return true;
}

export function addGoal(clientId: string, goal: GoalFramework["goals"][0]): boolean {
  const graph = clientGraphs.get(clientId);
  if (!graph) return false;
  graph.goals.goals.push(goal);
  return true;
}

export function getGraphStats(clientId: string): {
  nodeCount: number;
  edgeCount: number;
  eventCount: number;
  activeHistoryCount: number;
  goalCount: number;
} | null {
  const graph = clientGraphs.get(clientId);
  if (!graph) return null;

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    eventCount: graph.history.length,
    activeHistoryCount: graph.history.filter(h => decayWeight(h.eventDate) > 0.25).length,
    goalCount: graph.goals.goals.length,
  };
}
