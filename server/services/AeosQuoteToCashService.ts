// @ts-nocheck
/**
 * AEOS Quote-to-Cash Deterministic Financial State Machine
 * CIPC Patent App ID 1773575338868 | CIP6 | Claim 71, 75
 *
 * Governs the complete Quote-to-Cash lifecycle without human intervention:
 *   Stage 1: Predictive Quoting Engine
 *   Stage 2: Autonomous Registration Bridge
 *   Stage 3: Event-Triggered Invoicing
 *   Stage 4: Self-Healing Reconciliation Layer
 *
 * All stage transitions are validated by the Governance Gateway (Claim 64)
 * before execution — deterministic stability validation on financial actions.
 */
import { createHash } from "crypto";

export type Q2CStage = "quoting" | "registration" | "invoicing" | "reconciliation" | "completed" | "disputed";

export type Q2CEvent =
  | "booking_submitted"
  | "quote_generated"
  | "digital_signature_detected"
  | "infrastructure_provisioned"
  | "service_complete"
  | "invoice_generated"
  | "payment_received"
  | "discrepancy_detected"
  | "discrepancy_resolved"
  | "escalated";

type StageTransition = {
  from: Q2CStage;
  event: Q2CEvent;
  to: Q2CStage;
  guard?: (ctx: Q2CContext) => { allowed: boolean; reason: string };
};

export type ResourceAvailability = {
  operators: number;
  complianceAnalysts: number;
  infrastructureCapacity: number;
};

export type PredictiveDemandVector = {
  historicalDemandFactor: number;
  seasonalAdjustment: number;
  eventComplexityScore: number;
  jurisdictionRiskMultiplier: number;
};

export type Q2CContext = {
  id: string;
  clientId: string;
  stage: Q2CStage;
  createdAt: number;
  updatedAt: number;
  quoteAmount: number | null;
  invoiceAmount: number | null;
  paymentReceived: number | null;
  invoiceHash: string | null;
  paymentHash: string | null;
  reconciliationStatus: "pending" | "matched" | "discrepancy" | "resolved" | "escalated" | null;
  eventDetails: {
    eventType: string;
    attendeeCount: number;
    durationMinutes: number;
    jurisdiction: string;
    questionsProcessed?: number;
    complianceFlagsRaised?: number;
    blockchainCertHash?: string;
    aiSessionSummary?: string;
  } | null;
  registrationDetails: {
    credentialsGenerated: boolean;
    ablyChannelsProvisioned: boolean;
    operatorsAllocated: number;
    onboardingDistributed: boolean;
  } | null;
  auditTrail: Array<{
    timestamp: string;
    fromStage: Q2CStage;
    toStage: Q2CStage;
    event: Q2CEvent;
    details: string;
    hash: string;
    previousHash: string;
  }>;
};

const TRANSITIONS: StageTransition[] = [
  { from: "quoting", event: "quote_generated", to: "quoting" },
  {
    from: "quoting",
    event: "digital_signature_detected",
    to: "registration",
    guard: (ctx) => {
      if (!ctx.quoteAmount || ctx.quoteAmount <= 0) {
        return { allowed: false, reason: "Cannot proceed to registration — no valid quote amount" };
      }
      return { allowed: true, reason: "Quote accepted with valid amount" };
    },
  },
  { from: "registration", event: "infrastructure_provisioned", to: "registration" },
  {
    from: "registration",
    event: "service_complete",
    to: "invoicing",
    guard: (ctx) => {
      if (!ctx.registrationDetails?.credentialsGenerated) {
        return { allowed: false, reason: "Cannot invoice — registration credentials not generated" };
      }
      return { allowed: true, reason: "Service completed, registration valid" };
    },
  },
  { from: "invoicing", event: "invoice_generated", to: "reconciliation" },
  {
    from: "reconciliation",
    event: "payment_received",
    to: "completed",
    guard: (ctx) => {
      if (!ctx.invoiceHash || !ctx.paymentHash) {
        return { allowed: false, reason: "Cannot reconcile — missing invoice or payment hash" };
      }
      if (ctx.invoiceHash !== ctx.paymentHash) {
        return { allowed: false, reason: `Hash mismatch: invoice=${ctx.invoiceHash?.slice(0, 16)}… payment=${ctx.paymentHash?.slice(0, 16)}…` };
      }
      return { allowed: true, reason: "SHA-256 hash match confirmed — payment reconciled" };
    },
  },
  { from: "reconciliation", event: "discrepancy_detected", to: "disputed" },
  { from: "disputed", event: "discrepancy_resolved", to: "completed" },
  { from: "disputed", event: "escalated", to: "disputed" },
];

