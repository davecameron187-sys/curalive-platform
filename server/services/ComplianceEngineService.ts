// @ts-nocheck
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { complianceThreats, complianceFrameworkChecks } from "../../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export type ThreatType = "fraud" | "access_anomaly" | "data_exfiltration" | "policy_violation" | "regulatory_breach" | "predictive_warning";
export type Severity = "low" | "medium" | "high" | "critical";
export type ThreatStatus = "detected" | "investigating" | "confirmed" | "mitigated" | "false_positive";

interface ThreatDetectionResult {
  threats: DetectedThreat[];
  frameworkStatus: FrameworkSummary;
  riskScore: number;
  predictiveAlerts: PredictiveAlert[];
}

interface DetectedThreat {
  type: ThreatType;
  severity: Severity;
  title: string;
  description: string;
  confidence: number;
  evidence: Record<string, any>;
  affectedEntities: string[];
  suggestedRemediation: string;
}

interface PredictiveAlert {
  type: string;
  probability: number;
  timeHorizon: string;
  description: string;
  preventiveAction: string;
}

interface FrameworkSummary {
  iso27001: { passing: number; failing: number; warning: number; total: number; score: number };
  soc2: { passing: number; failing: number; warning: number; total: number; score: number };
}

async function rawQuery(query: string, params: any[] = []) {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(query, params);
  return rows;
}

async function safeRawQuery(query: string, params: any[] = []) {
  try { return await rawQuery(query, params); } catch { return []; }
}

async function analyzeRegistrationPatterns(): Promise<DetectedThreat[]> {
  const threats: DetectedThreat[] = [];

  const recentRegs: any[] = await safeRawQuery(`
    SELECT COUNT(*) as cnt, email,
           MIN(createdAt) as first_reg, MAX(createdAt) as last_reg
    FROM attendee_registrations
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY email
    HAVING cnt > 3
  `);

  for (const row of recentRegs) {
    if (Number(row.cnt) > 5) {
      threats.push({
        type: "fraud",
        severity: Number(row.cnt) > 10 ? "critical" : "high",
        title: `Suspicious registration volume: ${row.email}`,
        description: `${row.cnt} registrations from ${row.email} in 24h — potential bot/spam activity`,
        confidence: Math.min(0.95, 0.5 + Number(row.cnt) * 0.05),
        evidence: { email: row.email, count: Number(row.cnt), firstSeen: row.first_reg, lastSeen: row.last_reg },
        affectedEntities: [row.email],
        suggestedRemediation: "Rate-limit registrations per email; require CAPTCHA verification",
      });
    }
  }

  const duplicateEmails: any[] = await safeRawQuery(`
    SELECT COUNT(DISTINCT email) as unique_emails, COUNT(*) as total_regs
    FROM attendee_registrations
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    GROUP BY eventId
    HAVING unique_emails > 50
  `);

  for (const row of duplicateEmails) {
    threats.push({
      type: "fraud",
      severity: "high",
      title: "Unusual registration volume on single event",
      description: `${row.unique_emails} distinct emails registered on one event in 1 hour`,
      confidence: 0.85,
      evidence: { uniqueEmails: Number(row.unique_emails), totalRegs: Number(row.total_regs) },
      affectedEntities: [],
      suggestedRemediation: "Block IP or require additional verification",
    });
  }

  return threats;
}

async function analyzeAccessPatterns(): Promise<DetectedThreat[]> {
  const threats: DetectedThreat[] = [];

  const unusualActivity: any[] = await safeRawQuery(`
    SELECT action_by as email, action_by_role as role, COUNT(*) as access_count
    FROM ai_am_audit_log
    WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    GROUP BY action_by, action_by_role
    HAVING access_count > 50
  `);

  for (const row of unusualActivity) {
    threats.push({
      type: "access_anomaly",
      severity: Number(row.access_count) > 200 ? "critical" : "medium",
      title: `Abnormal activity: ${row.email}`,
      description: `${row.access_count} actions in 1 hour from ${row.email} (role: ${row.role})`,
      confidence: 0.7,
      evidence: { email: row.email, role: row.role, actionCount: Number(row.access_count) },
      affectedEntities: [row.email],
      suggestedRemediation: "Review user activity; consider temporary account suspension",
    });
  }

  return threats;
}

