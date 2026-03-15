import { getDb } from "../server/db";

async function createComplianceFrameworkTables() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS soc2_controls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      control_id VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('compliant', 'partial', 'non_compliant', 'not_applicable') NOT NULL DEFAULT 'non_compliant',
      owner_name VARCHAR(100),
      notes TEXT,
      testing_frequency VARCHAR(50),
      last_tested_at TIMESTAMP NULL,
      evidence_urls JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("Created soc2_controls table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS iso27001_controls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      control_id VARCHAR(20) NOT NULL,
      clause VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('compliant', 'partial', 'non_compliant', 'not_applicable') NOT NULL DEFAULT 'non_compliant',
      owner_name VARCHAR(100),
      notes TEXT,
      testing_frequency VARCHAR(50),
      last_tested_at TIMESTAMP NULL,
      evidence_urls JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("Created iso27001_controls table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS compliance_evidence_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      control_type ENUM('soc2', 'iso27001') NOT NULL,
      control_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_key VARCHAR(500) NOT NULL,
      mime_type VARCHAR(100),
      uploaded_by INT,
      uploaded_at BIGINT NOT NULL,
      expires_at BIGINT
    )
  `);
  console.log("Created compliance_evidence_files table");

  console.log("All compliance framework tables created successfully");
  process.exit(0);
}

createComplianceFrameworkTables().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
