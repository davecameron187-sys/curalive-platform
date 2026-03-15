import { getDb } from "../server/db";

async function run() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS aggregate_intelligence (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(64) NOT NULL,
      sentiment_score FLOAT,
      engagement_level ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
      compliance_risk ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
      word_count_range VARCHAR(32) NOT NULL DEFAULT 'unknown',
      event_quarter VARCHAR(16),
      source_type ENUM('live_session','archive_upload') NOT NULL DEFAULT 'archive_upload',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ aggregate_intelligence table created (or already exists)");
  process.exit(0);
}

run().catch(err => { console.error("❌", err); process.exit(1); });
