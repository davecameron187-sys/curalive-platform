// @ts-nocheck
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB connection"); process.exit(1); }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lumi_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      client_name VARCHAR(255) NOT NULL,
      agm_title VARCHAR(512) NOT NULL,
      agm_date VARCHAR(32),
      agm_time VARCHAR(16),
      jurisdiction ENUM('south_africa','united_kingdom','united_states','australia','other') NOT NULL DEFAULT 'south_africa',
      expected_attendees INT,
      meeting_url VARCHAR(1000),
      platform ENUM('zoom','teams','meet','webex','webphone','other') NOT NULL DEFAULT 'zoom',
      contact_name VARCHAR(255),
      contact_email VARCHAR(255),
      lumi_reference VARCHAR(128),
      dashboard_token VARCHAR(64) NOT NULL,
      status ENUM('booked','setup','ready','live','completed','cancelled') NOT NULL DEFAULT 'booked',
      checklist JSON,
      shadow_session_id INT,
      agm_session_id INT,
      notes TEXT,
      resolutions_json JSON,
      report_delivered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_dashboard_token (dashboard_token)
    )
  `);
  console.log("✓ lumi_bookings table created");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
