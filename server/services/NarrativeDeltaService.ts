/**
 * NarrativeDeltaService.ts
 * Phase 3.5 Stage 1A — Deterministic Delta Prototype
 *
 * Standalone observer service. Reads intelligence_feed items and scores them
 * against the signal priority hierarchy. Generates plain-English Narrative
 * Confidence Deltas or suppresses baseline confirmations.
 *
 * RULES:
 * - No DB writes
 * - No pipeline injection
 * - No LLM calls
 * - No UI changes
 * - Logs only — [NarrativeDelta] prefix
 * - Session state in memory only
 *
 * Priority hierarchy:
 * P0 — Compliance signal (material only — high/critical severity)
 * P1 — Deviation detected by correlation engine (deterioration/pattern)
 * P2 — First appearance of material topic (compliance/correlation pipeline
 *       OR high/critical severity OR structural signal type)
 * P3 — Sustained pressure: same topic 3+ times with escalation or unresolved risk
 * P4 — Internal state only — logged as STATE_RESOLUTION, never surfaced
 * SUPPRESSED — baseline confirmation, low-severity repetition, plain sentiment
 *
 * Tiebreaker within same tier: novelty beats repetition.
 *
 * Delta text rule: describe the communication, never the communicator.
 * No scores. No numeric language. No advice. No certainty.
 */

export type DeltaPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'SUPPRESSED';

export interface FeedItem {
  id: number;
  session_id: string;
  feed_type: string;
  severity: string;
  title: string;
  body: string;
  pipeline: string;
  created_at: Date | string;
}

export interface NarrativeDelta {
  feedItemId: number;
  sessionId: string;
  priority: DeltaPriority;
  deltaText: string | null;
  anchor: string | null;
  suppressed: boolean;
  suppressionReason: string | null;
}

const MATERIAL_PIPELINES = ['compliance', 'correlation'];
const MATERIAL_SEVERITIES = ['high', 'critical'];
const STRUCTURAL_SIGNAL_TYPES = ['pattern', 'anomaly', 'escalation'];
const SUSTAINED_PRESSURE_THRESHOLD = 3;
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

interface TopicRecord {
  count: number;
  firstSeenAt: number;
  lastSeenAt: number;
  resolved: boolean;
  hasMaterialSignal: boolean;
  severityHistory: string[];
}

interface SessionDeltaState {
  topicsEncountered: Map<string, TopicRecord>;
  riskSignalsActive: Set<string>;
  surfacedSignals: Set<string>;
  lastSeen: number;
}

const sessionStore = new Map<string, SessionDeltaState>();

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
    console.log(`[NarrativeDelta] TTL cleanup: removed ${removed} expired session(s). Active: ${sessionStore.size}`);
  }
}

const cleanupTimer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
if (cleanupTimer.unref) cleanupTimer.unref();

function getOrCreateSession(sessionId: string): SessionDeltaState {
  let state = sessionStore.get(sessionId);
  if (!state) {
    state = { topicsEncountered: new Map(), riskSignalsActive: new Set(), surfacedSignals: new Set(), lastSeen: Date.now() };
    sessionStore.set(sessionId, state);
  }
  state.lastSeen = Date.now();
  return state;
}

function isMaterialSignal(item: FeedItem): boolean {
  if (MATERIAL_PIPELINES.includes(item.pipeline)) return true;
  if (MATERIAL_SEVERITIES.includes(item.severity)) return true;
  if (STRUCTURAL_SIGNAL_TYPES.includes(item.feed_type)) return true;
  return false;
}

function extractTopicKey(item: FeedItem): string {
  const titleNorm = item.title
    .toLowerCase()
    .replace(/^sentiment:\s*/i, '')
    .replace(/^compliance:\s*/i, '')
    .replace(/^correlation:\s*/i, '')
    .trim();
  return `${item.pipeline}:${titleNorm}`;
}

function extractKeywords(body: string): string[] {
  const match = body.match(/Keywords?:\s*(.+)/i);
  if (!match) return [];
  return match[1].split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
}

function generateDeltaText(item: FeedItem, priority: DeltaPriority, state: SessionDeltaState, topicKey: string): string {
  const keywords = extractKeywords(item.body);
  const topicRecord = state.topicsEncountered.get(topicKey);

  if (priority === 'P0') {
    const keywordStr = keywords.slice(0, 2).join(', ');
    return `Compliance signal detected${keywordStr ? ` — language flagged: ${keywordStr}` : ''}.`;
  }

  if (priority === 'P1') {
    if (item.pipeline === 'correlation') {
      return `Sentiment has weakened across recent responses relative to session opening.`;
    }
    const keywordStr = keywords.slice(0, 3).join(', ');
    return `Communication tone has shifted from session opening${keywordStr ? ` — language now centred on: ${keywordStr}` : ''}.`;
  }

  if (priority === 'P2') {
    if (item.pipeline === 'correlation') {
      return `Pattern emerging in session not previously observed — communication dynamic shifting.`;
    }
    if (item.pipeline === 'compliance') {
      return `Compliance-relevant topic area introduced into session.`;
    }
    const keywordStr = keywords.slice(0, 3).join(', ');
    return `Material topic area entering session${keywordStr ? `: ${keywordStr}` : ''}.`;
  }

  if (priority === 'P3') {
    const keywordStr = keywords.slice(0, 3).join(', ');
    const count = topicRecord?.count ?? SUSTAINED_PRESSURE_THRESHOLD;
    return `Sustained focus on ${keywordStr || 'this topic area'} across ${count} signals — attention pattern unresolved.`;
  }

  return `Communication deviation detected relative to session baseline.`;
}

