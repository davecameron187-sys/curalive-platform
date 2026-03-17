import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Express, Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

/**
 * Rate Limiting Configuration
 */

// General API rate limiter - 100 requests per minute per user
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        method: req.method,
      },
      'Rate limit exceeded'
    );
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Strict rate limiter for login attempts - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        email: req.body?.email,
      },
      'Login rate limit exceeded'
    );
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Moderate rate limiter for file uploads - 10 uploads per 10 minutes
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        userId: req.user?.id,
      },
      'Upload rate limit exceeded'
    );
    res.status(429).json({
      error: 'Too many uploads. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

// Lenient rate limiter for public endpoints - 1000 requests per minute
export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Security Headers Configuration
 */

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://api.manus.im', 'https://*.ably.io'],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Input Validation Middleware
 */

export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'];

  // Only allow JSON content type for API endpoints
  if (req.path.startsWith('/api') && req.method !== 'GET') {
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(
        {
          ip: req.ip,
          path: req.path,
          contentType,
        },
        'Invalid content type'
      );
      return res.status(400).json({
        error: 'Content-Type must be application/json',
      });
    }
  }

  next();
};

/**
 * Request Size Limiting
 */

export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];

    if (contentLength) {
      const maxBytes = parseInt(maxSize) * 1024 * 1024;
      if (parseInt(contentLength) > maxBytes) {
        logger.warn(
          {
            ip: req.ip,
            contentLength: parseInt(contentLength),
            maxBytes,
          },
          'Request size exceeded'
        );
        return res.status(413).json({
          error: `Request body too large. Maximum size: ${maxSize}`,
        });
      }
    }

    next();
  };
};

/**
 * SQL Injection Prevention
 */

export const sanitizeQueryParams = (req: Request, res: Response, next: NextFunction) => {
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'UNION', 'SELECT', '--', ';'];

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    const stringValue = String(value).toUpperCase();
    if (sqlKeywords.some(keyword => stringValue.includes(keyword))) {
      logger.warn(
        {
          ip: req.ip,
          param: key,
          value,
        },
        'Potential SQL injection detected'
      );
      return res.status(400).json({
        error: 'Invalid query parameter',
      });
    }
  }

  next();
};

/**
 * CORS Configuration
 */

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'https://chorusai-mdu4k2ib.manus.space',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS request from unauthorized origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Audit Logging Middleware
 */

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    // Log audit event for sensitive operations
    if (req.method !== 'GET' && req.path.startsWith('/api/trpc')) {
      logger.info(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          userId: (req as any).user?.id,
          ip: req.ip,
        },
        'API request'
      );
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Apply all security middleware to Express app
 */

export const applySecurityMiddleware = (app: Express) => {
  // Security headers
  app.use(securityHeaders);

  // CORS
  app.use(require('cors')(corsConfig));

  // Request size limiting
  app.use(requestSizeLimiter('10mb'));

  // Content type validation
  app.use(validateContentType);

  // SQL injection prevention
  app.use(sanitizeQueryParams);

  // Audit logging
  app.use(auditLogger);

  // Rate limiting - apply to specific routes
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', loginLimiter);
  app.use('/api/upload', uploadLimiter);
  app.use('/api/trpc', apiLimiter);

  logger.info('Security middleware applied');
};

export default {
  apiLimiter,
  loginLimiter,
  uploadLimiter,
  publicLimiter,
  securityHeaders,
  validateContentType,
  requestSizeLimiter,
  sanitizeQueryParams,
  corsConfig,
  auditLogger,
  applySecurityMiddleware,
};
