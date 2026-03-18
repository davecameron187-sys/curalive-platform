import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function createAgmTables() {
  const db = await getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agm_resolutions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      resolution_number INT NOT NULL,
      title VARCHAR(512) NOT NULL,
      category ENUM('ordinary','special','advisory','remuneration','board_election','auditor_appointment','share_repurchase','dividend','esg','other') NOT NULL DEFAULT 'ordinary',
      proposed_by VARCHAR(255),
      sentiment_during_debate FLOAT,
      predicted_approval_pct FLOAT,
      actual_approval_pct FLOAT,
      prediction_accuracy FLOAT,
      dissenter_count INT DEFAULT 0,
      compliance_flags JSON,
      ai_analysis JSON,
      status ENUM('pending','debating','voted','carried','defeated','withdrawn') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ agm_resolutions");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agm_intelligence_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      shadow_session_id INT,
      client_name VARCHAR(255) NOT NULL,
      agm_title VARCHAR(512) NOT NULL,
      agm_date VARCHAR(32),
      jurisdiction ENUM('south_africa','united_kingdom','united_states','australia','other') NOT NULL DEFAULT 'south_africa',
      total_resolutions INT DEFAULT 0,
      resolutions_carried INT DEFAULT 0,
      resolutions_defeated INT DEFAULT 0,
      quorum_met BOOLEAN DEFAULT FALSE,
      quorum_percentage FLOAT,
      attendance_count INT DEFAULT 0,
      proxy_count INT DEFAULT 0,
      overall_sentiment FLOAT,
      governance_score FLOAT,
      dissent_index FLOAT,
      regulatory_alerts INT DEFAULT 0,
      qa_questions_total INT DEFAULT 0,
      qa_questions_governance INT DEFAULT 0,
      ai_governance_report JSON,
      evolution_observations_generated INT DEFAULT 0,
      status ENUM('setup','live','processing','completed','failed') NOT NULL DEFAULT 'setup',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ agm_intelligence_sessions");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agm_dissent_patterns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      pattern_type ENUM('recurring_dissenter','category_dissent','threshold_breach','institutional_block','cross_client_trend','emerging_risk') NOT NULL,
      category VARCHAR(128),
      description TEXT NOT NULL,
      frequency INT DEFAULT 1,
      confidence FLOAT DEFAULT 0.5,
      first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      session_ids JSON,
      evidence_data JSON,
      action_recommendation TEXT,
      decayed_score FLOAT DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ agm_dissent_patterns");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agm_governance_observations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      algorithm_source ENUM('resolution_sentiment','dissent_pattern','qa_governance_triage','quorum_intelligence','regulatory_guardian','governance_report') NOT NULL,
      observation_type ENUM('prediction_made','risk_detected','compliance_flag','pattern_identified','benchmark_deviation','intervention_suggested') NOT NULL,
      severity ENUM('info','low','medium','high','critical') NOT NULL DEFAULT 'info',
      title VARCHAR(512) NOT NULL,
      detail TEXT NOT NULL,
      confidence FLOAT DEFAULT 0.5,
      related_resolution_id INT,
      raw_data JSON,
      fed_to_evolution BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ agm_governance_observations");

  console.log("\n✓ All AGM tables created successfully");
  process.exit(0);
}

createAgmTables().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
