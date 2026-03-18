import { getDb } from "../server/db";

async function createWebcastArchiveTables() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS webcast_archive_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL DEFAULT 0,
      client_name VARCHAR(255) NOT NULL,
      event_title VARCHAR(255) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      event_date VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ webcast_archive_sessions table created");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS webcast_archive_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      algorithm_name VARCHAR(100) NOT NULL,
      result_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id),
      INDEX idx_algorithm (algorithm_name)
    )
  `);
  console.log("✓ webcast_archive_results table created");

  console.log("Done — webcast archive tables ready");
  process.exit(0);
}

createWebcastArchiveTables().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
