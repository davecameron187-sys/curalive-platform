/**
 * Audit Logging Middleware for Chorus.AI
 * Captures all operator actions for compliance and security audit trail
 * 
 * Logged Actions:
 * - Question approval/rejection/hold
 * - Speaker assignment
 * - Moderation decisions
 * - Data exports
 * - Configuration changes
 * - User access and authentication
 */

import { Request, Response, NextFunction } from "express";

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export enum AuditAction {
  // Question moderation
  QUESTION_APPROVED = "QUESTION_APPROVED",
  QUESTION_REJECTED = "QUESTION_REJECTED",
  QUESTION_HELD = "QUESTION_HELD",
  QUESTION_RELEASED = "QUESTION_RELEASED",
  QUESTION_ASSIGNED = "QUESTION_ASSIGNED",
  QUESTION_REASSIGNED = "QUESTION_REASSIGNED",
  
  // Answer management
  ANSWER_SUBMITTED = "ANSWER_SUBMITTED",
  ANSWER_APPROVED = "ANSWER_APPROVED",
  ANSWER_REJECTED = "ANSWER_REJECTED",
  ANSWER_COMPLIANCE_APPROVED = "ANSWER_COMPLIANCE_APPROVED",
  
  // Compliance
  COMPLIANCE_FLAG_CREATED = "COMPLIANCE_FLAG_CREATED",
  COMPLIANCE_FLAG_RESOLVED = "COMPLIANCE_FLAG_RESOLVED",
  COMPLIANCE_RULE_CREATED = "COMPLIANCE_RULE_CREATED",
  COMPLIANCE_RULE_UPDATED = "COMPLIANCE_RULE_UPDATED",
  COMPLIANCE_RULE_DELETED = "COMPLIANCE_RULE_DELETED",
  
  // Data access
  TRANSCRIPT_EXPORTED = "TRANSCRIPT_EXPORTED",
  ANALYTICS_EXPORTED = "ANALYTICS_EXPORTED",
  RECORDING_ACCESSED = "RECORDING_ACCESSED",
  REPORT_GENERATED = "REPORT_GENERATED",
  
  // Session management
  SESSION_STARTED = "SESSION_STARTED",
  SESSION_ENDED = "SESSION_ENDED",
  SESSION_PAUSED = "SESSION_PAUSED",
  SESSION_RESUMED = "SESSION_RESUMED",
  
  // User management
  USER_LOGGED_IN = "USER_LOGGED_IN",
  USER_LOGGED_OUT = "USER_LOGGED_OUT",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_CREATED = "USER_CREATED",
  USER_DELETED = "USER_DELETED",
  
  // Configuration
  EVENT_CREATED = "EVENT_CREATED",
  EVENT_UPDATED = "EVENT_UPDATED",
  EVENT_DELETED = "EVENT_DELETED",
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
  
  // System
  SYSTEM_ERROR = "SYSTEM_ERROR",
  SECURITY_ALERT = "SECURITY_ALERT",
}

export interface AuditLogEntry {
  userId: number;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure";
  errorMessage?: string;
  timestamp: Date;
}

// ============================================================================
// AUDIT LOGGER SERVICE
// ============================================================================

export class AuditLogger {
  // In-memory audit log store (for development; use database in production)
  private static logs: AuditLogEntry[] = [];
  private static readonly MAX_LOGS = 10000;

  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Add to in-memory store
      this.logs.push(entry);
      