async function analyzeDataExfiltration(): Promise<DetectedThreat[]> {
  const threats: DetectedThreat[] = [];

  const bulkExports: any[] = await safeRawQuery(`
    SELECT COUNT(*) as export_count
    FROM ai_am_audit_log
    WHERE (action LIKE '%export%' OR action LIKE '%download%' OR action LIKE '%bulk%')
    AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
  `);

  if (bulkExports.length > 0 && Number(bulkExports[0]?.export_count) > 20) {
    threats.push({
      type: "data_exfiltration",
      severity: "high",
      title: "Unusual bulk data export activity",
      description: `${bulkExports[0].export_count} export/download actions in the last hour`,
      confidence: 0.75,
      evidence: { exportCount: Number(bulkExports[0].export_count) },
      affectedEntities: [],
      suggestedRemediation: "Audit export logs; implement export rate limiting",
    });
  }

  return threats;
}

async function runPredictiveAnalysis(): Promise<PredictiveAlert[]> {
  const alerts: PredictiveAlert[] = [];

  const eventGrowth: any[] = await safeRawQuery(`
    SELECT COUNT(*) as upcoming_events
    FROM events
    WHERE status = 'scheduled'
  `);
  const upcoming = Number(eventGrowth[0]?.upcoming_events ?? 0);

  const avgRegsPerEvent: any[] = await safeRawQuery(`
    SELECT AVG(reg_count) as avg_regs FROM (
      SELECT eventId, COUNT(*) as reg_count
      FROM attendee_registrations
      WHERE createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY eventId
    ) sub
  `);
  const avgRegs = Number(avgRegsPerEvent[0]?.avg_regs ?? 0);

  if (upcoming > 5 && avgRegs > 100) {
    alerts.push({
      type: "capacity_stress",
      probability: Math.min(0.9, 0.3 + upcoming * 0.05),
      timeHorizon: "7 days",
      description: `${upcoming} events with ~${Math.round(avgRegs)} average registrations may stress infrastructure`,
      preventiveAction: "Pre-scale conference bridge capacity; verify CDN readiness",
    });
  }

  const recentThreats: any[] = await safeRawQuery(`
    SELECT threat_type, COUNT(*) as cnt
    FROM compliance_threats
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    AND status NOT IN ('false_positive', 'mitigated')
    GROUP BY threat_type
    ORDER BY cnt DESC
  `);

  for (const row of recentThreats) {
    if (Number(row.cnt) > 3) {
      alerts.push({
        type: "recurring_threat",
        probability: Math.min(0.85, 0.4 + Number(row.cnt) * 0.1),
        timeHorizon: "48 hours",
        description: `${row.threat_type} threats recurring (${row.cnt} in 7 days) — pattern likely to continue`,
        preventiveAction: `Implement automated ${row.threat_type} countermeasures`,
      });
    }
  }

  return alerts;
}

async function assessFrameworkCompliance(): Promise<FrameworkSummary> {
  const db = await getDb();
  if (!db) return {
    iso27001: { passing: 0, failing: 0, warning: 0, total: 0, score: 0 },
    soc2: { passing: 0, failing: 0, warning: 0, total: 0, score: 0 },
  };

  const isoControls: any[] = await safeRawQuery(`
    SELECT status, COUNT(*) as cnt FROM iso27001_controls GROUP BY status
  `);
  const soc2Controls: any[] = await safeRawQuery(`
    SELECT status, COUNT(*) as cnt FROM soc2_controls GROUP BY status
  `);

  const frameworkChecks: any[] = await safeRawQuery(`
    SELECT framework, status, COUNT(*) as cnt
    FROM compliance_framework_checks
    GROUP BY framework, status
  `);

  function summarize(controls: any[], checks: any[], framework: string) {
    let passing = 0, failing = 0, warning = 0, total = 0;
    for (const c of controls) {
      const cnt = Number(c.cnt);
      total += cnt;
      if (c.status === "compliant") passing += cnt;
      else if (c.status === "non_compliant") failing += cnt;
      else if (c.status === "partial") warning += cnt;
    }
    for (const c of checks) {
      if (c.framework !== framework) continue;
      const cnt = Number(c.cnt);
      if (c.status === "passing") passing += cnt;
      else if (c.status === "failing") failing += cnt;
      else if (c.status === "warning") warning += cnt;
      total += cnt;
    }
    const score = total > 0 ? Math.round((passing / total) * 100) : 0;
    return { passing, failing, warning, total, score };
  }

  return {
    iso27001: summarize(isoControls, frameworkChecks, "iso27001"),
    soc2: summarize(soc2Controls, frameworkChecks, "soc2"),
  };
}

