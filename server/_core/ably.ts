/**
 * Ably client helper for server-side real-time messaging.
 * Lazily initializes the Ably REST client using the ABLY_API_KEY env variable.
 */

let _ablyClient: any = null;

export async function getAblyClient() {
  if (_ablyClient) return _ablyClient;
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.warn("[Ably] ABLY_API_KEY not set — real-time alerts disabled");
    return null;
  }
  try {
    const Ably = await import("ably");
    _ablyClient = new Ably.Rest(apiKey);
    return _ablyClient;
  } catch (err) {
    console.error("[Ably] Failed to initialise client:", err);
    return null;
  }
}

export async function publishToChannel(
  channelName: string,
  eventName: string,
  data: unknown
): Promise<boolean> {
  const client = await getAblyClient();
  if (!client) return false;
  try {
    const channel = client.channels.get(channelName);
    await channel.publish(eventName, data);
    return true;
  } catch (err) {
    console.error("[Ably] Publish error:", err);
    return false;
  }
}


/**
 * Publish real-time event for event creation
 */
export async function publishEventCreated(eventData: {
  eventId: string;
  title: string;
  company: string;
  platform: string;
  status: string;
}): Promise<boolean> {
  return publishToChannel("events:updates", "event.created", {
    timestamp: new Date().toISOString(),
    ...eventData,
  });
}

/**
 * Publish real-time event for registration
 */
export async function publishRegistrationCreated(registrationData: {
  eventId: string;
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
}): Promise<boolean> {
  return publishToChannel("registrations:updates", "registration.created", {
    timestamp: new Date().toISOString(),
    ...registrationData,
  });
}

/**
 * Publish real-time event for post-event data
 */
export async function publishPostEventData(postEventData: {
  eventId: string;
  aiSummary?: string;
  complianceScore?: number;
  engagementScore?: number;
}): Promise<boolean> {
  return publishToChannel("post_event:updates", "post_event.generated", {
    timestamp: new Date().toISOString(),
    ...postEventData,
  });
}

/**
 * Publish real-time notification for OCC
 */
export async function publishOccNotification(notification: {
  conferenceId: number;
  type: "participant_joined" | "participant_left" | "sentiment_update" | "qa_approval";
  data: any;
}): Promise<boolean> {
  return publishToChannel(
    `occ:notifications:${notification.conferenceId}`,
    notification.type,
    {
      timestamp: new Date().toISOString(),
      ...notification.data,
    }
  );
}

/**
 * Publish real-time Q&A approval notification
 */
export async function publishQaApproval(qaData: {
  conferenceId: number;
  questionId: string;
  question: string;
  approvedBy: string;
}): Promise<boolean> {
  return publishToChannel(`occ:qa:${qaData.conferenceId}`, "qa.approved", {
    timestamp: new Date().toISOString(),
    ...qaData,
  });
}

/**
 * Publish real-time sentiment analysis update
 */
export async function publishSentimentUpdate(sentimentData: {
  conferenceId: number;
  score: number;
  trend: "positive" | "neutral" | "negative";
  keywords: string[];
}): Promise<boolean> {
  return publishToChannel(`occ:sentiment:${sentimentData.conferenceId}`, "sentiment.updated", {
    timestamp: new Date().toISOString(),
    ...sentimentData,
  });
}

/**
 * Publish real-time participant status update
 */
export async function publishParticipantStatusUpdate(statusData: {
  conferenceId: number;
  participantId: number;
  state: string;
  isSpeaking: boolean;
  requestToSpeak: boolean;
}): Promise<boolean> {
  return publishToChannel(`occ:participants:${statusData.conferenceId}`, "participant.updated", {
    timestamp: new Date().toISOString(),
    ...statusData,
  });
}


/**
 * Publish role change notification to affected user
 */
export async function publishRoleChangeNotification(roleChangeData: {
  userId: number;
  oldRole: string;
  newRole: string;
  changedByName: string;
  reason?: string;
}): Promise<boolean> {
  return publishToChannel(`user:${roleChangeData.userId}:notifications`, "role.changed", {
    timestamp: new Date().toISOString(),
    ...roleChangeData,
  });
}


/**
 * Publish conference transfer request to target operator
 */
export async function publishConferenceTransfer(data: {
  fromOperatorId: number;
  fromOperatorName: string;
  toOperatorId: number;
  conferenceId: string;
  conferenceName: string;
  timestamp: number;
}): Promise<boolean> {
  return publishToChannel(
    `operator:${data.toOperatorId}:notifications`,
    "conference_transfer_request",
    data
  );
}

/**
 * Publish conference transfer acceptance
 */
export async function publishConferenceTransferAccepted(data: {
  fromOperatorId: number;
  toOperatorId: number;
  toOperatorName: string;
  conferenceId: string;
  conferenceName: string;
  timestamp: number;
}): Promise<boolean> {
  return publishToChannel(
    `operator:${data.fromOperatorId}:notifications`,
    "conference_transfer_accepted",
    data
  );
}

/**
 * Publish conference transfer rejection
 */
export async function publishConferenceTransferRejected(data: {
  fromOperatorId: number;
  toOperatorId: number;
  toOperatorName: string;
  conferenceId: string;
  conferenceName: string;
  reason?: string;
  timestamp: number;
}): Promise<boolean> {
  return publishToChannel(
    `operator:${data.fromOperatorId}:notifications`,
    "conference_transfer_rejected",
    data
  );
}
