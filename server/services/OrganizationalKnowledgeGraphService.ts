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

// ─── Eigenvector Centrality for Relationship Graph ───────────────────────────
//
// Identifies the most influential nodes in the Knowledge Graph.
// Uses power iteration on the adjacency matrix:
//   x(k+1) = A × x(k) / ‖A × x(k)‖
//
// Convergence: ‖x(k+1) - x(k)‖₂ < ε  or  max iterations reached
// Edge weights are decay-adjusted: w_eff = w_original × W(age)

const EIGEN_MAX_ITER = 100;
const EIGEN_TOLERANCE = 1e-8;

export type NodeCentrality = {
  nodeId: string;
  nodeType: RelationshipNode["type"];
  label: string;
  eigenvectorCentrality: number;
  degreeCentrality: number;
  betweennessCentrality: number;
  clusteringCoefficient: number;
  influenceRank: number;
};

export function computeGraphCentrality(clientId: string, topN: number = 10): NodeCentrality[] {
  const graph = clientGraphs.get(clientId);
  if (!graph || graph.nodes.length === 0) return [];

  const nodes = graph.nodes;
  const n = nodes.length;
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node.id, i));

  const adj: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const edge of graph.edges) {
    const i = nodeIndex.get(edge.from);
    const j = nodeIndex.get(edge.to);
    if (i !== undefined && j !== undefined) {
      const timeWeight = decayWeight(edge.timestamp);
      adj[i][j] += edge.weight * timeWeight;
      adj[j][i] += edge.weight * timeWeight;
    }
  }

  let x = new Array(n).fill(1 / Math.sqrt(n));

  for (let iter = 0; iter < EIGEN_MAX_ITER; iter++) {
    const xNew = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        xNew[i] += adj[i][j] * x[j];
      }
    }
    const norm = Math.sqrt(xNew.reduce((s, v) => s + v * v, 0)) || 1;
    for (let i = 0; i < n; i++) xNew[i] /= norm;

    const delta = Math.sqrt(xNew.reduce((s, v, i) => s + Math.pow(v - x[i], 2), 0));
    x = xNew;
    if (delta < EIGEN_TOLERANCE) break;
  }

  const degree: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (adj[i][j] > 0) degree[i]++;
    }
    degree[i] /= Math.max(1, n - 1);
  }

  const betweenness = computeBetweennessCentrality(adj, n);
  const clustering = computeClusteringCoefficients(adj, n);

  const results: NodeCentrality[] = nodes.map((node, i) => ({
    nodeId: node.id,
    nodeType: node.type,
    label: node.label,
    eigenvectorCentrality: r4(x[i]),
    degreeCentrality: r4(degree[i]),
    betweennessCentrality: r4(betweenness[i]),
    clusteringCoefficient: r4(clustering[i]),
    influenceRank: 0,
  }));

  results.sort((a, b) => b.eigenvectorCentrality - a.eigenvectorCentrality);
  results.forEach((r, i) => { r.influenceRank = i + 1; });

  return results.slice(0, topN);
}

// ─── Betweenness Centrality (Brandes' Algorithm) ─────────────────────────────
//
// For each source s:
//   1. BFS from s to compute shortest path counts σ(s,v) and distances d(s,v)
//   2. Backtrack from leaves to accumulate dependency:
//      δ(s,v) = Σ_w (σ(s,v)/σ(s,w)) × (1 + δ(s,w))
//   3. C_B(v) += δ(s,v) for all v ≠ s
//
// Normalised: C_B(v) = C_B(v) / ((n-1)(n-2)/2)

function computeBetweennessCentrality(adj: number[][], n: number): number[] {
  const cb = new Array(n).fill(0);

  for (let s = 0; s < n; s++) {
    const stack: number[] = [];
    const predecessors: number[][] = Array.from({ length: n }, () => []);
    const sigma = new Array(n).fill(0);
    sigma[s] = 1;
    const dist = new Array(n).fill(-1);
    dist[s] = 0;
    const queue: number[] = [s];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      for (let w = 0; w < n; w++) {
        if (adj[v][w] <= 0) continue;
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          predecessors[w].push(v);
        }
      }
    }

    const delta = new Array(n).fill(0);
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) cb[w] += delta[w];
    }
  }

  const normaliser = Math.max(1, ((n - 1) * (n - 2)) / 2);
  for (let i = 0; i < n; i++) cb[i] /= normaliser;

  return cb;
}

// ─── Clustering Coefficient ──────────────────────────────────────────────────
//
// C(v) = 2 × T(v) / (k(v) × (k(v) - 1))
// where T(v) = number of triangles through v, k(v) = degree of v

function computeClusteringCoefficients(adj: number[][], n: number): number[] {
  const cc = new Array(n).fill(0);

  for (let v = 0; v < n; v++) {
    const neighbours: number[] = [];
    for (let j = 0; j < n; j++) {
      if (adj[v][j] > 0) neighbours.push(j);
    }
    const k = neighbours.length;
    if (k < 2) continue;

    let triangles = 0;
    for (let i = 0; i < neighbours.length; i++) {
      for (let j = i + 1; j < neighbours.length; j++) {
        if (adj[neighbours[i]][neighbours[j]] > 0) triangles++;
      }
    }
    cc[v] = (2 * triangles) / (k * (k - 1));
  }

  return cc;
}

