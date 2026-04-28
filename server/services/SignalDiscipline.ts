/**
 * SignalDiscipline.ts
 * Phase 3.5 Task 1 — Signal Discipline Core
 *
 * Sits between Governance Gateway output and intelligence_feed INSERT.
 * Suppresses duplicate and low-confidence signals before they reach the feed.
 *
 * NEVER modifies governance logic.
 * NEVER modifies pipeline logic.
 * NEVER persists state.
 */

export type SignalDecision =
  | 'surfaced'
  | 'suppressed_duplicate'
  | 'suppressed_low_confidence'
  | 'confidence_filter_skipped';

export interface SignalDisciplineResult {
  shouldSurface: boolean;
  reason: SignalDecision;
  normalizedKey?: string;
}

interface SessionState {
  keys: Set<string>;
  lastSeen: number;
}

const CONFIDENCE_THRESHOLD = 0.8;
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

const sessionStore = new Map<number, SessionState>();

function runCleanup(): void {
  const now = Date.now();
  let removed = 0;
  for (const [sessionId, state] of sessionStore.entries()) {
    if (now - state.lastSeen > SESSION_TTL_MS) {
      sessionStore.delete(sessionId);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`[SignalDiscipline] TTL cleanup: removed ${removed} expired session(s). Active sessions: ${sessionStore.size}`);
  }
}

const cleanupTimer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
if (cleanupTimer.unref) cleanupTimer.unref();

export function normalizeSignalText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDedupKey(title: string, body: string): string {
  return normalizeSignalText(`${title} ${body}`);
}

export function evaluateSignalDiscipline(params: {
  sessionId: number;
  title: string;
  body: string;
  confidenceScore?: number | null;
}): SignalDisciplineResult {
  const { sessionId, title, body, confidenceScore } = params;

  if (confidenceScore === null || confidenceScore === undefined) {
    console.log(`[SignalDiscipline] confidence_filter_skipped — sessionId=${sessionId} title=${title}`);
  } else if (confidenceScore < CONFIDENCE_THRESHOLD) {
    console.log(`[SignalDiscipline] suppressed_low_confidence — sessionId=${sessionId} confidence=${confidenceScore} title=${title}`);
    return { shouldSurface: false, reason: 'suppressed_low_confidence' };
  }

  const normalizedKey = buildDedupKey(title, body);
  const now = Date.now();

  let state = sessionStore.get(sessionId);
  if (!state) {
    state = { keys: new Set(), lastSeen: now };
    sessionStore.set(sessionId, state);
  }

  state.lastSeen = now;

  if (state.keys.has(normalizedKey)) {
    console.log(`[SignalDiscipline] suppressed_duplicate — sessionId=${sessionId} key=${normalizedKey}`);
    return { shouldSurface: false, reason: 'suppressed_duplicate', normalizedKey };
  }

  state.keys.add(normalizedKey);

  const reason: SignalDecision =
    confidenceScore === null || confidenceScore === undefined
      ? 'confidence_filter_skipped'
      : 'surfaced';

  console.log(`[SignalDiscipline] ${reason} — sessionId=${sessionId} confidence=${confidenceScore ?? 'n/a'} key=${normalizedKey}`);

  return { shouldSurface: true, reason, normalizedKey };
