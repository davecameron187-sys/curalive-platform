import { getDb } from "../server/db";

async function addAiReportColumn() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    ALTER TABLE archive_events 
    ADD COLUMN IF NOT EXISTS ai_report JSON DEFAULT NULL
  `);

  console.log("✅ ai_report column added to archive_events");
  process.exit(0);
}

addAiReportColumn().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
