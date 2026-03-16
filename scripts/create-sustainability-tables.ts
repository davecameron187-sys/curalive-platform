import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mysql2 = require("mysql2/promise");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.log("No DATABASE_URL — skipping"); return; }
  const conn = await mysql2.createConnection(url);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS sustainability_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL,
      event_title VARCHAR(512) DEFAULT '',
      total_attendees INT NOT NULL DEFAULT 0,
      duration_hours FLOAT NOT NULL DEFAULT 1,
      is_virtual BOOLEAN DEFAULT TRUE,
      physical_co2_tonnes FLOAT NOT NULL DEFAULT 0,
      virtual_co2_tonnes FLOAT NOT NULL DEFAULT 0,
      carbon_saved_tonnes FLOAT NOT NULL DEFAULT 0,
      savings_percent FLOAT NOT NULL DEFAULT 0,
      total_cost_avoided_usd FLOAT NOT NULL DEFAULT 0,
      grade VARCHAR(4) NOT NULL DEFAULT 'B',
      breakdown_json JSON,
      country VARCHAR(8) DEFAULT 'ZA',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event (event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Created sustainability_reports table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS communication_index_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quarter VARCHAR(16) NOT NULL,
      cici_score INT NOT NULL DEFAULT 0,
      communication_quality_score INT DEFAULT 0,
      investor_engagement_score INT DEFAULT 0,
      compliance_quality_score INT DEFAULT 0,
      market_confidence_score INT DEFAULT 0,
      total_events INT DEFAULT 0,
      live_events INT DEFAULT 0,
      archive_events INT DEFAULT 0,
      avg_sentiment INT DEFAULT 0,
      high_engagement_pct INT DEFAULT 0,
      low_compliance_risk_pct INT DEFAULT 0,
      positive_market_pct INT DEFAULT 0,
      event_type_breakdown JSON,
      top_signal TEXT,
      ai_commentary TEXT,
      peer_benchmark_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_quarter (quarter)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Created communication_index_snapshots table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS broadcast_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL,
      presenter_name VARCHAR(256),
      avg_wpm FLOAT DEFAULT 0,
      optimal_wpm_min INT DEFAULT 130,
      optimal_wpm_max INT DEFAULT 160,
      pace_alerts INT DEFAULT 0,
      filler_word_count INT DEFAULT 0,
      key_moments_json JSON,
      recap_json JSON,
      recap_generated_at TIMESTAMP NULL,
      duration_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event (event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Created broadcast_sessions table");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS studio_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(128) NOT NULL,
      active_layout VARCHAR(64) DEFAULT 'single-presenter',
      feed_sources JSON,
      lower_thirds JSON,
      active_overlays JSON,
      live_sentiment_overlay BOOLEAN DEFAULT FALSE,
      participant_count_overlay BOOLEAN DEFAULT FALSE,
      recording_status VARCHAR(32) DEFAULT 'idle',
      stream_key VARCHAR(256),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event (event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Created studio_sessions table");

  await conn.end();
  console.log("All patent module tables created successfully");
}

main().catch(console.error);
