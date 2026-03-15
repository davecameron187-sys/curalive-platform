import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS call_preparations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  sector VARCHAR(128),
  event_type ENUM('earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') DEFAULT 'earnings_call',
  event_quarter VARCHAR(16),
  key_announcements TEXT,
  financial_performance ENUM('strong','positive','mixed','challenging','difficult') DEFAULT 'mixed',
  known_sensitivities TEXT,
  difficulty_forecast FLOAT,
  predicted_questions JSON,
  top_concerns JSON,
  risk_areas JSON,
  communication_tips JSON,
  executive_briefing TEXT,
  full_briefing_json LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_company (company_name),
  INDEX idx_sector (sector),
  INDEX idx_quarter (event_quarter),
  INDEX idx_created (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db!.execute(sql.raw(table));
  console.log("✓ call_preparations table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
