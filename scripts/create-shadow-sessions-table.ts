import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS shadow_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_type ENUM('earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') NOT NULL,
  platform ENUM('zoom','teams','meet','webex','other') NOT NULL DEFAULT 'zoom',
  meeting_url VARCHAR(1000) NOT NULL,
  recall_bot_id VARCHAR(255),
  ably_channel VARCHAR(255),
  status ENUM('pending','bot_joining','live','processing','completed','failed') NOT NULL DEFAULT 'pending',
  transcript_segments INT DEFAULT 0,
  sentiment_avg FLOAT,
  compliance_flags INT DEFAULT 0,
  tagged_metrics_generated INT DEFAULT 0,
  notes TEXT,
  started_at BIGINT,
  ended_at BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_status (status),
  INDEX idx_client (client_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db.execute(sql.raw(table));
  console.log("✓ shadow_sessions table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
