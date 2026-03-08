import { getDb } from "../db";
import { transcriptEdits, transcriptVersions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface CollaborationEvent {
  type: "edit_created" | "edit_approved" | "edit_rejected" | "version_created" | "version_published" | "user_joined" | "user_left" | "cursor_moved";
  conferenceId: number;
  userId: number;
  userName: string;
  timestamp: Date;
  data?: {
    editId?: number;
    versionId?: number;
    originalText?: string;
    correctedText?: string;
    position?: { line: number; column: number };
    [key: string]: any;
  };
}

export interface ActiveCollaborator {
  userId: number;
  userName: string;
  joinedAt: Date;
  lastActive: Date;
  cursorPosition?: { line: number; column: number };
}

export class RealtimeCollaborationService {
  private static activeCollaborators = new Map<number, Map<number, ActiveCollaborator>>();
  private static eventHistory = new Map<number, CollaborationEvent[]>();
  private static MAX_HISTORY_SIZE = 1000;

  /**
   * Register a user as active in a conference
   */
  static registerCollaborator(
    conferenceId: number,
    userId: number,
    userName: string
  ): ActiveCollaborator {
    if (!this.activeCollaborators.has(conferenceId)) {
      this.activeCollaborators.set(conferenceId, new Map());
    }

    const collaborator: ActiveCollaborator = {
      userId,
      userName,
      joinedAt: new Date(),
      lastActive: new Date(),
    };

    this.activeCollaborators.get(conferenceId)!.set(userId, collaborator);

    // Emit user_joined event
    this.recordEvent(conferenceId, {
      type: "user_joined",
      conferenceId,
      userId,
      userName,
      timestamp: new Date(),
    });

    return collaborator;
  }

  /**
   * Unregister a collaborator
   */
  static unregisterCollaborator(conferenceId: number, userId: number): void {
    const collaborators = this.activeCollaborators.get(conferenceId);
    if (collaborators) {
      const collaborator = collaborators.get(userId);
      if (collaborator) {
        collaborators.delete(userId);

        // Emit user_left event
        this.recordEvent(conferenceId, {
          type: "user_left",
          conferenceId,
          userId,
          userName: collaborator.userName,
          timestamp: new Date(),
        });

        if (collaborators.size === 0) {
          this.activeCollaborators.delete(conferenceId);
        }
      }
    }
  }

  /**
   * Get active collaborators in a conference
   */
  static getActiveCollaborators(conferenceId: number): ActiveCollaborator[] {
    const collaborators = this.activeCollaborators.get(conferenceId);
    if (!collaborators) return [];

    // Filter out stale collaborators (inactive for > 5 minutes)
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const active: ActiveCollaborator[] = [];

    collaborators.forEach((collab, userId) => {
      if (now.getTime() - collab.lastActive.getTime() < staleThreshold) {
        active.push(collab);
      } else {
        collaborators.delete(userId);
      }
    });

    return active;
  }

  /**
   * Update cursor position for a collaborator
   */
  static updateCursorPosition(
    conferenceId: number,
    userId: number,
    position: { line: number; column: number }
  ): void {
    const collaborators = this.activeCollaborators.get(conferenceId);
    if (collaborators) {
      const collaborator = collaborators.get(userId);
      if (collaborator) {
        collaborator.lastActive = new Date();
        collaborator.cursorPosition = position;

        // Emit cursor_moved event
        this.recordEvent(conferenceId, {
          type: "cursor_moved",
          conferenceId,
          userId,
          userName: collaborator.userName,
          timestamp: new Date(),
          data: { position },
        });
      }
    }
  }

  /**
   * Record a collaboration event
   */
  static recordEvent(conferenceId: number, event: CollaborationEvent): void {
    if (!this.eventHistory.has(conferenceId)) {
      this.eventHistory.set(conferenceId, []);
    }

    const history = this.eventHistory.get(conferenceId)!;
    history.push(event);

    // Keep only recent events
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  /**
   * Get event history for a conference
   */
  static getEventHistory(
    conferenceId: number,
    limit: number = 100,
    offset: number = 0
  ): CollaborationEvent[] {
    const history = this.eventHistory.get(conferenceId) || [];
    return history.slice(-limit - offset, -offset || undefined);
  }

  /**
   * Record edit creation event
   */
  static recordEditCreated(
    conferenceId: number,
    userId: number,
    userName: string,
    editId: number,
    originalText: string,
    correctedText: string
  ): void {
    this.recordEvent(conferenceId, {
      type: "edit_created",
      conferenceId,
      userId,
      userName,
      timestamp: new Date(),
      data: {
        editId,
        originalText,
        correctedText,
      },
    });
  }

  /**
   * Record edit approval event
   */
  static recordEditApproved(
    conferenceId: number,
    userId: number,
    userName: string,
    editId: number,
    approved: boolean
  ): void {
    this.recordEvent(conferenceId, {
      type: approved ? "edit_approved" : "edit_rejected",
      conferenceId,
      userId,
      userName,
      timestamp: new Date(),
      data: { editId, approved },
    });
  }

  /**
   * Record version creation event
   */
  static recordVersionCreated(
    conferenceId: number,
    userId: number,
    userName: string,
    versionId: number,
    description?: string
  ): void {
    this.recordEvent(conferenceId, {
      type: "version_created",
      conferenceId,
      userId,
      userName,
      timestamp: new Date(),
      data: {
        versionId,
        description,
      },
    });
  }

  /**
   * Record version published event
   */
  static recordVersionPublished(
    conferenceId: number,
    userId: number,
    userName: string,
    versionId: number
  ): void {
    this.recordEvent(conferenceId, {
      type: "version_published",
      conferenceId,
      userId,
      userName,
      timestamp: new Date(),
      data: { versionId },
    });
  }

  /**
   * Get collaboration statistics
   */
  static getCollaborationStats(conferenceId: number) {
    const history = this.eventHistory.get(conferenceId) || [];
    const active = this.getActiveCollaborators(conferenceId);

    const eventCounts = {
      edit_created: 0,
      edit_approved: 0,
      edit_rejected: 0,
      version_created: 0,
      version_published: 0,
      user_joined: 0,
      user_left: 0,
      cursor_moved: 0,
    };

    history.forEach((event) => {
      eventCounts[event.type]++;
    });

    const uniqueUsers = new Set(history.map((e) => e.userId));

    return {
      totalEvents: history.length,
      eventCounts,
      activeCollaborators: active.length,
      uniqueUsers: uniqueUsers.size,
      lastEventTime: history.length > 0 ? history[history.length - 1].timestamp : null,
    };
  }

  /**
   * Broadcast edit to all collaborators
   */
  static broadcastEdit(
    conferenceId: number,
    editId: number,
    originalText: string,
    correctedText: string,
    editType: string,
    createdBy: number,
    createdByName: string
  ): CollaborationEvent {
    const event: CollaborationEvent = {
      type: "edit_created",
      conferenceId,
      userId: createdBy,
      userName: createdByName,
      timestamp: new Date(),
      data: {
        editId,
        originalText,
        correctedText,
        editType,
      },
    };

    this.recordEvent(conferenceId, event);
    return event;
  }

  /**
   * Detect conflicts between concurrent edits
   */
  static detectConflicts(
    conferenceId: number,
    userId: number,
    editedText: string
  ): { hasConflict: boolean; conflictingEdits: number[] } {
    const history = this.eventHistory.get(conferenceId) || [];
    const recentEdits = history
      .filter((e) => e.type === "edit_created" && e.userId !== userId)
      .slice(-10);

    const conflictingEdits: number[] = [];

    recentEdits.forEach((event) => {
      if (event.data?.editId && event.data?.originalText) {
        // Simple conflict detection: if edited text contains original text from another edit
        if (editedText.includes(event.data.originalText)) {
          conflictingEdits.push(event.data.editId);
        }
      }
    });

    return {
      hasConflict: conflictingEdits.length > 0,
      conflictingEdits,
    };
  }

  /**
   * Get merge strategy for conflicting edits
   */
  static resolveMergeConflict(
    originalText: string,
    edit1: string,
    edit2: string,
    strategy: "first" | "last" | "manual" = "last"
  ): string {
    switch (strategy) {
      case "first":
        return edit1;
      case "last":
        return edit2;
      case "manual":
        // Return both edits marked for manual resolution
        return `[CONFLICT]\nEdit 1: ${edit1}\nEdit 2: ${edit2}\n[/CONFLICT]`;
      default:
        return edit2;
    }
  }

  /**
   * Clear history for a conference
   */
  static clearHistory(conferenceId: number): void {
    this.eventHistory.delete(conferenceId);
  }

  /**
   * Export collaboration history
   */
  static exportHistory(conferenceId: number, format: "json" | "csv" = "json") {
    const history = this.eventHistory.get(conferenceId) || [];

    if (format === "json") {
      return JSON.stringify(history, null, 2);
    }

    // CSV format
    const headers = ["Timestamp", "Type", "User", "UserId", "Data"];
    const rows = history.map((event) => [
      event.timestamp.toISOString(),
      event.type,
      event.userName,
      event.userId,
      JSON.stringify(event.data || {}),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    return csv;
  }
}
