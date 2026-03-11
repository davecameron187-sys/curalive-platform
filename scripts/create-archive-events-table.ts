import { getDb } from "../server/db";

async function createArchiveEventsTable() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS archive_events (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      event_type ENUM('earnings_call','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') NOT NULL,
      event_date VARCHAR(32),
      platform VARCHAR(64),
      transcript_text LONGTEXT NOT NULL,
      word_count INT DEFAULT 0,
      segment_count INT DEFAULT 0,
      sentiment_avg FLOAT,
      compliance_flags INT DEFAULT 0,
      tagged_metrics_generated INT DEFAULT 0,
      status ENUM('processing','completed','failed') NOT NULL DEFAULT 'processing',
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ archive_events table created (or already exists)");
  process.exit(0);
}

createArchiveEventsTable().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
