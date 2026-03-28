/**
 * Database Migration Verification Script
 * Verifies all required tables exist and have correct schema
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

interface TableInfo {
  name: string;
  exists: boolean;
  columns?: number;
  error?: string;
}

const REQUIRED_TABLES = [
  "operator_sessions",
  "operator_actions",
  "questions",
  "operator_notes",
  "events",
  "attendees",
  "speakers",
  "event_speakers",
  "analytics",
  "users",
];

export async function verifyDatabaseSchema(): Promise<{
  success: boolean;
  tables: TableInfo[];
  summary: string;
}> {
  console.log("[DB Verify] Starting database schema verification...");

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      tables: [],
      summary: "Failed to connect to database",
    };
  }

  const results: TableInfo[] = [];

  for (const tableName of REQUIRED_TABLES) {
    try {
      // Try to query table info
      const result = await db.execute(
        sql.raw(`SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_NAME = '${tableName}' AND TABLE_SCHEMA = DATABASE()`)
      );

      const tableExists = (result as any)[0]?.[0]?.count > 0;

      if (tableExists) {
        // Get column count
        const columnResult = await db.execute(
          sql.raw(`SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_NAME = '${tableName}' AND TABLE_SCHEMA = DATABASE()`)
        );

        const columnCount = (columnResult as any)[0]?.[0]?.count || 0;

        results.push({
          name: tableName,
          exists: true,
          columns: columnCount,
        });

        console.log(`[DB Verify] ✓ ${tableName} (${columnCount} columns)`);
      } else {
        results.push({
          name: tableName,
          exists: false,
          error: "Table not found",
        });

        console.log(`[DB Verify] ✗ ${tableName} - NOT FOUND`);
      }
    } catch (error) {
      results.push({
        name: tableName,
        exists: false,
        error: String(error),
      });

      console.log(`[DB Verify] ✗ ${tableName} - ERROR: ${error}`);
    }
  }

  const allTablesExist = results.every((t) => t.exists);
  const summary = allTablesExist
    ? `✓ All ${results.length} tables verified successfully`
    : `✗ ${results.filter((t) => !t.exists).length} tables missing`;

  console.log(`[DB Verify] ${summary}`);

  return {
    success: allTablesExist,
    tables: results,
    summary,
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabaseSchema().then((result) => {
    console.log("\n=== Database Verification Report ===\n");
    console.log(`Status: ${result.success ? "✓ PASSED" : "✗ FAILED"}`);
    console.log(`Summary: ${result.summary}\n`);

    console.log("Table Details:");
    result.tables.forEach((table) => {
      const status = table.exists ? "✓" : "✗";
      const details = table.exists ? `${table.columns} columns` : table.error;
      console.log(`  ${status} ${table.name.padEnd(25)} ${details}`);
    });

    console.log("\n=====================================\n");

    process.exit(result.success ? 0 : 1);
  });
}

export default verifyDatabaseSchema;
