import { getDb } from "../server/db";

async function createCip4Tables() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  const tables = [
    `CREATE TABLE IF NOT EXISTS disclosure_certificates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL,
      session_id INT,
      client_name VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      transcript_hash VARCHAR(128) NOT NULL,
      report_hash VARCHAR(128) NOT NULL,
      compliance_status ENUM('clean','flagged','review_required') DEFAULT 'clean' NOT NULL,
      compliance_flags INT DEFAULT 0,
      jurisdictions JSON,
      hash_chain JSON,
      previous_cert_hash VARCHAR(128),
      certificate_hash VARCHAR(128) NOT NULL,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS crisis_predictions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT,
      event_id VARCHAR(128),
      client_name VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      risk_level ENUM('low','moderate','elevated','high','critical') DEFAULT 'low' NOT NULL,
      risk_score FLOAT DEFAULT 0,
      predicted_crisis_type VARCHAR(128),
      indicators JSON,
      sentiment_trajectory JSON,
      holding_statement TEXT,
      regulatory_checklist JSON,
      alert_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS valuation_impacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      prior_sentiment FLOAT,
      post_sentiment FLOAT,
      sentiment_delta FLOAT,
      predicted_share_impact VARCHAR(64),
      fair_value_gap VARCHAR(64),
      material_disclosures JSON,
      risk_factors JSON,
      analyst_consensus_impact VARCHAR(128),
      market_reaction_prediction TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS monthly_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_month VARCHAR(7) NOT NULL,
      client_name VARCHAR(255),
      total_events INT DEFAULT 0,
      avg_sentiment FLOAT,
      total_compliance_flags INT DEFAULT 0,
      communication_health_score FLOAT,
      report_data JSON,
      status ENUM('generating','completed','failed') DEFAULT 'generating' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS advisory_chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_key VARCHAR(128) NOT NULL,
      role ENUM('user','assistant') NOT NULL,
      content TEXT NOT NULL,
      event_ids JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS evolution_audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action_type ENUM('tool_proposed','shadow_test_started','shadow_test_passed','shadow_test_failed','tool_deployed','tool_deactivated','tool_promoted','roadmap_updated') NOT NULL,
      proposal_id INT,
      proposal_title VARCHAR(255),
      details JSON,
      blockchain_hash VARCHAR(128),
      previous_hash VARCHAR(128),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS capability_roadmap (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timeframe ENUM('30_days','60_days','90_days') NOT NULL,
      capability VARCHAR(255) NOT NULL,
      rationale TEXT,
      gap_score FLOAT,
      priority ENUM('low','medium','high','critical') DEFAULT 'medium' NOT NULL,
      status ENUM('predicted','in_progress','completed','dismissed') DEFAULT 'predicted' NOT NULL,
      proposal_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
  ];

  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
    try {
      await conn.execute(sql);
      console.log(`✓ ${tableName}`);
    } catch (err: any) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log(`○ ${tableName} (already exists)`);
      } else {
        console.error(`✗ ${tableName}:`, err.message);
      }
    }
  }

  console.log("\nAll CIP 4 tables created.");
  process.exit(0);
}

createCip4Tables();
