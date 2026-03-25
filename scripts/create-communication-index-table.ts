import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS communication_index_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quarter VARCHAR(16) NOT NULL,
  cici_score FLOAT NOT NULL,
  communication_quality_score FLOAT,
  investor_engagement_score FLOAT,
  compliance_quality_score FLOAT,
  market_confidence_score FLOAT,
  total_events INT DEFAULT 0,
  live_events INT DEFAULT 0,
  archive_events INT DEFAULT 0,
  avg_sentiment FLOAT,
  high_engagement_pct FLOAT,
  low_compliance_risk_pct FLOAT,
  positive_market_pct FLOAT,
  sector_breakdown JSON,
  event_type_breakdown JSON,
  top_signal TEXT,
  ai_commentary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_quarter (quarter)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db!.execute(sql.raw(table));
  console.log("✓ communication_index_snapshots table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
