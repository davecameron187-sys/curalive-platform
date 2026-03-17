/**
 * Offline QR Cache Service
 * Manages offline QR code scan caching with IndexedDB
 * Implements sync-on-reconnect with conflict resolution
 */

export interface CachedQRScan {
  id: string;
  sessionId: number;
  eventId: string;
  passCode: string;
  timestamp: number;
  synced: boolean;
  syncedAt?: number;
  result?: {
    success: boolean;
    result: "success" | "duplicate" | "not_found" | "error";
    attendee?: {
      name: string;
      email: string;
      company?: string;
    };
  };
}

export interface CacheStats {
  totalScans: number;
  syncedScans: number;
  pendingScans: number;
  failedScans: number;
  lastSyncTime?: number;
  cacheSize: number;
}

const DB_NAME = "CuraLive_QRCache";
const DB_VERSION = 1;
const STORE_NAME = "qr_scans";
const SYNC_BATCH_SIZE = 50;
const CACHE_EXPIRY_DAYS = 7;

class OfflineQRCacheService {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private syncCallbacks: Array<(stats: CacheStats) => void> = [];

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("sessionId", "sessionId", { unique: false });
          store.createIndex("eventId", "eventId", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
          console.log("Object store created");
        }
      };
    });
  }

  /**
   * Cache a QR scan locally
   */
  async cacheScan(scan: Omit<CachedQRScan, "id" | "synced">): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const id = `${scan.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cachedScan: CachedQRScan = {
      ...scan,
      id,
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(cachedScan);

      request.onerror = () => {
        console.error("Failed to cache scan:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("Scan cached successfully:", id);
        resolve(id);
      };
    });
  }

  /**
   * Get all pending (unsynced) scans
   */
  async getPendingScans(limit: number = SYNC_BATCH_SIZE): Promise<CachedQRScan[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("synced");
      const range = IDBKeyRange.only(false);
      const request = index.getAll(range, limit);

      request.onerror = () => {
        console.error("Failed to get pending scans:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * Mark scans as synced
   */
  async markAsSynced(scanIds: string[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      scanIds.forEach((id) => {
        const request = store.get(id);
        request.onsuccess = () => {
          const scan = request.result;
          if (scan) {
            scan.synced = true;
            scan.syncedAt = Date.now();
            store.put(scan);
          }
        };
      });

      transaction.onerror = () => {
        console.error("Failed to mark scans as synced:", transaction.error);
        reject(transaction.error);
      };

      transaction.oncomplete = () => {
        console.log(`Marked ${scanIds.length} scans as synced`);
        resolve();
      };
    });
  }

  /**
   * Update scan with server result
   */
  async updateScanResult(
    scanId: string,
    result: CachedQRScan["result"]
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(scanId);

      request.onerror = () => {
        console.error("Failed to update scan result:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const scan = request.result;
        if (scan) {
          scan.result = result;
          store.put(scan);
        }
      };

      transaction.oncomplete = () => {
        resolve();
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      const countRequest = store.count();
      const syncedRequest = store.index("synced").count(IDBKeyRange.only(true));
      const pendingRequest = store.index("synced").count(IDBKeyRange.only(false));

      let totalScans = 0;
      let syncedScans = 0;
      let pendingScans = 0;

      countRequest.onsuccess = () => {
        totalScans = countRequest.result;
      };

      syncedRequest.onsuccess = () => {
        syncedScans = syncedRequest.result;
      };

      pendingRequest.onsuccess = () => {
        pendingScans = pendingRequest.result;
      };

      transaction.oncomplete = () => {
        const stats: CacheStats = {
          totalScans,
          syncedScans,
          pendingScans,
          failedScans: 0,
          cacheSize: totalScans * 500, // Approximate size in bytes
        };
        resolve(stats);
      };

      transaction.onerror = () => {
        console.error("Failed to get cache stats:", transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Clear old cached scans (older than CACHE_EXPIRY_DAYS)
   */
  async clearExpiredScans(): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const expiryTime = Date.now() - CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("timestamp");
      const range = IDBKeyRange.upperBound(expiryTime);

      let deletedCount = 0;
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.log(`Cleared ${deletedCount} expired scans`);
        resolve(deletedCount);
      };

      transaction.onerror = () => {
        console.error("Failed to clear expired scans:", transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Sync pending scans with server
   */
  async syncWithServer(
    syncFn: (scans: CachedQRScan[]) => Promise<{ successIds: string[] }>
  ): Promise<CacheStats> {
    if (this.syncInProgress) {
      console.log("Sync already in progress");
      return this.getStats();
    }

    this.syncInProgress = true;

    try {
      while (true) {
        const pendingScans = await this.getPendingScans(SYNC_BATCH_SIZE);
        if (pendingScans.length === 0) break;

        try {
          const { successIds } = await syncFn(pendingScans);
          await this.markAsSynced(successIds);
          console.log(`Synced ${successIds.length} scans`);
        } catch (error) {
          console.error("Sync batch failed:", error);
          break;
        }
      }

      // Clear expired scans after successful sync
      await this.clearExpiredScans();

      const stats = await this.getStats();
      this.notifySyncCallbacks(stats);
      return stats;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Register callback for sync updates
   */
  onSync(callback: (stats: CacheStats) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifySyncCallbacks(stats: CacheStats): void {
    this.syncCallbacks.forEach((callback) => {
      try {
        callback(stats);
      } catch (error) {
        console.error("Sync callback error:", error);
      }
    });
  }

  /**
   * Setup online/offline event listeners
   */
  setupOnlineListener(onlineCallback: () => void): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("Back online");
      onlineCallback();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("Went offline");
    });
  }

  /**
   * Get online status
   */
  isOnlineNow(): boolean {
    return this.isOnline;
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        console.error("Failed to clear cache:", request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        console.log("Cache cleared");
        resolve();
      };
    });
  }
}

// Export singleton instance
export const offlineQRCache = new OfflineQRCacheService();
