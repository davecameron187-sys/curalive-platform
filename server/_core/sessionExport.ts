/**
 * Session Export Workflow
 * 
 * Generates PDF and CSV exports for:
 * - Operator notes and actions
 * - Q&A history with compliance flags
 * - Session transcript summary
 * - Compliance report
 */

import { getDb } from "../db";
// import { storagePut } from "../storage"; // TODO: Implement storage integration
import { operatorActions, liveQaQuestions, complianceFlags } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface SessionExportData {
  sessionId: string;
  eventId: string;
  operatorNotes: string[];
  questions: Array<{
    id: string;
    text: string;
    status: string;
    complianceFlags: string[];
  }>;
  complianceFlags: Array<{
    flagType: string;
    severity: string;
    description: string;
  }>;
  sessionDuration: number;
  exportedAt: string;
}

/**
 * Fetch session export data from database
 */
export async function fetchSessionExportData(
  sessionId: string
): Promise<SessionExportData | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Fetch operator notes
    const notes = await db
      .select()
      .from(operatorActions)
      .where(eq(operatorActions.sessionId, sessionId));

    const operatorNotes = notes
      .filter((n) => n.actionType === "note_created")
      .map((n) => (n.metadata as any)?.noteText || "");

    // Fetch Q&A questions
    const questions = await db
      .select()
      .from(liveQaQuestions)
      .where(eq(liveQaQuestions.sessionId, sessionId));

    // Fetch compliance flags
    const flags = await db
      .select()
      .from(complianceFlags)
      .where(eq(complianceFlags.sessionId, sessionId));

    return {
      sessionId,
      eventId: "", // Would be fetched from session metadata
      operatorNotes,
      questions: questions.map((q) => ({
        id: q.id.toString(),
        text: q.questionText,
        status: q.status,
        complianceFlags: [], // TODO: Link compliance flags to questions
      })),
      complianceFlags: flags.map((f) => ({
        flagType: f.riskType,
        severity: f.riskScore.toString(),
        description: f.riskDescription,
      })),
      sessionDuration: 0, // Would calculate from session start/end
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Session Export] Error fetching data:", error);
    return null;
  }
}

/**
 * Generate CSV export
 */
export function generateCSVExport(data: SessionExportData): string {
  const lines: string[] = [];

  // Header
  lines.push("Session Export Report");
  lines.push(`Session ID,${data.sessionId}`);
  lines.push(`Exported At,${data.exportedAt}`);
  lines.push("");

  // Operator Notes Section
  lines.push("OPERATOR NOTES");
  lines.push("Note");
  data.operatorNotes.forEach((note) => {
    lines.push(`"${note.replace(/"/g, '""')}"`);
  });
  lines.push("");

  // Q&A Section
  lines.push("Q&A HISTORY");
  lines.push("Question,Status,Compliance Flags");
  data.questions.forEach((q) => {
    const flags = q.complianceFlags.join(";");
    lines.push(`"${q.text.replace(/"/g, '""')}","${q.status}","${flags}"`);
  });
  lines.push("");

  // Compliance Flags Section
  lines.push("COMPLIANCE FLAGS");
  lines.push("Risk Type,Risk Score,Description");
  data.complianceFlags.forEach((f) => {
    lines.push(`"${f.flagType}","${f.severity}","${f.description.replace(/"/g, '""')}"`);
  });

  return lines.join("\n");
}

/**
 * Generate PDF export (simplified text-based)
 */
export function generatePDFExport(data: SessionExportData): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("SESSION EXPORT REPORT");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(`Session ID: ${data.sessionId}`);
  lines.push(`Event ID: ${data.eventId}`);
  lines.push(`Exported At: ${data.exportedAt}`);
  lines.push(`Session Duration: ${data.sessionDuration} seconds`);
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────");
  lines.push("OPERATOR NOTES");
  lines.push("───────────────────────────────────────────────────────────");
  if (data.operatorNotes.length === 0) {
    lines.push("(No notes recorded)");
  } else {
    data.operatorNotes.forEach((note, idx) => {
      lines.push(`${idx + 1}. ${note}`);
    });
  }
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────");
  lines.push("Q&A HISTORY");
  lines.push("───────────────────────────────────────────────────────────");
  if (data.questions.length === 0) {
    lines.push("(No questions submitted)");
  } else {
    data.questions.forEach((q, idx) => {
      lines.push(`${idx + 1}. ${q.text}`);
      lines.push(`   Status: ${q.status}`);
      if (q.complianceFlags.length > 0) {
        lines.push(`   Flags: ${q.complianceFlags.join(", ")}`);
      }
      lines.push("");
    });
  }

  lines.push("───────────────────────────────────────────────────────────");
  lines.push("COMPLIANCE SUMMARY");
  lines.push("───────────────────────────────────────────────────────────");
  if (data.complianceFlags.length === 0) {
    lines.push("(No compliance flags raised)");
  } else {
    data.complianceFlags.forEach((f, idx) => {
      lines.push(`${idx + 1}. [Risk ${f.severity}] ${f.flagType}`);
      lines.push(`   ${f.description}`);
      lines.push("");
    });
  }

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("END OF REPORT");
  lines.push("═══════════════════════════════════════════════════════════");

  return lines.join("\n");
}

/**
 * Export session as CSV
 */
export async function exportSessionAsCSV(
  sessionId: string
): Promise<string | null> {
  try {
    const data = await fetchSessionExportData(sessionId);
    if (!data) return null;

    const csv = generateCSVExport(data);
    console.log(`[Session Export] CSV generated for session ${sessionId}`);
    return csv;
  } catch (error) {
    console.error("[Session Export] CSV export error:", error);
    return null;
  }
}

/**
 * Export session as PDF (text-based for now)
 */
export async function exportSessionAsPDF(
  sessionId: string
): Promise<string | null> {
  try {
    const data = await fetchSessionExportData(sessionId);
    if (!data) return null;

    const pdf = generatePDFExport(data);
    console.log(`[Session Export] PDF generated for session ${sessionId}`);
    return pdf;
  } catch (error) {
    console.error("[Session Export] PDF export error:", error);
    return null;
  }
}
