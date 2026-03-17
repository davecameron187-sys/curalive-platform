import pino from 'pino';
import path from 'path';
import fs from 'fs';

/**
 * Pino Logger Configuration
 * Provides structured logging for production monitoring
 */

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), '.manus-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create separate file streams for different log types
const devServerLogStream = fs.createWriteStream(path.join(logsDir, 'devserver.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
const networkLogStream = fs.createWriteStream(path.join(logsDir, 'networkRequests.log'), { flags: 'a' });

/**
 * Main Logger Instance
 */

export const logger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          node_version: process.version,
        };
      },
    },
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
        },
        remoteAddress: req.socket.remoteAddress,
        remotePort: req.socket.remotePort,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      }),
      err: pino.stdSerializers.err,
    },
  },
  pino.transport({
    targets: [
      // Console output in development
      ...(process.env.NODE_ENV !== 'production'
        ? [
            {
              level: logLevel,
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            },
          ]
        : []),
      // File output for all logs
      {
        level: 'info',
        target: 'pino/file',
        options: { destination: path.join(logsDir, 'app.log') },
      },
      // File output for errors
      {
        level: 'error',
        target: 'pino/file',
        options: { destination: path.join(logsDir, 'error.log') },
      },
    ],
  })
);

/**
 * Specialized Loggers
 */

// HTTP Request Logger
export const httpLogger = pino(
  {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    target: 'pino/file',
    options: { destination: path.join(logsDir, 'networkRequests.log') },
  })
);

// Database Query Logger
export const dbLogger = pino(
  {
    level: process.env.DB_LOG_LEVEL || 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    target: 'pino/file',
    options: { destination: path.join(logsDir, 'database.log') },
  })
);

// Security Logger
export const securityLogger = pino(
  {
    level: 'warn',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    target: 'pino/file',
    options: { destination: path.join(logsDir, 'security.log') },
  })
);

/**
 * Audit Logger for compliance
 */

export const auditLogger = pino(
  {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    target: 'pino/file',
    options: { destination: path.join(logsDir, 'audit.log') },
  })
);

/**
 * Log Rotation Configuration
 * Rotate logs when they exceed 1MB
 */

const rotateLogFile = (filePath: string, maxSize = 1024 * 1024) => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.${timestamp}`;
      fs.renameSync(filePath, backupPath);
      
      // Keep only last 5 backups
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath);
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith(basename))
        .sort()
        .reverse();
      
      if (files.length > 5) {
        files.slice(5).forEach(f => {
          fs.unlinkSync(path.join(dir, f));
        });
      }
    }
  } catch (error) {
    // Ignore errors during rotation
  }
};

// Rotate logs every hour
setInterval(() => {
  rotateLogFile(path.join(logsDir, 'app.log'));
  rotateLogFile(path.join(logsDir, 'error.log'));
  rotateLogFile(path.join(logsDir, 'networkRequests.log'));
  rotateLogFile(path.join(logsDir, 'database.log'));
  rotateLogFile(path.join(logsDir, 'security.log'));
  rotateLogFile(path.join(logsDir, 'audit.log'));
}, 60 * 60 * 1000);

/**
 * Logging Utilities
 */

export const logHttpRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: number
) => {
  httpLogger.info(
    {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    },
    'HTTP Request'
  );
};

export const logDatabaseQuery = (
  query: string,
  duration: number,
  error?: Error
) => {
  if (error) {
    dbLogger.error(
      {
        query,
        duration,
        error: error.message,
      },
      'Database Query Error'
    );
  } else {
    dbLogger.debug(
      {
        query,
        duration,
      },
      'Database Query'
    );
  }
};

export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) => {
  const logFn = severity === 'critical' ? securityLogger.error : securityLogger.warn;
  logFn(
    {
      event,
      severity,
      ...details,
      timestamp: new Date().toISOString(),
    },
    `Security Event: ${event}`
  );
};

export const logAuditEvent = (
  action: string,
  userId: number,
  resource: string,
  changes?: Record<string, any>
) => {
  auditLogger.info(
    {
      action,
      userId,
      resource,
      changes,
      timestamp: new Date().toISOString(),
    },
    `Audit: ${action}`
  );
};

/**
 * Error Logging with Stack Traces
 */

export const logError = (
  error: Error,
  context?: Record<string, any>
) => {
  logger.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    'Error occurred'
  );
};

/**
 * Performance Logging
 */

export const logPerformance = (
  operation: string,
  duration: number,
  threshold = 1000
) => {
  if (duration > threshold) {
    logger.warn(
      {
        operation,
        duration,
        threshold,
      },
      `Slow operation detected: ${operation} took ${duration}ms`
    );
  } else {
    logger.debug(
      {
        operation,
        duration,
      },
      `Operation completed: ${operation}`
    );
  }
};

export default logger;
