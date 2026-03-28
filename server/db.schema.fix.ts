/**
 * Database Schema Fix Script
 * Resolves schema drift by creating essential tables for production
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";

export async function fixDatabaseSchema() {
  console.log("[DB Schema] Starting schema fix...");

  try {
    const db = await getDb();
    if (!db) throw new Error("Failed to initialize database");

    // Create operator_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS operator_sessions (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        operator_id VARCHAR(255) NOT NULL,
        status ENUM('pending', 'running', 'paused', 'ended') NOT NULL DEFAULT 'pending',
        started_at BIGINT,
        paused_at BIGINT,
        resumed_at BIGINT,
        ended_at BIGINT,
        elapsed_ms INT DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        INDEX idx_event_id (event_id),
        INDEX idx_operator_id (operator_id),
        INDEX idx_status (status)
      )
    `);
    console.log("[DB Schema] ✓ operator_sessions table created");

    // Create operator_actions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS operator_actions (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        action_data JSON,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES operator_sessions(id),
        INDEX idx_session_id (session_id),
        INDEX idx_action_type (action_type)
      )
    `);
    console.log("[DB Schema] ✓ operator_actions table created");

    // Create questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        asker_name VARCHAR(255),
        asker_email VARCHAR(255),
        status ENUM('submitted', 'approved', 'rejected', 'answered') NOT NULL DEFAULT 'submitted',
        compliance_risk_score DECIMAL(3, 2) DEFAULT 0.0,
        compliance_risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
        sentiment_score DECIMAL(3, 2),
        upvotes INT DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES operator_sessions(id),
        INDEX idx_session_id (session_id),
        INDEX idx_status (status),
        INDEX idx_compliance_risk (compliance_risk_level)
      )
    `);
    console.log("[DB Schema] ✓ questions table created");

    // Create operator_notes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS operator_notes (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES operator_sessions(id),
        INDEX idx_session_id (session_id)
      )
    `);
    console.log("[DB Schema] ✓ operator_notes table created");

    // Create events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time BIGINT NOT NULL,
        end_time BIGINT,
        status ENUM('draft', 'scheduled', 'live', 'ended') NOT NULL DEFAULT 'draft',
        created_by VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        INDEX idx_status (status),
        INDEX idx_created_by (created_by)
      )
    `);
    console.log("[DB Schema] ✓ events table created");

    // Create attendees table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attendees (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        joined_at BIGINT,
        left_at BIGINT,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id),
        INDEX idx_event_id (event_id),
        UNIQUE KEY unique_event_email (event_id, email)
      )
    `);
    console.log("[DB Schema] ✓ attendees table created");

    // Create speakers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS speakers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        company VARCHAR(255),
        bio TEXT,
        email VARCHAR(255),
        image_url VARCHAR(255),
        total_events INT DEFAULT 0,
        average_sentiment DECIMAL(3, 2) DEFAULT 0.0,
        engagement_rate DECIMAL(3, 2) DEFAULT 0.0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        INDEX idx_name (name)
      )
    `);
    console.log("[DB Schema] ✓ speakers table created");

    // Create event_speakers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_speakers (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        speaker_id VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (speaker_id) REFERENCES speakers(id),
        UNIQUE KEY unique_event_speaker (event_id, speaker_id)
      )
    `);
    console.log("[DB Schema] ✓ event_speakers table created");

    // Create analytics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        total_attendees INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        average_sentiment DECIMAL(3, 2) DEFAULT 0.0,
        peak_engagement_time BIGINT,
        top_speaker VARCHAR(255),
        created_at BIGINT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id),
        INDEX idx_event_id (event_id)
      )
    `);
    console.log("[DB Schema] ✓ analytics table created");

    console.log("[DB Schema] ✓ All tables created successfully!");
    return { success: true, message: "Database schema fixed" };
  } catch (error) {
    console.error("[DB Schema] Error fixing schema:", error);
    return { success: false, error: String(error) };
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatabaseSchema().then((result) => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
}
