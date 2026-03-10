import { db } from "@/server/db";
import { complianceAuditLog, complianceViolations } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export interface AuditLogEntry {
  id: string;
  eventId: string;
  action: "violation_detected" | "violation_acknowledged" | "violation_muted" | "violation_unmuted" | "alert_sent" | "rule_updated" | "preferences_changed";
  actionBy: string; // operator ID or system
  actionByRole: "operator" | "admin" | "system";
  targetViolationId?: string;
  targetSpeaker?: string;
  details: Record<string, any>;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  hash?: string; // for immutability verification
  previousHash?: string; // chain of custody
}

class ComplianceAuditTrail {
  /**
   * Log an action to the immutable audit trail
   */
  async logAction(entry: Omit<AuditLogEntry, "id" | "timestamp" | "hash" | "previousHash">): Promise<AuditLogEntry> {
    const id = crypto.randomUUID();
    const timestamp = Date.now();

    // Get previous hash for chain of custody
    const lastEntry = await db
      .select()
      .from(complianceAuditLog)
      .orderBy(desc(complianceAuditLog.timestamp))
      .limit(1);

    const previousHash = lastEntry[0]?.hash;

    // Create immutable hash
    const hashInput = JSON.stringify({
      id,
      eventId: entry.eventId,
      action: entry.action,
      actionBy: entry.actionBy,
      timestamp,
      details: entry.details,
    });

    const hash = crypto.createHash("sha256").update(hashInput).digest("hex");

    const auditEntry: AuditLogEntry = {
      id,
      timestamp,
      hash,
      previousHash,
      ...entry,
    };

    // Insert into database
    await db.insert(complianceAuditLog).values({
      id,
      eventId: entry.eventId,
      action: entry.action,
      actionBy: entry.actionBy,
      actionByRole: entry.actionByRole,
      targetViolationId: entry.targetViolationId,
      targetSpeaker: entry.targetSpeaker,
      details: JSON.stringify(entry.details),
      timestamp,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      hash,
      previousHash,
    });

    return auditEntry;
  }

  /**
   * Get all audit logs for an event
   */
  async getEventAuditLog(eventId: string, limit = 100, offset = 0) {
    const logs = await db
      .select()
      .from(complianceAuditLog)
      .where(eq(complianceAuditLog.eventId, eventId))
      .orderBy(desc(complianceAuditLog.timestamp))
      .limit(limit)
      .offset(offset);

    return logs.map((log) => ({
      ...log,
      details: JSON.parse(log.details || "{}"),
    }));
  }

  /**
   * Get audit logs for a specific violation
   */
  async getViolationAuditLog(violationId: string) {
    const logs = await db
      .select()
      .from(complianceAuditLog)
      .where(eq(complianceAuditLog.targetViolationId, violationId))
      .orderBy(desc(complianceAuditLog.timestamp));

    return logs.map((log) => ({
      ...log,
      details: JSON.parse(log.details || "{}"),
    }));
  }

