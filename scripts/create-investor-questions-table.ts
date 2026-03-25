import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS investor_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  company_name VARCHAR(255),
  sector VARCHAR(128),
  event_type ENUM('earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') DEFAULT 'earnings_call',
  event_quarter VARCHAR(16),
  investor_name VARCHAR(255),
  investor_firm VARCHAR(255),
  question_text TEXT NOT NULL,
  response_text TEXT,
  question_topic VARCHAR(128),
  topic_category ENUM(
    'revenue_guidance','margin_pressure','supply_chain','ai_infrastructure',
    'capital_allocation','esg','governance','debt_leverage','growth_strategy',
    'market_conditions','management','competition','regulatory','other'
  ) DEFAULT 'other',
  question_sentiment ENUM('positive','neutral','negative') DEFAULT 'neutral',
  difficulty_score FLOAT,
  response_sentiment ENUM('strong','adequate','weak','deflected') DEFAULT 'adequate',
  response_length_words INT DEFAULT 0,
  avoidance_detected TINYINT(1) DEFAULT 0,
  avoidance_score FLOAT DEFAULT 0,
  avoidance_reason VARCHAR(500),
  follow_up_count INT DEFAULT 0,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_company (company_name),
  INDEX idx_sector (sector),
  INDEX idx_topic_category (topic_category),
  INDEX idx_event_quarter (event_quarter),
  INDEX idx_difficulty (difficulty_score),
  INDEX idx_avoidance (avoidance_detected),
  INDEX idx_created (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db!.execute(sql.raw(table));
  console.log("✓ investor_questions table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
