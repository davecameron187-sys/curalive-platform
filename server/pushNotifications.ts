/**
 * Push Notifications Integration
 * Handles push notifications for mobile app via Expo
 */

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

interface PushToken {
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  createdAt: number;
}

// In-memory store for push tokens (use database in production)
const pushTokens: Map<string, PushToken[]> = new Map();

/**
 * Register push token for user
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: "ios" | "android" | "web"
) {
  try {
    if (!pushTokens.has(userId)) {
      pushTokens.set(userId, []);
    }

    const tokens = pushTokens.get(userId)!;

    // Check if token already exists
    const existing = tokens.find((t) => t.token === token);
    if (existing) {
      existing.createdAt = Date.now();
      console.log("[Push] Token already registered for user:", userId);
      return { success: true, message: "Token already registered" };
    }

    tokens.push({
      userId,
      token,
      platform,
      createdAt: Date.now(),
    });

    console.log("[Push] Token registered for user:", userId, "platform:", platform);
    return { success: true, message: "Token registered" };
  } catch (error) {
    console.error("[Push] Failed to register token:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Unregister push token
 */
export async function unregisterPushToken(userId: string, token: string) {
  try {
    const tokens = pushTokens.get(userId);
    if (!tokens) {
      return { success: false, error: "User not found" };
    }

    const index = tokens.findIndex((t) => t.token === token);
    if (index === -1) {
      return { success: false, error: "Token not found" };
    }

    tokens.splice(index, 1);
    console.log("[Push] Token unregistered for user:", userId);
    return { success: true, message: "Token unregistered" };
  } catch (error) {
    console.error("[Push] Failed to unregister token:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send push notification to user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
) {
  try {
    const tokens = pushTokens.get(userId);
    if (!tokens || tokens.length === 0) {
      console.log("[Push] No tokens found for user:", userId);
      return { success: false, error: "No push tokens registered" };
    }

    const results = [];

    for (const pushToken of tokens) {
      try {
        // In production, use Expo.sendPushNotificationsAsync()
        // For now, mock the response
        const result = {
          id: `notification-${Date.now()}`,
          status: "sent" as const,
          token: pushToken.token,
          platform: pushToken.platform,
        };

        results.push(result);
        console.log("[Push] Notification sent to", pushToken.platform, ":", payload.title);
      } catch (error) {
        console.error("[Push] Failed to send notification:", error);
        results.push({
          id: "",
          status: "failed" as const,
          token: pushToken.token,
          platform: pushToken.platform,
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error("[Push] Failed to send push notification:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushNotificationPayload
) {
  const results = [];

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    results.push({ userId, ...result });
  }

  return results;
}

/**
 * Send question approved notification
 */
export async function notifyQuestionApproved(
  userId: string,
  eventTitle: string,
  questionText: string
) {
  return sendPushNotification(userId, {
    title: "Your Question Was Approved",
    body: `Your question for "${eventTitle}" has been approved and will be presented to the speakers.`,
    data: {
      type: "question_approved",
      questionText: questionText.substring(0, 100),
    },
    sound: "default",
  });
}

/**
 * Send question rejected notification
 */
export async function notifyQuestionRejected(
  userId: string,
  eventTitle: string,
  reason: string
) {
  return sendPushNotification(userId, {
    title: "Question Not Approved",
    body: `Your question for "${eventTitle}" was not approved. Reason: ${reason}`,
    data: {
      type: "question_rejected",
      reason,
    },
  });
}

/**
 * Send event starting notification
 */
export async function notifyEventStarting(userId: string, eventTitle: string) {
  return sendPushNotification(userId, {
    title: "Event Starting Soon",
    body: `"${eventTitle}" is starting now. Join the live event!`,
    data: {
      type: "event_starting",
      eventTitle,
    },
    sound: "default",
  });
}

/**
 * Send speaker taking stage notification
 */
export async function notifySpeakerOnStage(
  userId: string,
  eventTitle: string,
  speakerName: string
) {
  return sendPushNotification(userId, {
    title: `${speakerName} is Now Speaking`,
    body: `Watch ${speakerName} present at "${eventTitle}"`,
    data: {
      type: "speaker_on_stage",
      speakerName,
      eventTitle,
    },
    sound: "default",
  });
}

/**
 * Send Q&A open notification
 */
export async function notifyQAOpen(userId: string, eventTitle: string) {
  return sendPushNotification(userId, {
    title: "Q&A is Now Open",
    body: `Submit your questions for "${eventTitle}"`,
    data: {
      type: "qa_open",
      eventTitle,
    },
    sound: "default",
  });
}

/**
 * Get user's push tokens
 */
export function getUserPushTokens(userId: string): PushToken[] {
  return pushTokens.get(userId) || [];
}

/**
 * Get push notification statistics
 */
export function getPushStats() {
  let totalTokens = 0;
  let totalUsers = 0;

  pushTokens.forEach((tokens) => {
    totalUsers++;
    totalTokens += tokens.length;
  });

  return {
    totalUsers,
    totalTokens,
    averageTokensPerUser: totalUsers > 0 ? totalTokens / totalUsers : 0,
  };
}

export default {
  registerPushToken,
  unregisterPushToken,
  sendPushNotification,
  sendBulkPushNotifications,
  notifyQuestionApproved,
  notifyQuestionRejected,
  notifyEventStarting,
  notifySpeakerOnStage,
  notifyQAOpen,
  getUserPushTokens,
  getPushStats,
};
