/**
 * Session Auto-Save Service — Session Persistence & Recovery
 * 
 * Automatically saves session state every 30 seconds
 * Enables recovery from unexpected disconnects
 */

export interface SessionRecoveryData {
  sessionId: string;
  notes: string;
  activeTab: string;
  timestamp: number;
  qaApprovals: string[]; // IDs of approved questions
  qaRejections: string[]; // IDs of rejected questions
}

const STORAGE_KEY = "session_recovery";
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export class SessionAutoSave {
  private sessionId: string;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private recoveryData: SessionRecoveryData;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.recoveryData = {
      sessionId,
      notes: "",
      activeTab: "webphone",
      timestamp: Date.now(),
      qaApprovals: [],
      qaRejections: [],
    };
    this.loadRecoveryData();
  }

  /**
   * Start auto-save timer
   */
  start() {
    this.autoSaveTimer = setInterval(() => {
      this.save();
    }, AUTO_SAVE_INTERVAL);
    console.log("[SessionAutoSave] Auto-save started");
  }

  /**
   * Stop auto-save timer
   */
  stop() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log("[SessionAutoSave] Auto-save stopped");
    }
  }

  /**
   * Update recovery data
   */
  update(data: Partial<SessionRecoveryData>) {
    this.recoveryData = {
      ...this.recoveryData,
      ...data,
      timestamp: Date.now(),
    };
  }

  /**
   * Save recovery data to localStorage
   */
  save() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      localStorage.setItem(key, JSON.stringify(this.recoveryData));
      console.log("[SessionAutoSave] Saved recovery data");
    } catch (error) {
      console.error("[SessionAutoSave] Failed to save:", error);
    }
  }

  /**
   * Load recovery data from localStorage
   */
  loadRecoveryData() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        this.recoveryData = JSON.parse(stored);
        console.log("[SessionAutoSave] Loaded recovery data");
      }
    } catch (error) {
      console.error("[SessionAutoSave] Failed to load:", error);
    }
  }

  /**
   * Get recovery data
   */
  getRecoveryData(): SessionRecoveryData {
    return this.recoveryData;
  }

  /**
   * Check if recovery data exists
   */
  hasRecoveryData(): boolean {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear recovery data
   */
  clear() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      localStorage.removeItem(key);
      console.log("[SessionAutoSave] Cleared recovery data");
    } catch (error) {
      console.error("[SessionAutoSave] Failed to clear:", error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    this.save(); // Save one last time before destroying
  }
}
