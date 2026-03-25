import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const tables = [
  `CREATE TABLE IF NOT EXISTS interconnection_activations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128),
    user_id INT NOT NULL DEFAULT 0,
    feature_id VARCHAR(64) NOT NULL,
    connected_feature_id VARCHAR(64) NOT NULL,
    activation_source VARCHAR(32) NOT NULL DEFAULT 'manual',
    roi_multiplier FLOAT NOT NULL DEFAULT 1.0,
    activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_feature_id (feature_id),
    INDEX idx_event_id (event_id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS interconnection_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date VARCHAR(16) NOT NULL,
    total_activations INT NOT NULL DEFAULT 0,
    unique_features INT NOT NULL DEFAULT 0,
    avg_connections_per_user FLOAT NOT NULL DEFAULT 0,
    top_feature_id VARCHAR(64),
    roi_realized FLOAT NOT NULL DEFAULT 0,
    workflow_completion_rate FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_date (date)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS virtual_studios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL,
    bundle_id VARCHAR(8) NOT NULL,
    studio_name VARCHAR(255) NOT NULL DEFAULT 'My Virtual Studio',
    avatar_style VARCHAR(32) NOT NULL DEFAULT 'professional',
    primary_language VARCHAR(8) NOT NULL DEFAULT 'en',
    dubbing_languages TEXT,
    esg_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    replay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    overlays_config LONGTEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_id (event_id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS esg_studio_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studio_id INT NOT NULL,
    flag_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'medium',
    content_snippet TEXT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_studio_id (studio_id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS studio_interconnections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studio_id INT NOT NULL,
    feature_id VARCHAR(64) NOT NULL,
    connected_feature_id VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    active_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_studio_id (studio_id)
  ) ENGINE=InnoDB`,
];

async function run() {
  const db = await getDb();
  for (const t of tables) {
    try {
      await db.execute(sql.raw(t));
      const name = t.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] ?? "?";
      console.log(`✓ ${name}`);
    } catch (e: any) {
      console.error(`✗ error:`, e.message);
    }
  }
  console.log("done");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
