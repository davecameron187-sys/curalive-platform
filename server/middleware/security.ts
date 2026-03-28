/**
 * Security Hardening Middleware
 * Implements CORS, CSP, HSTS, and other security headers
 */

import { Request, Response, NextFunction } from "express";

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: process.env.NODE_ENV === "production" 
    ? ["https://chorusai-mdu4k2ib.manus.space", "https://curalive-mdu4k2ib.manus.space"]
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';"
  );

  // HTTP Strict Transport Security
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );

  next();
}

/**
 * Input validation middleware
 */
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize request body
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  next();
}

/**
 * Recursively sanitize object to prevent injection attacks
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === "string") {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/[<>\"']/g, "")
          .substring(0, 10000); // Limit string length
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
}

/**
 * Request timeout middleware
 */
export function requestTimeout(timeout: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
    }, timeout);

    res.on("finish", () => clearTimeout(timeoutId));
    res.on("close", () => clearTimeout(timeoutId));

    next();
  };
}

/**
 * SQL injection prevention
 */
export function preventSQLInjection(req: Request, res: Response, next: NextFunction) {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi;

  const checkString = (str: string): boolean => {
    return sqlPattern.test(str);
  };

  // Check request body
  if (req.body && typeof req.body === "object") {
    for (const key in req.body) {
      if (typeof req.body[key] === "string" && checkString(req.body[key])) {
        return res.status(400).json({ error: "Invalid input detected" });
      }
    }
  }

  // Check query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === "string" && checkString(req.query[key])) {
      return res.status(400).json({ error: "Invalid input detected" });
    }
  }

  next();
}

/**
 * Rate limiting for authentication endpoints
 */
export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  // Store attempt counts in memory (use Redis in production)
  const store: { [key: string]: { count: number; resetTime: number } } = {};

  if (!store[key] || store[key].resetTime < now) {
    store[key] = { count: 0, resetTime: now + windowMs };
  }

  store[key].count++;

  if (store[key].count > maxAttempts) {
    return res.status(429).json({
      error: "Too many authentication attempts. Please try again later.",
    });
  }

  next();
}

/**
 * HTTPS redirect middleware
 */
export function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production" && req.header("x-forwarded-proto") !== "https") {
    return res.redirect(301, `https://${req.header("host")}${req.url}`);
  }

  next();
}

export default {
  corsConfig,
  securityHeaders,
  validateInput,
  requestTimeout,
  preventSQLInjection,
  authRateLimit,
  httpsRedirect,
};
