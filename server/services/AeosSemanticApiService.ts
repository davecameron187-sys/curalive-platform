// @ts-nocheck
/**
 * AEOS Modal-Agnostic Semantic API
 * CIPC Patent App ID 1773575338868 | CIP6 | Claim 73
 *
 * Self-describing API layer that exposes every platform capability in structured
 * natural language, enabling external AI systems to discover, understand, and invoke
 * any capability without pre-programmed integrations.
 *
 * Supports natural language commands that trigger complex multi-module workflows.
 */

export type SemanticCapability = {
  id: string;
  name: string;
  description: string;
  module: number;
  moduleName: string;
  category: "intelligence" | "compliance" | "communication" | "financial" | "governance" | "infrastructure";
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  regulatoryImplications: string[];
  dependencies: string[];
  invocationPath: string;
};

export type WorkflowStep = {
  capabilityId: string;
  order: number;
  inputMapping: Record<string, string>;
  description: string;
};

export type SemanticWorkflow = {
  id: string;
  name: string;
  naturalLanguageTrigger: string;
  steps: WorkflowStep[];
  modulesInvolved: number[];
  estimatedDurationMs: number;
};

const capabilityRegistry: SemanticCapability[] = [
  {
    id: "cap-triage-question",
    name: "AI Question Triage",
    description: "Analyzes a live Q&A question using AI to determine category, sentiment polarity, compliance risk score, triage score, and P2P priority rank",
    module: 31,
    moduleName: "Live Q&A Intelligence Engine",
    category: "intelligence",
    inputs: [
      { name: "questionText", type: "string", required: true, description: "The text of the question submitted by an attendee" },
      { name: "sessionId", type: "number", required: true, description: "The active Q&A session identifier" },
      { name: "attendeeName", type: "string", required: false, description: "Name of the attendee for identity mapping" },
    ],
    outputs: [
      { name: "triageScore", type: "number", description: "AI-computed relevance and quality score (0-100)" },
      { name: "complianceRiskScore", type: "number", description: "Multi-jurisdictional compliance risk assessment (0-100)" },
      { name: "p2pRank", type: "number", description: "Polarity-to-Priority rank computed from sentiment and urgency" },
      { name: "sentimentPolarity", type: "string", description: "Detected sentiment: positive, neutral, negative, or adversarial" },
      { name: "category", type: "string", description: "Question category classification" },
    ],
    regulatoryImplications: ["ZA_JSE Listings Requirements", "US_SEC Regulation FD", "UK_FCA MAR/DTR", "EU_ESMA MAR"],
    dependencies: ["cap-compliance-check"],
    invocationPath: "liveQa.triageQuestion",
  },
  {
    id: "cap-go-live",
    name: "Go Live Authorization Gate",
    description: "Evaluates whether a participant may be unmuted on a live call by checking triage score threshold and compliance risk ceiling",
    module: 31,
    moduleName: "Live Q&A Intelligence Engine",
    category: "compliance",
    inputs: [
      { name: "questionId", type: "number", required: true, description: "ID of the question to authorize for live audio" },
      { name: "minimumThreshold", type: "number", required: false, description: "Override triage score threshold (default: 40)" },
    ],
    outputs: [
      { name: "authorised", type: "boolean", description: "Whether the Go Live command is authorized" },
      { name: "reason", type: "string", description: "Human-readable authorization decision reason" },
    ],
    regulatoryImplications: ["Prevents compliance-flagged questions from going live without review"],
    dependencies: ["cap-triage-question"],
    invocationPath: "liveQa.goLive",
  },
  {
    id: "cap-compliance-check",
    name: "Multi-Jurisdictional Compliance Screening",
    description: "Screens content against ZA_JSE, US_SEC, UK_FCA, and EU_ESMA regulatory frameworks for forward-looking statements, selective disclosure, and materiality risks",
    module: 28,
    moduleName: "AI Self-Evolution Engine",
    category: "compliance",
    inputs: [
      { name: "content", type: "string", required: true, description: "Text content to screen for compliance risks" },
      { name: "jurisdiction", type: "string", required: false, description: "Primary jurisdiction (defaults to all)" },
    ],
    outputs: [
      { name: "riskScore", type: "number", description: "Overall compliance risk score (0-100)" },
      { name: "jurisdictionAlerts", type: "array", description: "Per-jurisdiction regulatory alerts with required actions" },
      { name: "safeResponse", type: "string", description: "Compliance-safe version of the input content" },
    ],
    regulatoryImplications: ["Direct regulatory framework application"],
    dependencies: [],
    invocationPath: "agiCompliance.predictiveRiskAnalysis",
  },
  {
    id: "cap-governance-gateway",
    name: "Autonomous Governance Gateway",
    description: "Four-criterion deterministic safety validation preventing AI-generated tools from deploying without passing stability, consistency, failure rate, and compliance boundary checks",
    module: 28,
    moduleName: "AI Self-Evolution Engine",
    category: "governance",
    inputs: [
      { name: "proposalId", type: "number", required: true, description: "ID of the tool proposal to evaluate" },
    ],
    outputs: [
      { name: "passed", type: "boolean", description: "Whether the tool passed all four governance criteria" },
      { name: "stabilityScore", type: "number", description: "Composite stability score" },
      { name: "reason", type: "string", description: "Detailed governance decision explanation" },
    ],
    regulatoryImplications: ["Prevents untested AI from affecting compliance-critical modules"],
    dependencies: [],
    invocationPath: "aiEvolution.evaluateGovernanceGateway",
  },
  {
    id: "cap-predictive-quote",
    name: "Predictive Quoting Engine",
    description: "Calculates dynamic event pricing by cross-referencing resource availability with a Predictive Demand Vector derived from historical patterns, seasonal trends, and event complexity",
    module: 32,
    moduleName: "AEOS",
    category: "financial",
    inputs: [
      { name: "eventType", type: "string", required: true, description: "Type of investor event (earnings_call, agm, investor_briefing)" },
      { name: "attendeeCount", type: "number", required: true, description: "Expected number of attendees" },
      { name: "durationHours", type: "number", required: true, description: "Planned event duration in hours" },
      { name: "jurisdiction", type: "string", required: true, description: "Primary regulatory jurisdiction" },
    ],
    outputs: [
      { name: "totalAmount", type: "number", description: "Calculated quote amount" },
      { name: "breakdown", type: "object", description: "Cost breakdown by category" },
      { name: "demandMultiplier", type: "number", description: "Applied demand vector multiplier" },
    ],
    regulatoryImplications: ["Pricing subject to financial governance validation before execution"],
    dependencies: ["cap-governance-gateway"],
    invocationPath: "aeos.computePredictiveQuote",
  },
  {
    id: "cap-q2c-transition",
    name: "Quote-to-Cash Stage Transition",
    description: "Advances the Q2C lifecycle through its deterministic state machine stages with guard validation and SHA-256 hash-chained audit trail",
    module: 32,
    moduleName: "AEOS",
    category: "financial",
    inputs: [
      { name: "contextId", type: "string", required: true, description: "Q2C context identifier" },
      { name: "event", type: "string", required: true, description: "Lifecycle event triggering the transition" },
    ],
    outputs: [
      { name: "success", type: "boolean", description: "Whether the transition was executed" },
      { name: "newStage", type: "string", description: "The new Q2C lifecycle stage" },
      { name: "auditHash", type: "string", description: "SHA-256 hash of the transition audit entry" },
    ],
    regulatoryImplications: ["Financial state changes require governance gateway validation"],
    dependencies: ["cap-governance-gateway"],
    invocationPath: "aeos.transitionStage",
  },
  {
    id: "cap-knowledge-graph",
    name: "Organizational Knowledge Graph Query",
    description: "Queries the Digital Twin knowledge graph for company intelligence, cross-event patterns, and predictive insights weighted by temporal decay",
    module: 32,
    moduleName: "AEOS",
    category: "intelligence",
    inputs: [
      { name: "clientId", type: "string", required: true, description: "Client organization identifier" },
      { name: "queryType", type: "string", required: true, description: "Type of query: patterns, staffing, crisis_brief, history" },
    ],
    outputs: [
      { name: "result", type: "object", description: "Query-specific result with decay-weighted intelligence" },
    ],
    regulatoryImplications: ["Per-client data isolation enforced — no cross-contamination"],
    dependencies: [],
    invocationPath: "aeos.queryKnowledgeGraph",
  },
  {
    id: "cap-crisis-brief",
    name: "Autonomous Crisis Brief Generation",
    description: "Generates a crisis communication brief based on Knowledge Graph patterns, including hostile question predictions, recommended preparation, and suggested responses",
    module: 32,
    moduleName: "AEOS",
    category: "intelligence",
    inputs: [
      { name: "clientId", type: "string", required: true, description: "Client organization identifier" },
    ],
    outputs: [
      { name: "brief", type: "object", description: "Crisis brief with risk level, patterns, preparation, and suggested responses" },
    ],
    regulatoryImplications: ["Brief content subject to compliance screening before distribution"],
    dependencies: ["cap-knowledge-graph", "cap-compliance-check"],
    invocationPath: "aeos.generateCrisisBrief",
  },
  {
    id: "cap-staffing-forecast",
    name: "Predictive Resource Allocation",
    description: "Forecasts operator and compliance analyst staffing requirements based on Knowledge Graph patterns, event complexity, and demand vectors",
    module: 32,
    moduleName: "AEOS",
    category: "infrastructure",
    inputs: [
      { name: "clientId", type: "string", required: true, description: "Client organization identifier" },
      { name: "eventType", type: "string", required: true, description: "Upcoming event type" },
      { name: "expectedAttendees", type: "number", required: true, description: "Expected attendee count" },
    ],
    outputs: [
      { name: "forecast", type: "object", description: "Staffing forecast with complexity score, operator count, and reasoning" },
    ],
    regulatoryImplications: [],
    dependencies: ["cap-knowledge-graph"],
    invocationPath: "aeos.generateStaffingForecast",
  },
  {
    id: "cap-jitter-sync",
    name: "Predictive Jitter-Buffer Synchronization",
    description: "Aligns real-time transcripts with high-latency telephony bridges using a per-session rolling 50-sample delta-time model",
    module: 31,
    moduleName: "Live Q&A Intelligence Engine",
    category: "infrastructure",
    inputs: [
      { name: "sessionId", type: "string", required: true, description: "Telephony session identifier" },
      { name: "audioArrivalMs", type: "number", required: true, description: "Audio signal arrival timestamp (ms)" },
      { name: "transcriptGeneratedMs", type: "number", required: true, description: "Transcript generation timestamp (ms)" },
    ],
    outputs: [
      { name: "alignedTimestamp", type: "number", description: "Jitter-compensated aligned timestamp" },
      { name: "latencyCategory", type: "string", description: "Current latency classification: low, moderate, high, critical" },
      { name: "adjustmentFactor", type: "number", description: "Applied adjustment in milliseconds" },
    ],
    regulatoryImplications: [],
    dependencies: [],
    invocationPath: "transcriptSync.computeDeltaTime",
  },
];

