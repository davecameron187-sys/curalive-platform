export interface SessionRecoveryData {
  sessionId: string;
  notes: string;
  activeTab: string;
  timestamp: number;
  qaApprovals: string[];
  qaRejections: string[];
}

const STORAGE_KEY = "session_recovery";
const AUTO_SAVE_INTERVAL = 30000;

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

  start() {
    this.autoSaveTimer = setInterval(() => {
      this.save();
    }, AUTO_SAVE_INTERVAL);
    console.log("[SessionAutoSave] Auto-save started");
  }

  stop() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log("[SessionAutoSave] Auto-save stopped");
    }
  }

  update(data: Partial<SessionRecoveryData>) {
    this.recoveryData = {
      ...this.recoveryData,
      ...data,
      timestamp: Date.now(),
    };
  }

  save() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      localStorage.setItem(key, JSON.stringify(this.recoveryData));
      console.log("[SessionAutoSave] Saved recovery data");
    } catch (error) {
      console.error("[SessionAutoSave] Failed to save:", error);
    }
  }

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

  getRecoveryData(): SessionRecoveryData {
    return this.recoveryData;
  }

  hasRecoveryData(): boolean {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  clear() {
    try {
      const key = `${STORAGE_KEY}:${this.sessionId}`;
      localStorage.removeItem(key);
      console.log("[SessionAutoSave] Cleared recovery data");
    } catch (error) {
      console.error("[SessionAutoSave] Failed to clear:", error);
    }
  }

  destroy() {
    this.stop();
    this.save();
  }
}
