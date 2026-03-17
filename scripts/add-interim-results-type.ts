import { getDb } from "../server/db";

async function addInterimResultsType() {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  await conn.execute(`
    ALTER TABLE archive_events 
    MODIFY COLUMN event_type ENUM('earnings_call','interim_results','agm','capital_markets_day','ceo_town_hall','board_meeting','webcast','other') NOT NULL
  `);

  console.log("✅ interim_results added to archive_events event_type enum");
  process.exit(0);
}

addInterimResultsType().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
