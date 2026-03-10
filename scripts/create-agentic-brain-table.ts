import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS agentic_analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(128),
  q1_role VARCHAR(64) NOT NULL,
  q2_challenge VARCHAR(64) NOT NULL,
  q3_event_type VARCHAR(64) NOT NULL,
  primary_bundle VARCHAR(64) NOT NULL,
  bundle_letter VARCHAR(4) NOT NULL,
  score FLOAT NOT NULL,
  ai_action LONGTEXT,
  roi_preview VARCHAR(255),
  interconnections TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB`;

async function main() {
  const db = await getDb();
  await db.execute(sql.raw(table));
  console.log("✓ agentic_analyses table created");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
