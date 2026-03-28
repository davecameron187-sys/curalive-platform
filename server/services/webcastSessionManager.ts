/**
 * Webcast Session Manager
 * Handles webcast and audio-only session types without requiring schema migration
 * Stores webcast-specific metadata in memory/cache during session lifecycle
 */

interface WebcastSession {
  sessionId: string;
  eventId: string;
  sessionType: "standard" | "webcast" | "audio-only";
  webcastUrl?: string;
  webcastPlatform?: string; // youtube, facebook, custom-rtmp, etc.
  createdAt: number;
  updatedAt: number;
}

// In-memory store for webcast sessions (in production, use Redis or database)
const webcastSessions = new Map<string, WebcastSession>();

/**
 * Create or update webcast session metadata
 */
export function createWebcastSession(
  sessionId: string,
  eventId: string,
  sessionType: "standard" | "webcast" | "audio-only",
  webcastUrl?: string,
  webcastPlatform?: string
): WebcastSession {
  const session: WebcastSession = {
    sessionId,
    eventId,
    sessionType,
    webcastUrl,
    webcastPlatform,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  webcastSessions.set(sessionId, session);
  return session;
}

/**
 * Get webcast session metadata
 */
export function getWebcastSession(sessionId: string): WebcastSession | undefined {
  return webcastSessions.get(sessionId);
}

/**
 * Update webcast session metadata
 */
export function updateWebcastSession(
  sessionId: string,
  updates: Partial<Omit<WebcastSession, "sessionId" | "eventId" | "createdAt">>
): WebcastSession | undefined {
  const session = webcastSessions.get(sessionId);
  if (!session) return undefined;

  const updated: WebcastSession = {
    ...session,
    ...updates,
    updatedAt: Date.now(),
  };

  webcastSessions.set(sessionId, updated);
  return updated;
}

/**
 * Delete webcast session metadata
 */
export function deleteWebcastSession(sessionId: string): boolean {
  return webcastSessions.delete(sessionId);
}

/**
 * Get all webcast sessions for an event
 */
export function getWebcastSessionsByEvent(eventId: string): WebcastSession[] {
  return Array.from(webcastSessions.values()).filter((s) => s.eventId === eventId);
}

/**
 * Check if session is webcast or audio-only type
 */
export function isWebcastSession(sessionId: string): boolean {
  const session = webcastSessions.get(sessionId);
  return session?.sessionType === "webcast" || session?.sessionType === "audio-only";
}

/**
 * Get session type
 */
export function getSessionType(
  sessionId: string
): "standard" | "webcast" | "audio-only" | undefined {
  return webcastSessions.get(sessionId)?.sessionType;
}

/**
 * Clear all webcast sessions (for testing/cleanup)
 */
export function clearWebcastSessions(): void {
  webcastSessions.clear();
}

/**
 * Get session count
 */
export function getWebcastSessionCount(): number {
  return webcastSessions.size;
}