function scorePriority(item: FeedItem, state: SessionDeltaState, topicKey: string): { priority: DeltaPriority; suppressionReason: string | null } {
  const topicRecord = state.topicsEncountered.get(topicKey);
  const isFirstOccurrence = !topicRecord;
  const isMaterial = isMaterialSignal(item);

  if (item.pipeline === 'compliance' && MATERIAL_SEVERITIES.includes(item.severity)) {
    return { priority: 'P0', suppressionReason: null };
  }

  if (item.severity === 'critical') {
    return { priority: 'P0', suppressionReason: null };
  }

  if (item.pipeline === 'correlation') {
    const titleLower = item.title.toLowerCase();
    const isDeterioration =
      titleLower.includes('deterioration') ||
      titleLower.includes('pattern') ||
      titleLower.includes('drop') ||
      titleLower.includes('anomaly') ||
      titleLower.includes('escalation');
    if (isDeterioration) {
      const signalKey = topicKey + ':' + item.pipeline + ':deterioration';
      if (state.surfacedSignals.has(signalKey)) {
        console.log(`[NarrativeDelta] SUPPRESSED_DUPLICATE_PATTERN feedItemId=${item.id} key=${signalKey}`);
        return { priority: 'SUPPRESSED', suppressionReason: 'duplicate_pattern' };
      }
      state.surfacedSignals.add(signalKey);
      state.riskSignalsActive.add(topicKey);
      return { priority: 'P1', suppressionReason: null };
    }
  }

  if (item.severity === 'high') {
    return { priority: 'P1', suppressionReason: null };
  }

  if (state.riskSignalsActive.has(topicKey) && !isFirstOccurrence) {
    console.log(`[NarrativeDelta] STATE_RESOLUTION feedItemId=${item.id} topic=${topicKey} — risk signal tracking resolved`);
    state.riskSignalsActive.delete(topicKey);
    return { priority: 'SUPPRESSED', suppressionReason: 'state_resolution' };
  }

  if (isFirstOccurrence && isMaterial) {
    return { priority: 'P2', suppressionReason: null };
  }

  if (topicRecord && topicRecord.count >= SUSTAINED_PRESSURE_THRESHOLD && !topicRecord.resolved && (topicRecord.hasMaterialSignal || MATERIAL_SEVERITIES.includes(item.severity))) {
    return { priority: 'P3', suppressionReason: null };
  }

  const suppressionReason = isFirstOccurrence ? 'non_material_first_occurrence' : 'baseline_confirmation';
  return { priority: 'SUPPRESSED', suppressionReason };
}

export function evaluateNarrativeDelta(item: FeedItem): NarrativeDelta {
  const state = getOrCreateSession(item.session_id);
  const topicKey = extractTopicKey(item);

  const { priority, suppressionReason } = scorePriority(item, state, topicKey);

  const now = Date.now();
  const existing = state.topicsEncountered.get(topicKey);
  if (existing) {
    existing.count++;
    existing.lastSeenAt = now;
    if (MATERIAL_SEVERITIES.includes(item.severity)) existing.hasMaterialSignal = true;
    existing.severityHistory.push(item.severity);
  } else {
    state.topicsEncountered.set(topicKey, {
      count: 1,
      firstSeenAt: now,
      lastSeenAt: now,
      resolved: false,
      hasMaterialSignal: isMaterialSignal(item),
      severityHistory: [item.severity],
    });
  }

  const deltaText = priority !== 'SUPPRESSED' ? generateDeltaText(item, priority, state, topicKey) : null;
  const anchor = priority !== 'SUPPRESSED' ? `session_baseline:${item.session_id}` : null;

  const result: NarrativeDelta = {
    feedItemId: item.id,
    sessionId: item.session_id,
    priority,
    deltaText,
    anchor,
    suppressed: priority === 'SUPPRESSED',
    suppressionReason,
  };

  if (priority === 'SUPPRESSED') {
    console.log(`[NarrativeDelta] SUPPRESSED feedItemId=${item.id} reason=${suppressionReason} topic=${topicKey}`);
  } else {
    console.log(`[NarrativeDelta] ${priority} feedItemId=${item.id} topic=${topicKey} delta="${deltaText}"`);
  }

  return result;
}

export function evaluateSessionDeltas(items: FeedItem[]): NarrativeDelta[] {
  const sorted = [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const results: NarrativeDelta[] = sorted.map(evaluateNarrativeDelta);
  const surfaced = results.filter(r => !r.suppressed);
  const suppressed = results.filter(r => r.suppressed);

  console.log(`[NarrativeDelta] Session summary — ${sorted[0]?.session_id ?? 'unknown'}: ${sorted.length} items processed · ${surfaced.length} surfaced · ${suppressed.length} suppressed`);

  if (surfaced.length > 0) {
    console.log(`[NarrativeDelta] Surfaced deltas:`);
    surfaced.forEach(d => {
      console.log(`  [${d.priority}] feedItemId=${d.feedItemId} — "${d.deltaText}"`);
    });
  }

  return results;
}
