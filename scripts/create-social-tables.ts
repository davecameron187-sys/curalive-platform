import { getDb } from "../server/db";

const tables = [
  `CREATE TABLE IF NOT EXISTS social_media_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    platform ENUM('linkedin','twitter','facebook','instagram','tiktok') NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_handle VARCHAR(255),
    avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NULL,
    linked_events TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_platform_account (platform, account_id),
    INDEX idx_user_id (user_id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    created_by INT NOT NULL,
    content LONGTEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT FALSE NOT NULL,
    echo_source VARCHAR(64),
    content_type ENUM('text','image','video','link') DEFAULT 'text' NOT NULL,
    platforms TEXT NOT NULL,
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    status ENUM('draft','pending_approval','approved','scheduled','published','failed') DEFAULT 'draft' NOT NULL,
    moderation_status ENUM('pending','approved','flagged','rejected') DEFAULT 'pending' NOT NULL,
    moderation_notes TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS social_post_platforms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    account_id INT NOT NULL,
    platform ENUM('linkedin','twitter','facebook','instagram','tiktok') NOT NULL,
    external_post_id VARCHAR(255),
    publish_status ENUM('pending','published','failed') DEFAULT 'pending' NOT NULL,
    published_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_post_id (post_id),
    INDEX idx_account_id (account_id)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS social_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    account_id INT NOT NULL,
    platform ENUM('linkedin','twitter','facebook','instagram','tiktok') NOT NULL,
    views INT DEFAULT 0 NOT NULL,
    likes INT DEFAULT 0 NOT NULL,
    shares INT DEFAULT 0 NOT NULL,
    comments INT DEFAULT 0 NOT NULL,
    clicks INT DEFAULT 0 NOT NULL,
    engagement_rate FLOAT DEFAULT 0 NOT NULL,
    roi_correlation FLOAT DEFAULT 0 NOT NULL,
    ai_insight TEXT,
    collected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_post_id (post_id),
    INDEX idx_collected_at (collected_at)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS social_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT,
    action VARCHAR(64) NOT NULL,
    platform VARCHAR(32),
    details TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_post_id (post_id)
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
