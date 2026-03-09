# Transcript Editing & Correction Feature Specification

## Executive Summary

This document outlines the comprehensive architecture and implementation strategy for adding transcript editing and correction capabilities to CuraLive. The feature enables operators to correct transcription errors, improve accuracy, maintain version history, and ensure compliance with audit requirements. Operators can edit individual segments or perform batch corrections, with full version control, audit trails, and approval workflows.

**Target Completion:** 4 weeks  
**Complexity:** High  
**Business Impact:** High (increases transcript accuracy, enables compliance, improves customer satisfaction)

---

## 1. System Architecture

### 1.1 Editing Workflow

```
┌──────────────────────────────────────────────────────────────┐
│              LIVE TRANSCRIPTION (Read-Only)                  │
│  Real-time segments from Whisper API with confidence scores  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│          TRANSCRIPT EDITOR (Post-Event)                      │
│  - View all segments with confidence scores                  │
│  - Inline editing for individual segments                    │
│  - Batch editing modal for bulk corrections                  │
│  - Search and replace functionality                          │
│  - Spell-check and grammar suggestions                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Single │  │ Batch  │  │ Approval │
    │ Edit   │  │ Edit   │  │ Workflow │
    └────┬───┘  └────┬───┘  └─────┬────┘
         │           │            │
         └───────────┼────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│            VERSION HISTORY & AUDIT TRAIL                     │
│  - Track all edits with timestamps and operator info        │
│  - Store original and corrected text                        │
│  - Enable undo/revert functionality                         │
│  - Maintain compliance audit log                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│            CORRECTED TRANSCRIPT EXPORT                       │
│  - Generate PDF with corrected text                         │
│  - Export SRT/VTT with corrections                          │
│  - Include edit history in post-event report                │
│  - Update post-event summary with corrected transcript      │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interaction

The transcript editing feature integrates with the existing transcription pipeline at the post-event stage. Operators can access the editor from the OCC or Post-Event Report page, make corrections, and the corrected transcript is used for all subsequent exports and reports.

---

## 2. Database Schema

### 2.1 New Tables

#### `occ_transcript_edits`
Stores individual edits made to transcription segments with full version history.

```sql
CREATE TABLE occ_transcript_edits (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  segment_id BIGINT NOT NULL,
  conference_id BIGINT NOT NULL,
  operator_id BIGINT NOT NULL,
  edit_type ENUM('correction', 'deletion', 'merge', 'split') NOT NULL,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  original_confidence DECIMAL(3, 2),
  updated_confidence DECIMAL(3, 2),
  reason VARCHAR(500),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by BIGINT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (segment_id) REFERENCES occ_transcriptions(id),
  FOREIGN KEY (conference_id) REFERENCES occ_conferences(id),
  FOREIGN KEY (operator_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_segment_id (segment_id),
  INDEX idx_conference_id (conference_id),
  INDEX idx_operator_id (operator_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

#### `occ_transcript_audit_log`
Maintains compliance audit trail for all transcript modifications.

```sql
CREATE TABLE occ_transcript_audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conference_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  operator_id BIGINT NOT NULL,
  segment_ids JSON,
  changes JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conference_id) REFERENCES occ_conferences(id),
  FOREIGN KEY (operator_id) REFERENCES users(id),
  INDEX idx_conference_id (conference_id),
  INDEX idx_operator_id (operator_id),
  INDEX idx_created_at (created_at)
);
```

#### `occ_transcript_corrections`
Aggregates all corrections for a segment to maintain current corrected state.

```sql
CREATE TABLE occ_transcript_corrections (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  segment_id BIGINT NOT NULL UNIQUE,
  conference_id BIGINT NOT NULL,
  original_text TEXT NOT NULL,
  current_corrected_text TEXT NOT NULL,
  correction_count INT DEFAULT 0,
  last_corrected_by BIGINT,
  last_corrected_at TIMESTAMP,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (segment_id) REFERENCES occ_transcriptions(id),
  FOREIGN KEY (conference_id) REFERENCES occ_conferences(id),
  FOREIGN KEY (last_corrected_by) REFERENCES users(id),
  INDEX idx_segment_id (segment_id),
  INDEX idx_conference_id (conference_id)
);
```

#### `occ_transcript_suggestions`
Stores AI-generated correction suggestions based on confidence scores.

```sql
CREATE TABLE occ_transcript_suggestions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  segment_id BIGINT NOT NULL,
  conference_id BIGINT NOT NULL,
  suggestion_type ENUM('low_confidence', 'grammar', 'spell_check', 'context') NOT NULL,
  original_text VARCHAR(500),
  suggested_text VARCHAR(500),
  confidence DECIMAL(3, 2),
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (segment_id) REFERENCES occ_transcriptions(id),
  FOREIGN KEY (conference_id) REFERENCES occ_conferences(id),
  INDEX idx_segment_id (segment_id),
  INDEX idx_conference_id (conference_id),
  INDEX idx_suggestion_type (suggestion_type)
);
```

---

## 3. Backend Implementation

### 3.1 Transcript Editing Service

```typescript
// server/services/transcriptEditingService.ts
import { db } from "@/server/db";
import { occ_transcript_edits, occ_transcript_audit_log, occ_transcript_corrections } from "@/drizzle/schema";

export class TranscriptEditingService {
  /**
   * Edit a single transcription segment
   */
  async editSegment(
    segmentId: string,
    correctedText: string,
    operatorId: string,
    reason?: string
  ) {
    // Get original segment
    const segment = await db.query.occ_transcriptions.findFirst({
      where: (t, { eq }) => eq(t.id, segmentId)
    });

    if (!segment) throw new Error("Segment not found");

    // Create edit record
    const edit = await db.insert(occ_transcript_edits).values({
      segment_id: segmentId,
      conference_id: segment.conference_id,
      operator_id: operatorId,
      edit_type: "correction",
      original_text: segment.text,
      corrected_text: correctedText,
      original_confidence: segment.confidence,
      reason: reason || null,
      status: "pending"
    });

    // Update or create correction record
    const existing = await db.query.occ_transcript_corrections.findFirst({
      where: (c, { eq }) => eq(c.segment_id, segmentId)
    });

    if (existing) {
      await db.update(occ_transcript_corrections)
        .set({
          current_corrected_text: correctedText,
          correction_count: existing.correction_count + 1,
          last_corrected_by: operatorId,
          last_corrected_at: new Date()
        })
        .where((c, { eq }) => eq(c.segment_id, segmentId));
    } else {
      await db.insert(occ_transcript_corrections).values({
        segment_id: segmentId,
        conference_id: segment.conference_id,
        original_text: segment.text,
        current_corrected_text: correctedText,
        correction_count: 1,
        last_corrected_by: operatorId,
        last_corrected_at: new Date()
      });
    }

    // Log to audit trail
    await this.logAuditEvent(
      segment.conference_id,
      "SEGMENT_EDITED",
      operatorId,
      [segmentId],
      { original: segment.text, corrected: correctedText }
    );

    return edit;
  }

  /**
   * Batch edit multiple segments
   */
  async batchEditSegments(
    conferenceId: string,
    edits: Array<{ segmentId: string; correctedText: string }>,
    operatorId: string,
    reason?: string
  ) {
    const results = [];

    for (const edit of edits) {
      const result = await this.editSegment(
        edit.segmentId,
        edit.correctedText,
        operatorId,
        reason
      );
      results.push(result);
    }

    // Log batch operation
    await this.logAuditEvent(
      conferenceId,
      "BATCH_EDIT",
      operatorId,
      edits.map(e => e.segmentId),
      { count: edits.length, reason }
    );

    return results;
  }

  /**
   * Get edit history for a segment
   */
  async getEditHistory(segmentId: string) {
    const edits = await db.query.occ_transcript_edits.findMany({
      where: (e, { eq }) => eq(e.segment_id, segmentId),
      orderBy: (e) => e.created_at
    });

    return edits;
  }

  /**
   * Revert a segment to original or previous version
   */
  async revertEdit(segmentId: string, operatorId: string, targetVersion?: number) {
    const edits = await this.getEditHistory(segmentId);

    if (edits.length === 0) throw new Error("No edits found for this segment");

    // Get target text (original or previous version)
    let targetText: string;
    if (targetVersion === undefined || targetVersion === 0) {
      // Revert to original
      const segment = await db.query.occ_transcriptions.findFirst({
        where: (t, { eq }) => eq(t.id, segmentId)
      });
      targetText = segment!.text;
    } else {
      // Revert to specific version
      targetText = edits[targetVersion - 1].corrected_text;
    }

    // Create revert edit
    const segment = await db.query.occ_transcriptions.findFirst({
      where: (t, { eq }) => eq(t.id, segmentId)
    });

    const revertEdit = await db.insert(occ_transcript_edits).values({
      segment_id: segmentId,
      conference_id: segment!.conference_id,
      operator_id: operatorId,
      edit_type: "correction",
      original_text: (await db.query.occ_transcript_corrections.findFirst({
        where: (c, { eq }) => eq(c.segment_id, segmentId)
      }))?.current_corrected_text || segment!.text,
      corrected_text: targetText,
      reason: `Reverted to version ${targetVersion || "original"}`,
      status: "approved"
    });

    // Update correction record
    await db.update(occ_transcript_corrections)
      .set({
        current_corrected_text: targetText,
        last_corrected_by: operatorId,
        last_corrected_at: new Date()
      })
      .where((c, { eq }) => eq(c.segment_id, segmentId));

    return revertEdit;
  }

  /**
   * Approve pending edits (admin only)
   */
  async approveEdit(editId: string, approverOperatorId: string) {
    await db.update(occ_transcript_edits)
      .set({
        status: "approved",
        approved_by: approverOperatorId,
        approved_at: new Date()
      })
      .where((e, { eq }) => eq(e.id, editId));

    // Log approval
    const edit = await db.query.occ_transcript_edits.findFirst({
      where: (e, { eq }) => eq(e.id, editId)
    });

    await this.logAuditEvent(
      edit!.conference_id,
      "EDIT_APPROVED",
      approverOperatorId,
      [edit!.segment_id.toString()],
      { editId }
    );
  }

  /**
   * Get corrected transcript for export
   */
  async getCorrectedTranscript(conferenceId: string) {
    const segments = await db.query.occ_transcriptions.findMany({
      where: (t, { eq }) => eq(t.conference_id, conferenceId),
      orderBy: (t) => t.segment_index
    });

    const correctedSegments = await Promise.all(
      segments.map(async (seg) => {
        const correction = await db.query.occ_transcript_corrections.findFirst({
          where: (c, { eq }) => eq(c.segment_id, seg.id)
        });

        return {
          ...seg,
          text: correction?.current_corrected_text || seg.text,
          is_corrected: !!correction
        };
      })
    );

    return correctedSegments;
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    conferenceId: string,
    action: string,
    operatorId: string,
    segmentIds: string[],
    changes: any
  ) {
    await db.insert(occ_transcript_audit_log).values({
      conference_id: conferenceId,
      action,
      operator_id: operatorId,
      segment_ids: JSON.stringify(segmentIds),
      changes: JSON.stringify(changes),
      created_at: new Date()
    });
  }

  /**
   * Generate correction suggestions based on confidence scores
   */
  async generateSuggestions(conferenceId: string) {
    const segments = await db.query.occ_transcriptions.findMany({
      where: (t, { eq }) => eq(t.conference_id, conferenceId)
    });

    const suggestions = [];

    for (const segment of segments) {
      // Flag low confidence segments
      if (segment.confidence && segment.confidence < 0.7) {
        suggestions.push({
          segment_id: segment.id,
          conference_id: conferenceId,
          suggestion_type: "low_confidence",
          original_text: segment.text,
          confidence: segment.confidence
        });
      }
    }

    // Insert suggestions
    if (suggestions.length > 0) {
      await db.insert(occ_transcript_suggestions).values(suggestions);
    }

    return suggestions;
  }
}
```

### 3.2 tRPC Procedures

```typescript
// server/routers/transcriptEditing.ts
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { TranscriptEditingService } from "@/server/services/transcriptEditingService";

const editingService = new TranscriptEditingService();

export const transcriptEditingRouter = router({
  /**
   * Edit a single segment
   */
  editSegment: protectedProcedure
    .input(z.object({
      segmentId: z.string(),
      correctedText: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await editingService.editSegment(
        input.segmentId,
        input.correctedText,
        ctx.user.id.toString(),
        input.reason
      );
    }),

  /**
   * Batch edit multiple segments
   */
  batchEditSegments: protectedProcedure
    .input(z.object({
      conferenceId: z.string(),
      edits: z.array(z.object({
        segmentId: z.string(),
        correctedText: z.string()
      })),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await editingService.batchEditSegments(
        input.conferenceId,
        input.edits,
        ctx.user.id.toString(),
        input.reason
      );
    }),

  /**
   * Get edit history for a segment
   */
  getEditHistory: protectedProcedure
    .input(z.object({ segmentId: z.string() }))
    .query(async ({ input }) => {
      return await editingService.getEditHistory(input.segmentId);
    }),

  /**
   * Revert to previous version
   */
  revertEdit: protectedProcedure
    .input(z.object({
      segmentId: z.string(),
      targetVersion: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await editingService.revertEdit(
        input.segmentId,
        ctx.user.id.toString(),
        input.targetVersion
      );
    }),

  /**
   * Get corrected transcript
   */
  getCorrectedTranscript: protectedProcedure
    .input(z.object({ conferenceId: z.string() }))
    .query(async ({ input }) => {
      return await editingService.getCorrectedTranscript(input.conferenceId);
    }),

  /**
   * Get correction suggestions
   */
  getCorrectionsForConference: protectedProcedure
    .input(z.object({ conferenceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const corrections = await ctx.db.query.occ_transcript_corrections.findMany({
        where: (c, { eq }) => eq(c.conference_id, input.conferenceId)
      });
      return corrections;
    }),

  /**
   * Get audit log
   */
  getAuditLog: protectedProcedure
    .input(z.object({
      conferenceId: z.string(),
      limit: z.number().default(100)
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.occ_transcript_audit_log.findMany({
        where: (a, { eq }) => eq(a.conference_id, input.conferenceId),
        limit: input.limit,
        orderBy: (a) => a.created_at
      });
    })
});
```

---

## 4. Frontend Implementation

### 4.1 Transcript Editor Component

```typescript
// client/src/components/TranscriptEditor.tsx
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function TranscriptEditor({ conferenceId }: { conferenceId: string }) {
  const [segments, setSegments] = useState<any[]>([]);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historySegmentId, setHistorySegmentId] = useState<string | null>(null);

  const { data: correctedSegments } = trpc.transcriptEditing.getCorrectedTranscript.useQuery(
    { conferenceId },
    { enabled: !!conferenceId }
  );

  const editSegmentMutation = trpc.transcriptEditing.editSegment.useMutation();
  const { data: editHistory } = trpc.transcriptEditing.getEditHistory.useQuery(
    { segmentId: historySegmentId || "" },
    { enabled: !!historySegmentId }
  );

  useEffect(() => {
    if (correctedSegments) {
      setSegments(correctedSegments);
    }
  }, [correctedSegments]);

  const handleEditSegment = async () => {
    if (!editingSegmentId) return;

    await editSegmentMutation.mutateAsync({
      segmentId: editingSegmentId,
      correctedText: editingText
    });

    // Update local state
    setSegments(prev =>
      prev.map(seg =>
        seg.id === editingSegmentId ? { ...seg, text: editingText } : seg
      )
    );

    setEditingSegmentId(null);
    setEditingText("");
  };

  const filteredSegments = segments.filter(seg =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seg.speaker_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800";
    if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="transcript-editor bg-slate-900 text-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Transcript Editor</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 bg-slate-800 rounded text-sm"
          />
          <Button
            onClick={() => setShowBatchEdit(true)}
            disabled={selectedSegments.size === 0}
            className="text-xs"
          >
            Batch Edit ({selectedSegments.size})
          </Button>
          <Button onClick={() => setShowHistory(true)} className="text-xs">
            History
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredSegments.map((seg) => (
          <div
            key={seg.id}
            className="border-l-2 border-blue-400 pl-3 py-2 hover:bg-slate-800 rounded transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-semibold text-blue-300">
                  {seg.speaker_name} ({seg.speaker_role})
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge className={confidenceColor(seg.confidence || 1)}>
                    {((seg.confidence || 1) * 100).toFixed(0)}%
                  </Badge>
                  {seg.is_corrected && (
                    <Badge className="bg-green-600 text-white">Corrected</Badge>
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedSegments.has(seg.id)}
                onChange={(e) => {
                  const newSet = new Set(selectedSegments);
                  if (e.target.checked) {
                    newSet.add(seg.id);
                  } else {
                    newSet.delete(seg.id);
                  }
                  setSelectedSegments(newSet);
                }}
                className="mt-1"
              />
            </div>

            <div
              onClick={() => {
                setEditingSegmentId(seg.id);
                setEditingText(seg.text);
              }}
              className="text-sm text-gray-200 cursor-pointer hover:text-white transition"
            >
              {seg.text}
            </div>

            <div className="text-xs text-gray-500 mt-2">
              {seg.start_time}s - {seg.end_time}s
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingSegmentId} onOpenChange={() => setEditingSegmentId(null)}>
        <DialogContent className="bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="bg-slate-700 text-white min-h-24"
            placeholder="Enter corrected text..."
          />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setEditingSegmentId(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSegment} className="bg-blue-600">
              Save Correction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Edit Modal */}
      <Dialog open={showBatchEdit} onOpenChange={setShowBatchEdit}>
        <DialogContent className="bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Batch Edit {selectedSegments.size} Segments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Search & Replace</label>
              <input
                type="text"
                placeholder="Find text..."
                className="w-full px-3 py-2 bg-slate-700 rounded mb-2"
              />
              <input
                type="text"
                placeholder="Replace with..."
                className="w-full px-3 py-2 bg-slate-700 rounded"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Reason for correction</label>
              <Textarea
                placeholder="Optional: explain why these corrections were made..."
                className="bg-slate-700 text-white min-h-20"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowBatchEdit(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600">Apply Corrections</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-slate-800 text-white max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
          </DialogHeader>
          {editHistory && editHistory.length > 0 ? (
            <div className="space-y-3">
              {editHistory.map((edit, idx) => (
                <div key={idx} className="border-l-2 border-blue-400 pl-3 py-2">
                  <div className="text-sm font-semibold">Edit #{idx + 1}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(edit.created_at).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-300 mt-2">
                    <strong>Original:</strong> {edit.original_text}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    <strong>Corrected:</strong> {edit.corrected_text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">No edit history</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### 4.2 Transcript Diff Viewer

```typescript
// client/src/components/TranscriptDiffViewer.tsx
import { useMemo } from "react";

export function TranscriptDiffViewer({
  original,
  corrected
}: {
  original: string;
  corrected: string;
}) {
  const diff = useMemo(() => {
    // Simple diff implementation - highlight changed words
    const origWords = original.split(" ");
    const corrWords = corrected.split(" ");
    const changes = [];

    for (let i = 0; i < Math.max(origWords.length, corrWords.length); i++) {
      if (origWords[i] !== corrWords[i]) {
        changes.push({
          type: "changed",
          original: origWords[i],
          corrected: corrWords[i],
          index: i
        });
      }
    }

    return changes;
  }, [original, corrected]);

  return (
    <div className="transcript-diff bg-slate-800 p-4 rounded text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-red-400 mb-2">Original</h4>
          <p className="text-gray-300">
            {original.split(" ").map((word, idx) => (
              <span
                key={idx}
                className={
                  diff.some(d => d.index === idx && d.type === "changed")
                    ? "bg-red-900 text-red-200"
                    : ""
                }
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-green-400 mb-2">Corrected</h4>
          <p className="text-gray-300">
            {corrected.split(" ").map((word, idx) => (
              <span
                key={idx}
                className={
                  diff.some(d => d.index === idx && d.type === "changed")
                    ? "bg-green-900 text-green-200"
                    : ""
                }
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Integration Points

### 5.1 OCC Integration

The transcript editor is accessible from the OCC through a new "Transcript" tab in the Feature Bar. Operators can:

- View live transcription segments with confidence scores
- Edit individual segments inline
- Perform batch corrections
- View edit history and audit trail
- Export corrected transcript

### 5.2 Post-Event Report Integration

The post-event report displays:

- Corrected transcript (with corrections highlighted)
- Original vs corrected diff viewer
- Edit history showing who made what corrections
- Audit trail for compliance
- Export options with corrected text

### 5.3 Export Integration

All export formats (PDF, SRT, VTT, JSON) use the corrected transcript:

- PDF exports include edit history section
- SRT/VTT exports contain corrected text
- JSON exports include both original and corrected versions

---

## 6. Permissions & Approval Workflow

### 6.1 Role-Based Access

| Role | Permissions |
|------|-----------|
| **Operator** | Edit own segments, view history, suggest corrections |
| **Senior Operator** | Edit all segments, approve corrections, view audit log |
| **Admin** | Full access, force approve, delete edits, configure settings |

### 6.2 Approval Workflow (Optional)

For compliance-sensitive customers, enable approval workflow:

1. Operator makes correction (status: pending)
2. Senior operator reviews and approves (status: approved)
3. Correction used in exports and reports
4. Audit trail records all steps

---

## 7. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Schema & Backend** | 1 week | Database tables, TranscriptEditingService, tRPC procedures |
| **Phase 2: Frontend Editor** | 1 week | TranscriptEditor component, inline editing, batch operations |
| **Phase 3: History & Audit** | 1 week | Version history, audit trail, diff viewer, revert functionality |
| **Phase 4: Integration & Testing** | 1 week | OCC integration, post-event report integration, export updates, testing |

**Total: 4 weeks**

---

## 8. Success Criteria

### Functional Requirements

- ✅ Edit individual segments with corrected text
- ✅ Batch edit multiple segments with search & replace
- ✅ View complete edit history for each segment
- ✅ Revert to previous versions or original
- ✅ Full audit trail of all edits
- ✅ Corrected transcript used in all exports
- ✅ Confidence scores updated after corrections
- ✅ Role-based access control

### Performance Requirements

- ✅ Edit save latency: <1s
- ✅ History retrieval: <500ms
- ✅ Batch edit processing: <5s for 100 segments
- ✅ Diff viewer rendering: <200ms
- ✅ Audit log queries: <1s

### Quality Requirements

- ✅ >80% unit test coverage
- ✅ All E2E tests passing
- ✅ Zero data loss during edits
- ✅ Complete audit trail for compliance
- ✅ GDPR/CCPA compliant (edit retention)

---

## 9. Monitoring & Analytics

### Key Metrics

- Number of edits per conference
- Average edits per segment
- Most common correction types
- Operator correction patterns
- Confidence score improvements
- User adoption rate

### Monitoring Dashboard

Real-time dashboard showing:

- Active editors per conference
- Pending corrections count
- Audit log activity
- Error rates and failures

---

## 10. Future Enhancements

1. **AI-Powered Suggestions** — Automatic suggestions for low-confidence segments
2. **Collaborative Editing** — Multiple operators editing simultaneously
3. **Spell Check & Grammar** — Built-in spell and grammar checking
4. **Custom Dictionaries** — Industry-specific terminology support
5. **Automated Corrections** — Auto-correct common transcription errors
6. **Correction Analytics** — Dashboard showing correction patterns and trends
7. **Integration with CRM** — Auto-update CRM with corrected transcripts
8. **Compliance Reporting** — Generate compliance reports with edit history

---

## 11. Security & Compliance

### Data Protection

- Encryption of edit history
- Access logging for all corrections
- Immutable audit trail
- Data retention policies

### Compliance

- GDPR: Right to deletion, data portability
- CCPA: California privacy rights
- SOC 2: Audit trail and access controls
- HIPAA: If applicable for healthcare customers

---

## Conclusion

The transcript editing and correction feature provides operators with powerful tools to ensure transcription accuracy, maintain compliance, and improve customer satisfaction. With full version history, audit trails, and role-based access control, the feature meets enterprise requirements for data integrity and regulatory compliance.

**Status:** Ready for implementation  
**Owner:** Engineering Team  
**Stakeholders:** Product, Operations, Compliance
