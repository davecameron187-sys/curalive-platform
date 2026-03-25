// @ts-nocheck
/**
 * Alert Deduplication & Caching Service for AI-AM
 * Prevents duplicate alerts within a time window and caches violation data
 */

interface CachedViolation {
  hash: string;
  violationId: number;
  timestamp: number;
  eventId: string;
}

// In-memory cache for recent violations (prevents duplicates)
// Structure: eventId -> Set of violation hashes
const violationCache = new Map<string, Map<string, CachedViolation>>();

// Time window for deduplication (milliseconds)
const DEDUP_WINDOW_MS = 30000; // 30 seconds

// Maximum cache size per event (prevent memory bloat)
const MAX_CACHE_SIZE = 1000;

/**
 * Generate a hash for a violation to detect duplicates
 * Hashes the speaker, violation type, and transcript excerpt
 */
export function generateViolationHash(
  speakerName: string | undefined,
  violationType: string,
  transcriptExcerpt: string
): string {
  const key = `${speakerName || "unknown"}:${violationType}:${transcriptExcerpt.substring(0, 100)}`;
  // Simple hash function (in production, use crypto.subtle.digest)
  return Buffer.from(key).toString("base64").substring(0, 32);
}

/**
 * Check if a violation is a duplicate (within dedup window)
 */
export function isDuplicate(
  eventId: string,
  speakerName: string | undefined,
  violationType: string,
  transcriptExcerpt: string
): boolean {
  const hash = generateViolationHash(speakerName, violationType, transcriptExcerpt);
  const now = Date.now();

  if (!violationCache.has(eventId)) {
    return false;
  }

  const eventCache = violationCache.get(eventId)!;
  const cached = eventCache.get(hash);

  if (!cached) {
    return false;
  }

  // Check if within dedup window
  if (now - cached.timestamp < DEDUP_WINDOW_MS) {
    return true; // Duplicate detected
  }

  // Outside dedup window, remove from cache
  eventCache.delete(hash);
  return false;
}

/**
 * Cache a violation to prevent duplicates
 */
export function cacheViolation(
  eventId: string,
  violationId: number,
  speakerName: string | undefined,
  violationType: string,
  transcriptExcerpt: string
): void {
  const hash = generateViolationHash(speakerName, violationType, transcriptExcerpt);
  const now = Date.now();

  if (!violationCache.has(eventId)) {
    violationCache.set(eventId, new Map());
  }

  const eventCache = violationCache.get(eventId)!;

  // Enforce max cache size (FIFO eviction)
  if (eventCache.size >= MAX_CACHE_SIZE) {
    const firstKey = eventCache.keys().next().value;
    eventCache.delete(firstKey);
  }

  eventCache.set(hash, {
    hash,
    violationId,
    timestamp: now,
    eventId,
  });
}

/**
 * Clean up expired entries from cache (call periodically)
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();

  for (const [eventId, eventCache] of violationCache.entries()) {
    for (const [hash, cached] of eventCache.entries()) {
      if (now - cached.timestamp > DEDUP_WINDOW_MS * 2) {
        eventCache.delete(hash);
      }
    }

    // Remove empty event caches
    if (eventCache.size === 0) {
      violationCache.delete(eventId);
    }
  }
}

/**
 * Clear cache for a specific event (e.g., when event ends)
 */
export function clearEventCache(eventId: string): void {
  violationCache.delete(eventId);
}

/**
 * Clear the entire violation cache (used in tests)
 */
export function clearAllCache(): void {
  violationCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  totalEvents: number;
  totalCachedViolations: number;
  eventCacheSizes: Record<string, number>;
} {
  const eventCacheSizes: Record<string, number> = {};
  let totalCachedViolations = 0;

  for (const [eventId, eventCache] of violationCache.entries()) {
    eventCacheSizes[eventId] = eventCache.size;
    totalCachedViolations += eventCache.size;
  }

  return {
    totalEvents: violationCache.size,
    totalCachedViolations,
    eventCacheSizes,
  };
}

/**
 * Start periodic cleanup job
 */
export function startCleanupJob(intervalMs = 60000): NodeJS.Timer {
  return setInterval(() => {
    cleanupExpiredCache();
    const stats = getCacheStats();
    console.log(`[AI-AM Dedup] Cache cleanup: ${stats.totalCachedViolations} violations cached across ${stats.totalEvents} events`);
  }, intervalMs);
}
