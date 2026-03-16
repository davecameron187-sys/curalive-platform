import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mysql2 = require("mysql2/promise");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const conn = await mysql2.createConnection(url);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS operator_corrections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(255) NOT NULL,
      event_title VARCHAR(255),
      metric_id INT,
      correction_type ENUM('sentiment_override', 'compliance_dismiss', 'compliance_add', 'severity_change', 'threshold_adjust') NOT NULL,
      original_value FLOAT,
      corrected_value FLOAT,
      original_label VARCHAR(255),
      corrected_label VARCHAR(255),
      reason TEXT,
      event_type VARCHAR(64),
      client_name VARCHAR(255),
      operator_id VARCHAR(255) DEFAULT 'operator',
      applied_to_model TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log("operator_corrections table created");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS adaptive_thresholds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      threshold_key VARCHAR(255) NOT NULL UNIQUE,
      event_type VARCHAR(64),
      sector VARCHAR(64),
      metric_type ENUM('sentiment', 'compliance', 'engagement') NOT NULL,
      default_value FLOAT NOT NULL,
      learned_value FLOAT NOT NULL,
      sample_count INT DEFAULT 0,
      last_correction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log("adaptive_thresholds table created");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS compliance_vocabulary (
      id INT AUTO_INCREMENT PRIMARY KEY,
      keyword VARCHAR(255) NOT NULL UNIQUE,
      source ENUM('system', 'operator', 'learned') DEFAULT 'system' NOT NULL,
      severity_weight FLOAT DEFAULT 1.0,
      times_flagged INT DEFAULT 0,
      times_dismissed INT DEFAULT 0,
      effective_weight FLOAT DEFAULT 1.0,
      sector VARCHAR(64),
      added_by VARCHAR(255) DEFAULT 'system',
      active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log("compliance_vocabulary table created");

  const defaultKeywords = [
    "forward-looking", "guidance", "forecast", "predict", "expect",
    "material", "non-public", "insider", "merger", "acquisition",
  ];
  for (const kw of defaultKeywords) {
    await conn.execute(
      `INSERT IGNORE INTO compliance_vocabulary (keyword, source, severity_weight, effective_weight) VALUES (?, 'system', 1.0, 1.0)`,
      [kw]
    );
  }
  console.log(`Seeded ${defaultKeywords.length} default compliance keywords`);

  await conn.end();
  console.log("Done");
}

main().catch((e) => { console.error(e); process.exit(1); });
