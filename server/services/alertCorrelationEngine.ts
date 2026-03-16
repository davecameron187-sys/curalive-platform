/**
 * Alert Correlation Engine
 * Round 64 Features - Systemic issue detection
 */
import * as alertDb from "@/server/db.round64";

interface Alert {
  id: number;
  kioskId: string;
  eventId: string;
  anomalyType: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  value: number;
}

interface CorrelationPattern {
  type: string;
  kioskIds: string[];
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  relatedAlerts: number[];
}

export class AlertCorrelationEngine {
  private alertBuffer: Alert[] = [];
  private readonly BUFFER_SIZE = 1000;
  private readonly TIME_WINDOW = 5 * 60 * 1000; // 5 minutes

  /**
   * Add alert to correlation engine
   */
  addAlert(alert: Alert) {
    this.alertBuffer.push(alert);

    // Maintain buffer size
    if (this.alertBuffer.length > this.BUFFER_SIZE) {
      this.alertBuffer = this.alertBuffer.slice(-this.BUFFER_SIZE);
    }
  }

  /**
   * Detect correlations in recent alerts
   */
  async detectCorrelations(eventId: string): Promise<CorrelationPattern[]> {
    const recentAlerts = this.alertBuffer.filter(
      (a) =>
        a.eventId === eventId &&
        Date.now() - a.timestamp.getTime() < this.TIME_WINDOW
    );

    const patterns: CorrelationPattern[] = [];

    // Check for simultaneous alerts across multiple kiosks
    patterns.push(...this.detectSimultaneousFailures(recentAlerts));

    // Check for cascading failures
    patterns.push(...this.detectCascadingFailures(recentAlerts));

    // Check for anomaly type clustering
    patterns.push(...this.detectAnomalyTypeClustering(recentAlerts));

    // Check for severity escalation
    patterns.push(...this.detectSeverityEscalation(recentAlerts));

    // Persist detected patterns
    for (const pattern of patterns) {
      await alertDb.createAlertCorrelation(
        pattern.kioskIds,
        eventId,
        pattern.type,
        pattern.severity,
        pattern.description,
        pattern.relatedAlerts
      );
    }

    return patterns;
  }

  /**
   * Detect simultaneous failures across multiple kiosks
   */
  private detectSimultaneousFailures(alerts: Alert[]): CorrelationPattern[] {
    const patterns: CorrelationPattern[] = [];
    const timeGroups: Map<string, Alert[]> = new Map();

    // Group alerts by 30-second windows
    for (const alert of alerts) {
      const timeKey = Math.floor(alert.timestamp.getTime() / 30000).toString();
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(alert);
    }

    // Find groups with 3+ kiosks affected
    for (const [_, groupAlerts] of timeGroups) {
      const uniqueKiosks = new Set(groupAlerts.map((a) => a.kioskId));

      if (uniqueKiosks.size >= 3) {
        const avgSeverity = this.calculateAverageSeverity(groupAlerts);
        patterns.push({
          type: "simultaneous_failures",
          kioskIds: Array.from(uniqueKiosks),
          severity: avgSeverity,
          confidence: Math.min(uniqueKiosks.size / 10, 0.95),
          description: `${uniqueKiosks.size} kiosks experienced simultaneous failures`,
          relatedAlerts: groupAlerts.map((a) => a.id),
        });
      }
    }

    return patterns;
  }

