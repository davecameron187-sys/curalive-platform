/**
 * Caching Layer
 * Implements in-memory caching with TTL for frequently accessed data
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(config: CacheConfig = {}) {
    this.ttl = config.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = config.maxSize || 1000;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict oldest entry if cache is full
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.ttl),
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Get or compute value
   */
  async getOrCompute<R>(
    key: string,
    compute: () => Promise<R>,
    ttl?: number
  ): Promise<R> {
    const cached = this.get(key) as R | null;

    if (cached !== null) {
      return cached;
    }

    const value = await compute();
    this.set(key, value as unknown as T, ttl);
    return value;
  }
}

/**
 * Create cache instances for different data types
 */

// Speaker profiles cache (10 minute TTL)
export const speakerCache = new Cache<{
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  email: string;
  image_url: string;
  total_events: number;
  average_sentiment: number;
  engagement_rate: number;
}>({
  ttl: 10 * 60 * 1000,
  maxSize: 500,
});

// Event analytics cache (5 minute TTL)
export const analyticsCache = new Cache<{
  eventId: string;
  totalAttendees: number;
  totalQuestions: number;
  averageSentiment: number;
  topSpeaker: string;
}>({
  ttl: 5 * 60 * 1000,
  maxSize: 500,
});

// Session state cache (1 minute TTL)
export const sessionCache = new Cache<{
  id: string;
  eventId: string;
  status: string;
  elapsedMs: number;
  createdAt: number;
}>({
  ttl: 1 * 60 * 1000,
  maxSize: 1000,
});

// Questions cache (2 minute TTL)
export const questionsCache = new Cache<{
  id: string;
  text: string;
  status: string;
  sentiment: number;
  complianceRisk: number;
}>({
  ttl: 2 * 60 * 1000,
  maxSize: 5000,
});

// Event list cache (15 minute TTL)
export const eventsCache = new Cache<{
  id: string;
  title: string;
  status: string;
  startTime: number;
}>({
  ttl: 15 * 60 * 1000,
  maxSize: 100,
});

/**
 * Cache invalidation helpers
 */

export function invalidateSpeakerCache(speakerId: string) {
  speakerCache.delete(`speaker:${speakerId}`);
  eventsCache.clear(); // Invalidate events list since it includes speakers
}

export function invalidateAnalyticsCache(eventId: string) {
  analyticsCache.delete(`analytics:${eventId}`);
}

export function invalidateSessionCache(sessionId: string) {
  sessionCache.delete(`session:${sessionId}`);
}

export function invalidateQuestionsCache(sessionId: string) {
  questionsCache.delete(`questions:${sessionId}`);
}

export function invalidateEventsCache() {
  eventsCache.clear();
}

/**
 * Cache statistics
 */
export function getCacheStats() {
  return {
    speakers: speakerCache.size(),
    analytics: analyticsCache.size(),
    sessions: sessionCache.size(),
    questions: questionsCache.size(),
    events: eventsCache.size(),
    total: speakerCache.size() + analyticsCache.size() + sessionCache.size() + questionsCache.size() + eventsCache.size(),
  };
}

export default {
  speakerCache,
  analyticsCache,
  sessionCache,
  questionsCache,
  eventsCache,
  invalidateSpeakerCache,
  invalidateAnalyticsCache,
  invalidateSessionCache,
  invalidateQuestionsCache,
  invalidateEventsCache,
  getCacheStats,
};