async function aiAssessThreatSeverity(threats: DetectedThreat[]): Promise<DetectedThreat[]> {
  if (threats.length === 0) return threats;

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity compliance analyst for CuraLive, a real-time investor events platform.
Assess the severity and recommended actions for detected threats.
Respond with a JSON array where each element has: index (number), adjustedSeverity ("low"|"medium"|"high"|"critical"), reasoning (string), urgentAction (string).
Only output the JSON array, no other text.`,
        },
        {
          role: "user",
          content: JSON.stringify(threats.map((t, i) => ({
            index: i,
            type: t.type,
            title: t.title,
            description: t.description,
            currentSeverity: t.severity,
            confidence: t.confidence,
          }))),
        },
      ],
      maxTokens: 1000,
    });

    const text = typeof result.content === "string" ? result.content : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const assessments = JSON.parse(jsonMatch[0]);
      for (const a of assessments) {
        if (a.index < threats.length) {
          threats[a.index].severity = a.adjustedSeverity;
          threats[a.index].description += `\n\nAI Assessment: ${a.reasoning}`;
          if (a.urgentAction) threats[a.index].suggestedRemediation = a.urgentAction;
        }
      }
    }
  } catch (err) {
    console.error("[ComplianceEngine] AI assessment failed, using rule-based severity:", err);
  }

  return threats;
}

export async function runFullScan(): Promise<ThreatDetectionResult> {
  const [regThreats, accessThreats, exfilThreats, predictiveAlerts, frameworkStatus] =
    await Promise.all([
      analyzeRegistrationPatterns(),
      analyzeAccessPatterns(),
      analyzeDataExfiltration(),
      runPredictiveAnalysis(),
      assessFrameworkCompliance(),
    ]);

  let allThreats = [...regThreats, ...accessThreats, ...exfilThreats];

  allThreats = await aiAssessThreatSeverity(allThreats);

  const db = await getDb();
  if (db) {
    for (const threat of allThreats) {
      try {
        await db.insert(complianceThreats).values({
          threatType: threat.type,
          severity: threat.severity,
          status: "detected",
          sourceSystem: "compliance_engine",
          title: threat.title,
          description: threat.description,
          evidence: threat.evidence,
          affectedEntities: threat.affectedEntities,
          aiConfidence: threat.confidence,
          aiReasoning: threat.description,
          remediationAction: threat.suggestedRemediation,
          detectedBy: "compliance_engine",
        });
      } catch (err) {
        console.error("[ComplianceEngine] Failed to persist threat:", err);
      }
    }
  }

  const criticalCount = allThreats.filter(t => t.severity === "critical").length;
  const highCount = allThreats.filter(t => t.severity === "high").length;
  const riskScore = Math.min(100, criticalCount * 25 + highCount * 10 + allThreats.length * 2);

  return { threats: allThreats, frameworkStatus, riskScore, predictiveAlerts };
}

export async function getThreats(filters?: {
  status?: ThreatStatus;
  severity?: Severity;
  type?: ThreatType;
  limit?: number;
}) {
  const rows: any[] = await safeRawQuery(`
    SELECT * FROM compliance_threats
    WHERE 1=1
    ${filters?.status ? `AND status = '${filters.status}'` : ""}
    ${filters?.severity ? `AND severity = '${filters.severity}'` : ""}
    ${filters?.type ? `AND threat_type = '${filters.type}'` : ""}
    ORDER BY created_at DESC
    LIMIT ${filters?.limit ?? 100}
  `);
  return rows;
}

export async function updateThreatStatus(id: number, status: ThreatStatus, reviewedBy?: number) {
  await rawQuery(
    `UPDATE compliance_threats SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [status, reviewedBy ?? null, id]
  );
  return { success: true };
}

