import "dotenv/config";

async function main() {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    await conn.execute(`ALTER TABLE archive_events ADD COLUMN event_id VARCHAR(128) NULL AFTER id`);
    console.log("Added event_id column to archive_events");
  } catch (e: any) {
    if (e.message?.includes("Duplicate column")) {
      console.log("event_id column already exists");
    } else {
      throw e;
    }
  }

  await conn.execute(`UPDATE archive_events SET event_id = CONCAT('archive-', id) WHERE event_id IS NULL`);
  console.log("Backfilled event_id for existing records");

  await conn.end();
}

main().catch(console.error);