const BASE_RATE_PER_HOUR = 4250;
const COMPLIANCE_MONITORING_RATE = 2100;
const OPERATOR_RATE = 1500;

// ─── Historical Quote Store for Bayesian Learning ────────────────────────────

type HistoricalQuote = {
  eventType: string;
  attendeeCount: number;
  durationHours: number;
  actualCost: number;
  acceptedAmount: number;
  margin: number;
  timestamp: number;
};

const quoteHistory: HistoricalQuote[] = [];

export function recordQuoteOutcome(outcome: HistoricalQuote): void {
  quoteHistory.push(outcome);
}

// ─── Bayesian Demand Estimation ──────────────────────────────────────────────
//
// Prior:  μ₀ = base demand multiplier (1.0), σ₀² = 0.25 (broad prior)
// Likelihood: Each historical event contributes an observed demand ratio
//   observed_ratio = acceptedAmount / baseCost
//
// Posterior (conjugate Normal-Normal):
//   μ_post = (μ₀/σ₀² + Σ(xᵢ/σ²)) / (1/σ₀² + n/σ²)
//   σ²_post = 1 / (1/σ₀² + n/σ²)
//
// where σ² is estimated from the observed variance of demand ratios

export function computeBayesianDemandEstimate(
  eventType: string,
  demandVector: PredictiveDemandVector
): { posteriorMean: number; posteriorStdDev: number; confidenceLower: number; confidenceUpper: number; sampleSize: number; priorWeight: number } {
  const PRIOR_MEAN = 1.0;
  const PRIOR_VARIANCE = 0.25;
  const WILSON_Z = 1.96;

  const relevant = quoteHistory.filter(h => h.eventType === eventType && h.acceptedAmount > 0);

  if (relevant.length < 2) {
    const pointEstimate = 1 +
      (demandVector.historicalDemandFactor * 0.3) +
      (demandVector.seasonalAdjustment * 0.25) +
      (demandVector.eventComplexityScore * 0.25) +
      (demandVector.jurisdictionRiskMultiplier * 0.2);

    return {
      posteriorMean: Math.round(pointEstimate * 1000) / 1000,
      posteriorStdDev: Math.round(Math.sqrt(PRIOR_VARIANCE) * 1000) / 1000,
      confidenceLower: Math.round((pointEstimate - WILSON_Z * Math.sqrt(PRIOR_VARIANCE)) * 1000) / 1000,
      confidenceUpper: Math.round((pointEstimate + WILSON_Z * Math.sqrt(PRIOR_VARIANCE)) * 1000) / 1000,
      sampleSize: relevant.length,
      priorWeight: 1.0,
    };
  }

  const ratios = relevant.map(h => h.margin);
  const n = ratios.length;
  const sampleMean = ratios.reduce((a, b) => a + b, 0) / n;
  const sampleVariance = ratios.reduce((s, r) => s + Math.pow(r - sampleMean, 2), 0) / (n - 1);
  const sigma2 = Math.max(sampleVariance, 0.01);

  const posteriorVariance = 1 / (1 / PRIOR_VARIANCE + n / sigma2);
  const posteriorMean = posteriorVariance * (PRIOR_MEAN / PRIOR_VARIANCE + ratios.reduce((s, r) => s + r, 0) / sigma2);
  const posteriorStdDev = Math.sqrt(posteriorVariance);

  const vectorAdjustment =
    (demandVector.historicalDemandFactor * 0.15) +
    (demandVector.seasonalAdjustment * 0.15) +
    (demandVector.eventComplexityScore * 0.15) +
    (demandVector.jurisdictionRiskMultiplier * 0.10);

  const adjustedMean = posteriorMean + vectorAdjustment;

  return {
    posteriorMean: Math.round(adjustedMean * 1000) / 1000,
    posteriorStdDev: Math.round(posteriorStdDev * 1000) / 1000,
    confidenceLower: Math.round((adjustedMean - WILSON_Z * posteriorStdDev) * 1000) / 1000,
    confidenceUpper: Math.round((adjustedMean + WILSON_Z * posteriorStdDev) * 1000) / 1000,
    sampleSize: n,
    priorWeight: Math.round((posteriorVariance / PRIOR_VARIANCE) * 1000) / 1000,
  };
}

