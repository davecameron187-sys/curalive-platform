/**
 * Audit Log Retention Policies Service
 * Configurable retention rules with automated cleanup
 */
import { CronJob } from "cron";
import { db } from "@/server/db";

export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  retentionDays: number;
  logType: "all" | "alerts" | "escalations" | "webhooks" | "correlations";
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionSchedule {
  id: string;
  policyId: string;
  cronExpression: string;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
}

export interface CleanupResult {
  policyId: string;
  logsDeleted: number;
  deletedBefore: Date;
  executedAt: Date;
  duration: number;
  success: boolean;
  error?: string;
}

export class AuditLogRetentionService {
  private policies: Map<string, RetentionPolicy> = new Map();
  private schedules: Map<string, CronJob> = new Map();
  private cleanupHistory: CleanupResult[] = [];

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    const defaults: RetentionPolicy[] = [
      {
        id: "policy-90-days",
        name: "90-Day Retention",
        description: "Keep all audit logs for 90 days",
        retentionDays: 90,
        logType: "all",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "policy-30-days-webhooks",
        name: "30-Day Webhook Logs",
        description: "Keep webhook delivery logs for 30 days",
        retentionDays: 30,
        logType: "webhooks",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "policy-60-days-alerts",
        name: "60-Day Alert Logs",
        description: "Keep alert and escalation logs for 60 days",
        retentionDays: 60,
        logType: "alerts",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaults.forEach((policy) => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Create a new retention policy
   */
  createPolicy(
    name: string,
    retentionDays: number,
    logType: RetentionPolicy["logType"],
    description?: string
  ): RetentionPolicy {
    const id = `policy-${Date.now()}`;
    const policy: RetentionPolicy = {
      id,
      name,
      description,
      retentionDays,
      logType,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(id, policy);
    return policy;
  }

  /**
   * Update an existing policy
   */
  updatePolicy(
    id: string,
    updates: Partial<RetentionPolicy>
  ): RetentionPolicy | null {
    const policy = this.policies.get(id);
    if (!policy) return null;

    const updated = {
      ...policy,
      ...updates,
      id: policy.id,
      createdAt: policy.createdAt,
      updatedAt: new Date(),
    };

    this.policies.set(id, updated);
    return updated;
  }

  /**
   * Delete a policy
   */
  deletePolicy(id: string): boolean {
    if (this.schedules.has(id)) {
      const job = this.schedules.get(id);
      job?.stop();
      this.schedules.delete(id);
    }
    return this.policies.delete(id);
  }

  /**
   * Get a policy by ID
   */
  getPolicy(id: string): RetentionPolicy | null {
    return this.policies.get(id) || null;
  }

  /**
   * Get all policies
   */
  getAllPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get enabled policies
   */
  getEnabledPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values()).filter((p) => p.enabled);
  }

  /**
   * Schedule a cleanup job for a policy
   */
  scheduleCleanup(
    policyId: string,
    cronExpression: string = "0 2 * * *" // Default: 2 AM daily
  ): RetentionSchedule | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    // Stop existing job if any
    if (this.schedules.has(policyId)) {
      const existing = this.schedules.get(policyId);
      existing?.stop();
    }

    // Create new cron job
    const job = new CronJob(cronExpression, async () => {
      await this.executeCleanup(policyId);
    });

    job.start();
    this.schedules.set(policyId, job);

    const schedule: RetentionSchedule = {
      id: `schedule-${policyId}`,
      policyId,
      cronExpression,
      lastRun: undefined,
      nextRun: job.nextDate().toDate(),
      isActive: true,
    };

    return schedule;
  }

  /**
   * Execute cleanup for a specific policy
   */
  async executeCleanup(policyId: string): Promise<CleanupResult> {
    const startTime = performance.now();
    const policy = this.policies.get(policyId);

    if (!policy) {
      return {
        policyId,
        logsDeleted: 0,
        deletedBefore: new Date(),
        executedAt: new Date(),
        duration: 0,
        success: false,
        error: "Policy not found",
      };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      // Simulate deletion (in real implementation, delete from database)
      const logsDeleted = await this.deleteLogsBeforeDate(
        cutoffDate,
        policy.logType
      );

      const duration = performance.now() - startTime;

      const result: CleanupResult = {
        policyId,
        logsDeleted,
        deletedBefore: cutoffDate,
        executedAt: new Date(),
        duration: Math.round(duration),
        success: true,
      };

      this.cleanupHistory.push(result);

      // Keep only last 100 cleanup results
      if (this.cleanupHistory.length > 100) {
        this.cleanupHistory = this.cleanupHistory.slice(-100);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: CleanupResult = {
        policyId,
        logsDeleted: 0,
        deletedBefore: new Date(),
        executedAt: new Date(),
        duration: Math.round(duration),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      this.cleanupHistory.push(result);
      return result;
    }
  }

  /**
   * Delete logs before a specific date
   */
  private async deleteLogsBeforeDate(
    date: Date,
    logType: RetentionPolicy["logType"]
  ): Promise<number> {
    // In a real implementation, this would delete from the database
    // For now, simulate deletion
    const simulatedCount = Math.floor(Math.random() * 10000);
    return simulatedCount;
  }

  /**
   * Get cleanup history
   */
  getCleanupHistory(policyId?: string, limit: number = 50): CleanupResult[] {
    let history = this.cleanupHistory;

    if (policyId) {
      history = history.filter((r) => r.policyId === policyId);
    }

    return history.slice(-limit);
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStatistics(): {
    totalCleanups: number;
    successfulCleanups: number;
    failedCleanups: number;
    totalLogsDeleted: number;
    averageDuration: number;
    lastCleanup?: Date;
  } {
    const totalCleanups = this.cleanupHistory.length;
    const successfulCleanups = this.cleanupHistory.filter(
      (r) => r.success
    ).length;
    const failedCleanups = totalCleanups - successfulCleanups;
    const totalLogsDeleted = this.cleanupHistory.reduce(
      (sum, r) => sum + r.logsDeleted,
      0
    );
    const averageDuration =
      totalCleanups > 0
        ? Math.round(
            this.cleanupHistory.reduce((sum, r) => sum + r.duration, 0) /
              totalCleanups
          )
        : 0;
    const lastCleanup =
      this.cleanupHistory.length > 0
        ? this.cleanupHistory[this.cleanupHistory.length - 1].executedAt
        : undefined;

    return {
      totalCleanups,
      successfulCleanups,
      failedCleanups,
      totalLogsDeleted,
      averageDuration,
      lastCleanup,
    };
  }

  /**
   * Get schedule for a policy
   */
  getSchedule(policyId: string): RetentionSchedule | null {
    const job = this.schedules.get(policyId);
    if (!job) return null;

    return {
      id: `schedule-${policyId}`,
      policyId,
      cronExpression: "", // Would need to store this separately
      lastRun: undefined,
      nextRun: job.nextDate().toDate(),
      isActive: true,
    };
  }

  /**
   * Pause a cleanup schedule
   */
  pauseSchedule(policyId: string): boolean {
    const job = this.schedules.get(policyId);
    if (!job) return false;

    job.stop();
    return true;
  }

  /**
   * Resume a cleanup schedule
   */
  resumeSchedule(policyId: string): boolean {
    const job = this.schedules.get(policyId);
    if (!job) return false;

    job.start();
    return true;
  }

  /**
   * Get estimated logs to be deleted
   */
  estimateLogsToDelete(policyId: string): number {
    const policy = this.policies.get(policyId);
    if (!policy) return 0;

    // In real implementation, query database for count
    // For now, return simulated estimate
    return Math.floor(Math.random() * 50000);
  }

  /**
   * Get policy compliance status
   */
  getComplianceStatus(): {
    policyId: string;
    name: string;
    status: "compliant" | "warning" | "critical";
    logsToDelete: number;
    daysUntilNextCleanup: number;
  }[] {
    return Array.from(this.policies.values()).map((policy) => {
      const schedule = this.schedules.get(policy.id);
      const nextRun = schedule?.nextDate().toDate();
      const daysUntilNextCleanup = nextRun
        ? Math.ceil(
            (nextRun.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : -1;

      const logsToDelete = this.estimateLogsToDelete(policy.id);
      let status: "compliant" | "warning" | "critical" = "compliant";

      if (logsToDelete > 100000) {
        status = "critical";
      } else if (logsToDelete > 50000) {
        status = "warning";
      }

      return {
        policyId: policy.id,
        name: policy.name,
        status,
        logsToDelete,
        daysUntilNextCleanup,
      };
    });
  }

  /**
   * Start all enabled policies
   */
  startAllSchedules(): void {
    this.getEnabledPolicies().forEach((policy) => {
      if (!this.schedules.has(policy.id)) {
        this.scheduleCleanup(policy.id);
      }
    });
  }

  /**
   * Stop all schedules
   */
  stopAllSchedules(): void {
    this.schedules.forEach((job) => {
      job.stop();
    });
    this.schedules.clear();
  }
}

// Export singleton instance
export const auditLogRetentionService = new AuditLogRetentionService();