const workflowRegistry: SemanticWorkflow[] = [
  {
    id: "wf-prepare-earnings-call",
    name: "Prepare for Earnings Call",
    naturalLanguageTrigger: "Prepare for tomorrow's earnings call",
    steps: [
      { capabilityId: "cap-knowledge-graph", order: 1, inputMapping: { queryType: "patterns" }, description: "Query Knowledge Graph for historical patterns and risk indicators" },
      { capabilityId: "cap-staffing-forecast", order: 2, inputMapping: {}, description: "Generate staffing forecast based on predicted complexity" },
      { capabilityId: "cap-crisis-brief", order: 3, inputMapping: {}, description: "Generate crisis brief if hostile patterns detected" },
      { capabilityId: "cap-compliance-check", order: 4, inputMapping: { content: "pre_event_checklist" }, description: "Pre-screen compliance requirements for jurisdiction" },
      { capabilityId: "cap-predictive-quote", order: 5, inputMapping: {}, description: "Generate or verify event pricing" },
    ],
    modulesInvolved: [20, 28, 30, 31, 32],
    estimatedDurationMs: 15000,
  },
  {
    id: "wf-complete-event-lifecycle",
    name: "Complete Event Lifecycle",
    naturalLanguageTrigger: "Event is complete, process everything",
    steps: [
      { capabilityId: "cap-q2c-transition", order: 1, inputMapping: { event: "service_complete" }, description: "Trigger Q2C transition to invoicing stage" },
      { capabilityId: "cap-knowledge-graph", order: 2, inputMapping: { queryType: "history" }, description: "Update Knowledge Graph with event intelligence" },
      { capabilityId: "cap-governance-gateway", order: 3, inputMapping: {}, description: "Validate any pending AI tool proposals" },
    ],
    modulesInvolved: [28, 31, 32],
    estimatedDurationMs: 10000,
  },
];

