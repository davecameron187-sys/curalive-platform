#!/usr/bin/env node

/**
 * Temporary Render Database Import Script
 * 
 * Purpose: Import curalive_db_backup.sql into the Render PostgreSQL database
 * from within Render's network (where the Node service has internal access)
 * 
 * Usage: node scripts/import-render-db.js
 * 
 * Requirements:
 * - DATABASE_URL environment variable must be set
 * - curalive_db_backup.sql must exist in the current directory
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  try {
    // Check environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('IMPORT FAILED: DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    // Check backup file exists
    const backupPath = path.join(process.cwd(), 'curalive_db_backup.sql');
    if (!fs.existsSync(backupPath)) {
      console.error(`IMPORT FAILED: curalive_db_backup.sql not found at ${backupPath}`);
      process.exit(1);
    }

    console.log('IMPORT STARTED');

    // Read the SQL dump
    const sqlDump = fs.readFileSync(backupPath, 'utf-8');
    console.log(`Read backup file: ${backupPath} (${sqlDump.length} bytes)`);

    // Connect to database
    const client = new Client({
      connectionString: databaseUrl,
    });

    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Execute the SQL dump
    console.log('Executing SQL dump...');
    await client.query(sqlDump);
    console.log('SQL dump executed successfully');

    // Verify import by checking table count
    const result = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    );
    const tableCount = result.rows[0].count;
    console.log(`Verification: ${tableCount} tables found in public schema`);

    await client.end();
    console.log('IMPORT SUCCESS');
    process.exit(0);

  } catch (error) {
    console.error('IMPORT FAILED:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    process.exit(1);
  }
}

main();