  /**
   * Get audit logs by operator
   */
  async getOperatorAuditLog(operatorId: string, eventId?: string) {
    let query = db
      .select()
      .from(complianceAuditLog)
      .where(eq(complianceAuditLog.actionBy, operatorId));

    if (eventId) {
      query = query.where(and(eq(complianceAuditLog.actionBy, operatorId), eq(complianceAuditLog.eventId, eventId)));
    }

    const logs = await query.orderBy(desc(complianceAuditLog.timestamp));

    return logs.map((log) => ({
      ...log,
      details: JSON.parse(log.details || "{}"),
    }));
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(eventId: string, action: AuditLogEntry["action"]) {
    const logs = await db
      .select()
      .from(complianceAuditLog)
      .where(and(eq(complianceAuditLog.eventId, eventId), eq(complianceAuditLog.action, action)))
      .orderBy(desc(complianceAuditLog.timestamp));

    return logs.map((log) => ({
      ...log,
      details: JSON.parse(log.details || "{}"),
    }));
  }

  /**
   * Verify audit trail integrity (chain of custody)
   */
  async verifyAuditTrailIntegrity(eventId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const logs = await db
      .select()
      .from(complianceAuditLog)
      .where(eq(complianceAuditLog.eventId, eventId))
      .orderBy(complianceAuditLog.timestamp);

    const errors: string[] = [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Verify hash
      const hashInput = JSON.stringify({
        id: log.id,
        eventId: log.eventId,
        action: log.action,
        actionBy: log.actionBy,
        timestamp: log.timestamp,
        details: log.details,
      });

      const expectedHash = crypto.createHash("sha256").update(hashInput).digest("hex");

      if (log.hash !== expectedHash) {
        errors.push(`Log ${log.id} hash mismatch at ${new Date(log.timestamp).toISOString()}`);
      }

      // Verify chain of custody
      if (i > 0) {
        const previousLog = logs[i - 1];
        if (log.previousHash !== previousLog.hash) {
          errors.push(`Chain of custody broken between ${previousLog.id} and ${log.id}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate compliance report from audit trail
   */
  async generateComplianceReport(eventId: string) {
    const logs = await this.getEventAuditLog(eventId, 10000);
    const violations = await db
      .select()
      .from(complianceViolations)
      .where(eq(complianceViolations.eventId, eventId));

    const report = {
      eventId,
      generatedAt: new Date().toISOString(),
      totalViolations: violations.length,
      totalActions: logs.length,
      actionBreakdown: {
        violationDetected: logs.filter((l) => l.action === "violation_detected").length,
        violationAcknowledged: logs.filter((l) => l.action === "violation_acknowledged").length,
        violationMuted: logs.filter((l) => l.action === "violation_muted").length,
        alertsSent: logs.filter((l) => l.action === "alert_sent").length,
      },
      operatorActions: {} as Record<string, number>,
      violationTimeline: violations.map((v) => ({
        violationId: v.id,
        type: v.violationType,
        severity: v.severity,
        speaker: v.speaker,
        detectedAt: new Date(v.detectedAt).toISOString(),
        acknowledged: v.acknowledgedAt ? new Date(v.acknowledgedAt).toISOString() : null,
      })),
      auditTrailIntegrity: await this.verifyAuditTrailIntegrity(eventId),
    };

    // Count operator actions
    logs.forEach((log) => {
      if (!report.operatorActions[log.actionBy]) {
        report.operatorActions[log.actionBy] = 0;
      }
      report.operatorActions[log.actionBy]++;
    });

    return report;
  }

  /**
   * Export audit trail as CSV
   */
  async exportAuditTrailAsCSV(eventId: string): Promise<string> {
    const logs = await this.getEventAuditLog(eventId, 10000);

    const headers = [
      "Timestamp",
      "Action",
      "Performed By",
      "Role",
      "Target Violation",
      "Target Speaker",
      "Details",
      "IP Address",
      "Hash",
    ];

    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.action,
      log.actionBy,
      log.actionByRole,
      log.targetViolationId || "",
      log.targetSpeaker || "",
      JSON.stringify(log.details),
      log.ipAddress || "",
      log.hash,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csv;
  }

  /**
   * Export audit trail as JSON
   */
  async exportAuditTrailAsJSON(eventId: string): Promise<string> {
    const logs = await this.getEventAuditLog(eventId, 10000);

    return JSON.stringify(
      {
        eventId,
        exportedAt: new Date().toISOString(),
        totalRecords: logs.length,
        logs: logs.map((log) => ({
          ...log,
          details: JSON.parse(log.details || "{}"),
          timestamp: new Date(log.timestamp).toISOString(),
        })),
      },
      null,
      2
    );
  }

  /**
   * Log violation detection
   */
  async logViolationDetected(
    eventId: string,
    violationId: string,
    speaker: string,
    violationType: string,
    severity: string,
    confidence: number
  ) {
    return this.logAction({
      eventId,
      action: "violation_detected",
      actionBy: "system",
      actionByRole: "system",
      targetViolationId: violationId,
      targetSpeaker: speaker,
      details: {
        violationType,
        severity,
        confidence,
      },
    });
  }

  /**
   * Log violation acknowledgment
   */
  async logViolationAcknowledged(eventId: string, violationId: string, operatorId: string) {
    return this.logAction({
      eventId,
      action: "violation_acknowledged",
      actionBy: operatorId,
      actionByRole: "operator",
      targetViolationId: violationId,
      details: {
        acknowledgedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Log violation muting
   */
  async logViolationMuted(eventId: string, violationId: string, operatorId: string, speaker: string, duration: number) {
    return this.logAction({
      eventId,
      action: "violation_muted",
      actionBy: operatorId,
      actionByRole: "operator",
      targetViolationId: violationId,
      targetSpeaker: speaker,
      details: {
        mutedAt: new Date().toISOString(),
        duration,
        durationUnit: "seconds",
      },
    });
  }

  /**
   * Log alert sent
   */
  async logAlertSent(eventId: string, operatorId: string, channel: "email" | "sms" | "inApp", violationId: string) {
    return this.logAction({
      eventId,
      action: "alert_sent",
      actionBy: "system",
      actionByRole: "system",
      targetViolationId: violationId,
      details: {
        channel,
        sentTo: operatorId,
        sentAt: new Date().toISOString(),
      },
    });
  }
}

export const auditTrail = new ComplianceAuditTrail();
