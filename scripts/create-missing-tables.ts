import { getDb } from "../server/db";

const tables = [
  `CREATE TABLE IF NOT EXISTS ai_generated_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    content_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    edited_content TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'generated',
    recipients TEXT,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    generated_by INT,
    approved_at TIMESTAMP NULL,
    approved_by INT,
    rejected_at TIMESTAMP NULL,
    rejection_reason TEXT,
    sent_at TIMESTAMP NULL,
    sent_to TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS occ_transcription_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id VARCHAR(128) NOT NULL,
    speaker_name VARCHAR(255),
    speaker_role VARCHAR(64),
    content TEXT NOT NULL,
    start_time_ms INT,
    end_time_ms INT,
    confidence FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS occ_live_rolling_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id VARCHAR(128) NOT NULL,
    summary TEXT NOT NULL,
    segment_count INT DEFAULT 0,
    from_time_ms INT,
    to_time_ms INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS qa_auto_triage_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qa_id INT NOT NULL,
    conference_id INT,
    classification VARCHAR(32) NOT NULL,
    confidence FLOAT,
    reason TEXT,
    is_sensitive TINYINT(1) DEFAULT 0,
    sensitivity_flags TEXT,
    triage_score FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS speaking_pace_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id VARCHAR(128) NOT NULL,
    segment_id INT,
    speaker_name VARCHAR(255),
    words_per_minute FLOAT,
    filler_word_count INT DEFAULT 0,
    pause_count INT DEFAULT 0,
    coaching_feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS toxicity_filter_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    content_type VARCHAR(32) NOT NULL DEFAULT 'qa',
    toxicity_score FLOAT DEFAULT 0,
    categories TEXT,
    flagged TINYINT(1) DEFAULT 0,
    action_taken VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS transcript_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    segment_id INT NOT NULL,
    operator_id INT NOT NULL,
    original_text TEXT NOT NULL,
    corrected_text TEXT NOT NULL,
    edit_type VARCHAR(64) NOT NULL,
    reason TEXT,
    confidence FLOAT,
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS transcript_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id INT NOT NULL,
    version_number INT NOT NULL,
    full_transcript TEXT NOT NULL,
    edit_count INT DEFAULT 0,
    change_description TEXT,
    created_by INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS transcript_edit_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    edit_id INT NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor_id INT,
    actor_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS event_brief_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conference_id VARCHAR(128),
    event_id INT,
    brief_type VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    operator_approved TINYINT(1) DEFAULT 0,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS content_engagement_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    recipient_email VARCHAR(255),
    event_type VARCHAR(64) NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS content_performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    open_rate FLOAT DEFAULT 0,
    click_rate FLOAT DEFAULT 0,
    engagement_score FLOAT DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS report_key_moments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    timestamp_seconds INT NOT NULL,
    moment_type ENUM('insight', 'action_item', 'question', 'highlight', 'disclaimer') NOT NULL,
    content TEXT NOT NULL,
    speaker VARCHAR(255),
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS compliance_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL,
    certificate_id VARCHAR(64) NOT NULL UNIQUE,
    pdf_url TEXT NOT NULL,
    generated_by INT,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    signed_by INT,
    signed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    event_id VARCHAR(128),
    endpoint TEXT NOT NULL,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    device_type ENUM('mobile', 'desktop', 'tablet') DEFAULT 'mobile',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS white_label_clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    accent_color VARCHAR(7) DEFAULT '#007bff',
    custom_domain VARCHAR(255),
    contact_email VARCHAR(320),
    contact_name VARCHAR(255),
    billing_tier ENUM('starter', 'professional', 'enterprise') NOT NULL DEFAULT 'starter',
    max_concurrent_events INT DEFAULT 1,
    max_monthly_events INT DEFAULT 5,
    features_enabled TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS client_event_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    event_id INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    custom_title VARCHAR(255),
    custom_description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `ALTER TABLE sentiment_snapshots ADD COLUMN IF NOT EXISTS per_speaker_sentiment TEXT`
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
      console.log("ERR " + tableName + ": " + (e.message ?? "").slice(0, 80));
    }
  }
  console.log("Done");
  process.exit(0);
}

main();
