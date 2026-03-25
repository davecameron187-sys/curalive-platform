import { getDb } from "../server/db";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }
  const conn = (db as any).session?.client ?? (db as any).$client;
  if (!conn) { console.error("No DB connection"); process.exit(1); }

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mailing_lists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL,
      name VARCHAR(255) NOT NULL,
      status ENUM('draft','processing','ready','sending','sent') NOT NULL DEFAULT 'draft',
      total_entries INT NOT NULL DEFAULT 0,
      processed_entries INT NOT NULL DEFAULT 0,
      emailed_entries INT NOT NULL DEFAULT 0,
      registered_entries INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_mailing_lists_event (event_id)
    )
  `);
  console.log("Created mailing_lists table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mailing_list_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mailing_list_id INT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL,
      company VARCHAR(255),
      job_title VARCHAR(255),
      access_pin VARCHAR(8),
      status ENUM('pending','pin_assigned','emailed','clicked','registered') NOT NULL DEFAULT 'pending',
      registration_id INT,
      confirm_token VARCHAR(64),
      email_sent_at TIMESTAMP NULL,
      clicked_at TIMESTAMP NULL,
      registered_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_mle_list (mailing_list_id),
      INDEX idx_mle_email (email),
      INDEX idx_mle_token (confirm_token),
      INDEX idx_mle_pin (access_pin)
    )
  `);
  console.log("Created mailing_list_entries table");
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
