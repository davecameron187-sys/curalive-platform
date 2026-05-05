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
  for (const [sessionId, state] of Array.from(sessionStore.entries())) {
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


const SENTIMENT_NEUTRAL_SCORE_PATTERN = /Score:\s*(\d+)\/100/i;
const SENTIMENT_KEYWORDS_PATTERN = /Keywords:\s*(.+)$/im;
const SENTIMENT_STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'that','this','it','is','was','are','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'i','we','you','he','she','they','them','their','our','your',
  'going','to','take','next','but','that','analyze','engage','happening','small','life','here','shops','puzzle','traders','logo','this','is','was'
]);

function isSentimentTitle(title: string): boolean {
  return /^Sentiment:/i.test(title.trim());
}

function extractSentimentScore(body: string): number | null {
  const match = body.match(SENTIMENT_NEUTRAL_SCORE_PATTERN);
  return match ? parseInt(match[1], 10) : null;
}

function extractKeywords(body: string): string[] {
  const match = body.match(SENTIMENT_KEYWORDS_PATTERN);
  if (!match) return [];
  return match[1].split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
}

function isLowInformationKeywords(keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const meaningful = keywords.filter(k => k.length > 2 && !SENTIMENT_STOPWORDS.has(k));
  return meaningful.length === 0;
}

function isMaterialitySuppressed(title: string, body: string): { suppressed: boolean; reason: string } {
  if (!isSentimentTitle(title)) {
    return { suppressed: false, reason: '' };
  }
  const score = extractSentimentScore(body);
  const keywords = extractKeywords(body);
  const lowInfo = isLowInformationKeywords(keywords);

  if (score !== null && score >= 45 && score <= 55 && lowInfo) {
    return { suppressed: true, reason: 'suppressed_low_materiality_sentiment' };
  }
  if (lowInfo && keywords.length <= 1) {
    return { suppressed: true, reason: 'suppressed_single_keyword_sentiment' };
  }
  return { suppressed: false, reason: '' };
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

  const materialityCheck = isMaterialitySuppressed(title, body);
  if (materialityCheck.suppressed) {
    console.log(`[SignalDiscipline] ${materialityCheck.reason} — sessionId=${sessionId} title=${title}`);
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
}
