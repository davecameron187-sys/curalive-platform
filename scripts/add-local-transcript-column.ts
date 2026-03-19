import { getDb } from "../server/db";

async function run() {
  const db = await getDb();
  await (db as any).execute(
    `ALTER TABLE shadow_sessions ADD COLUMN local_transcript_json LONGTEXT NULL AFTER ably_channel`
  );
  console.log("✅ Added local_transcript_json column to shadow_sessions");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
