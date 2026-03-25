import { getDb } from "../server/db";

async function createAiEvolutionTables() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS ai_evolution_observations (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      source_type ENUM('live_session','archive_upload','transcript_paste') NOT NULL,
      source_id INT,
      event_type VARCHAR(64),
      client_name VARCHAR(255),
      observation_type ENUM('weak_module','missing_capability','repeated_pattern','operator_friction','data_gap','cross_event_trend') NOT NULL,
      module_name VARCHAR(128),
      observation TEXT NOT NULL,
      confidence FLOAT DEFAULT 0.5,
      suggested_capability VARCHAR(255),
      raw_context JSON,
      cluster_id INT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ ai_evolution_observations table created");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS ai_tool_proposals (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category ENUM('analysis','tracking','automation','reporting','integration') NOT NULL,
      rationale TEXT NOT NULL,
      evidence_count INT DEFAULT 0,
      avg_confidence FLOAT DEFAULT 0,
      observation_ids JSON,
      status ENUM('emerging','proposed','approved','building','live','rejected') NOT NULL DEFAULT 'emerging',
      estimated_impact ENUM('low','medium','high','transformative') DEFAULT 'medium',
      prompt_template TEXT,
      module_spec JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ ai_tool_proposals table created");

  process.exit(0);
}

createAiEvolutionTables().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