  /**
   * Detect cascading failures
   */
  private detectCascadingFailures(alerts: Alert[]): CorrelationPattern[] {
    const patterns: CorrelationPattern[] = [];
    const sortedAlerts = [...alerts].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Look for pattern: alert on kiosk A, then B, then C within 2 minutes
    for (let i = 0; i < sortedAlerts.length - 2; i++) {
      const alert1 = sortedAlerts[i];
      const alert2 = sortedAlerts[i + 1];
      const alert3 = sortedAlerts[i + 2];

      const timeDiff1 = alert2.timestamp.getTime() - alert1.timestamp.getTime();
      const timeDiff2 = alert3.timestamp.getTime() - alert2.timestamp.getTime();

      if (timeDiff1 < 120000 && timeDiff2 < 120000) {
        // Within 2 minutes
        if (
          alert1.kioskId !== alert2.kioskId &&
          alert2.kioskId !== alert3.kioskId
        ) {
          patterns.push({
            type: "cascading_failure",
            kioskIds: [alert1.kioskId, alert2.kioskId, alert3.kioskId],
            severity: this.calculateAverageSeverity([alert1, alert2, alert3]),
            confidence: 0.85,
            description: `Cascading failure detected: ${alert1.kioskId} → ${alert2.kioskId} → ${alert3.kioskId}`,
            relatedAlerts: [alert1.id, alert2.id, alert3.id],
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect anomaly type clustering
   */
  private detectAnomalyTypeClustering(alerts: Alert[]): CorrelationPattern[] {
    const patterns: CorrelationPattern[] = [];
    const anomalyGroups: Map<string, Alert[]> = new Map();

    // Group by anomaly type
    for (const alert of alerts) {
      if (!anomalyGroups.has(alert.anomalyType)) {
        anomalyGroups.set(alert.anomalyType, []);
      }
      anomalyGroups.get(alert.anomalyType)!.push(alert);
    }

    // Find anomaly types affecting 3+ kiosks
    for (const [anomalyType, groupAlerts] of anomalyGroups) {
      const uniqueKiosks = new Set(groupAlerts.map((a) => a.kioskId));

      if (uniqueKiosks.size >= 3) {
        patterns.push({
          type: "anomaly_clustering",
          kioskIds: Array.from(uniqueKiosks),
          severity: this.calculateAverageSeverity(groupAlerts),
          confidence: Math.min(uniqueKiosks.size / 10, 0.9),
          description: `${anomalyType} affecting ${uniqueKiosks.size} kiosks (systemic issue)`,
          relatedAlerts: groupAlerts.map((a) => a.id),
        });
      }
    }

    return patterns;
  }

  /**
   * Detect severity escalation
   */
  private detectSeverityEscalation(alerts: Alert[]): CorrelationPattern[] {
    const patterns: CorrelationPattern[] = [];
    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };

    // Group by kiosk
    const kioskAlerts: Map<string, Alert[]> = new Map();
    for (const alert of alerts) {
      if (!kioskAlerts.has(alert.kioskId)) {
        kioskAlerts.set(alert.kioskId, []);
      }
      kioskAlerts.get(alert.kioskId)!.push(alert);
    }

    // Check for escalation patterns
    for (const [kioskId, kAlerts] of kioskAlerts) {
      const sorted = [...kAlerts].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const currentSeverity = severityMap[current.severity];
        const nextSeverity = severityMap[next.severity];

        if (nextSeverity > currentSeverity) {
          const timeDiff = next.timestamp.getTime() - current.timestamp.getTime();
          if (timeDiff < 300000) {
            // Within 5 minutes
            patterns.push({
              type: "severity_escalation",
              kioskIds: [kioskId],
              severity: next.severity,
              confidence: 0.9,
              description: `Severity escalation on ${kioskId}: ${current.severity} → ${next.severity}`,
              relatedAlerts: [current.id, next.id],
            });
          }
        }
      }
    }

    return patterns;
  }

  /**
   * Calculate average severity
   */
  private calculateAverageSeverity(
    alerts: Alert[]
  ): "low" | "medium" | "high" | "critical" {
    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const avg =
      alerts.reduce((sum, a) => sum + severityMap[a.severity], 0) /
      alerts.length;

    if (avg >= 3.5) return "critical";
    if (avg >= 2.5) return "high";
    if (avg >= 1.5) return "medium";
    return "low";
  }

  /**
   * Detect systemic issues
   */
  async detectSystemicIssues(eventId: string) {
    return alertDb.detectSystemicIssues(eventId, 3);
  }

  /**
   * Get correlation statistics
   */
  async getCorrelationStatistics(eventId: string) {
    return alertDb.getCorrelationStatistics(eventId);
  }

  /**
   * Resolve correlation
   */
  async resolveCorrelation(correlationId: number, resolution: string) {
    return alertDb.resolveCorrelation(correlationId, resolution);
  }
}

export const correlationEngine = new AlertCorrelationEngine();
