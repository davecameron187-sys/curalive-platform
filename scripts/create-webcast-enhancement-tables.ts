import { getDb } from "../server/db";

const tables = [
  `CREATE TABLE IF NOT EXISTS webcast_enhancements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL,
    personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    xr_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    language_dubbing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    dubbing_language VARCHAR(32) NOT NULL DEFAULT 'en',
    sustainability_score FLOAT NOT NULL DEFAULT 0,
    ad_integration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ad_pre_roll_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ad_mid_roll_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    noise_enhancement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    noise_gate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    echo_cancellation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_gain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    podcast_generated_at TIMESTAMP NULL,
    podcast_title VARCHAR(512) NULL,
    podcast_script LONGTEXT NULL,
    recap_generated_at TIMESTAMP NULL,
    recap_brief LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_we_event_id (event_id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS webcast_analytics_expanded (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL,
    viewer_engagement FLOAT NOT NULL DEFAULT 0,
    roi_uplift FLOAT NOT NULL DEFAULT 0,
    carbon_footprint_kg FLOAT NOT NULL DEFAULT 0,
    carbon_saved_kg FLOAT NOT NULL DEFAULT 0,
    attendees_travel_avoided INT NOT NULL DEFAULT 0,
    ad_revenue FLOAT NOT NULL DEFAULT 0,
    podcast_listens INT NOT NULL DEFAULT 0,
    recap_views INT NOT NULL DEFAULT 0,
    sustainability_grade VARCHAR(4) NOT NULL DEFAULT 'B',
    collected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_wae_event_id (event_id)
  ) ENGINE=InnoDB`,
];

async function main() {
  const db = await getDb();
  if (!db) { console.log("No DB connection"); process.exit(1); }
  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "unknown";
    try {
      await db.execute(sql);
      console.log("OK  " + tableName);
    } catch (e: any) {
      console.log("ERR " + tableName + ": " + (e.message ?? "").slice(0, 120));
    }
  }
  console.log("Done");
  process.exit(0);
}

main();
