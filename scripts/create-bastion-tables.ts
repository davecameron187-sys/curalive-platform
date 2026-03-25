// @ts-nocheck
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB connection"); process.exit(1); }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bastion_intelligence_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      shadow_session_id INT,
      client_name VARCHAR(255) NOT NULL,
      event_title VARCHAR(512) NOT NULL,
      event_type ENUM('earnings_call','agm','investor_day','roadshow','capital_markets_day','special_call','other') NOT NULL DEFAULT 'earnings_call',
      event_date VARCHAR(32),
      sector VARCHAR(128),
      ticker VARCHAR(32),
      overall_sentiment FLOAT,
      management_tone_score FLOAT,
      credibility_score FLOAT,
      market_moving_statements INT DEFAULT 0,
      forward_guidance_count INT DEFAULT 0,
      analyst_questions_total INT DEFAULT 0,
      analyst_questions_hostile INT DEFAULT 0,
      investment_brief JSON,
      evolution_observations_generated INT DEFAULT 0,
      status ENUM('setup','live','processing','completed','failed') NOT NULL DEFAULT 'setup',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ bastion_intelligence_sessions created");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bastion_investor_observations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      algorithm_source ENUM('earnings_sentiment','forward_guidance','analyst_question_intel','credibility_scorer','market_moving_detector','investment_brief') NOT NULL,
      observation_type ENUM('prediction_made','risk_detected','compliance_flag','pattern_identified','benchmark_deviation','intervention_suggested') NOT NULL,
      severity ENUM('info','low','medium','high','critical') NOT NULL DEFAULT 'info',
      title VARCHAR(512) NOT NULL,
      detail TEXT NOT NULL,
      confidence FLOAT DEFAULT 0.5,
      raw_data JSON,
      fed_to_evolution BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ bastion_investor_observations created");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bastion_guidance_tracker (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      ticker VARCHAR(32),
      session_id INT NOT NULL,
      guidance_type ENUM('revenue','earnings','margins','capex','headcount','market_share','other') NOT NULL,
      statement TEXT NOT NULL,
      confidence_level ENUM('firm','tentative','aspirational') NOT NULL DEFAULT 'tentative',
      numeric_value VARCHAR(128),
      timeframe VARCHAR(64),
      prior_guidance_id INT,
      prior_value VARCHAR(128),
      delta VARCHAR(64),
      met_or_missed ENUM('met','missed','exceeded','pending') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✓ bastion_guidance_tracker created");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bastion_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      client_name VARCHAR(255) NOT NULL,
      event_title VARCHAR(512) NOT NULL,
      event_type ENUM('earnings_call','agm','investor_day','roadshow','capital_markets_day','special_call','other') NOT NULL DEFAULT 'earnings_call',
      event_date VARCHAR(32),
      event_time VARCHAR(16),
      sector VARCHAR(128),
      ticker VARCHAR(32),
      expected_attendees INT,
      meeting_url VARCHAR(1000),
      platform ENUM('zoom','teams','meet','webex','webphone','other') NOT NULL DEFAULT 'zoom',
      contact_name VARCHAR(255),
      contact_email VARCHAR(255),
      bastion_reference VARCHAR(128),
      confirmation_recipients TEXT,
      confirmation_sent_at TIMESTAMP NULL,
      dashboard_token VARCHAR(64) NOT NULL,
      status ENUM('booked','setup','ready','live','completed','cancelled') NOT NULL DEFAULT 'booked',
      checklist JSON,
      shadow_session_id INT,
      bastion_session_id INT,
      notes TEXT,
      report_delivered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_dashboard_token (dashboard_token)
    )
  `);
  console.log("✓ bastion_bookings created");

  console.log("\n✅ All Bastion tables created successfully");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
