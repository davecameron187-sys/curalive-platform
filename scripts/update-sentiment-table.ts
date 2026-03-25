import { getDb } from "../server/db";

async function main() {
  const db = await getDb();
  if (!db) {
    console.log("No DB connection");
    process.exit(1);
  }
  try {
    await db.execute(`ALTER TABLE sentiment_snapshots ADD COLUMN IF NOT EXISTS per_speaker_sentiment TEXT`);
    console.log("OK sentiment_snapshots update");
  } catch (e: any) {
    console.log("ERR sentiment_snapshots update: " + (e.message ?? ""));
  }
  process.exit(0);
}

main();
