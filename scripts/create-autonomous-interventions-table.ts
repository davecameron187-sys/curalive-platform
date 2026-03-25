import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS autonomous_interventions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(128),
  conference_id VARCHAR(128),
  rule_id VARCHAR(64) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  trigger_value FLOAT,
  threshold FLOAT,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
  bundle_triggered VARCHAR(64),
  action_taken TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMP NULL,
  outcome TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_event_id (event_id),
  INDEX idx_conference_id (conference_id),
  INDEX idx_acknowledged (acknowledged),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db.execute(sql.raw(table));
  console.log("✓ autonomous_interventions table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
