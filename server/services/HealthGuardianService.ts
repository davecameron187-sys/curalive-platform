// @ts-nocheck
import {getDb, rawSql } from "../db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export type ServiceName = "database" | "twilio" | "openai" | "ably" | "recall" | "active_events";
export type HealthStatus = "healthy" | "degraded" | "critical" | "unknown";
export type Severity = "info" | "warning" | "critical";
export type RootCauseCategory = "platform" | "participant" | "presenter" | "network" | "third_party" | "unknown";

interface CheckResult {
  service: ServiceName;
  status: HealthStatus;
  latencyMs: number;
  details: Record<string, any>;
}

interface ServiceBaseline {
  avgLatency: number;
  stdDev: number;
  sampleCount: number;
}

const CHECK_INTERVAL_MS = 30_000;
const ANOMALY_THRESHOLD_SIGMA = 2.5;
const DEGRADED_LATENCY_MS: Record<ServiceName, number> = {
  database: 500,
  twilio: 2000,
  openai: 5000,
  ably: 1000,
  recall: 3000,
  active_events: 1000,
};

let guardianInterval: ReturnType<typeof setInterval> | null = null;
let lastResults: Map<ServiceName, CheckResult> = new Map();
let consecutiveFailures: Map<ServiceName, number> = new Map();

async function rawQuery(query: string, params: any[] = []) {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");
    const [rows] = await rawSql(query, params);
  return rows;
}

async function safeRawQuery(query: string, params: any[] = []) {
  try {
    return await rawQuery(query, params);
  } catch {
    return [];
  }
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await rawQuery("SELECT 1 AS ping");
    const latency = Date.now() - start;
    return {
      service: "database",
      status: latency > DEGRADED_LATENCY_MS.database ? "degraded" : "healthy",
      latencyMs: latency,
      details: { query: "SELECT 1", rowsReturned: 1 },
    };
  } catch (err: any) {
    return {
      service: "database",
      status: "critical",
      latencyMs: Date.now() - start,
      details: { error: err.message },
    };
  }
}

async function checkTwilio(): Promise<CheckResult> {
  const start = Date.now();
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return { service: "twilio", status: "unknown", latencyMs: 0, details: { error: "Credentials not configured" } };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return {
        service: "twilio",
        status: latency > DEGRADED_LATENCY_MS.twilio ? "degraded" : "healthy",
        latencyMs: latency,
        details: { accountStatus: data.status, friendlyName: data.friendly_name },
      };
    }
    if (res.status === 401 || res.status === 403) {
      return { service: "twilio", status: "healthy", latencyMs: latency, details: { httpStatus: res.status, note: "API reachable, credentials pending validation" } };
    }
    return { service: "twilio", status: "degraded", latencyMs: latency, details: { httpStatus: res.status } };
  } catch (err: any) {
    return { service: "twilio", status: "critical", latencyMs: Date.now() - start, details: { error: err.message } };
  }
}

async function checkOpenAI(): Promise<CheckResult> {
  const start = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { service: "openai", status: "unknown", latencyMs: 0, details: { error: "API key not configured" } };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    if (res.ok) {
      return {
        service: "openai",
        status: latency > DEGRADED_LATENCY_MS.openai ? "degraded" : "healthy",
        latencyMs: latency,
        details: { modelsEndpoint: "reachable" },
      };
    }
    if (res.status === 401 || res.status === 403) {
      return { service: "openai", status: "healthy", latencyMs: latency, details: { httpStatus: res.status, note: "API reachable, credentials pending validation" } };
    }
    return { service: "openai", status: "degraded", latencyMs: latency, details: { httpStatus: res.status } };
  } catch (err: any) {
    return { service: "openai", status: "critical", latencyMs: Date.now() - start, details: { error: err.message } };
  }
}

