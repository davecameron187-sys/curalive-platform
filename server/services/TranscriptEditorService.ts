// @ts-nocheck
import { getDb } from "../db";
import {
  transcriptEdits,
  transcriptVersions,
  transcriptEditAuditLog,
  occTranscriptionSegments,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export interface EditRequest {
  transcriptionSegmentId: number;
  originalText: string;
  correctedText: string;
  editType: "correction" | "clarification" | "redaction" | "speaker_correction";
  reason?: string;
  confidence?: number;
}

export interface EditApprovalRequest {
  editId: number;
  approved: boolean;
  approverName: string;
  approverId: number;
}

export interface VersionSnapshot {
  versionNumber: number;
  fullTranscript: string;
  editCount: number;
  changeDescription?: string;
}

export class TranscriptEditorService {
  /**
   * Create a new transcript edit
   */
  static async createEdit(
    conferenceId: number,
    operatorId: number,
    operatorName: string,
    editRequest: EditRequest
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const edit = await db.insert(transcriptEdits).values({
      transcriptionSegmentId: editRequest.transcriptionSegmentId,
      conferenceId,
      originalText: editRequest.originalText,
      correctedText: editRequest.correctedText,
      editType: editRequest.editType,
      reason: editRequest.reason,
      operatorId,
      operatorName,
      confidence: editRequest.confidence || 95,
      approved: false,
    });

    // Log audit trail
    await this.logAuditEvent(conferenceId, operatorId, operatorName, "operator", "created", {
      editId: (edit as any).insertId,
      originalText: editRequest.originalText,
      correctedText: editRequest.correctedText,
      editType: editRequest.editType,
    });

    return edit;
  }

  /**
   * Get all edits for a conference
   */
  static async getConferenceEdits(conferenceId: number) {
    const db = await getDb();
    if (!db) return [];
    const edits = await db
      .select()
      .from(transcriptEdits)
      .where(eq(transcriptEdits.conferenceId, conferenceId));

    return edits;
  }

  /**
   * Get pending edits requiring approval
   */
  static async getPendingEdits(conferenceId: number) {
    const db = await getDb();
    if (!db) return [];
    const pending = await db
      .select()
      .from(transcriptEdits)
      .where(
        and(
          eq(transcriptEdits.conferenceId, conferenceId),
          eq(transcriptEdits.approved, false)
        )
      );

    return pending;
  }

  /**
   * Approve or reject an edit
   */
  static async approveEdit(
    editId: number,
    conferenceId: number,
    approval: EditApprovalRequest
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const edit = await db
      .select()
      .from(transcriptEdits)
      .where(eq(transcriptEdits.id, editId));

    if (!edit.length) {
      throw new Error(`Edit ${editId} not found`);
    }

    const updated = await db
      .update(transcriptEdits)
      .set({
        approved: approval.approved,
        approvedBy: approval.approverId,
        approvedAt: approval.approved ? new Date() : null,
      })
      .where(eq(transcriptEdits.id, editId)) as any;

    // Log audit trail
    await this.logAuditEvent(
      conferenceId,
      approval.approverId,
      approval.approverName,
      "admin",
      approval.approved ? "approved" : "rejected",
      {
        editId,
        originalText: edit[0].originalText,
        correctedText: edit[0].correctedText,
      }
    );

    return updated;
  }

  /**
   * Get full transcript with all approved edits applied
   */
  static async getFullTranscriptWithEdits(conferenceId: number) {
    const db = await getDb();
    if (!db) return "";
    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, conferenceId));

    const approvedEdits = await db
      .select()
      .from(transcriptEdits)
      .where(
        and(
          eq(transcriptEdits.conferenceId, conferenceId),
          eq(transcriptEdits.approved, true)
        )
      );

    // Build edit map for quick lookup
    const editMap = new Map<number, string>();
    approvedEdits.forEach((edit: typeof transcriptEdits.$inferSelect) => {
      editMap.set(edit.transcriptionSegmentId, edit.correctedText);
    });

    // Build full transcript with edits applied
    const fullTranscript = segments
      .map((seg: typeof occTranscriptionSegments.$inferSelect) => {
        const correctedText = editMap.get(seg.id) || seg.text;
        return `[${seg.speakerName}]: ${correctedText}`;
      })
      .join("\n");

    return fullTranscript;
  }

  /**
   * Create a version snapshot of the transcript
   */
  static async createVersion(
    conferenceId: number,
    userId: number,
    userName: string,
    changeDescription?: string
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const fullTranscript = await this.getFullTranscriptWithEdits(conferenceId);

    // Get current edit count
    const edits = await this.getConferenceEdits(conferenceId);
    const editCount = edits.length;

    // Get next version number
    const lastVersion = await db
      .select()
      .from(transcriptVersions)
      .where(eq(transcriptVersions.conferenceId, conferenceId))
      .orderBy(transcriptVersions.versionNumber)
      .limit(1);

    const versionNumber = lastVersion.length > 0 ? lastVersion[0].versionNumber + 1 : 1;

    const version = await db.insert(transcriptVersions).values({
      conferenceId,
      versionNumber,
      fullTranscript,
      editCount,
      createdBy: userId,
      createdByName: userName,
      changeDescription,
      isPublished: false,
    });

    // Log audit trail
    await this.logAuditEvent(conferenceId, userId, userName, "operator", "created", {
      versionId: (version as any).insertId,
      versionNumber,
      editCount,
    });

    return version;
  }

  /**
   * Get all versions for a conference
   */
  static async getConferenceVersions(conferenceId: number) {
    const db = await getDb();
    if (!db) return [];
    const versions = await db
      .select()
      .from(transcriptVersions)
      .where(eq(transcriptVersions.conferenceId, conferenceId))
      .orderBy(transcriptVersions.versionNumber);

    return versions;
  }

  /**
   * Publish a transcript version (make it official)
   */
  static async publishVersion(
    versionId: number,
    conferenceId: number,
    userId: number,
    userName: string
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const updated = await db
      .update(transcriptVersions)
      .set({
        isPublished: true,
        publishedAt: new Date(),
      })
      .where(eq(transcriptVersions.id, versionId));

    // Log audit trail
    await this.logAuditEvent(conferenceId, userId, userName, "admin", "published", {
      versionId,
    });

    return updated;
  }

  /**
   * Revert to a previous version
   */
  static async revertToVersion(
    versionId: number,
    conferenceId: number,
    userId: number,
    userName: string
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const targetVersion = await db
      .select()
      .from(transcriptVersions)
      .where(eq(transcriptVersions.id, versionId));

    if (!targetVersion.length) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Create new version with reverted content
    const newVersion = await db.insert(transcriptVersions).values({
      conferenceId,
      versionNumber: targetVersion[0].versionNumber + 1,
      fullTranscript: targetVersion[0].fullTranscript,
      editCount: targetVersion[0].editCount,
      createdBy: userId,
      createdByName: userName,
      changeDescription: `Reverted to version ${targetVersion[0].versionNumber}`,
      isPublished: false,
    });

    // Log audit trail
    await this.logAuditEvent(conferenceId, userId, userName, "operator", "reverted", {
      revertedFromVersionId: versionId,
      newVersionId: (newVersion as any).insertId,
    });

    return newVersion;
  }

  /**
   * Get audit log for a conference
   */
  static async getAuditLog(conferenceId: number) {
    const db = await getDb();
    if (!db) return [];
    const logs = await db
      .select()
      .from(transcriptEditAuditLog)
      .where(eq(transcriptEditAuditLog.conferenceId, conferenceId))
      .orderBy(transcriptEditAuditLog.timestamp);

    return logs;
  }

  /**
   * Log an audit event
   */
  static async logAuditEvent(
    conferenceId: number,
    userId: number,
    userName: string,
    userRole: "operator" | "admin" | "moderator",
    action: "created" | "edited" | "approved" | "rejected" | "published" | "reverted" | "deleted",
    details?: Record<string, any>
  ) {
    const db = await getDb();
    if (!db) return;
    await db.insert(transcriptEditAuditLog).values({
      conferenceId,
      action,
      userId,
      userName,
      userRole,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date(),
    });
  }

  /**
   * Generate AI-powered correction suggestions using LLM
   */
  static async generateCorrectionSuggestions(
    originalText: string,
    context?: string
  ) {
    const prompt = context
      ? `Given the context: "${context}"\n\nOriginal transcribed text: "${originalText}"\n\nProvide 3 possible corrections for this text. Return as JSON array with {correction: string, confidence: 0-100, reason: string}.`
      : `Original transcribed text: "${originalText}"\n\nProvide 3 possible corrections for this text. Return as JSON array with {correction: string, confidence: 0-100, reason: string}.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a transcription correction expert. Suggest corrections for transcribed speech with high accuracy.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "correction_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      correction: { type: "string" },
                      confidence: { type: "number", minimum: 0, maximum: 100 },
                      reason: { type: "string" },
                    },
                    required: ["correction", "confidence", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      if (typeof content === "string") {
        const parsed = JSON.parse(content);
        return parsed.suggestions || [];
      }
      return [] as any;
    } catch (error) {
      console.error("Error generating correction suggestions:", error);
      return [] as any;
    }
  }

  /**
   * Get edit statistics for a conference
   */
  static async getEditStatistics(conferenceId: number) {
    const edits = await this.getConferenceEdits(conferenceId);
    const approvedEdits = edits.filter((e: typeof transcriptEdits.$inferSelect) => e.approved);
    const pendingEdits = edits.filter((e: typeof transcriptEdits.$inferSelect) => !e.approved);

    const editTypeBreakdown = edits.reduce(
      (acc: Record<string, number>, edit: typeof transcriptEdits.$inferSelect) => {
        acc[edit.editType] = (acc[edit.editType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgConfidence =
      edits.length > 0
        ? edits.reduce((sum: number, e: typeof transcriptEdits.$inferSelect) => sum + e.confidence, 0) /
          edits.length
        : 0;

    return {
      totalEdits: edits.length,
      approvedEdits: approvedEdits.length,
      pendingEdits: pendingEdits.length,
      approvalRate: edits.length > 0 ? (approvedEdits.length / edits.length) * 100 : 0,
      editTypeBreakdown,
      averageConfidence: Math.round(avgConfidence),
    };
  }

  /**
   * Export transcript as formatted document
   */
  static async exportTranscript(
    conferenceId: number,
    format: "txt" | "md" | "json" = "txt"
  ) {
    const fullTranscript = await this.getFullTranscriptWithEdits(conferenceId);
    const versions = await this.getConferenceVersions(conferenceId);
    const stats = await this.getEditStatistics(conferenceId);
    const db = await getDb();

    if (format === "json") {
      return {
        transcript: fullTranscript,
        statistics: stats,
        versions: versions.length,
        lastUpdated: new Date().toISOString(),
      };
    }

    if (format === "md") {
      return `# Transcript

${fullTranscript}

## Statistics
- Total Edits: ${stats.totalEdits}
- Approved: ${stats.approvedEdits}
- Pending: ${stats.pendingEdits}
- Approval Rate: ${stats.approvalRate.toFixed(1)}%
- Average Confidence: ${stats.averageConfidence}%

## Version History
${versions.map((v: typeof transcriptVersions.$inferSelect) => `- Version ${v.versionNumber}: ${v.changeDescription || "No description"}`).join("\n")}
`;
    }

    // Default: plain text
    return fullTranscript as any;
  }
}
