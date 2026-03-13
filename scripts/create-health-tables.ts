import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const tables = [
  `CREATE TABLE IF NOT EXISTS health_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    latency_ms INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    checked_at BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_health_service (service),
    INDEX idx_health_status (status),
    INDEX idx_health_checked (checked_at)
  )`,

  `CREATE TABLE IF NOT EXISTS health_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    root_cause TEXT DEFAULT NULL,
    root_cause_category VARCHAR(50) DEFAULT NULL,
    affected_events JSON DEFAULT NULL,
    resolution TEXT DEFAULT NULL,
    detected_at BIGINT NOT NULL,
    resolved_at BIGINT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_incident_service (service),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_status (status),
    INDEX idx_incident_detected (detected_at)
  )`,

  `CREATE TABLE IF NOT EXISTS health_incident_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    event_id INT DEFAULT NULL,
    report_type VARCHAR(30) NOT NULL DEFAULT 'customer',
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    root_cause_attribution VARCHAR(50) NOT NULL,
    detailed_analysis TEXT NOT NULL,
    timeline JSON DEFAULT NULL,
    recommendations TEXT DEFAULT NULL,
    generated_by VARCHAR(20) NOT NULL DEFAULT 'ai',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_incident (incident_id),
    INDEX idx_report_event (event_id)
  )`,

  `CREATE TABLE IF NOT EXISTS health_baselines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service VARCHAR(50) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    avg_value DOUBLE NOT NULL DEFAULT 0,
    std_dev DOUBLE NOT NULL DEFAULT 0,
    sample_count INT NOT NULL DEFAULT 0,
    last_updated BIGINT NOT NULL,
    UNIQUE KEY uq_baseline (service, metric)
  )`
];

async function run() {
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }
  for (const ddl of tables) {
    const name = ddl.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    await (db as any).execute(sql.raw(ddl));
    console.log(`Created table: ${name}`);
  }
  console.log("Done — health tables created.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
