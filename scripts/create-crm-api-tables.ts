import { getDb } from "../server/db";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }
  const conn = (db as any).session?.client ?? (db as any).$client;
  if (!conn) { console.error("No DB connection"); process.exit(1); }

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS crm_api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_hash VARCHAR(128) NOT NULL,
      key_prefix VARCHAR(12) NOT NULL,
      name VARCHAR(255) NOT NULL,
      event_id VARCHAR(128),
      permissions JSON NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      last_used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_crm_key_hash (key_hash),
      INDEX idx_crm_key_event (event_id)
    )
  `);
  console.log("Created crm_api_keys table");

  await conn.execute(`
    ALTER TABLE mailing_lists
    ADD COLUMN webhook_url VARCHAR(512) NULL DEFAULT NULL
  `).catch((e: any) => {
    if (e.message?.includes("Duplicate column")) console.log("webhook_url already exists");
    else throw e;
  });
  console.log("Added webhook_url to mailing_lists");

  await conn.execute(`
    ALTER TABLE mailing_lists
    ADD COLUMN default_join_method ENUM('phone','teams','zoom','web') NULL DEFAULT NULL
  `).catch((e: any) => {
    if (e.message?.includes("Duplicate column")) console.log("default_join_method already exists");
    else throw e;
  });
  console.log("Added default_join_method to mailing_lists");

  await conn.execute(`
    ALTER TABLE mailing_lists
    ADD COLUMN pre_registered TINYINT(1) NOT NULL DEFAULT 0
  `).catch((e: any) => {
    if (e.message?.includes("Duplicate column")) console.log("pre_registered already exists");
    else throw e;
  });
  console.log("Added pre_registered to mailing_lists");

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