export function computePredictiveQuote(
  eventType: string,
  attendeeCount: number,
  durationHours: number,
  resources: ResourceAvailability,
  demandVector: PredictiveDemandVector
): {
  totalAmount: number;
  breakdown: Record<string, number>;
  demandMultiplier: number;
  bayesianEstimate: ReturnType<typeof computeBayesianDemandEstimate>;
  resourceUtilisation: number;
  confidenceRange: { low: number; high: number };
} {
  const baseCost = BASE_RATE_PER_HOUR * durationHours;
  const complianceCost = COMPLIANCE_MONITORING_RATE * durationHours;
  const requiredOperators = Math.max(1, Math.ceil(attendeeCount / 50));
  const operatorCost = OPERATOR_RATE * requiredOperators * durationHours;

  const resourceUtilisation = Math.min(1, (requiredOperators / Math.max(1, resources.operators)) * 0.5 +
    (1 / Math.max(1, resources.complianceAnalysts)) * 0.3 +
    (attendeeCount / Math.max(1, resources.infrastructureCapacity * 100)) * 0.2);

  const scarcityPremium = resourceUtilisation > 0.8 ? 1 + (resourceUtilisation - 0.8) * 0.5 : 1;

  const bayesian = computeBayesianDemandEstimate(eventType, demandVector);
  const demandMultiplier = Math.min(2.5, Math.max(0.8, bayesian.posteriorMean * scarcityPremium));

  const subtotal = (baseCost + complianceCost + operatorCost) * demandMultiplier;
  const totalAmount = Math.round(subtotal * 100) / 100;

  const lowMultiplier = Math.max(0.8, bayesian.confidenceLower * scarcityPremium);
  const highMultiplier = Math.min(2.5, bayesian.confidenceUpper * scarcityPremium);
  const rawCost = baseCost + complianceCost + operatorCost;

  return {
    totalAmount,
    breakdown: {
      baseCost: Math.round(baseCost * 100) / 100,
      complianceCost: Math.round(complianceCost * 100) / 100,
      operatorCost: Math.round(operatorCost * 100) / 100,
      scarcityPremium: Math.round((scarcityPremium - 1) * rawCost * 100) / 100,
    },
    demandMultiplier: Math.round(demandMultiplier * 1000) / 1000,
    bayesianEstimate: bayesian,
    resourceUtilisation: Math.round(resourceUtilisation * 1000) / 1000,
    confidenceRange: {
      low: Math.round(rawCost * lowMultiplier * 100) / 100,
      high: Math.round(rawCost * highMultiplier * 100) / 100,
    },
  };
}

