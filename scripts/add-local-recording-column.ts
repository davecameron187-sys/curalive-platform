import { getDb } from "../server/db";

async function run() {
  const db = await getDb();
  await (db as any).execute(
    `ALTER TABLE shadow_sessions ADD COLUMN local_recording_path VARCHAR(1000) NULL AFTER local_transcript_json`
  );
  console.log("✅ Added local_recording_path column to shadow_sessions");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