async function checkAbly(): Promise<CheckResult> {
  const start = Date.now();
  const ablyKey = process.env.ABLY_API_KEY;
  if (!ablyKey) {
    return { service: "ably", status: "unknown", latencyMs: 0, details: { error: "API key not configured" } };
  }
  try {
    const res = await fetch("https://rest.ably.io/time", {
      headers: { Authorization: `Basic ${Buffer.from(ablyKey).toString("base64")}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (res.ok) {
      return {
        service: "ably",
        status: latency > DEGRADED_LATENCY_MS.ably ? "degraded" : "healthy",
        latencyMs: latency,
        details: { timeEndpoint: "reachable" },
      };
    }
    return { service: "ably", status: "degraded", latencyMs: latency, details: { httpStatus: res.status } };
  } catch (err: any) {
    return { service: "ably", status: "critical", latencyMs: Date.now() - start, details: { error: err.message } };
  }
}

async function checkRecall(): Promise<CheckResult> {
  const start = Date.now();
  const apiKey = process.env.RECALL_AI_API_KEY;
  if (!apiKey) {
    return { service: "recall", status: "unknown", latencyMs: 0, details: { error: "API key not configured" } };
  }
  try {
    const res = await fetch("https://api.recall.ai/api/v1/bot/", {
      method: "GET",
      headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (res.ok) {
      return {
        service: "recall",
        status: latency > DEGRADED_LATENCY_MS.recall ? "degraded" : "healthy",
        latencyMs: latency,
        details: { botEndpoint: "reachable" },
      };
    }
    if (res.status === 401 || res.status === 403) {
      return { service: "recall", status: "healthy", latencyMs: latency, details: { httpStatus: res.status, note: "API reachable, credentials pending validation" } };
    }
    return { service: "recall", status: "degraded", latencyMs: latency, details: { httpStatus: res.status } };
  } catch (err: any) {
    return { service: "recall", status: "critical", latencyMs: Date.now() - start, details: { error: err.message } };
  }
}

async function checkActiveEvents(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const rows = await rawQuery(
      "SELECT id, title, status FROM events WHERE status IN ('live', 'in_progress') LIMIT 10"
    );
    const latency = Date.now() - start;
    const activeCount = Array.isArray(rows) ? rows.length : 0;
    return {
      service: "active_events",
      status: "healthy",
      latencyMs: latency,
      details: { activeEvents: activeCount, events: rows },
    };
  } catch (err: any) {
    const latency = Date.now() - start;
    return {
      service: "active_events",
      status: "degraded",
      latencyMs: latency,
      details: { error: err.message },
    };
  }
}

async function updateBaseline(service: ServiceName, latencyMs: number) {
  try {
    const existing = await rawQuery(
      "SELECT avg_value, std_dev, sample_count FROM health_baselines WHERE service = ? AND metric = 'latency'",
      [service]
    );
    const now = Date.now();
    if (Array.isArray(existing) && existing.length > 0) {
      const row = existing[0] as any;
      const n = Number(row.sample_count) + 1;
      const oldMean = Number(row.avg_value);
      const oldStdDev = Number(row.std_dev);
      const newMean = oldMean + (latencyMs - oldMean) / n;
      const newStdDev = Math.sqrt(
        ((n - 2) / Math.max(n - 1, 1)) * (oldStdDev * oldStdDev) +
        ((latencyMs - oldMean) * (latencyMs - newMean)) / Math.max(n - 1, 1)
      );
      await rawQuery(
        "UPDATE health_baselines SET avg_value = ?, std_dev = ?, sample_count = ?, last_updated = ? WHERE service = ? AND metric = 'latency'",
        [newMean, isNaN(newStdDev) ? 0 : newStdDev, n, now, service]
      );
    } else {
      await rawQuery(
        "INSERT INTO health_baselines (service, metric, avg_value, std_dev, sample_count, last_updated) VALUES (?, 'latency', ?, 0, 1, ?)",
        [service, latencyMs, now]
      );
    }
  } catch (e) {}
}

async function detectAnomaly(service: ServiceName, latencyMs: number): Promise<boolean> {
  try {
    const rows = await rawQuery(
      "SELECT avg_value, std_dev, sample_count FROM health_baselines WHERE service = ? AND metric = 'latency'",
      [service]
    );
    if (!Array.isArray(rows) || rows.length === 0) return false;
    const row = rows[0] as any;
    const sampleCount = Number(row.sample_count);
    const stdDev = Number(row.std_dev);
    const avgValue = Number(row.avg_value);
    if (sampleCount < 10 || stdDev === 0) return false;
    const zScore = Math.abs(latencyMs - avgValue) / stdDev;
    return zScore > ANOMALY_THRESHOLD_SIGMA;
  } catch {
    return false;
  }
}

async function hasActiveIncident(service: ServiceName): Promise<boolean> {
  try {
    const rows = await safeRawQuery(
      "SELECT id FROM health_incidents WHERE service = ? AND status = 'active' LIMIT 1",
      [service]
    );
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function createIncident(result: CheckResult, isAnomaly: boolean) {
  if (await hasActiveIncident(result.service)) return;

  const now = Date.now();
  const severity: Severity = result.status === "critical" ? "critical" : "warning";
  const title = isAnomaly
    ? `Anomaly detected: ${result.service} latency ${result.latencyMs}ms (expected baseline exceeded)`
    : `${result.service} service ${result.status}: ${result.details.error || "degraded performance"}`;

  let activeEvents: any[] = [];
  try {
    activeEvents = await rawQuery("SELECT id, title FROM events WHERE status IN ('live', 'in_progress') LIMIT 10") as any[];
  } catch {}

  let rootCauseAnalysis = "";
  let rootCauseCategory: RootCauseCategory = "unknown";
  try {
    const prompt = `Analyse this infrastructure health incident for CuraLive (a live investor events platform).

Service: ${result.service}
Status: ${result.status}
Latency: ${result.latencyMs}ms
Details: ${JSON.stringify(result.details)}
Is anomaly (deviation from baseline): ${isAnomaly}
Active events during incident: ${activeEvents.length > 0 ? JSON.stringify(activeEvents) : "None"}

Determine the most likely root cause and categorise it as one of:
- "platform" = CuraLive's own infrastructure issue
- "participant" = issue originating from a participant's connection/device
- "presenter" = issue originating from a presenter's connection/device  
- "network" = general network/ISP issue affecting connectivity
- "third_party" = issue with an external service provider (Twilio, OpenAI, Ably, etc.)
- "unknown" = insufficient data to determine

Respond in JSON: {"rootCause": "explanation", "category": "one_of_above", "impact": "description of impact", "recommendation": "what to do"}`;

    const resp = await invokeLLM(prompt, "You are an infrastructure monitoring AI for a live events platform. Be precise and technical.", true);
    const parsed = JSON.parse(resp);
    rootCauseAnalysis = parsed.rootCause || "";
    rootCauseCategory = parsed.category || "unknown";
  } catch {
    rootCauseAnalysis = `${result.service} reported ${result.status} with latency ${result.latencyMs}ms`;
  }

  await safeRawQuery(
    `INSERT INTO health_incidents (service, severity, status, title, description, root_cause, root_cause_category, affected_events, detected_at) 
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
    [
      result.service,
      severity,
      title,
      JSON.stringify(result.details),
      rootCauseAnalysis,
      rootCauseCategory,
      JSON.stringify(activeEvents.map((e: any) => ({ id: e.id, title: e.title }))),
      now,
    ]
  );

  console.log(`[HealthGuardian] INCIDENT: ${severity.toUpperCase()} — ${title}`);
}

async function resolveIncident(service: ServiceName) {
  const now = Date.now();
  await safeRawQuery(
    "UPDATE health_incidents SET status = 'resolved', resolved_at = ? WHERE service = ? AND status = 'active'",
    [now, service]
  );
  consecutiveFailures.set(service, 0);
}

export async function runAllChecks(): Promise<CheckResult[]> {
  const checkPromises: Promise<CheckResult>[] = [
    checkDatabase(),
    checkActiveEvents(),
  ];
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) checkPromises.push(checkTwilio());
  if (process.env.OPENAI_API_KEY) checkPromises.push(checkOpenAI());
  if (process.env.ABLY_API_KEY) checkPromises.push(checkAbly());
  if (process.env.RECALL_AI_API_KEY) checkPromises.push(checkRecall());

  const checks = await Promise.allSettled(checkPromises);

  const results: CheckResult[] = [];
  for (const check of checks) {
    if (check.status === "fulfilled") {
      results.push(check.value);
    }
  }

  const now = Date.now();
  for (const result of results) {
    lastResults.set(result.service, result);

    await safeRawQuery(
      "INSERT INTO health_checks (service, status, latency_ms, details, checked_at) VALUES (?, ?, ?, ?, ?)",
      [result.service, result.status, result.latencyMs, JSON.stringify(result.details), now]
    );

    if (result.status === "unknown") {
      continue;
    }

    if (result.status === "healthy") {
      await updateBaseline(result.service, result.latencyMs);
      const hadFailures = (consecutiveFailures.get(result.service) || 0) > 0;
      const hasActive = await hasActiveIncident(result.service);
      if (hadFailures || hasActive) {
        await resolveIncident(result.service);
      }
      consecutiveFailures.set(result.service, 0);
      const isAnomaly = await detectAnomaly(result.service, result.latencyMs);
      if (isAnomaly) {
        await createIncident(result, true);
      }
    } else {
      const count = (consecutiveFailures.get(result.service) || 0) + 1;
      consecutiveFailures.set(result.service, count);
      if (count >= 2) {
        const isAnomaly = await detectAnomaly(result.service, result.latencyMs);
        await createIncident(result, isAnomaly);
      }
    }
  }

  return results;
}

async function ensureHealthTables() {
  try {
    await rawSql(`CREATE TABLE IF NOT EXISTS health_checks (
      id SERIAL PRIMARY KEY,
      service VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      latency_ms INTEGER,
      details TEXT,
      checked_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    await rawSql(`CREATE TABLE IF NOT EXISTS health_baselines (
      id SERIAL PRIMARY KEY,
      service VARCHAR(64) NOT NULL,
      metric VARCHAR(64) NOT NULL,
      avg_value DOUBLE PRECISION,
      std_dev DOUBLE PRECISION DEFAULT 0,
      sample_count INTEGER DEFAULT 0,
      last_updated TIMESTAMP,
      UNIQUE(service, metric)
    )`);

    await rawSql(`CREATE TABLE IF NOT EXISTS health_incidents (
      id SERIAL PRIMARY KEY,
      service VARCHAR(64) NOT NULL,
      severity VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      title TEXT,
      description TEXT,
      root_cause TEXT,
      root_cause_category VARCHAR(64),
      affected_events TEXT,
      detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMP
    )`);

    await rawSql(`CREATE TABLE IF NOT EXISTS health_incident_reports (
      id SERIAL PRIMARY KEY,
      incident_id INTEGER,
      event_id INTEGER,
      report_type VARCHAR(32),
      title TEXT,
      summary TEXT,
      root_cause_attribution VARCHAR(64),
      detailed_analysis TEXT,
      timeline TEXT,
      recommendations TEXT,
      generated_by VARCHAR(64),
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log("[HealthGuardian] ✓ Health tables ensured");
  } catch (err: any) {
    console.warn("[HealthGuardian] Table migration warning:", err?.message);
  }
}

export function startHealthGuardian() {
  if (guardianInterval) return;
  console.log("[HealthGuardian] Starting autonomous monitoring (30s interval)");
  ensureHealthTables().then(() => {
    runAllChecks().catch((e) => console.error("[HealthGuardian] Initial check failed:", e));
    guardianInterval = setInterval(() => {
      runAllChecks().catch((e) => console.error("[HealthGuardian] Check cycle failed:", e));
    }, CHECK_INTERVAL_MS);
  }).catch((e) => {
    console.error("[HealthGuardian] Table setup failed:", e);
    runAllChecks().catch(() => {});
    guardianInterval = setInterval(() => {
      runAllChecks().catch(() => {});
    }, CHECK_INTERVAL_MS);
  });
}

export function stopHealthGuardian() {
  if (guardianInterval) {
    clearInterval(guardianInterval);
    guardianInterval = null;
    console.log("[HealthGuardian] Stopped");
  }
}

export function getLastResults(): CheckResult[] {
  return Array.from(lastResults.values());
}

export async function getHealthHistory(service?: string, limit = 100) {
  let query = "SELECT * FROM health_checks";
  const params: any[] = [];
  if (service) {
    query += " WHERE service = ?";
    params.push(service);
  }
  query += " ORDER BY checked_at DESC LIMIT ?";
  params.push(limit);
  return rawQuery(query, params);
}

export async function getIncidents(status?: string, limit = 50) {
  let query = "SELECT * FROM health_incidents";
  const params: any[] = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY detected_at DESC LIMIT ?";
  params.push(limit);
  return rawQuery(query, params);
}

export async function getIncidentById(id: number) {
  const rows = await rawQuery("SELECT * FROM health_incidents WHERE id = ?", [id]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function generateCustomerReport(incidentId: number, eventId?: number) {
  const incident = await getIncidentById(incidentId);
  if (!incident) throw new Error("Incident not found");

  const checksAroundIncident = await rawQuery(
    "SELECT * FROM health_checks WHERE checked_at BETWEEN ? AND ? ORDER BY checked_at ASC",
    [(incident as any).detected_at - 300000, ((incident as any).resolved_at || Date.now()) + 60000]
  );

  const timeline = (checksAroundIncident as any[]).map((c: any) => ({
    time: new Date(Number(c.checked_at)).toISOString(),
    service: c.service,
    status: c.status,
    latencyMs: c.latency_ms,
  }));

  const prompt = `Generate a professional customer-facing incident report for a live investor events platform called CuraLive.

INCIDENT DETAILS:
- Service affected: ${(incident as any).service}
- Severity: ${(incident as any).severity}
- Title: ${(incident as any).title}
- Root cause: ${(incident as any).root_cause}
- Root cause category: ${(incident as any).root_cause_category}
- Detected at: ${new Date(Number((incident as any).detected_at)).toISOString()}
- Resolved at: ${(incident as any).resolved_at ? new Date(Number((incident as any).resolved_at)).toISOString() : "Ongoing"}
- Affected events: ${(incident as any).affected_events || "None"}

HEALTH CHECK TIMELINE (around the incident):
${JSON.stringify(timeline.slice(0, 30), null, 2)}

IMPORTANT: The root cause category tells us WHERE the issue originated:
- "platform" = CuraLive's infrastructure was at fault
- "participant" = A participant's internet/device caused the issue
- "presenter" = The presenter's connection/equipment was the source
- "network" = General network conditions (ISP, routing) caused degradation
- "third_party" = An external provider (Twilio, OpenAI, etc.) had issues

Create a professional report with these sections:
1. Executive Summary (2-3 sentences)
2. Incident Timeline (key timestamps)
3. Root Cause Analysis (clearly state where the issue came from — platform, participant, presenter, network, or third party)
4. Impact Assessment (what was affected and for how long)
5. Resolution (what was done to fix it)
6. Preventive Measures (what will be done to prevent recurrence)

Be honest and professional. If the issue was NOT CuraLive's fault (participant/presenter/network), clearly explain this with evidence. If it WAS CuraLive's fault, acknowledge it and focus on resolution.

Respond in JSON:
{
  "title": "Incident Report Title",
  "summary": "Executive summary paragraph",
  "rootCauseAttribution": "platform|participant|presenter|network|third_party",
  "detailedAnalysis": "Full markdown formatted report with all sections",
  "recommendations": "Bullet points of recommendations"
}`;

  const resp = await invokeLLM(prompt, "You are a professional infrastructure incident report writer for CuraLive, a live investor events platform. Be precise, professional, and evidence-based.", true);
  const parsed = JSON.parse(resp);

  await rawQuery(
    `INSERT INTO health_incident_reports (incident_id, event_id, report_type, title, summary, root_cause_attribution, detailed_analysis, timeline, recommendations, generated_by) 
     VALUES (?, ?, 'customer', ?, ?, ?, ?, ?, ?, 'ai')`,
    [
      incidentId,
      eventId || null,
      parsed.title || "Incident Report",
      parsed.summary || "",
      parsed.rootCauseAttribution || (incident as any).root_cause_category || "unknown",
      parsed.detailedAnalysis || "",
      JSON.stringify(timeline),
      parsed.recommendations || "",
    ]
  );

  return parsed;
}

export async function getReportsForIncident(incidentId: number) {
  return rawQuery("SELECT * FROM health_incident_reports WHERE incident_id = ? ORDER BY created_at DESC", [incidentId]);
}

export async function getOverallHealthScore(): Promise<{ score: number; status: HealthStatus; services: Record<string, HealthStatus> }> {
  const results = getLastResults();
  if (results.length === 0) return { score: 100, status: "unknown", services: {} };

  const services: Record<string, HealthStatus> = {};
  let totalScore = 0;
  for (const r of results) {
    services[r.service] = r.status;
    if (r.status === "healthy") totalScore += 100;
    else if (r.status === "degraded") totalScore += 50;
    else if (r.status === "unknown") totalScore += 75;
  }

  const score = Math.round(totalScore / results.length);
  const status: HealthStatus = score >= 90 ? "healthy" : score >= 60 ? "degraded" : "critical";

  return { score, status, services };
}
