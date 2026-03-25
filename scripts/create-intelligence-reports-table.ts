import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS intelligence_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  sector VARCHAR(128),
  event_type ENUM('earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') DEFAULT 'earnings_call',
  event_quarter VARCHAR(16),
  report_date DATE,
  sentiment_score FLOAT,
  communication_score FLOAT,
  cici_score FLOAT,
  question_difficulty_avg FLOAT,
  total_questions INT DEFAULT 0,
  high_difficulty_count INT DEFAULT 0,
  avoidance_events INT DEFAULT 0,
  market_reaction ENUM('positive','neutral','negative') DEFAULT 'neutral',
  top_concerns JSON,
  executive_scores JSON,
  key_insights JSON,
  risk_flags JSON,
  executive_summary TEXT,
  recommendations TEXT,
  full_report_json LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_company (company_name),
  INDEX idx_sector (sector),
  INDEX idx_quarter (event_quarter),
  INDEX idx_created (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db!.execute(sql.raw(table));
  console.log("✓ intelligence_reports table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
