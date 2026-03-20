import { getDb } from "../server/db";

async function createLiveQaTables() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection");
    process.exit(1);
  }

  const conn = (db as any).session?.client ?? (db as any).$client;

  const queries = [
    `CREATE TABLE IF NOT EXISTS live_qa_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_code VARCHAR(20) NOT NULL UNIQUE,
      shadow_session_id INT,
      event_name VARCHAR(500) NOT NULL,
      client_name VARCHAR(255),
      qa_session_status ENUM('active','paused','closed') NOT NULL DEFAULT 'active',
      total_questions INT DEFAULT 0,
      total_approved INT DEFAULT 0,
      total_rejected INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      closed_at TIMESTAMP NULL
    )`,
    `CREATE TABLE IF NOT EXISTS live_qa_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      question_text TEXT NOT NULL,
      submitter_name VARCHAR(200),
      submitter_email VARCHAR(255),
      submitter_company VARCHAR(200),
      question_category ENUM('financial','operational','esg','governance','strategy','general') NOT NULL DEFAULT 'general',
      question_status ENUM('pending','triaged','approved','answered','rejected','flagged') NOT NULL DEFAULT 'pending',
      upvotes INT DEFAULT 0,
      triage_score FLOAT,
      triage_classification VARCHAR(32),
      triage_reason TEXT,
      compliance_risk_score FLOAT,
      priority_score FLOAT,
      is_anonymous BOOLEAN DEFAULT FALSE,
      operator_notes TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT,
      INDEX idx_session_id (session_id),
      INDEX idx_status (question_status),
      INDEX idx_priority (priority_score)
    )`,
    `CREATE TABLE IF NOT EXISTS live_qa_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      answer_text TEXT NOT NULL,
      is_auto_draft BOOLEAN DEFAULT FALSE,
      auto_draft_reasoning TEXT,
      approved_by_operator BOOLEAN DEFAULT FALSE,
      answered_at BIGINT,
      INDEX idx_question_id (question_id)
    )`,
    `CREATE TABLE IF NOT EXISTS live_qa_compliance_flags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      jurisdiction VARCHAR(50) NOT NULL,
      risk_score FLOAT NOT NULL,
      risk_type VARCHAR(100) NOT NULL,
      risk_description TEXT,
      recommended_action ENUM('forward','route_to_bot','legal_review','delay_24h') NOT NULL DEFAULT 'forward',
      auto_remediation_suggestion TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_question_id (question_id),
      INDEX idx_jurisdiction (jurisdiction)
    )`,
  ];

  for (const sql of queries) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      await conn.execute(sql);
      console.log(`✓ ${tableName} — created/verified`);
    } catch (err: any) {
      console.error(`✗ ${tableName} — ${err.message}`);
    }
  }

  console.log("\nLive Q&A tables ready.");
  process.exit(0);
}

createLiveQaTables();
