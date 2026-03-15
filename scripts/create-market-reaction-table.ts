import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS market_reaction_correlations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  company_name VARCHAR(255) NOT NULL,
  ticker VARCHAR(20),
  event_type ENUM('earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') NOT NULL DEFAULT 'earnings_call',
  event_date DATE,
  sentiment_score FLOAT,
  compliance_flags INT DEFAULT 0,
  executive_confidence_score FLOAT,
  qa_difficulty_score FLOAT,
  transcript_segments INT DEFAULT 0,
  key_topics TEXT,
  guidance_discussed TINYINT(1) DEFAULT 0,
  revenue_discussed TINYINT(1) DEFAULT 0,
  margin_discussed TINYINT(1) DEFAULT 0,
  price_pre_event FLOAT,
  price_post_24h FLOAT,
  price_post_48h FLOAT,
  price_post_7d FLOAT,
  market_reaction ENUM('strongly_positive','positive','neutral','negative','strongly_negative'),
  reaction_magnitude FLOAT,
  prediction_score FLOAT,
  prediction_direction ENUM('positive','neutral','negative'),
  prediction_confidence FLOAT,
  ai_insight TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_ticker (ticker),
  INDEX idx_event_type (event_type),
  INDEX idx_market_reaction (market_reaction),
  INDEX idx_created (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db!.execute(sql.raw(table));
  console.log("✓ market_reaction_correlations table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
