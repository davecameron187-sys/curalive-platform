import "dotenv/config";
import { getDb } from "../server/db";

async function createSupportTables() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  console.log("Creating knowledge_entries table...");
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      source VARCHAR(200),
      keywords TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Creating support_queries table...");
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS support_queries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id VARCHAR(100),
      user_message TEXT NOT NULL,
      ai_response TEXT,
      needs_escalation TINYINT(1) DEFAULT 0,
      matched_entries TEXT,
      session_id VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Support tables created successfully.");
  process.exit(0);
}

createSupportTables().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
