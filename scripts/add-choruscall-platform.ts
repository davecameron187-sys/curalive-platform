import { getDb } from "../server/db";

async function run() {
  const db = await getDb();
  await (db as any).execute(
    `ALTER TABLE shadow_sessions MODIFY COLUMN platform ENUM('zoom','teams','meet','webex','choruscall','other') NOT NULL DEFAULT 'zoom'`
  );
  console.log("✅ Added 'choruscall' to shadow_sessions.platform enum");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
