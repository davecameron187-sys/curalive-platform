import { getDb } from "../server/db";

async function createComplianceEngineTables() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS compliance_threats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      threat_type ENUM('fraud', 'access_anomaly', 'data_exfiltration', 'policy_violation', 'regulatory_breach', 'predictive_warning') NOT NULL,
      severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
      status ENUM('detected', 'investigating', 'confirmed', 'mitigated', 'false_positive') NOT NULL DEFAULT 'detected',
      event_id VARCHAR(128),
      source_system VARCHAR(64) NOT NULL,
      title VARCHAR(512) NOT NULL,
      description TEXT,
      evidence JSON,
      affected_entities JSON,
      ai_confidence FLOAT DEFAULT 0,
      ai_reasoning TEXT,
      remediation_action VARCHAR(255),
      remediation_taken_at TIMESTAMP NULL,
      detected_by VARCHAR(64) NOT NULL DEFAULT 'compliance_engine',
      reviewed_by INT,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("Created compliance_threats table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS compliance_framework_checks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      framework ENUM('iso27001', 'soc2') NOT NULL,
      control_ref VARCHAR(20) NOT NULL,
      control_name VARCHAR(255) NOT NULL,
      check_type ENUM('automated', 'manual', 'ai_assessed') NOT NULL DEFAULT 'automated',
      status ENUM('passing', 'failing', 'warning', 'not_assessed') NOT NULL DEFAULT 'not_assessed',
      last_checked_at TIMESTAMP NULL,
      details TEXT,
      evidence JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("Created compliance_framework_checks table");

  console.log("All compliance engine tables created successfully");
  process.exit(0);
}

createComplianceEngineTables().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
