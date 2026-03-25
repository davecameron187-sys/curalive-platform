import { getDb } from "../server/db";

const tables = [
  `CREATE TABLE IF NOT EXISTS materiality_risk_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    statement_text TEXT NOT NULL,
    materiality_score DECIMAL(5,3) NOT NULL,
    filing_required TINYINT(1) NOT NULL DEFAULT 0,
    filing_type VARCHAR(50) NOT NULL DEFAULT 'none',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
    mnpi_indicators JSON,
    draft_filing JSON,
    explanation TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS investor_intent_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    question_text TEXT NOT NULL,
    investor_name VARCHAR(200),
    primary_intent VARCHAR(100) NOT NULL,
    confidence DECIMAL(5,3) NOT NULL,
    aggression_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
    intent_badge VARCHAR(100),
    hidden_agenda TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS consistency_check_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    statement_text TEXT NOT NULL,
    consistency_score DECIMAL(5,3) NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
    contradictions_count INT NOT NULL DEFAULT 0,
    messaging_drift TEXT,
    corrective_language TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS volatility_simulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    base_case_move DECIMAL(8,3),
    bull_case_move DECIMAL(8,3),
    bear_case_move DECIMAL(8,3),
    expected_volatility DECIMAL(8,3),
    guidance_signal VARCHAR(50),
    tone_impact DECIMAL(5,3),
    simulations_data JSON,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS regulatory_evolution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    evolution_stage VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,3) NOT NULL,
    deployment_recommendation VARCHAR(50),
    threshold_adjustments_count INT NOT NULL DEFAULT 0,
    classifier_updates_count INT NOT NULL DEFAULT 0,
    false_positive_reduction DECIMAL(8,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS event_integrity_twins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    twin_hash VARCHAR(128) NOT NULL,
    integrity_score DECIMAL(5,3) NOT NULL,
    certificate_grade VARCHAR(10) NOT NULL DEFAULT 'NR',
    chain_length INT NOT NULL DEFAULT 0,
    disclosure_completeness DECIMAL(5,1),
    regulatory_compliance DECIMAL(5,1),
    certificate_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  for (const sql of tables) {
    const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
    try {
      await (db as any).execute(sql);
      console.log(`✅ ${name}`);
    } catch (e: any) {
      console.error(`❌ ${name}:`, e.message);
    }
  }
  console.log("Done.");
  process.exit(0);
}

main();
