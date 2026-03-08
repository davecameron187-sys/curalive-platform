import { describe, it, expect, beforeEach, vi } from "vitest";
import { TranscriptEditorService } from "./services/TranscriptEditorService";
import { db } from "./db";
import {
  transcriptEdits,
  transcriptVersions,
  transcriptEditAuditLog,
  occTranscriptionSegments,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("TranscriptEditorService", () => {
  const mockConferenceId = 1;
  const mockOperatorId = 1;
  const mockOperatorName = "Test Operator";
  const mockApproverId = 2;
  const mockApproverName = "Test Admin";

  beforeEach(async () => {
    // Clean up test data
    await db.delete(transcriptEdits).where(eq(transcriptEdits.conferenceId, mockConferenceId));
    await db.delete(transcriptVersions).where(eq(transcriptVersions.conferenceId, mockConferenceId));
    await db
      .delete(transcriptEditAuditLog)
      .where(eq(transcriptEditAuditLog.conferenceId, mockConferenceId));
  });

  describe("createEdit", () => {
    it("should create a new transcript edit", async () => {
      const editRequest = {
        transcriptionSegmentId: 1,
        originalText: "The quarterly earnings were strong",
        correctedText: "The quarterly earnings were very strong",
        editType: "correction" as const,
        reason: "Added emphasis",
        confidence: 98,
      };

      const result = await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        editRequest
      );

      expect(result.insertId).toBeDefined();

      const edits = await TranscriptEditorService.getConferenceEdits(mockConferenceId);
      expect(edits).toHaveLength(1);
      expect(edits[0].originalText).toBe(editRequest.originalText);
      expect(edits[0].correctedText).toBe(editRequest.correctedText);
      expect(edits[0].approved).toBe(false);
    });

    it("should log audit event when creating edit", async () => {
      const editRequest = {
        transcriptionSegmentId: 1,
        originalText: "Original text",
        correctedText: "Corrected text",
        editType: "clarification" as const,
      };

      await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        editRequest
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe("created");
      expect(logs[0].userId).toBe(mockOperatorId);
    });

    it("should handle redaction edit type", async () => {
      const editRequest = {
        transcriptionSegmentId: 1,
        originalText: "Sensitive information",
        correctedText: "[REDACTED]",
        editType: "redaction" as const,
        reason: "Confidential data",
      };

      await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        editRequest
      );

      const edits = await TranscriptEditorService.getConferenceEdits(mockConferenceId);
      expect(edits[0].editType).toBe("redaction");
      expect(edits[0].correctedText).toBe("[REDACTED]");
    });
  });

  describe("approveEdit", () => {
    it("should approve a pending edit", async () => {
      const editRequest = {
        transcriptionSegmentId: 1,
        originalText: "Original",
        correctedText: "Corrected",
        editType: "correction" as const,
      };

      const createResult = await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        editRequest
      );

      const editId = Number(createResult.insertId);

      await TranscriptEditorService.approveEdit(editId, mockConferenceId, {
        editId,
        approved: true,
        approverName: mockApproverName,
        approverId: mockApproverId,
      });

      const edits = await TranscriptEditorService.getConferenceEdits(mockConferenceId);
      expect(edits[0].approved).toBe(true);
      expect(edits[0].approvedBy).toBe(mockApproverId);
      expect(edits[0].approvedAt).toBeDefined();
    });

    it("should reject an edit", async () => {
      const editRequest = {
        transcriptionSegmentId: 1,
        originalText: "Original",
        correctedText: "Corrected",
        editType: "correction" as const,
      };

      const createResult = await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        editRequest
      );

      const editId = Number(createResult.insertId);

      await TranscriptEditorService.approveEdit(editId, mockConferenceId, {
        editId,
        approved: false,
        approverName: mockApproverName,
        approverId: mockApproverId,
      });

      const edits = await TranscriptEditorService.getConferenceEdits(mockConferenceId);
      expect(edits[0].approved).toBe(false);
      expect(edits[0].approvedAt).toBeNull();
    });

    it("should log approval in audit trail", async () => {
      const editRequest = {
        transcriptionSegmentId: 1,
        originalText: "Original",
        correctedText: "Corrected",
        editType: "correction" as const,
      };

      const createResult = await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        editRequest
      );

      const editId = Number(createResult.insertId);

      await TranscriptEditorService.approveEdit(editId, mockConferenceId, {
        editId,
        approved: true,
        approverName: mockApproverName,
        approverId: mockApproverId,
      });

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      const approvalLog = logs.find((l) => l.action === "approved");
      expect(approvalLog).toBeDefined();
      expect(approvalLog?.userId).toBe(mockApproverId);
    });
  });

  describe("getPendingEdits", () => {
    it("should return only unapproved edits", async () => {
      // Create 3 edits
      for (let i = 0; i < 3; i++) {
        await TranscriptEditorService.createEdit(
          mockConferenceId,
          mockOperatorId,
          mockOperatorName,
          {
            transcriptionSegmentId: i + 1,
            originalText: `Original ${i}`,
            correctedText: `Corrected ${i}`,
            editType: "correction" as const,
          }
        );
      }

      // Approve first edit
      const allEdits = await TranscriptEditorService.getConferenceEdits(mockConferenceId);
      await TranscriptEditorService.approveEdit(Number(allEdits[0].id), mockConferenceId, {
        editId: Number(allEdits[0].id),
        approved: true,
        approverName: mockApproverName,
        approverId: mockApproverId,
      });

      const pending = await TranscriptEditorService.getPendingEdits(mockConferenceId);
      expect(pending).toHaveLength(2);
      expect(pending.every((e) => !e.approved)).toBe(true);
    });
  });

  describe("createVersion", () => {
    it("should create a transcript version", async () => {
      const version = await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Initial version"
      );

      expect(version.insertId).toBeDefined();

      const versions = await TranscriptEditorService.getConferenceVersions(mockConferenceId);
      expect(versions).toHaveLength(1);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[0].changeDescription).toBe("Initial version");
      expect(versions[0].isPublished).toBe(false);
    });

    it("should increment version number", async () => {
      await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Version 1"
      );

      await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Version 2"
      );

      const versions = await TranscriptEditorService.getConferenceVersions(mockConferenceId);
      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[1].versionNumber).toBe(2);
    });

    it("should log version creation in audit trail", async () => {
      await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Test version"
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      const versionLog = logs.find((l) => l.action === "created");
      expect(versionLog).toBeDefined();
    });
  });

  describe("publishVersion", () => {
    it("should publish a transcript version", async () => {
      const versionResult = await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Version to publish"
      );

      const versionId = Number(versionResult.insertId);

      await TranscriptEditorService.publishVersion(
        versionId,
        mockConferenceId,
        mockApproverId,
        mockApproverName
      );

      const versions = await TranscriptEditorService.getConferenceVersions(mockConferenceId);
      expect(versions[0].isPublished).toBe(true);
      expect(versions[0].publishedAt).toBeDefined();
    });

    it("should log publication in audit trail", async () => {
      const versionResult = await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName
      );

      const versionId = Number(versionResult.insertId);

      await TranscriptEditorService.publishVersion(
        versionId,
        mockConferenceId,
        mockApproverId,
        mockApproverName
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      const publishLog = logs.find((l) => l.action === "published");
      expect(publishLog).toBeDefined();
    });
  });

  describe("revertToVersion", () => {
    it("should revert to a previous version", async () => {
      const v1 = await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Version 1"
      );

      const v2 = await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "Version 2"
      );

      await TranscriptEditorService.revertToVersion(
        Number(v1.insertId),
        mockConferenceId,
        mockApproverId,
        mockApproverName
      );

      const versions = await TranscriptEditorService.getConferenceVersions(mockConferenceId);
      expect(versions).toHaveLength(3);
      expect(versions[2].changeDescription).toContain("Reverted to version");
    });

    it("should log revert action in audit trail", async () => {
      const v1 = await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName
      );

      await TranscriptEditorService.revertToVersion(
        Number(v1.insertId),
        mockConferenceId,
        mockApproverId,
        mockApproverName
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      const revertLog = logs.find((l) => l.action === "reverted");
      expect(revertLog).toBeDefined();
    });
  });

  describe("getEditStatistics", () => {
    it("should calculate edit statistics", async () => {
      // Create 5 edits
      const editIds: number[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await TranscriptEditorService.createEdit(
          mockConferenceId,
          mockOperatorId,
          mockOperatorName,
          {
            transcriptionSegmentId: i + 1,
            originalText: `Original ${i}`,
            correctedText: `Corrected ${i}`,
            editType: i % 2 === 0 ? ("correction" as const) : ("clarification" as const),
            confidence: 90 + i,
          }
        );
        editIds.push(Number(result.insertId));
      }

      // Approve 3 edits
      for (let i = 0; i < 3; i++) {
        await TranscriptEditorService.approveEdit(editIds[i], mockConferenceId, {
          editId: editIds[i],
          approved: true,
          approverName: mockApproverName,
          approverId: mockApproverId,
        });
      }

      const stats = await TranscriptEditorService.getEditStatistics(mockConferenceId);

      expect(stats.totalEdits).toBe(5);
      expect(stats.approvedEdits).toBe(3);
      expect(stats.pendingEdits).toBe(2);
      expect(stats.approvalRate).toBe(60);
      expect(stats.editTypeBreakdown.correction).toBe(3);
      expect(stats.editTypeBreakdown.clarification).toBe(2);
      expect(stats.averageConfidence).toBeGreaterThan(0);
    });

    it("should handle zero edits", async () => {
      const stats = await TranscriptEditorService.getEditStatistics(mockConferenceId);

      expect(stats.totalEdits).toBe(0);
      expect(stats.approvedEdits).toBe(0);
      expect(stats.pendingEdits).toBe(0);
      expect(stats.approvalRate).toBe(0);
      expect(stats.averageConfidence).toBe(0);
    });
  });

  describe("exportTranscript", () => {
    it("should export transcript as plain text", async () => {
      const transcript = await TranscriptEditorService.exportTranscript(
        mockConferenceId,
        "txt"
      );

      expect(typeof transcript).toBe("string");
    });

    it("should export transcript as markdown", async () => {
      const transcript = await TranscriptEditorService.exportTranscript(
        mockConferenceId,
        "md"
      );

      expect(typeof transcript).toBe("string");
      expect(transcript).toContain("# Transcript");
      expect(transcript).toContain("## Statistics");
    });

    it("should export transcript as JSON", async () => {
      const transcript = await TranscriptEditorService.exportTranscript(
        mockConferenceId,
        "json"
      );

      expect(typeof transcript).toBe("object");
      expect(transcript).toHaveProperty("transcript");
      expect(transcript).toHaveProperty("statistics");
      expect(transcript).toHaveProperty("lastUpdated");
    });
  });

  describe("getAuditLog", () => {
    it("should return all audit events for a conference", async () => {
      await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        {
          transcriptionSegmentId: 1,
          originalText: "Original",
          correctedText: "Corrected",
          editType: "correction" as const,
        }
      );

      await TranscriptEditorService.createVersion(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((l) => l.action === "created")).toBe(true);
    });

    it("should include user information in audit log", async () => {
      await TranscriptEditorService.createEdit(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        {
          transcriptionSegmentId: 1,
          originalText: "Original",
          correctedText: "Corrected",
          editType: "correction" as const,
        }
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      const log = logs[0];

      expect(log.userId).toBe(mockOperatorId);
      expect(log.userName).toBe(mockOperatorName);
      expect(log.userRole).toBe("operator");
    });
  });

  describe("logAuditEvent", () => {
    it("should log custom audit events", async () => {
      await TranscriptEditorService.logAuditEvent(
        mockConferenceId,
        mockOperatorId,
        mockOperatorName,
        "operator",
        "created",
        { customField: "customValue" }
      );

      const logs = await TranscriptEditorService.getAuditLog(mockConferenceId);
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("created");
      expect(logs[0].details).toContain("customField");
    });
  });
});
