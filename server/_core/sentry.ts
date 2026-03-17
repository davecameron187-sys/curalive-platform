import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Sentry Configuration for Production Monitoring
 * Tracks errors, performance, and provides alerting
 */

export const initSentry = (app: Express) => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.APP_VERSION || '1.0.0',
    // Attach stack traces to all messages
    attachStacktrace: true,
    // Max breadcrumbs to keep
    maxBreadcrumbs: 50,
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'chrome-extension://',
      'moz-extension://',
      // Network errors
      'NetworkError',
      'Network request failed',
      // User cancelled
      'AbortError',
    ],
  });

  // Request handler - must be first
  app.use(Sentry.Handlers.requestHandler());

  // Performance monitoring middleware
  app.use(Sentry.Handlers.tracingHandler());

  logger.info('Sentry initialized');
};

/**
 * Error Handler Middleware
 */

export const sentryErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Capture exception in Sentry
  Sentry.captureException(err, {
    contexts: {
      http: {
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
      },
    },
    user: {
      id: (req as any).user?.id,
      email: (req as any).user?.email,
    },
  });

  logger.error(err, 'Unhandled error');

  // Send error response
  res.status(500).json({
    error: 'Internal server error',
    eventId: Sentry.lastEventId(),
  });
};

/**
 * Sentry Error Tracking Utilities
 */

export const captureException = (
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) => {
  Sentry.captureException(error, {
    level,
    contexts: {
      custom: context,
    },
  });
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
};

/**
 * Performance Monitoring
 */

export const startTransaction = (
  name: string,
  op: string = 'http.request'
) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

export const capturePerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  const transaction = Sentry.startTransaction({
    name: operation,
    op: 'custom',
  });

  transaction.setData('duration', duration);
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      transaction.setData(key, value);
    });
  }

  // Alert if operation is slow
  if (duration > 1000) {
    Sentry.captureMessage(`Slow operation: ${operation} took ${duration}ms`, 'warning');
  }

  transaction.finish();
};

/**
 * User Context
 */

export const setUserContext = (userId: number, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId.toString(),
    email,
    username,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Breadcrumb Tracking
 */

export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Alert Thresholds and Rules
 */

export interface AlertRule {
  name: string;
  condition: (metric: number) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

const alertRules: AlertRule[] = [
  {
    name: 'High Error Rate',
    condition: (rate) => rate > 0.05, // > 5%
    severity: 'critical',
    message: 'Error rate exceeds 5%',
  },
  {
    name: 'Slow API Response',
    condition: (duration) => duration > 5000, // > 5 seconds
    severity: 'high',
    message: 'API response time exceeds 5 seconds',
  },
  {
    name: 'Database Slow Query',
    condition: (duration) => duration > 1000, // > 1 second
    severity: 'medium',
    message: 'Database query exceeds 1 second',
  },
  {
    name: 'High Memory Usage',
    condition: (usage) => usage > 0.9, // > 90%
    severity: 'high',
    message: 'Memory usage exceeds 90%',
  },
  {
    name: 'High CPU Usage',
    condition: (usage) => usage > 0.9, // > 90%
    severity: 'high',
    message: 'CPU usage exceeds 90%',
  },
];

export const checkAlertRules = (metric: number, ruleName: string) => {
  const rule = alertRules.find(r => r.name === ruleName);

  if (rule && rule.condition(metric)) {
    Sentry.captureMessage(rule.message, rule.severity as Sentry.SeverityLevel);
    logger.warn(
      {
        rule: rule.name,
        severity: rule.severity,
        metric,
      },
      rule.message
    );
  }
};

/**
 * Monitoring Metrics
 */

export interface MonitoringMetrics {
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeUsers: number;
  requestsPerSecond: number;
  databaseConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export const reportMetrics = (metrics: Partial<MonitoringMetrics>) => {
  Sentry.captureMessage('System Metrics', 'info', {
    contexts: {
      metrics,
    },
  });

  // Check alert rules for each metric
  if (metrics.errorRate) checkAlertRules(metrics.errorRate, 'High Error Rate');
  if (metrics.avgResponseTime) checkAlertRules(metrics.avgResponseTime, 'Slow API Response');
  if (metrics.memoryUsage) checkAlertRules(metrics.memoryUsage, 'High Memory Usage');
  if (metrics.cpuUsage) checkAlertRules(metrics.cpuUsage, 'High CPU Usage');
};

/**
 * Sentry Dashboard Configuration
 */

export const getSentryDashboardConfig = () => {
  return {
    organization: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    alerts: {
      enabled: true,
      channels: ['slack', 'email', 'pagerduty'],
      rules: alertRules,
    },
    metrics: {
      enabled: true,
      interval: 60000, // 1 minute
    },
  };
};

export default {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  startTransaction,
  capturePerformance,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  checkAlertRules,
  reportMetrics,
  getSentryDashboardConfig,
};
