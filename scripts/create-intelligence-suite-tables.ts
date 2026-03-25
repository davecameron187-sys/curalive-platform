import { getDb } from "../server/db";

const tables = [
  `CREATE TABLE IF NOT EXISTS evasiveness_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    question_text TEXT,
    response_text TEXT,
    score DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    directness_index INT NOT NULL DEFAULT 50,
    explanation TEXT,
    flags JSON,
    hedging_phrases JSON,
    topic_shift_detected TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_evasiveness_event (event_id),
    INDEX idx_evasiveness_session (session_id),
    INDEX idx_evasiveness_score (score)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS market_impact_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    predicted_volatility DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    direction VARCHAR(20) NOT NULL DEFAULT 'neutral',
    confidence DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    reasoning TEXT,
    risk_factors JSON,
    catalysts JSON,
    time_horizon VARCHAR(20) DEFAULT '2-3 days',
    historical_comparison TEXT,
    input_sentiment DECIMAL(4,3),
    input_topics JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_market_impact_event (event_id),
    INDEX idx_market_impact_session (session_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS compliance_risk_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    overall_risk DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    text_risk DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    tone_risk DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    behavioral_risk DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    selective_disclosure_risk DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    regulatory_flags JSON,
    violations JSON,
    recommendations JSON,
    insider_trading_indicators JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_compliance_event (event_id),
    INDEX idx_compliance_session (session_id),
    INDEX idx_compliance_risk (overall_risk)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS external_sentiment_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    aggregated_sentiment DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    social_mentions INT NOT NULL DEFAULT 0,
    sentiment_breakdown JSON,
    top_themes JSON,
    crowd_reaction VARCHAR(20) DEFAULT 'mixed',
    divergence_from_call DECIMAL(4,3) DEFAULT 0.000,
    early_warnings JSON,
    influencer_sentiment TEXT,
    media_reactions JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_external_sentiment_event (event_id),
    INDEX idx_external_sentiment_session (session_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ir_briefings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    session_id INT NOT NULL,
    stakeholder_type VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    executive_summary TEXT,
    briefing_data JSON,
    confidence_level DECIMAL(4,3) DEFAULT 0.000,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_briefings_event (event_id),
    INDEX idx_briefings_session (session_id),
    INDEX idx_briefings_stakeholder (stakeholder_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function main() {
  const db = await getDb();
  if (!db) { console.log("No DB connection"); process.exit(1); }
  console.log("[IntelligenceSuite] Creating 5 intelligence suite tables...");
  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
    try {
      await db.execute(sql);
      console.log("  ✓ " + tableName);
    } catch (e: any) {
      console.log("  ✗ " + tableName + ": " + (e.message ?? "").slice(0, 80));
    }
  }
  console.log("[IntelligenceSuite] Done!");
  process.exit(0);
}

main();
