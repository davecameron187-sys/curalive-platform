import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mysql2 = require("mysql2/promise");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const conn = await mysql2.createConnection(url);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS conference_dialouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      conference_name VARCHAR(128) NOT NULL,
      caller_id VARCHAR(32) NOT NULL,
      total_participants INT NOT NULL DEFAULT 0,
      connected_count INT NOT NULL DEFAULT 0,
      failed_count INT NOT NULL DEFAULT 0,
      status ENUM('pending','dialling','active','completed','cancelled') NOT NULL DEFAULT 'pending',
      created_at BIGINT NOT NULL,
      ended_at BIGINT
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS conference_dialout_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dialout_id INT NOT NULL,
      phone_number VARCHAR(32) NOT NULL,
      label VARCHAR(255),
      call_sid VARCHAR(128),
      status ENUM('queued','ringing','in-progress','completed','busy','no-answer','failed','cancelled') NOT NULL DEFAULT 'queued',
      duration_secs INT,
      answered_at BIGINT,
      ended_at BIGINT,
      error_message VARCHAR(512),
      INDEX idx_dialout_id (dialout_id)
    )
  `);

  console.log("conference_dialouts + conference_dialout_participants tables created");
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