      // Maintain max log size
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }
      
      // Log to console in development
      console.log(`[Audit] ${entry.action} - User ${entry.userId} - ${entry.resourceType}/${entry.resourceId}`);
      
      // TODO: Persist to database for production
    } catch (error) {
      console.error("[Audit Logger] Failed to log audit event:", error);
      // Don't throw - audit logging should not break application flow
    }
  }

  /**
   * Log question moderation action
   */
  static async logQuestionModeration(
    userId: number,
    questionId: number,
    action: AuditAction,
    metadata: Record<string, any>,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "question",
      resourceId: questionId.toString(),
      metadata,
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status: "success",
      timestamp: new Date(),
    });
  }

  /**
   * Log answer submission
   */
  static async logAnswerSubmission(
    userId: number,
    answerId: number,
    questionId: number,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.ANSWER_SUBMITTED,
      resourceType: "answer",
      resourceId: answerId.toString(),
      metadata: { questionId },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status: "success",
      timestamp: new Date(),
    });
  }

  /**
   * Log compliance decision
   */
  static async logComplianceDecision(
    userId: number,
    flagId: number,
    action: AuditAction,
    decision: string,
    reasoning: string,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "compliance_flag",
      resourceId: flagId.toString(),
      metadata: { decision, reasoning },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status: "success",
      timestamp: new Date(),
    });
  }

  /**
   * Log data export
   */
  static async logDataExport(
    userId: number,
    exportType: string,
    eventId: string,
    recordCount: number,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      action: exportType === "transcript" ? AuditAction.TRANSCRIPT_EXPORTED : AuditAction.ANALYTICS_EXPORTED,
      resourceType: "export",
      resourceId: eventId,
      metadata: { exportType, recordCount },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status: "success",
      timestamp: new Date(),
    });
  }

  /**
   * Log user authentication
   */
  static async logAuthentication(
    userId: number,
    action: AuditAction,
    req: Request,
    status: "success" | "failure" = "success",
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "user",
      resourceId: userId.toString(),
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status,
      errorMessage,
      timestamp: new Date(),
    });
  }

  /**
   * Log configuration change
   */
  static async logConfigurationChange(
    userId: number,
    resourceType: string,
    resourceId: string,
    changes: Record<string, any>,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.SETTINGS_CHANGED,
      resourceType,
      resourceId,
      changes,
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status: "success",
      timestamp: new Date(),
    });
  }

  /**
   * Log security alert
   */
  static async logSecurityAlert(
    userId: number | null,
    alertType: string,
    message: string,
    req: Request
  ): Promise<void> {
    await this.log({
      userId: userId || 0,
      action: AuditAction.SECURITY_ALERT,
      resourceType: "security",
      resourceId: alertType,
      metadata: { message },
      ipAddress: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
      status: "failure",
      errorMessage: message,
      timestamp: new Date(),
    });
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(userId: number, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      return this.logs
        .filter(log => log.userId === userId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("[Audit Logger] Failed to retrieve user audit logs:", error);
      return [];
    }
  }

  /**
   * Get audit logs for a resource
   */
  static async getResourceAuditLogs(resourceType: string, resourceId: string): Promise<AuditLogEntry[]> {
    try {
      return this.logs
        .filter(log => log.resourceType === resourceType && log.resourceId === resourceId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error("[Audit Logger] Failed to retrieve resource audit logs:", error);
      return [];
    }
  }

  /**
   * Get audit logs for a time range
   */
  static async getAuditLogsByTimeRange(startDate: Date, endDate: Date): Promise<AuditLogEntry[]> {
    try {
      return this.logs
        .filter(log => log.timestamp >= startDate && log.timestamp <= endDate)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error("[Audit Logger] Failed to retrieve time-range audit logs:", error);
      return [];
    }
  }

  /**
   * Get all audit logs
   */
  static async getAllAuditLogs(limit: number = 1000): Promise<AuditLogEntry[]> {
    return this.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get audit log statistics
   */
  static async getAuditStatistics(): Promise<{
    totalLogs: number;
    actionCounts: Record<string, number>;
    userCounts: Record<number, number>;
  }> {
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<number, number> = {};

    for (const log of this.logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    }

    return {
      totalLogs: this.logs.length,
      actionCounts,
      userCounts,
    };
  }
}

// ============================================================================
// AUDIT LOGGING MIDDLEWARE
// ============================================================================

/**
 * Middleware to capture request/response for audit logging
 */
export const auditLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data: any) {
    // Attach audit context to request
    (req as any).auditContext = {
      startTime: Date.now(),
      statusCode: res.statusCode,
      responseSize: data?.length || 0,
    };

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Log moderation action
 */
export const logModerationAction = async (
  req: Request,
  action: AuditAction,
  questionId: number,
  metadata: Record<string, any>
) => {
  const userId = (req as any).user?.id;
  if (userId) {
    await AuditLogger.logQuestionModeration(userId, questionId, action, metadata, req);
  }
};

/**
 * Log data export
 */
export const logDataExportAction = async (
  req: Request,
  exportType: string,
  eventId: string,
  recordCount: number
) => {
  const userId = (req as any).user?.id;
  if (userId) {
    await AuditLogger.logDataExport(userId, exportType, eventId, recordCount, req);
  }
};

/**
 * Log security violation
 */
export const logSecurityViolation = async (
  req: Request,
  violationType: string,
  message: string
) => {
  const userId = (req as any).user?.id;
  await AuditLogger.logSecurityAlert(userId || null, violationType, message, req);
};

// ============================================================================
// AUDIT LOG RETENTION POLICY
// ============================================================================

/**
 * Clean up old audit logs (retention: 90 days)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // In-memory cleanup
    const beforeCount = (AuditLogger as any).logs.length;
    (AuditLogger as any).logs = (AuditLogger as any).logs.filter((log: AuditLogEntry) => log.timestamp > cutoffDate);
    const afterCount = (AuditLogger as any).logs.length;

    console.log(`[Audit Logger] Cleaned up ${beforeCount - afterCount} audit logs older than ${retentionDays} days`);
  } catch (error) {
    console.error("[Audit Logger] Failed to cleanup old audit logs:", error);
  }
}

/**
 * Schedule periodic cleanup
 */
export function scheduleAuditLogCleanup(intervalHours: number = 24): void {
  setInterval(() => {
    cleanupOldAuditLogs();
  }, intervalHours * 60 * 60 * 1000);
}

export default AuditLogger;