export function discoverCapabilities(filter?: { module?: number; category?: string }): SemanticCapability[] {
  let results = [...capabilityRegistry];
  if (filter?.module) results = results.filter(c => c.module === filter.module);
  if (filter?.category) results = results.filter(c => c.category === filter.category);
  return results;
}

export function getCapability(id: string): SemanticCapability | null {
  return capabilityRegistry.find(c => c.id === id) ?? null;
}

export function discoverWorkflows(): SemanticWorkflow[] {
  return [...workflowRegistry];
}

export function resolveNaturalLanguageCommand(command: string): SemanticWorkflow | null {
  const normalized = command.toLowerCase().trim();

  for (const workflow of workflowRegistry) {
    const triggerWords = workflow.naturalLanguageTrigger.toLowerCase().split(/\s+/);
    const matchCount = triggerWords.filter(word => normalized.includes(word)).length;
    if (matchCount >= triggerWords.length * 0.6) {
      return workflow;
    }
  }

  const keywordMap: Record<string, string> = {
    "earnings": "wf-prepare-earnings-call",
    "prepare": "wf-prepare-earnings-call",
    "complete": "wf-complete-event-lifecycle",
    "finished": "wf-complete-event-lifecycle",
    "done": "wf-complete-event-lifecycle",
    "invoice": "wf-complete-event-lifecycle",
  };

  for (const [keyword, workflowId] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return workflowRegistry.find(w => w.id === workflowId) ?? null;
    }
  }

  return null;
}