export async function getThreatStats() {
  const bySeverity: any[] = await safeRawQuery(`
    SELECT severity, COUNT(*) as cnt
    FROM compliance_threats
    WHERE status NOT IN ('mitigated', 'false_positive')
    GROUP BY severity
  `);

  const byType: any[] = await safeRawQuery(`
    SELECT threat_type, COUNT(*) as cnt
    FROM compliance_threats
    WHERE status NOT IN ('mitigated', 'false_positive')
    GROUP BY threat_type
  `);

  const trend: any[] = await safeRawQuery(`
    SELECT DATE(created_at) as day, COUNT(*) as cnt
    FROM compliance_threats
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY day
  `);

  const activeCount: any[] = await safeRawQuery(`
    SELECT COUNT(*) as cnt FROM compliance_threats
    WHERE status NOT IN ('mitigated', 'false_positive')
  `);

  return {
    activeThreats: Number(activeCount[0]?.cnt ?? 0),
    bySeverity: bySeverity.reduce((acc, r) => ({ ...acc, [r.severity]: Number(r.cnt) }), {}),
    byType: byType.reduce((acc, r) => ({ ...acc, [r.threat_type]: Number(r.cnt) }), {}),
    trend: trend.map(r => ({ date: r.day, count: Number(r.cnt) })),
  };
}

export async function getComplianceDashboardData() {
  const [scanResult, stats, recentThreats] = await Promise.all([
    assessFrameworkCompliance(),
    getThreatStats(),
    getThreats({ limit: 10 }),
  ]);

  const criticalCount = stats.bySeverity?.critical ?? 0;
  const highCount = stats.bySeverity?.high ?? 0;
  const riskScore = Math.min(100, criticalCount * 25 + highCount * 10 + stats.activeThreats * 2);

  return {
    frameworks: scanResult,
    threatStats: stats,
    recentThreats,
    riskScore,
    lastScanAt: new Date().toISOString(),
  };
}