// ─── Shortest Path Query (Dijkstra) ──────────────────────────────────────────
//
// Finds the shortest weighted path between any two nodes in the Knowledge Graph.
// Weight = 1 / (edge_weight × decay_weight)  so stronger/more-recent edges are preferred.

export type PathResult = {
  from: string;
  to: string;
  path: string[];
  totalCost: number;
  hopCount: number;
  found: boolean;
};

export function findShortestPath(clientId: string, fromNodeId: string, toNodeId: string): PathResult {
  const graph = clientGraphs.get(clientId);
  if (!graph) return { from: fromNodeId, to: toNodeId, path: [], totalCost: Infinity, hopCount: 0, found: false };

  const nodes = graph.nodes;
  const n = nodes.length;
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node.id, i));

  const src = nodeIndex.get(fromNodeId);
  const dst = nodeIndex.get(toNodeId);
  if (src === undefined || dst === undefined) {
    return { from: fromNodeId, to: toNodeId, path: [], totalCost: Infinity, hopCount: 0, found: false };
  }

  const adj: Array<Array<{ to: number; cost: number }>> = Array.from({ length: n }, () => []);
  for (const edge of graph.edges) {
    const i = nodeIndex.get(edge.from);
    const j = nodeIndex.get(edge.to);
    if (i !== undefined && j !== undefined) {
      const timeWeight = decayWeight(edge.timestamp);
      const cost = 1 / (edge.weight * timeWeight + 0.001);
      adj[i].push({ to: j, cost });
      adj[j].push({ to: i, cost });
    }
  }

  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  dist[src] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < minDist) {
        u = i;
        minDist = dist[i];
      }
    }
    if (u === -1 || u === dst) break;
    visited[u] = true;

    for (const edge of adj[u]) {
      const alt = dist[u] + edge.cost;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
      }
    }
  }

  if (dist[dst] === Infinity) {
    return { from: fromNodeId, to: toNodeId, path: [], totalCost: Infinity, hopCount: 0, found: false };
  }

  const pathIndices: number[] = [];
  for (let at = dst; at !== -1; at = prev[at]) pathIndices.push(at);
  pathIndices.reverse();

  return {
    from: fromNodeId,
    to: toNodeId,
    path: pathIndices.map(i => nodes[i].id),
    totalCost: r4(dist[dst]),
    hopCount: pathIndices.length - 1,
    found: true,
  };
}

// ─── Community Detection (Label Propagation) ─────────────────────────────────
//
// Iterative algorithm:
//   1. Assign each node a unique label
//   2. For each node, adopt the label most frequent among weighted neighbours
//   3. Repeat until convergence or max iterations
//
// Identifies natural clusters in the relationship graph (e.g., groups of
// attendees who consistently appear together across events).

export type CommunityResult = {
  communityId: string;
  members: Array<{ nodeId: string; nodeType: string; label: string }>;
  size: number;
  cohesion: number;
};

export function detectCommunities(clientId: string): CommunityResult[] {
  const graph = clientGraphs.get(clientId);
  if (!graph || graph.nodes.length === 0) return [];

  const nodes = graph.nodes;
  const n = nodes.length;
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, i) => nodeIndex.set(node.id, i));

  const adj: Array<Array<{ to: number; weight: number }>> = Array.from({ length: n }, () => []);
  for (const edge of graph.edges) {
    const i = nodeIndex.get(edge.from);
    const j = nodeIndex.get(edge.to);
    if (i !== undefined && j !== undefined) {
      const w = edge.weight * decayWeight(edge.timestamp);
      adj[i].push({ to: j, weight: w });
      adj[j].push({ to: i, weight: w });
    }
  }

  const labels = nodes.map((_, i) => i);
  const MAX_ITER = 50;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let changed = false;
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const i of order) {
      const labelWeights: Record<number, number> = {};
      for (const edge of adj[i]) {
        const l = labels[edge.to];
        labelWeights[l] = (labelWeights[l] || 0) + edge.weight;
      }
      if (Object.keys(labelWeights).length === 0) continue;

      let maxWeight = -1;
      let bestLabel = labels[i];
      for (const [l, w] of Object.entries(labelWeights)) {
        if (w > maxWeight) {
          maxWeight = w;
          bestLabel = parseInt(l);
        }
      }
      if (bestLabel !== labels[i]) {
        labels[i] = bestLabel;
        changed = true;
      }
    }
    if (!changed) break;
  }

  const communities = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const members = communities.get(labels[i]) ?? [];
    members.push(i);
    communities.set(labels[i], members);
  }

  const results: CommunityResult[] = [];
  for (const [communityLabel, memberIndices] of communities) {
    if (memberIndices.length < 2) continue;

    let internalEdges = 0;
    let totalPossible = (memberIndices.length * (memberIndices.length - 1)) / 2;
    const memberSet = new Set(memberIndices);

    for (const i of memberIndices) {
      for (const edge of adj[i]) {
        if (memberSet.has(edge.to) && edge.to > i) internalEdges++;
      }
    }

    results.push({
      communityId: `community-${communityLabel}`,
      members: memberIndices.map(i => ({ nodeId: nodes[i].id, nodeType: nodes[i].type, label: nodes[i].label })),
      size: memberIndices.length,
      cohesion: r4(totalPossible > 0 ? internalEdges / totalPossible : 0),
    });
  }

  return results.sort((a, b) => b.size - a.size);
}

function r4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
