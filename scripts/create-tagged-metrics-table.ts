import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const table = `CREATE TABLE IF NOT EXISTS tagged_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  event_title VARCHAR(255),
  tag_type ENUM('sentiment','compliance','scaling','engagement','qa','intervention') NOT NULL,
  metric_value FLOAT NOT NULL,
  label VARCHAR(255),
  detail TEXT,
  bundle VARCHAR(64),
  severity ENUM('positive','neutral','negative','critical') NOT NULL DEFAULT 'neutral',
  source VARCHAR(64) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_event_id (event_id),
  INDEX idx_tag_type (tag_type),
  INDEX idx_created_at (created_at),
  INDEX idx_severity (severity)
) ENGINE=InnoDB`;

const seed = `INSERT INTO tagged_metrics
  (event_id, event_title, tag_type, metric_value, label, detail, bundle, severity, source) VALUES
  ('q4-earnings-2026','Q4 2025 Earnings Call','sentiment',82,'Bullish Sentiment Peak','Investor sentiment spiked to 82 following CFO revenue guidance — 15-point rise in 90 seconds','Investor Relations','positive','sentiment-engine'),
  ('q4-earnings-2026','Q4 2025 Earnings Call','compliance',0.12,'Low Risk Score','No material statement flags detected across 47-minute call — compliance clean','Compliance & Risk','positive','compliance-engine'),
  ('q4-earnings-2026','Q4 2025 Earnings Call','qa',14,'Q&A Queue Peak','14 questions queued simultaneously — auto-triage activated, top 3 routed by investor tier','Operations & Efficiency','neutral','qa-engine'),
  ('q4-earnings-2026','Q4 2025 Earnings Call','engagement',71,'Engagement Score','71% of participants in active state — above 70% threshold, no intervention triggered','Investor Relations','positive','engagement-engine'),
  ('q4-earnings-2026','Q4 2025 Earnings Call','intervention',1,'Autonomous Action Fired','Sentiment Drop Alert triggered at minute 23 — IR agent queued re-engagement poll','Operations & Efficiency','neutral','intervention-engine'),
  ('q4-earnings-2026','Q4 2025 Earnings Call','scaling',340,'Peak Concurrent Participants','340 simultaneous connections — platform scaled without degradation','Operations & Efficiency','positive','scaling-engine'),
  ('ceo-town-hall-q1-2026','CEO Town Hall Q1 2026','sentiment',58,'Sentiment Dip Detected','Sentiment dropped to 58 after restructuring announcement — 24-point decline','Investor Relations','negative','sentiment-engine'),
  ('ceo-town-hall-q1-2026','CEO Town Hall Q1 2026','compliance',0.71,'Elevated Risk Score','Material forward-looking statement flagged — compliance agent created audit log entry','Compliance & Risk','critical','compliance-engine'),
  ('ceo-town-hall-q1-2026','CEO Town Hall Q1 2026','qa',8,'Q&A Volume','8 questions submitted — normal volume, no auto-triage escalation required','Operations & Efficiency','neutral','qa-engine'),
  ('ceo-town-hall-q1-2026','CEO Town Hall Q1 2026','engagement',64,'Engagement Drop','64% active participants — below 70% threshold, engagement alert queued','Investor Relations','negative','engagement-engine'),
  ('ceo-town-hall-q1-2026','CEO Town Hall Q1 2026','intervention',2,'Two Interventions Fired','Compliance Risk + Sentiment Drop alerts both fired within 4 minutes of restructuring announcement','Compliance & Risk','critical','intervention-engine'),
  ('ceo-town-hall-q1-2026','CEO Town Hall Q1 2026','scaling',187,'Peak Concurrent Participants','187 simultaneous connections — scaled cleanly','Operations & Efficiency','positive','scaling-engine')`;

async function main() {
  const db = await getDb();
  await db.execute(sql.raw(table));
  console.log("✓ tagged_metrics table created");
  await db.execute(sql.raw(seed));
  console.log("✓ Seeded 12 demo tagged metrics across 2 events");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
