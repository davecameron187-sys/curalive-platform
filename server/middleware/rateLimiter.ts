import { Request, Response, NextFunction } from "express";
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware for Chorus.AI
 * Protects API endpoints from abuse and ensures fair resource allocation
 * 
 * Strategy:
 * - General API: 1000 requests per minute per IP
 * - Login attempts: 5 attempts per 15 minutes per IP
 * - Data exports: 10 exports per hour per user
 * - WebSocket: 100 messages per minute per connection
 * - Moderation actions: 100 actions per minute per moderator
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for development; use Redis in production)
const store: RateLimitStore = {};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 60000, // 1 minute default
    maxRequests = 100,
    keyGenerator = (req) => req.ip || "unknown",
    handler = (req, res) => {
      res.status(429).json({
        error: "Too many requests, please try again later.",
      });
    },
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset bucket
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    store[key].count++;

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - store[key].count));
    res.setHeader("X-RateLimit-Reset", store[key].resetTime);

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      return handler(req, res);
    }

    next();
  };
}

/**
 * General API rate limiter (1000 req/min)
 */
export const generalApiLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 1000,
  keyGenerator: (req) => req.ip || "unknown",
});

/**
 * Strict API rate limiter (100 req/min)
 */
export const strictApiLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => req.ip || "unknown",
});

/**
 * Login rate limiter (5 attempts per 15 minutes)
 */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => req.ip || "unknown",
});

/**
 * Export rate limiter (10 exports per hour per user)
 */
export const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyGenerator: (req) => (req as any).user?.id ? `user:${(req as any).user.id}` : req.ip || "unknown",
});

/**
 * Question submission rate limiter (20 questions per hour per user)
 */
export const questionSubmissionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  keyGenerator: (req) => (req as any).user?.id ? `user:${(req as any).user.id}` : (req as any).body?.email || req.ip || "unknown",
});

/**
 * Moderation action rate limiter (100 actions per minute per moderator)
 */
export const moderationActionLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => `moderator:${(req as any).user?.id}`,
});

/**
 * WebSocket rate limiter (100 messages per minute)
 */
export const wsLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

/**
 * File upload rate limiter (50 uploads per hour per user)
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50,
  keyGenerator: (req) => `user:${(req as any).user?.id}`,
});

/**
 * API Key rate limiter (10000 requests per hour per API key)
 */
export const apiKeyLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10000,
  keyGenerator: (req) => `apikey:${req.headers['x-api-key']}`,
});

/**
 * Get remaining rate limit for a user/IP
 */
export async function getRateLimitStatus(key: string): Promise<{
  remaining: number;
  resetTime: number;
}> {
  if (store[key]) {
    return {
      remaining: Math.max(0, store[key].count),
      resetTime: store[key].resetTime,
    };
  }
  return { remaining: 0, resetTime: 0 };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): boolean {
  if (store[key]) {
    delete store[key];
    return true;
  }
  return false;
}

/**
 * Whitelist IP addresses from rate limiting
 */
export const whitelistIps = (whitelist: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (whitelist.includes(req.ip || '')) {
      (req as any).rateLimit = { current: 0, limit: Infinity };
    }
    next();
  };
};

/**
 * Monitor rate limit violations
 */
export function setupRateLimitMonitoring() {
  setInterval(() => {
    const violations = Object.entries(store)
      .filter(([_, data]) => data.count > 50)
      .map(([key, _]) => key);
    
    if (violations.length > 10) {
      console.warn('[Rate Limiter] High number of rate limit violations detected:', violations.length);
      // TODO: Send alert to monitoring system
    }
  }, 60000); // Check every minute
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000); // Clean every minute

export default {
  createRateLimiter,
  generalApiLimiter,
  strictApiLimiter,
  loginLimiter,
  exportLimiter,
  questionSubmissionLimiter,
  moderationActionLimiter,
  wsLimiter,
  uploadLimiter,
  apiKeyLimiter,
  getRateLimitStatus,
  resetRateLimit,
  whitelistIps,
  setupRateLimitMonitoring,
};