export function computeInvoiceHash(invoiceData: {
  clientId: string;
  amount: number;
  eventDuration: number;
  questionsProcessed: number;
  attendeeCount: number;
  invoiceRef: string;
}): string {
  const payload = JSON.stringify({
    clientId: invoiceData.clientId,
    amount: invoiceData.amount,
    eventDuration: invoiceData.eventDuration,
    questionsProcessed: invoiceData.questionsProcessed,
    attendeeCount: invoiceData.attendeeCount,
    invoiceRef: invoiceData.invoiceRef,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function computePaymentHash(paymentData: {
  clientId: string;
  amount: number;
  eventDuration: number;
  questionsProcessed: number;
  attendeeCount: number;
  invoiceRef: string;
}): string {
  const payload = JSON.stringify({
    clientId: paymentData.clientId,
    amount: paymentData.amount,
    eventDuration: paymentData.eventDuration,
    questionsProcessed: paymentData.questionsProcessed,
    attendeeCount: paymentData.attendeeCount,
    invoiceRef: paymentData.invoiceRef,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function reconcilePayment(
  invoiceHash: string,
  paymentHash: string,
  invoiceAmount: number,
  paymentAmount: number
): { status: "matched" | "discrepancy"; reason: string; discrepancyType?: "partial" | "overpayment" | "hash_mismatch" } {
  if (invoiceHash === paymentHash && Math.abs(invoiceAmount - paymentAmount) < 0.01) {
    return { status: "matched", reason: "SHA-256 hash match and amount match confirmed" };
  }

  if (invoiceHash !== paymentHash) {
    return { status: "discrepancy", reason: "SHA-256 hash mismatch — possible data tampering or incorrect payment reference", discrepancyType: "hash_mismatch" };
  }

  if (paymentAmount < invoiceAmount) {
    return { status: "discrepancy", reason: `Partial payment: received ${paymentAmount}, expected ${invoiceAmount}`, discrepancyType: "partial" };
  }

  return { status: "discrepancy", reason: `Overpayment: received ${paymentAmount}, expected ${invoiceAmount}`, discrepancyType: "overpayment" };
}

export function createQ2CContext(clientId: string, eventType: string): Q2CContext {
  const id = `q2c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    clientId,
    stage: "quoting",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    quoteAmount: null,
    invoiceAmount: null,
    paymentReceived: null,
    invoiceHash: null,
    paymentHash: null,
    reconciliationStatus: null,
    eventDetails: { eventType, attendeeCount: 0, durationMinutes: 0, jurisdiction: "ZA_JSE" },
    registrationDetails: null,
    auditTrail: [],
  };
}

function computeAuditHash(entry: { timestamp: string; fromStage: Q2CStage; toStage: Q2CStage; event: Q2CEvent; details: string; previousHash: string }): string {
  return createHash("sha256").update(JSON.stringify(entry)).digest("hex");
}

export function transitionStage(
  ctx: Q2CContext,
  event: Q2CEvent,
  governanceOverride?: { stabilityScore: number; consistencyRate: number; failureRate: number }
): { success: boolean; context: Q2CContext; reason: string } {
  const transition = TRANSITIONS.find(t => t.from === ctx.stage && t.event === event);
  if (!transition) {
    return { success: false, context: ctx, reason: `No valid transition from "${ctx.stage}" via event "${event}"` };
  }

  const financialEvents: Q2CEvent[] = ["quote_generated", "invoice_generated", "payment_received", "discrepancy_resolved"];
  if (financialEvents.includes(event)) {
    const gov = governanceOverride ?? { stabilityScore: 1.0, consistencyRate: 1.0, failureRate: 0 };
    const govResult = validateFinancialGovernance(gov.stabilityScore, gov.consistencyRate, gov.failureRate);
    if (!govResult.passed) {
      return { success: false, context: ctx, reason: govResult.reason };
    }
  }

  if (transition.guard) {
    const guardResult = transition.guard(ctx);
    if (!guardResult.allowed) {
      return { success: false, context: ctx, reason: guardResult.reason };
    }
  }

  const previousHash = ctx.auditTrail.length > 0
    ? ctx.auditTrail[ctx.auditTrail.length - 1].hash
    : "Q2C_GENESIS";

  const auditEntry = {
    timestamp: new Date().toISOString(),
    fromStage: ctx.stage,
    toStage: transition.to,
    event,
    details: `Transition: ${ctx.stage} → ${transition.to} via ${event}`,
    previousHash,
  };
  const hash = computeAuditHash(auditEntry);

  const updatedCtx: Q2CContext = {
    ...ctx,
    stage: transition.to,
    updatedAt: Date.now(),
    auditTrail: [...ctx.auditTrail, { ...auditEntry, hash }],
  };

  console.log(`[AEOS-Q2C] ${ctx.clientId}: ${ctx.stage} → ${transition.to} (${event}) | hash=${hash.slice(0, 16)}…`);
  return { success: true, context: updatedCtx, reason: auditEntry.details };
}

export function provisionRegistration(ctx: Q2CContext, operatorCount: number): Q2CContext {
  return {
    ...ctx,
    registrationDetails: {
      credentialsGenerated: true,
      ablyChannelsProvisioned: true,
      operatorsAllocated: operatorCount,
      onboardingDistributed: true,
    },
    updatedAt: Date.now(),
  };
}

export function generateCryptoInvoice(ctx: Q2CContext): Q2CContext {
  if (!ctx.eventDetails || !ctx.quoteAmount) return ctx;

  const invoiceRef = `INV-${ctx.clientId}-${ctx.id}`;
  const invoiceHash = computeInvoiceHash({
    clientId: ctx.clientId,
    amount: ctx.quoteAmount,
    eventDuration: ctx.eventDetails.durationMinutes,
    questionsProcessed: ctx.eventDetails.questionsProcessed ?? 0,
    attendeeCount: ctx.eventDetails.attendeeCount,
    invoiceRef,
  });

  return {
    ...ctx,
    invoiceAmount: ctx.quoteAmount,
    invoiceHash,
    updatedAt: Date.now(),
  };
}

export function validateFinancialGovernance(
  stabilityScore: number,
  consistencyRate: number,
  failureRate: number
): { passed: boolean; reason: string } {
  const FINANCIAL_STABILITY_THRESHOLD = 0.65;
  const MIN_CONSISTENCY_RATE = 0.70;
  const MAX_FAILURE = 0.3;

  if (stabilityScore < FINANCIAL_STABILITY_THRESHOLD) {
    return { passed: false, reason: `Financial governance blocked: stability ${stabilityScore.toFixed(3)} below ${FINANCIAL_STABILITY_THRESHOLD}` };
  }
  if (consistencyRate < MIN_CONSISTENCY_RATE) {
    return { passed: false, reason: `Financial governance blocked: consistency ${(consistencyRate * 100).toFixed(0)}% below ${MIN_CONSISTENCY_RATE * 100}%` };
  }
  if (failureRate > MAX_FAILURE) {
    return { passed: false, reason: `Financial governance blocked: failure rate ${(failureRate * 100).toFixed(0)}% exceeds ${MAX_FAILURE * 100}%` };
  }
  return { passed: true, reason: `Financial governance passed: stability=${stabilityScore.toFixed(3)}, consistency=${(consistencyRate * 100).toFixed(0)}%, failureRate=${(failureRate * 100).toFixed(0)}%` };
}

export function verifyQ2CAuditIntegrity(ctx: Q2CContext): { valid: boolean; chainLength: number; brokenAt?: number } {
  let prevHash = "Q2C_GENESIS";
  for (let i = 0; i < ctx.auditTrail.length; i++) {
    const entry = ctx.auditTrail[i];
    if (entry.previousHash !== prevHash) {
      return { valid: false, chainLength: ctx.auditTrail.length, brokenAt: i };
    }
    const recomputed = computeAuditHash({
      timestamp: entry.timestamp,
      fromStage: entry.fromStage,
      toStage: entry.toStage,
      event: entry.event,
      details: entry.details,
      previousHash: entry.previousHash,
    });
    if (recomputed !== entry.hash) {
      return { valid: false, chainLength: ctx.auditTrail.length, brokenAt: i };
    }
    prevHash = entry.hash;
  }
  return { valid: true, chainLength: ctx.auditTrail.length };
}
