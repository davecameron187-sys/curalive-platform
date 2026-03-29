#!/usr/bin/env node

/**
 * Delete All Archives Script
 * Permanently deletes all archived sessions from the database
 * Creates an audit record with deletion timestamp
 */

import { drizzle } from "drizzle-orm/mysql2/http";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";
import fs from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable not set");
  process.exit(1);
}

async function deleteAllArchives() {
  console.log("🗑️  Starting archive deletion process...\n");

  const db = drizzle(DATABASE_URL);
  const deletionTimestamp = new Date().toISOString();

  try {
    // Step 1: Get count of archived sessions before deletion
    console.log("📊 Counting archived sessions...");
    const archivedSessions = await db
      .select()
      .from(schema.liveQaSessionMetadata)
      .where(eq(schema.liveQaSessionMetadata.isLive, false));

    const sessionCount = archivedSessions.length;
    console.log(`   Found ${sessionCount} archived sessions to delete\n`);

    if (sessionCount === 0) {
      console.log("✅ No archived sessions found. Nothing to delete.\n");
      return;
    }

    // Step 2: Collect session IDs for deletion
    const sessionIds = archivedSessions.map((s) => s.sessionId);
    console.log("📋 Session IDs to delete:");
    sessionIds.forEach((id) => console.log(`   - ${id}`));
    console.log();

    // Step 3: Delete related Q&A questions
    console.log("🗑️  Deleting Q&A questions...");
    let qaCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.liveQaQuestions)
        .where(eq(schema.liveQaQuestions.sessionId, sessionId));
      qaCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${qaCount} Q&A questions\n`);

    // Step 4: Delete transcript segments
    console.log("🗑️  Deleting transcript segments...");
    let transcriptCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.transcriptSegments)
        .where(eq(schema.transcriptSegments.sessionId, sessionId));
      transcriptCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${transcriptCount} transcript segments\n`);

    // Step 5: Delete compliance flags
    console.log("🗑️  Deleting compliance flags...");
    let complianceCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.complianceFlags)
        .where(eq(schema.complianceFlags.sessionId, sessionId));
      complianceCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${complianceCount} compliance flags\n`);

    // Step 6: Delete operator actions
    console.log("🗑️  Deleting operator actions...");
    let actionCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.operatorActions)
        .where(eq(schema.operatorActions.sessionId, sessionId));
      actionCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${actionCount} operator actions\n`);

    // Step 7: Delete session handoff packages
    console.log("🗑️  Deleting session handoff packages...");
    let handoffCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.sessionHandoffPackages)
        .where(eq(schema.sessionHandoffPackages.sessionId, sessionId));
      handoffCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${handoffCount} handoff packages\n`);

    // Step 8: Delete session recordings
    console.log("🗑️  Deleting session recordings...");
    let recordingCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.sessionRecordings)
        .where(eq(schema.sessionRecordings.sessionId, sessionId));
      recordingCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${recordingCount} session recordings\n`);

    // Step 9: Delete operator sessions
    console.log("🗑️  Deleting operator sessions...");
    let operatorSessionCount = 0;
    for (const sessionId of sessionIds) {
      const result = await db
        .delete(schema.operatorSessions)
        .where(eq(schema.operatorSessions.sessionId, sessionId));
      operatorSessionCount += result.rowsAffected || 0;
    }
    console.log(`   Deleted ${operatorSessionCount} operator sessions\n`);

    // Step 10: Delete live QA session metadata
    console.log("🗑️  Deleting live QA session metadata...");
    const metadataResult = await db
      .delete(schema.liveQaSessionMetadata)
      .where(eq(schema.liveQaSessionMetadata.isLive, false));
    const metadataCount = metadataResult.rowsAffected || 0;
    console.log(`   Deleted ${metadataCount} session metadata records\n`);

    // Step 11: Create audit record
    console.log("📝 Creating audit record...");
    const auditRecord = {
      action: "DELETE_ALL_ARCHIVES",
      timestamp: deletionTimestamp,
      deletedSessions: sessionCount,
      deletedQaQuestions: qaCount,
      deletedTranscriptSegments: transcriptCount,
      deletedComplianceFlags: complianceCount,
      deletedOperatorActions: actionCount,
      deletedHandoffPackages: handoffCount,
      deletedRecordings: recordingCount,
      deletedOperatorSessions: operatorSessionCount,
      deletedMetadata: metadataCount,
      totalRecordsDeleted:
        qaCount +
        transcriptCount +
        complianceCount +
        actionCount +
        handoffCount +
        recordingCount +
        operatorSessionCount +
        metadataCount,
      sessionIds: sessionIds,
    };

    // Write audit record to file
    const auditDir = path.join(process.cwd(), "audit-logs");
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    const auditFileName = `archive-deletion-${deletionTimestamp.replace(/[:.]/g, "-")}.json`;
    const auditFilePath = path.join(auditDir, auditFileName);
    fs.writeFileSync(auditFilePath, JSON.stringify(auditRecord, null, 2));
    console.log(`   ✅ Audit record saved to: ${auditFilePath}\n`);

    // Summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("✅ ARCHIVE DELETION COMPLETE");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Deletion Timestamp: ${deletionTimestamp}`);
    console.log(`Total Sessions Deleted: ${sessionCount}`);
    console.log(`Total Records Deleted: ${auditRecord.totalRecordsDeleted}`);
    console.log(`Audit Record: ${auditFileName}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    console.log("⚠️  IMPORTANT: This deletion is permanent and cannot be undone.");
    console.log(`   Audit record timestamp: ${deletionTimestamp}`);
    console.log("   This timestamp is the only record of when deletion occurred.\n");
  } catch (error) {
    console.error("❌ Error during deletion:", error);
    process.exit(1);
  }
}

deleteAllArchives();
