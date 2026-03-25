import fs from 'fs';
import pg from 'pg';

const data = JSON.parse(fs.readFileSync('/home/runner/workspace/database-backup.json', 'utf8'));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

async function insertRows(table, rows) {
  if (!rows || rows.length === 0) return 0;
  let inserted = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = Object.values(row);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = cols.map(c => `"${c}"`).join(', ');
    try {
      await client.query(`INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, vals);
      inserted++;
    } catch (e) {
      // Skip rows that fail (e.g. missing columns)
      if (!e.message.includes('does not exist')) {
        // console.warn(`  Skip row in ${table}: ${e.message.slice(0, 100)}`);
      } else {
        console.error(`  Table/column error in ${table}: ${e.message.slice(0, 120)}`);
        return inserted;
      }
    }
  }
  return inserted;
}

const tableOrder = [
  'health_checks', 'health_incidents', 'health_baselines',
  'iso27001_controls', 'soc2_controls',
  'ai_evolution_observations', 'ai_tool_proposals',
  'bastion_investor_observations', 'bastion_intelligence_sessions', 'bastion_guidance_tracker',
  'archive_events', 'tagged_metrics',
  'crisis_predictions', 'disclosure_certificates', 'valuation_impacts',
  'aggregate_intelligence'
];

for (const table of tableOrder) {
  const rows = data[table];
  if (!rows || rows.length === 0) { continue; }
  const count = await insertRows(table, rows);
  console.log(`${table}: ${count}/${rows.length} rows restored`);
}

// Reset sequences for tables with serial IDs
for (const table of tableOrder) {
  try {
    await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`);
  } catch {}
}

await client.end();
console.log('\nRestore complete!');
