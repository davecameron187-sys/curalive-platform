import { getDb } from "../server/db";

async function createPlatformSharesTable() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS live_qa_platform_shares (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      platform ENUM('zoom','teams','webex','meet','generic') NOT NULL,
      share_type ENUM('link','embed','widget') NOT NULL DEFAULT 'link',
      share_link VARCHAR(1000) NOT NULL,
      white_label BOOLEAN DEFAULT FALSE,
      brand_name VARCHAR(255),
      brand_color VARCHAR(7),
      click_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session_id (session_id),
      INDEX idx_platform (platform)
    )
  `);

  console.log("live_qa_platform_shares table created successfully");
  process.exit(0);
}

createPlatformSharesTable().catch(err => {
  console.error("Failed to create table:", err);
  process.exit(1);
});