export async function seedFrameworkControls() {
  const db = await getDb();
  if (!db) return;

  const existingIso: any[] = await safeRawQuery(`SELECT COUNT(*) as cnt FROM iso27001_controls`);
  const existingSoc2: any[] = await safeRawQuery(`SELECT COUNT(*) as cnt FROM soc2_controls`);

  if (Number(existingIso[0]?.cnt) === 0) {
    const isoControls = [
      { controlId: "A.5.1", clause: "Information Security Policies", name: "Policies for information security", status: "partial" },
      { controlId: "A.6.1", clause: "Organization of Information Security", name: "Internal organization", status: "compliant" },
      { controlId: "A.7.1", clause: "Human Resource Security", name: "Prior to employment screening", status: "partial" },
      { controlId: "A.8.1", clause: "Asset Management", name: "Responsibility for assets", status: "compliant" },
      { controlId: "A.9.1", clause: "Access Control", name: "Business requirements of access control", status: "compliant" },
      { controlId: "A.9.2", clause: "Access Control", name: "User access management", status: "compliant" },
      { controlId: "A.10.1", clause: "Cryptography", name: "Cryptographic controls", status: "compliant" },
      { controlId: "A.11.1", clause: "Physical Security", name: "Secure areas", status: "non_compliant" },
      { controlId: "A.12.1", clause: "Operations Security", name: "Operational procedures", status: "partial" },
      { controlId: "A.12.4", clause: "Operations Security", name: "Logging and monitoring", status: "compliant" },
      { controlId: "A.13.1", clause: "Communications Security", name: "Network security management", status: "compliant" },
      { controlId: "A.14.1", clause: "System Acquisition", name: "Security requirements of info systems", status: "partial" },
      { controlId: "A.15.1", clause: "Supplier Relationships", name: "Information security in supplier relationships", status: "partial" },
      { controlId: "A.16.1", clause: "Incident Management", name: "Management of security incidents", status: "compliant" },
      { controlId: "A.17.1", clause: "Business Continuity", name: "Information security continuity", status: "partial" },
      { controlId: "A.18.1", clause: "Compliance", name: "Compliance with legal and contractual", status: "compliant" },
    ];

    for (const ctrl of isoControls) {
      await safeRawQuery(
        `INSERT INTO iso27001_controls (control_id, clause, name, status) VALUES (?, ?, ?, ?)`,
        [ctrl.controlId, ctrl.clause, ctrl.name, ctrl.status]
      );
    }
    console.log("[ComplianceEngine] Seeded 16 ISO 27001 controls");
  }

  if (Number(existingSoc2[0]?.cnt) === 0) {
    const soc2Controls = [
      { controlId: "CC1.1", category: "Control Environment", name: "COSO Principle 1: Integrity and ethics", status: "compliant" },
      { controlId: "CC1.2", category: "Control Environment", name: "COSO Principle 2: Board oversight", status: "partial" },
      { controlId: "CC2.1", category: "Communication", name: "COSO Principle 13: Quality information", status: "compliant" },
      { controlId: "CC3.1", category: "Risk Assessment", name: "COSO Principle 6: Risk identification", status: "compliant" },
      { controlId: "CC4.1", category: "Monitoring", name: "COSO Principle 16: Ongoing evaluations", status: "compliant" },
      { controlId: "CC5.1", category: "Control Activities", name: "COSO Principle 10: Risk-mitigating activities", status: "partial" },
      { controlId: "CC6.1", category: "Logical Access", name: "Logical access security software", status: "compliant" },
      { controlId: "CC6.2", category: "Logical Access", name: "New user registration and authorization", status: "compliant" },
      { controlId: "CC6.3", category: "Logical Access", name: "Role-based access control", status: "compliant" },
      { controlId: "CC7.1", category: "System Operations", name: "Detection of unauthorized changes", status: "partial" },
      { controlId: "CC7.2", category: "System Operations", name: "Monitoring of system components", status: "compliant" },
      { controlId: "CC8.1", category: "Change Management", name: "Changes to infrastructure and software", status: "partial" },
      { controlId: "CC9.1", category: "Risk Mitigation", name: "Risk mitigation activities", status: "compliant" },
      { controlId: "A1.1", category: "Availability", name: "System availability commitments", status: "compliant" },
      { controlId: "A1.2", category: "Availability", name: "Environmental protections", status: "partial" },
      { controlId: "C1.1", category: "Confidentiality", name: "Confidential information protection", status: "compliant" },
      { controlId: "P1.1", category: "Privacy", name: "Privacy notice and consent", status: "partial" },
      { controlId: "PI1.1", category: "Processing Integrity", name: "Processing completeness and accuracy", status: "compliant" },
    ];

    for (const ctrl of soc2Controls) {
      await safeRawQuery(
        `INSERT INTO soc2_controls (control_id, category, name, status) VALUES (?, ?, ?, ?)`,
        [ctrl.controlId, ctrl.category, ctrl.name, ctrl.status]
      );
    }
    console.log("[ComplianceEngine] Seeded 18 SOC 2 controls");
  }
}

let scanInterval: ReturnType<typeof setInterval> | null = null;

export function startComplianceEngine(intervalMs = 300_000) {
  seedFrameworkControls().catch(err => console.error("[ComplianceEngine] Seed failed:", err));

  if (scanInterval) clearInterval(scanInterval);
  scanInterval = setInterval(async () => {
    try {
      const result = await runFullScan();
      if (result.riskScore > 50) {
        console.warn(`[ComplianceEngine] Elevated risk score: ${result.riskScore} — ${result.threats.length} active threats`);
      }
    } catch (err) {
      console.error("[ComplianceEngine] Periodic scan failed:", err);
    }
  }, intervalMs);

  console.log(`[ComplianceEngine] Started — scanning every ${intervalMs / 1000}s`);
}

export function stopComplianceEngine() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
}
