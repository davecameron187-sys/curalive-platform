import { getDb } from "../server/db";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }
  const conn = (db as any).session?.client ?? (db as any).$client;
  if (!conn) { console.error("No DB connection"); process.exit(1); }

  await conn.execute(`
    ALTER TABLE mailing_list_entries
    ADD COLUMN join_method ENUM('phone','teams','zoom','web') NULL DEFAULT NULL
  `).catch((e: any) => {
    if (e.message?.includes("Duplicate column")) console.log("join_method column already exists on mailing_list_entries");
    else throw e;
  });
  console.log("Added join_method to mailing_list_entries");

  await conn.execute(`
    ALTER TABLE attendee_registrations
    ADD COLUMN join_method ENUM('phone','teams','zoom','web') NULL DEFAULT NULL
  `).catch((e: any) => {
    if (e.message?.includes("Duplicate column")) console.log("join_method column already exists on attendee_registrations");
    else throw e;
  });
  console.log("Added join_method to attendee_registrations");

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
