import { describe, it, expect, beforeEach, vi } from "vitest";
import { RedactionWorkflowService } from "./services/RedactionWorkflowService";
import { AblyRealtimeService } from "./services/AblyRealtimeService";
import { RealtimeCollaborationService } from "./services/RealtimeCollaborationService";

describe("Redaction Integration Tests", () => {
  describe("RedactionWorkflowService", () => {
    it("should detect sensitive financial content", async () => {
      const text = "Our revenue is $5,000,000 with a profit margin of 25%";
      const result = await RedactionWorkflowService.detectSensitiveContent(text);

      expect(result.hasSensitive).toBe(true);
      expect(result.types).toContain("financial");
    });

    it("should detect personal information", async () => {
      const text = "Contact John at john@example.com or 555-123-4567";
      const result = await RedactionWorkflowService.detectSensitiveContent(text);

      expect(result.hasSensitive).toBe(true);
      expect(result.types).toContain("personal");
    });

    it("should apply financial redaction", async () => {
      const result = await RedactionWorkflowService.applyRedaction({
        originalText: "Revenue: $1,000,000",
        redactionType: "financial",
      });

      expect(result.redactedText).toContain("[FINANCIAL]");
      expect(result.redactedSegments.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should validate redaction completeness", () => {
      const validation = RedactionWorkflowService.validateRedaction(
        "Original: $1,000,000",
        "Original: [FINANCIAL]"
      );

      expect(validation.isValid).toBe(true);
      expect(validation.redactionPercentage).toBeGreaterThan(0);
    });

    it("should batch redact multiple segments", async () => {
      const segments = [
        { id: 1, text: "Revenue: $1,000,000", type: "financial" },
        { id: 2, text: "Contact: john@example.com", type: "personal" },
      ];

      const results = await RedactionWorkflowService.batchRedact(segments);

      expect(results.length).toBe(2);
      expect(results[0].redactionCount).toBeGreaterThan(0);
      expect(results[1].redactionCount).toBeGreaterThan(0);
    });

    it("should generate redaction report", async () => {
      const report = await RedactionWorkflowService.generateRedactionReport(1);

      expect(report.conferenceId).toBe(1);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalRedactions).toBeGreaterThanOrEqual(0);
      expect(report.auditTrail).toBeDefined();
    });

    it("should get redaction statistics", async () => {
      const stats = await RedactionWorkflowService.getRedactionStats(1);

      expect(stats.totalRedactions).toBeGreaterThanOrEqual(0);
      expect(stats.approvedRedactions).toBeGreaterThanOrEqual(0);
      expect(stats.pendingRedactions).toBeGreaterThanOrEqual(0);
      expect(stats.redactionsByType).toBeDefined();
    });
  });

  describe("AblyRealtimeService", () => {
    beforeEach(() => {
      // Mock Ably client
      vi.mock("ably");
    });

    it("should initialize Ably client", () => {
      // This would require mocking Ably
      const stats = AblyRealtimeService.getStats();
      expect(stats).toBeDefined();
      expect(stats.connectionState).toBeDefined();
    });

    it("should get connection state", () => {
      const state = AblyRealtimeService.getConnectionState();
      expect(typeof state).toBe("string");
    });

    it("should track active channels", () => {
      const stats = AblyRealtimeService.getStats();
      expect(Array.isArray(stats.channels)).toBe(true);
    });
  });

  describe("RealtimeCollaborationService", () => {
    it("should register collaborator", () => {
      const collaborator = RealtimeCollaborationService.registerCollaborator(
        1,
        1,
        "John Doe"
      );

      expect(collaborator.userId).toBe(1);
      expect(collaborator.userName).toBe("John Doe");
      expect(collaborator.joinedAt).toBeDefined();
    });

    it("should get active collaborators", () => {
      RealtimeCollaborationService.registerCollaborator(1, 1, "John");
      RealtimeCollaborationService.registerCollaborator(1, 2, "Jane");

      const active = RealtimeCollaborationService.getActiveCollaborators(1);

      expect(active.length).toBeGreaterThanOrEqual(0);
    });

    it("should update cursor position", () => {
      RealtimeCollaborationService.registerCollaborator(1, 1, "John");
      RealtimeCollaborationService.updateCursorPosition(1, 1, {
        line: 10,
        column: 5,
      });

      const active = RealtimeCollaborationService.getActiveCollaborators(1);
      const john = active.find((c) => c.userId === 1);

      expect(john?.cursorPosition).toEqual({ line: 10, column: 5 });
    });

    it("should record edit created event", () => {
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "John",
        100,
        "Original",
        "Corrected"
      );

      const history = RealtimeCollaborationService.getEventHistory(1);

      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].type).toBe("edit_created");
    });

    it("should record edit approval event", () => {
      RealtimeCollaborationService.recordEditApproved(1, 1, "John", 100, true);

      const history = RealtimeCollaborationService.getEventHistory(1);
      const approvalEvent = history.find((e) => e.type === "edit_approved");

      expect(approvalEvent).toBeDefined();
      expect(approvalEvent?.data?.approved).toBe(true);
    });

    it("should detect conflicts between edits", () => {
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "John",
        100,
        "Original Text",
        "Corrected Text"
      );

      const conflict = RealtimeCollaborationService.detectConflicts(
        1,
        2,
        "Original Text here"
      );

      expect(conflict.hasConflict).toBe(true);
      expect(Array.isArray(conflict.conflictingEdits)).toBe(true);
    });

    it("should resolve merge conflicts", () => {
      const resolved = RealtimeCollaborationService.resolveMergeConflict(
        "Original",
        "Edit 1",
        "Edit 2",
        "last"
      );

      expect(resolved).toBe("Edit 2");
    });

    it("should get collaboration statistics", () => {
      RealtimeCollaborationService.registerCollaborator(1, 1, "John");
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "John",
        100,
        "Original",
        "Corrected"
      );

      const stats = RealtimeCollaborationService.getCollaborationStats(1);

      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.activeCollaborators).toBeGreaterThanOrEqual(0);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(0);
    });

    it("should broadcast edit to collaborators", () => {
      const event = RealtimeCollaborationService.broadcastEdit(
        1,
        100,
        "Original",
        "Corrected",
        "typo",
        1,
        "John"
      );

      expect(event.type).toBe("edit_created");
      expect(event.data?.editId).toBe(100);
    });

    it("should export history as JSON", () => {
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "John",
        100,
        "Original",
        "Corrected"
      );

      const json = RealtimeCollaborationService.exportHistory(1, "json");

      expect(typeof json).toBe("string");
      expect(json).toContain("edit_created");
    });

    it("should export history as CSV", () => {
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "John",
        100,
        "Original",
        "Corrected"
      );

      const csv = RealtimeCollaborationService.exportHistory(1, "csv");

      expect(typeof csv).toBe("string");
      expect(csv).toContain("Timestamp");
      expect(csv).toContain("Type");
    });

    it("should unregister collaborator", () => {
      RealtimeCollaborationService.registerCollaborator(1, 1, "John");
      RealtimeCollaborationService.unregisterCollaborator(1, 1);

      const active = RealtimeCollaborationService.getActiveCollaborators(1);
      const john = active.find((c) => c.userId === 1);

      expect(john).toBeUndefined();
    });

    it("should clear history", () => {
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "John",
        100,
        "Original",
        "Corrected"
      );

      RealtimeCollaborationService.clearHistory(1);

      const history = RealtimeCollaborationService.getEventHistory(1);

      expect(history.length).toBe(0);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete redaction workflow", async () => {
      // 1. Register collaborators
      const collab1 = RealtimeCollaborationService.registerCollaborator(
        1,
        1,
        "Alice"
      );
      const collab2 = RealtimeCollaborationService.registerCollaborator(
        1,
        2,
        "Bob"
      );

      expect(collab1.userId).toBe(1);
      expect(collab2.userId).toBe(2);

      // 2. Detect sensitive content
      const sensitive = await RedactionWorkflowService.detectSensitiveContent(
        "Revenue: $5,000,000"
      );

      expect(sensitive.hasSensitive).toBe(true);

      // 3. Apply redaction
      const redacted = await RedactionWorkflowService.applyRedaction({
        originalText: "Revenue: $5,000,000",
        redactionType: "financial",
      });

      expect(redacted.redactedText).toContain("[FINANCIAL]");

      // 4. Record collaboration events
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "Alice",
        1,
        "Revenue: $5,000,000",
        redacted.redactedText
      );

      RealtimeCollaborationService.recordEditApproved(1, 2, "Bob", 1, true);

      // 5. Get statistics
      const stats = RealtimeCollaborationService.getCollaborationStats(1);

      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.eventCounts.edit_created).toBeGreaterThan(0);
      expect(stats.eventCounts.edit_approved).toBeGreaterThan(0);
    });

    it("should handle concurrent edits with conflict detection", async () => {
      // Register two collaborators
      RealtimeCollaborationService.registerCollaborator(1, 1, "Alice");
      RealtimeCollaborationService.registerCollaborator(1, 2, "Bob");

      // Alice creates an edit
      RealtimeCollaborationService.recordEditCreated(
        1,
        1,
        "Alice",
        1,
        "Original Text",
        "Alice's Edit"
      );

      // Bob creates an edit with overlapping content
      const conflict = RealtimeCollaborationService.detectConflicts(
        1,
        2,
        "Original Text here"
      );

      expect(conflict.hasConflict).toBe(true);

      // Resolve conflict using "last write wins"
      const resolved = RealtimeCollaborationService.resolveMergeConflict(
        "Original Text",
        "Alice's Edit",
        "Bob's Edit",
        "last"
      );

      expect(resolved).toBe("Bob's Edit");
    });
  });
});
