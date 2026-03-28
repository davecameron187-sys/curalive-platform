import { Request, Response, NextFunction } from "express";

/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
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
 * Public API rate limiter (100 req/min)
 */
export const publicApiLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => req.ip || "unknown",
});

/**
 * Authenticated API rate limiter (1000 req/min)
 */
export const authenticatedApiLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 1000,
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

/**
 * Strict rate limiter for auth endpoints (10 req/min)
 */
export const authLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 10,
  keyGenerator: (req) => req.ip || "unknown",
});

/**
 * WebSocket rate limiter (50 messages/min)
 */
export const wsLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 50,
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

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
  publicApiLimiter,
  authenticatedApiLimiter,
  authLimiter,
  wsLimiter,
};