export function describeCapabilityInNaturalLanguage(id: string): string | null {
  const cap = getCapability(id);
  if (!cap) return null;

  const inputDesc = cap.inputs.map(i => `${i.name} (${i.type}${i.required ? ", required" : ", optional"}): ${i.description}`).join("; ");
  const outputDesc = cap.outputs.map(o => `${o.name} (${o.type}): ${o.description}`).join("; ");
  const regDesc = cap.regulatoryImplications.length > 0
    ? `Regulatory implications: ${cap.regulatoryImplications.join(", ")}.`
    : "No direct regulatory implications.";

  return `${cap.name} (Module ${cap.module} — ${cap.moduleName}): ${cap.description}. Inputs: ${inputDesc}. Outputs: ${outputDesc}. ${regDesc} Invoke via: ${cap.invocationPath}`;
}

export function getApiManifest(): {
  totalCapabilities: number;
  totalWorkflows: number;
  modules: number[];
  categories: string[];
  capabilities: SemanticCapability[];
  workflows: SemanticWorkflow[];
} {
  const modules = [...new Set(capabilityRegistry.map(c => c.module))].sort((a, b) => a - b);
  const categories = [...new Set(capabilityRegistry.map(c => c.category))];
  return {
    totalCapabilities: capabilityRegistry.length,
    totalWorkflows: workflowRegistry.length,
    modules,
    categories,
    capabilities: capabilityRegistry,
    workflows: workflowRegistry,
  };
}
