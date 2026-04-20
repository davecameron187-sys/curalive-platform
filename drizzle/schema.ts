import { boolean, integer, real, smallint, json, text, timestamp, varchar, bigint, serial, pgTable, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "operator"]);
export const statusEnum = pgEnum("status", ["upcoming", "live", "completed"]);
export const stateEnum = pgEnum("state", [
    "free",
    "incoming",
    "connected",
    "muted",
    "parked",
    "speaking",
    "waiting_operator",
    "web_participant",
    "dropped",
  ]);
export const senderTypeEnum = pgEnum("senderType", ["operator", "participant", "moderator", "system"]);
export const recipientTypeEnum = pgEnum("recipientType", ["all", "hosts", "participant"]);
export const eventEnum = pgEnum("event", [
    "free",
    "incoming",
    "connected",
    "muted",
    "unmuted",
    "parked",
    "unparked",
    "speaking",
    "speaking_ended",
    "disconnected",
    "picked",
    "request_to_speak",
    "request_accepted",
    "request_refused",
    "moved_to_subconference",
    "returned_from_subconference",
  ]);
export const triggeredByEnum = pgEnum("triggeredBy", ["system", "operator", "participant", "moderator"]);
export const serviceTypeEnum = pgEnum("serviceType", [
    "capital_raising_1x1",
    "research_presentation",
    "earnings_call",
    "hybrid_conference",
  ]);
export const platformEnum = pgEnum("platform", ["zoom", "teams", "webex", "mixed"]);
export const meetingTypeEnum = pgEnum("meetingType", ["1x1", "group", "large_group"]);
export const waitingRoomStatusEnum = pgEnum("waitingRoomStatus", [
    "not_arrived",
    "in_waiting_room",
    "admitted",
    "completed",
    "no_show",
  ]);
export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);
export const signalTypeEnum = pgEnum("signalType", [
    "soft_commit",
    "interest",
    "objection",
    "question",
    "pricing_discussion",
    "size_discussion",
  ]);
export const event_typeEnum = pgEnum("event_type", [
    "webinar",
    "webcast",
    "virtual_event",
    "hybrid_event",
    "on_demand",
    "simulive",
    "audio_conference",
    "capital_markets",
  ]);
export const industry_verticalEnum = pgEnum("industry_vertical", [
    "financial_services",
    "corporate_communications",
    "healthcare",
    "technology",
    "professional_services",
    "government",
    "education",
    "media_entertainment",
    "general",
  ]);
export const webcast_statusEnum = pgEnum("webcast_status", [
    "draft",
    "scheduled",
    "live",
    "ended",
    "on_demand",
    "cancelled",
  ]);
export const qa_statusEnum = pgEnum("qa_status", [
    "pending",
    "approved",
    "answered",
    "dismissed",
    "flagged",
  ]);
export const poll_statusEnum = pgEnum("poll_status", ["draft", "live", "closed"]);
export const carrierEnum = pgEnum("carrier", ["twilio", "telnyx"]);
export const directionEnum = pgEnum("direction", ["outbound", "inbound"]);
export const recording_statusEnum = pgEnum("recording_status", ["pending", "completed", "failed"]);
export const transcription_statusEnum = pgEnum("transcription_status", ["pending", "processing", "completed", "failed"]);
export const transfer_typeEnum = pgEnum("transfer_type", ["blind", "warm"]);
export const outcomeEnum = pgEnum("outcome", [
    "admitted",
    "operator_queue",
    "no_conference",
    "failed",
  ]);
export const payment_methodEnum = pgEnum("payment_method", ["eft", "bank_transfer", "cheque", "credit_card", "other"]);
export const frequencyEnum = pgEnum("frequency", ["monthly", "quarterly", "annually"]);
export const call_qualityEnum = pgEnum("call_quality", ["poor", "fair", "good", "excellent"]);
export const report_typeEnum = pgEnum("report_type", ["full", "executive", "compliance"]);
export const sourceEnum = pgEnum("source", ["forge_ai", "whisper", "manual"]);
export const poll_typeEnum = pgEnum("poll_type", ["multiple_choice", "rating_scale", "word_cloud", "yes_no"]);
export const resource_typeEnum = pgEnum("resource_type", ["dial_in_number", "rtmp_key", "mux_stream", "recall_bot", "ably_channel"]);
export const default_platformEnum = pgEnum("default_platform", ["zoom", "teams", "webex", "rtmp", "pstn"]);
export const billing_tierEnum = pgEnum("billing_tier", ["starter", "professional", "enterprise"]);
export const risk_levelEnum = pgEnum("risk_level", ["low", "medium", "high"]);
export const compliance_statusEnum = pgEnum("compliance_status", ["flagged", "reviewed", "approved", "disclosed"]);
export const actionEnum = pgEnum("action", ["flagged", "reviewed", "approved", "disclosed", "certificate_generated", "exported"]);
export const follow_up_statusEnum = pgEnum("follow_up_status", ["pending", "contacted", "resolved", "dismissed"]);
export const approval_statusEnum = pgEnum("approval_status", ["approved", "rejected", "pending"]);
export const moment_typeEnum = pgEnum("moment_type", ["insight", "action_item", "question", "highlight", "disclaimer"]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
export const device_typeEnum = pgEnum("device_type", ["mobile", "desktop", "tablet"]);
export const content_typeEnum = pgEnum("content_type", ["text", "image", "video", "link"]);
export const moderation_statusEnum = pgEnum("moderation_status", ["pending", "approved", "flagged", "rejected"]);
export const publish_statusEnum = pgEnum("publish_status", ["pending", "published", "failed"]);
export const tag_typeEnum = pgEnum("tag_type", ["sentiment", "compliance", "scaling", "engagement", "qa", "intervention"]);
export const correction_typeEnum = pgEnum("correction_type", ["sentiment_override", "compliance_dismiss", "compliance_add", "severity_change", "threshold_adjust"]);
export const metric_typeEnum = pgEnum("metric_type", ["sentiment", "compliance", "engagement"]);
export const deliveryStatusEnum = pgEnum("deliveryStatus", ["pending", "sent", "failed"]);
export const tierEnum = pgEnum("tier", ["basic", "professional", "enterprise"]);
export const default_join_methodEnum = pgEnum("default_join_method", ["phone", "teams", "zoom", "web"]);
export const join_methodEnum = pgEnum("join_method", ["phone", "teams", "zoom", "web"]);
export const control_typeEnum = pgEnum("control_type", ["soc2", "iso27001"]);
export const threat_typeEnum = pgEnum("threat_type", ["fraud", "access_anomaly", "data_exfiltration", "policy_violation", "regulatory_breach", "predictive_warning"]);
export const frameworkEnum = pgEnum("framework", ["iso27001", "soc2"]);
export const check_typeEnum = pgEnum("check_type", ["automated", "manual", "ai_assessed"]);
export const source_typeEnum = pgEnum("source_type", ["live_session", "archive_upload", "transcript_paste"]);
export const observation_typeEnum = pgEnum("observation_type", [
    "weak_module", "missing_capability", "repeated_pattern",
    "operator_friction", "data_gap", "cross_event_trend",
  ]);
export const categoryEnum = pgEnum("category", [
    "analysis", "tracking", "automation", "reporting", "integration",
  ]);
export const estimated_impactEnum = pgEnum("estimated_impact", ["low", "medium", "high", "transformative"]);
export const jurisdictionEnum = pgEnum("jurisdiction", [
    "south_africa", "united_kingdom", "united_states", "australia", "other",
  ]);
export const pattern_typeEnum = pgEnum("pattern_type", [
    "recurring_dissenter", "category_dissent", "threshold_breach",
    "institutional_block", "cross_client_trend", "emerging_risk",
  ]);
export const algorithm_sourceEnum = pgEnum("algorithm_source", [
    "resolution_sentiment", "dissent_pattern", "qa_governance_triage",
    "quorum_intelligence", "regulatory_guardian", "governance_report",
  ]);
export const guidance_typeEnum = pgEnum("guidance_type", [
    "revenue", "earnings", "margins", "capex", "headcount", "market_share", "other",
  ]);
export const confidence_levelEnum = pgEnum("confidence_level", ["firm", "tentative", "aspirational"]);
export const met_or_missedEnum = pgEnum("met_or_missed", ["met", "missed", "exceeded", "pending"]);
export const action_typeEnum = pgEnum("action_type", [
    "tool_proposed", "shadow_test_started", "shadow_test_passed", "shadow_test_failed",
    "tool_deployed", "tool_deactivated", "tool_promoted", "roadmap_updated"
  ]);
export const timeframeEnum = pgEnum("timeframe", ["30_days", "60_days", "90_days"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);
export const qa_session_statusEnum = pgEnum("qa_session_status", ["active", "paused", "closed"]);
export const question_categoryEnum = pgEnum("question_category", ["financial", "operational", "esg", "governance", "strategy", "general"]);
export const question_statusEnum = pgEnum("question_status", ["pending", "triaged", "approved", "answered", "rejected", "flagged"]);
export const recommended_actionEnum = pgEnum("recommended_action", ["forward", "route_to_bot", "legal_review", "delay_24h"]);
export const share_typeEnum = pgEnum("share_type", ["link", "embed", "widget"]);



/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 64 }).default("user").notNull(),
  // Profile customisation fields
  jobTitle: varchar("jobTitle", { length: 255 }),
  organisation: varchar("organisation", { length: 255 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 64 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table — stores event metadata including optional access code for password protection.
 */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull().unique(), // e.g. "q4-earnings-2026"
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  status: varchar("status", { length: 64 }).default("upcoming").notNull(),
  accessCode: varchar("accessCode", { length: 64 }), // null = no password required
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Attendee registrations table — persists sign-ups from the Registration page.
 */
export const attendeeRegistrations = pgTable("attendee_registrations", {
  id: serial("id").primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  language: varchar("language", { length: 64 }).default("English").notNull(),
  dialIn: boolean("dialIn").default(false).notNull(),
  accessGranted: boolean("accessGranted").default(false).notNull(),
  joinedAt: timestamp("joinedAt"),
  // CuraLive Direct — unique 5-digit PIN for auto-admit dial-in
  accessPin: varchar("access_pin", { length: 8 }),
  pinUsedAt: timestamp("pin_used_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendeeRegistration = typeof attendeeRegistrations.$inferSelect;
export type InsertAttendeeRegistration = typeof attendeeRegistrations.$inferInsert;

/**
 * IR contacts table — stores investor relations email contacts for post-event summaries.
 */
export const irContacts = pgTable("ir_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 128 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IrContact = typeof irContacts.$inferSelect;
export type InsertIrContact = typeof irContacts.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// OCC — Operator Call Centre tables
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OCC Conferences — the master conference record managed by operators.
 * Maps 1:1 with an event but carries telephony-specific state.
 */
export const occConferences = pgTable("occ_conferences", {
  id: serial("id").primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  callId: varchar("callId", { length: 64 }).notNull().unique(), // e.g. "CC-9921"
  subject: varchar("subject", { length: 255 }).notNull(),
  reseller: varchar("reseller", { length: 128 }).default("CuraLive").notNull(),
  product: varchar("product", { length: 128 }).default("Event Conference").notNull(),
  moderatorCode: varchar("moderatorCode", { length: 32 }),
  participantCode: varchar("participantCode", { length: 32 }),
  securityCode: varchar("securityCode", { length: 32 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  webAccessCode: varchar("webAccessCode", { length: 32 }),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  isRecording: boolean("isRecording").default(false).notNull(),
  waitingMusicEnabled: boolean("waitingMusicEnabled").default(true).notNull(),
  participantLimitEnabled: boolean("participantLimitEnabled").default(false).notNull(),
  participantLimit: integer("participantLimit").default(500),
  requestsToSpeakEnabled: boolean("requestsToSpeakEnabled").default(true).notNull(),
  // CuraLive Direct — when true, callers with valid PIN bypass operator queue
  autoAdmitEnabled: boolean("autoAdmitEnabled").default(false).notNull(),
  scheduledStart: timestamp("scheduledStart"),
  actualStart: timestamp("actualStart"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OccConference = typeof occConferences.$inferSelect;
export type InsertOccConference = typeof occConferences.$inferInsert;

/**
 * OCC Participants — every person in or associated with a conference.
 * State is updated in real-time by the telephony bridge and operator actions.
 */
export const occParticipants = pgTable("occ_participants", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(), // references occConferences.id
  lineNumber: integer("lineNumber").notNull(), // position in the conference (1-based)
  role: varchar("role", { length: 64 }).default("participant").notNull(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  location: varchar("location", { length: 128 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  voiceServer: varchar("voiceServer", { length: 32 }),
  // State
  state: varchar("state", { length: 64 }).default("incoming").notNull(),
  isSpeaking: boolean("isSpeaking").default(false).notNull(),
  isWebParticipant: boolean("isWebParticipant").default(false).notNull(),
  requestToSpeak: boolean("requestToSpeak").default(false).notNull(),
  requestToSpeakPosition: integer("requestToSpeakPosition"),
  // CuraLive Direct — link to attendee_registrations for PIN actions
  registrationId: integer("registrationId"), // null = no registration linked
  // Subconference
  subconferenceId: integer("subconferenceId"), // null = main conference
  // Monitoring
  isMonitored: boolean("isMonitored").default(false).notNull(),
  monitoringOperatorId: integer("monitoringOperatorId"),
  // Timestamps
  connectedAt: timestamp("connectedAt"),
  disconnectedAt: timestamp("disconnectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OccParticipant = typeof occParticipants.$inferSelect;
export type InsertOccParticipant = typeof occParticipants.$inferInsert;

/**
 * OCC Lounge — participants who have dialled in to an event conference
 * but are waiting to be admitted by an operator.
 */
export const occLounge = pgTable("occ_lounge", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(),
  callId: varchar("callId", { length: 64 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  description: varchar("description", { length: 255 }),
  language: varchar("language", { length: 32 }).default("en"),
  arrivedAt: timestamp("arrivedAt").defaultNow().notNull(),
  pickedAt: timestamp("pickedAt"),
  pickedByOperatorId: integer("pickedByOperatorId"),
  status: varchar("status", { length: 64 }).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccLounge = typeof occLounge.$inferSelect;
export type InsertOccLounge = typeof occLounge.$inferInsert;

/**
 * OCC Operator Requests — participants who pressed DTMF to request operator assistance.
 */
export const occOperatorRequests = pgTable("occ_operator_requests", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(),
  participantId: integer("participantId").notNull(),
  callId: varchar("callId", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  pickedAt: timestamp("pickedAt"),
  pickedByOperatorId: integer("pickedByOperatorId"),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccOperatorRequest = typeof occOperatorRequests.$inferSelect;
export type InsertOccOperatorRequest = typeof occOperatorRequests.$inferInsert;

/**
 * OCC Operator Sessions — tracks each operator's current state and which
 * conference panels they have open. Used for presence and coordination.
 */
export const occOperatorSessions = pgTable("occ_operator_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // references users.id
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  state: varchar("state", { length: 64 }).default("absent").notNull(),
  activeConferenceId: integer("activeConferenceId"), // conference currently being managed
  openConferenceIds: text("openConferenceIds"), // JSON array of open CCP conference IDs
  lastHeartbeat: timestamp("lastHeartbeat").defaultNow().notNull(),
  loginAt: timestamp("loginAt"),
  breakAt: timestamp("breakAt"),
  logoutAt: timestamp("logoutAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OccOperatorSession = typeof occOperatorSessions.$inferSelect;
export type InsertOccOperatorSession = typeof occOperatorSessions.$inferInsert;

/**
 * OCC Chat Messages — real-time chat between operator and conference participants.
 */
export const occChatMessages = pgTable("occ_chat_messages", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(),
  senderType: varchar("senderType", { length: 64 }).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderId: integer("senderId"), // participantId or userId
  recipientType: varchar("recipientType", { length: 64 }).default("all").notNull(),
  recipientId: integer("recipientId"), // null = broadcast
  message: text("message").notNull(),
  detectedLanguage: varchar("detectedLanguage", { length: 10 }), // ISO 639-1 code e.g. 'fr', 'es'
  translatedMessage: text("translatedMessage"), // translated to operator's preferred language
  translationLanguage: varchar("translationLanguage", { length: 10 }), // target language of translation
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccChatMessage = typeof occChatMessages.$inferSelect;
export type InsertOccChatMessage = typeof occChatMessages.$inferInsert;

/**
 * OCC Audio Files — pre-recorded audio files available for playback into a conference.
 */
export const occAudioFiles = pgTable("occ_audio_files", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId"), // null = global/shared
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  durationSeconds: integer("durationSeconds"),
  isPlaying: boolean("isPlaying").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccAudioFile = typeof occAudioFiles.$inferSelect;
export type InsertOccAudioFile = typeof occAudioFiles.$inferInsert;

/**
 * OCC Participant History — timestamped event log for each participant line.
 * Records every state transition for audit and post-event review.
 */
export const occParticipantHistory = pgTable("occ_participant_history", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(),
  participantId: integer("participantId").notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  triggeredBy: varchar("triggeredBy", { length: 64 }).default("system").notNull(),
  operatorId: integer("operatorId"),
  note: varchar("note", { length: 255 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccParticipantHistory = typeof occParticipantHistory.$inferSelect;
export type InsertOccParticipantHistory = typeof occParticipantHistory.$inferInsert;

/**
 * OCC Access Code Log — records every access code entry attempt for audit.
 */
export const occAccessCodeLog = pgTable("occ_access_code_log", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(),
  callingNumber: varchar("callingNumber", { length: 32 }),
  calledNumber: varchar("calledNumber", { length: 32 }),
  accessCodeEntered: varchar("accessCodeEntered", { length: 64 }),
  isValid: boolean("isValid").notNull(),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccAccessCodeLog = typeof occAccessCodeLog.$inferSelect;
export type InsertOccAccessCodeLog = typeof occAccessCodeLog.$inferInsert;

/**
 * OCC Dial-Out History — records every multi-party dial-out session.
 * Each row is one session; entries are stored as JSON in the dialEntries column.
 */
export const occDialOutHistory = pgTable("occ_dial_out_history", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull(),
  operatorId: integer("operatorId"),
  operatorName: varchar("operatorName", { length: 255 }),
  // JSON array of { name, company, phone, role, status }
  dialEntries: text("dialEntries").notNull(),
  successCount: integer("successCount").default(0).notNull(),
  failCount: integer("failCount").default(0).notNull(),
  totalCount: integer("totalCount").default(0).notNull(),
  initiatedAt: timestamp("initiatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccDialOutHistory = typeof occDialOutHistory.$inferSelect;
export type InsertOccDialOutHistory = typeof occDialOutHistory.$inferInsert;

/**
 * OCC Green Room — speaker sub-conference for pre-event preparation.
 * Linked to a main conference; speakers join here before being transferred.
 */
export const occGreenRooms = pgTable("occ_green_rooms", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conferenceId").notNull().unique(), // parent conference
  name: varchar("name", { length: 255 }).default("Speaker Green Room").notNull(),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  accessCode: varchar("accessCode", { length: 32 }),
  isActive: boolean("isActive").default(false).notNull(),
  isOpen: boolean("isOpen").default(false).notNull(), // visible in OCC
  transferredAt: timestamp("transferredAt"), // when Transfer All was triggered
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OccGreenRoom = typeof occGreenRooms.$inferSelect;
export type InsertOccGreenRoom = typeof occGreenRooms.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Live Video Meetings — Capital Markets & Private Equity service module
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Roadshows — a named series of back-to-back 1:1 or group video meetings
 * for capital-raising transactions, research presentations, or hybrid conferences.
 */
export const liveRoadshows = pgTable("live_roadshows", {
  id: serial("id").primaryKey(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull().unique(), // e.g. "aggreko-sep-2026"
  title: varchar("title", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(), // company raising capital
  bank: varchar("bank", { length: 255 }), // e.g. "BofA Securities"
  serviceType: varchar("serviceType", { length: 64 }).default("capital_raising_1x1").notNull(),
  platform: varchar("platform", { length: 64 }).default("zoom").notNull(),
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  // Dates
  startDate: varchar("startDate", { length: 32 }), // ISO date string
  endDate: varchar("endDate", { length: 32 }),
  timezone: varchar("timezone", { length: 64 }).default("Europe/London").notNull(),
  // Branding / white-label
  brandingEnabled: boolean("brandingEnabled").default(true).notNull(),
  customLogoUrl: varchar("customLogoUrl", { length: 512 }),
  // Operator notes
  notes: text("notes"),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LiveRoadshow = typeof liveRoadshows.$inferSelect;
export type InsertLiveRoadshow = typeof liveRoadshows.$inferInsert;

/**
 * Roadshow Meetings — individual meeting slots within a roadshow.
 * Each slot has its own video link, timeslot, and investor assignment.
 */
export const liveRoadshowMeetings = pgTable("live_roadshow_meetings", {
  id: serial("id").primaryKey(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  meetingDate: varchar("meetingDate", { length: 32 }).notNull(), // ISO date
  startTime: varchar("startTime", { length: 8 }).notNull(), // "HH:MM"
  endTime: varchar("endTime", { length: 8 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Europe/London").notNull(),
  meetingType: varchar("meetingType", { length: 64 }).default("1x1").notNull(),
  platform: varchar("platform", { length: 64 }).default("zoom").notNull(),
  videoLink: varchar("videoLink", { length: 512 }), // the Zoom/Teams join URL
  meetingId: varchar("meetingId", { length: 128 }), // platform meeting ID
  passcode: varchar("passcode", { length: 64 }),
  status: varchar("status", { length: 64 }).default("scheduled").notNull(),
  // Operator notes for this slot
  operatorNotes: text("operatorNotes"),
  // Slide deck — S3 URL of uploaded PDF/PPTX
  slideDeckUrl: varchar("slideDeckUrl", { length: 1024 }),
  slideDeckName: varchar("slideDeckName", { length: 255 }),
  // Current slide index shown to presenter/attendees (0-based)
  currentSlideIndex: integer("currentSlideIndex").default(0).notNull(),
  totalSlides: integer("totalSlides").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LiveRoadshowMeeting = typeof liveRoadshowMeetings.$inferSelect;
export type InsertLiveRoadshowMeeting = typeof liveRoadshowMeetings.$inferInsert;

/**
 * Roadshow Investors — investors (buy-side) assigned to specific meeting slots.
 * One investor can be assigned to multiple slots across a roadshow.
 */
export const liveRoadshowInvestors = pgTable("live_roadshow_investors", {
  id: serial("id").primaryKey(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  meetingId: integer("meetingId").notNull(), // references liveRoadshowMeetings.id
  name: varchar("name", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  // Waiting room state
  waitingRoomStatus: varchar("waitingRoomStatus", { length: 64 }).default("not_arrived").notNull(),
  arrivedAt: timestamp("arrivedAt"),
  admittedAt: timestamp("admittedAt"),
  // Invite
  inviteSentAt: timestamp("inviteSentAt"),
  inviteToken: varchar("inviteToken", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LiveRoadshowInvestor = typeof liveRoadshowInvestors.$inferSelect;
export type InsertLiveRoadshowInvestor = typeof liveRoadshowInvestors.$inferInsert;

/**
 * Live Meeting Summaries — AI-generated post-meeting summaries.
 */
export const liveMeetingSummaries = pgTable("live_meeting_summaries", {
  id: serial("id").primaryKey(),
  meetingDbId: integer("meetingDbId").notNull(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  summary: text("summary").notNull(),
  keyTopics: text("keyTopics"),
  actionItems: text("actionItems"),
  sentiment: varchar("sentiment", { length: 64 }).default("neutral"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LiveMeetingSummary = typeof liveMeetingSummaries.$inferSelect;
export type InsertLiveMeetingSummary = typeof liveMeetingSummaries.$inferInsert;

/**
 * Slide Thumbnails — S3 URLs for per-page PDF thumbnail images.
 */
export const slideThumbnails = pgTable("slide_thumbnails", {
  id: serial("id").primaryKey(),
  meetingDbId: integer("meetingDbId").notNull(),
  slideIndex: integer("slideIndex").notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SlideThumbnail = typeof slideThumbnails.$inferSelect;
export type InsertSlideThumbnail = typeof slideThumbnails.$inferInsert;

/**
 * Commitment Signals — AI-detected soft commitment language from meeting transcripts.
 */
export const commitmentSignals = pgTable("commitment_signals", {
  id: serial("id").primaryKey(),
  meetingDbId: integer("meetingDbId").notNull(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  investorId: integer("investorId"), // references liveRoadshowInvestors.id (nullable if unknown)
  investorName: varchar("investorName", { length: 255 }),
  institution: varchar("institution", { length: 255 }),
  quote: text("quote").notNull(), // the detected phrase
  signalType: varchar("signalType", { length: 64 }).notNull(),
  confidenceScore: integer("confidenceScore").default(0).notNull(), // 0-100
  indicatedAmount: varchar("indicatedAmount", { length: 64 }), // e.g. "$5m", "10% of deal"
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommitmentSignal = typeof commitmentSignals.$inferSelect;
export type InsertCommitmentSignal = typeof commitmentSignals.$inferInsert;

/**
 * Investor Briefing Packs — AI-generated pre-meeting briefing notes for presenters.
 */
export const investorBriefingPacks = pgTable("investor_briefing_packs", {
  id: serial("id").primaryKey(),
  investorId: integer("investorId").notNull(),
  meetingDbId: integer("meetingDbId").notNull(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  // AI-generated content
  investorProfile: text("investorProfile"), // AUM, mandate, geography focus
  recentActivity: text("recentActivity"), // recent portfolio changes, known positions
  suggestedTalkingPoints: text("suggestedTalkingPoints"), // JSON array
  knownConcerns: text("knownConcerns"), // JSON array of likely objections
  previousInteractions: text("previousInteractions"), // notes from prior meetings
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestorBriefingPack = typeof investorBriefingPacks.$inferSelect;
export type InsertInvestorBriefingPack = typeof investorBriefingPacks.$inferInsert;

// ─── White-Label Event Branding ───────────────────────────────────────────────
export const eventBranding = pgTable("event_branding", {
  id: serial("id").primaryKey(),
  roadshowId: varchar("roadshow_id", { length: 100 }).notNull().unique(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 20 }).default("#3b82f6"),
  accentColor: varchar("accent_color", { length: 20 }).default("#10b981"),
  backgroundColor: varchar("background_color", { length: 20 }).default("#0f172a"),
  textColor: varchar("text_color", { length: 20 }).default("#f8fafc"),
  fontFamily: varchar("font_family", { length: 100 }).default("Space Grotesk"),
  tagline: varchar("tagline", { length: 300 }),
  footerText: varchar("footer_text", { length: 500 }),
  faviconUrl: varchar("favicon_url", { length: 500 }),
  showCuraLiveWatermark: boolean("show_chorus_watermark").default(true),
  customCss: text("custom_css"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});

// ─── Webcasting Platform ──────────────────────────────────────────────────────
/**
 * webcast_events — All webcast/webinar/virtual event types across all verticals.
 */
export const webcastEvents = pgTable("webcast_events", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 64 }).notNull().default("webinar"),
  industryVertical: varchar("industry_vertical", { length: 64 }).notNull().default("general"),
  status: varchar("webcast_status", { length: 64 }).notNull().default("draft"),
  startTime: bigint("start_time", { mode: "number" }),
  endTime: bigint("end_time", { mode: "number" }),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  maxAttendees: integer("max_attendees").default(1000),
  registrationCount: integer("registration_count").default(0),
  peakAttendees: integer("peak_attendees").default(0),
  streamUrl: varchar("stream_url", { length: 500 }),
  rtmpKey: varchar("rtmp_key", { length: 256 }),
  recordingUrl: varchar("recording_url", { length: 500 }),
  registrationEnabled: boolean("registration_enabled").default(true),
  chatEnabled: boolean("chat_enabled").default(true),
  qaEnabled: boolean("qa_enabled").default(true),
  pollsEnabled: boolean("polls_enabled").default(true),
  recordingEnabled: boolean("recording_enabled").default(true),
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 20 }).default("#3b82f6"),
  hostName: varchar("host_name", { length: 200 }),
  hostOrganization: varchar("host_organization", { length: 200 }),
  tags: varchar("tags", { length: 500 }),
  aiApplicationIds: text("ai_application_ids"), // JSON array of selected AI application IDs
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type WebcastEvent = typeof webcastEvents.$inferSelect;
export type InsertWebcastEvent = typeof webcastEvents.$inferInsert;

/**
 * webcast_registrations — Attendee registrations for webcast events.
 */
export const webcastRegistrations = pgTable("webcast_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("job_title", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  customFields: text("custom_fields"),
  attended: boolean("attended").default(false),
  joinedAt: bigint("joined_at", { mode: "number" }),
  leftAt: bigint("left_at", { mode: "number" }),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  engagementScore: integer("engagement_score").default(0),
  registrationSource: varchar("registration_source", { length: 100 }).default("direct"),
  utmSource: varchar("utm_source", { length: 100 }),
  attendeeToken: varchar("attendee_token", { length: 64 }),
  registeredAt: bigint("registered_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  // Reminder tracking — Unix ms timestamps when each reminder was sent (null = not yet sent)
  reminder24SentAt: bigint("reminder_24_sent_at", { mode: "number" }),
  reminder1SentAt: bigint("reminder_1_sent_at", { mode: "number" }),
});
export type WebcastRegistration = typeof webcastRegistrations.$inferSelect;
export type InsertWebcastRegistration = typeof webcastRegistrations.$inferInsert;

/**
 * webcast_qa — Q&A questions submitted during webcast events.
 */
export const webcastQa = pgTable("webcast_qa", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  attendeeName: varchar("attendee_name", { length: 200 }).notNull(),
  attendeeEmail: varchar("attendee_email", { length: 255 }),
  attendeeCompany: varchar("attendee_company", { length: 200 }),
  question: text("question").notNull(),
  status: varchar("qa_status", { length: 64 }).notNull().default("pending"),
  upvotes: integer("upvotes").default(0),
  answer: text("answer"),
  answeredBy: varchar("answered_by", { length: 200 }),
  answeredAt: bigint("answered_at", { mode: "number" }),
  category: varchar("category", { length: 100 }),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type WebcastQa = typeof webcastQa.$inferSelect;
export type InsertWebcastQa = typeof webcastQa.$inferInsert;

/**
 * webcast_polls — Interactive polls for webcast events.
 */
export const webcastPolls = pgTable("webcast_polls", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  question: varchar("question", { length: 500 }).notNull(),
  options: text("options").notNull(),
  results: text("results"),
  status: varchar("poll_status", { length: 64 }).notNull().default("draft"),
  allowMultiple: boolean("allow_multiple").default(false),
  showResultsToAttendees: boolean("show_results_to_attendees").default(true),
  totalVotes: integer("total_votes").default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  closedAt: bigint("closed_at", { mode: "number" }),
});
export type WebcastPoll = typeof webcastPolls.$inferSelect;
export type InsertWebcastPoll = typeof webcastPolls.$inferInsert;

/**
 * recall_bots — Tracks Recall.ai meeting bot instances for live transcription.
 * Each row represents one bot deployed to a meeting (Zoom, Teams, Webex, etc.)
 */
export const recallBots = pgTable("recall_bots", {
  id: serial("id").primaryKey(),
  // Links to either a webcast event or a live roadshow meeting
  eventId: integer("event_id"),
  meetingId: integer("meeting_id"),
  // Recall.ai bot identifier (UUID)
  recallBotId: varchar("recall_bot_id", { length: 100 }).notNull().unique(),
  // The meeting URL the bot joined
  meetingUrl: text("meeting_url").notNull(),
  // Bot display name shown in the meeting
  botName: varchar("bot_name", { length: 200 }).default("CuraLive"),
  // Recall.ai bot status: created, joining, in_call, done, failed
  status: varchar("status", { length: 50 }).notNull().default("created"),
  // Ably channel name this bot publishes transcripts to
  ablyChannel: varchar("ably_channel", { length: 200 }),
  // Full transcript accumulated from webhook chunks (JSON array of segments)
  transcriptJson: text("transcript_json"),
  // AI-generated summary (populated after bot leaves)
  summary: text("summary"),
  // Recording URL from Recall.ai (if recording enabled)
  recordingUrl: text("recording_url"),
  // Webhook URL the bot was configured to deliver events to
  webhookUrl: text("webhook_url"),
  // Error message if bot failed
  errorMessage: text("error_message"),
  // Timestamps
  startedAt: bigint("started_at", { mode: "number" }).$defaultFn(() => Date.now()),
  joinedAt: bigint("joined_at", { mode: "number" }),
  leftAt: bigint("left_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).$defaultFn(() => Date.now()),
});
export type RecallBot = typeof recallBots.$inferSelect;
export type InsertRecallBot = typeof recallBots.$inferInsert;

/**
 * mux_streams — Tracks Mux Live Stream instances for RTMP ingest.
 * Each row represents one Mux live stream (one RTMP ingest endpoint + one HLS playback URL).
 * Operators use the stream key in OBS/vMix; attendees watch via the playback URL.
 */
export const muxStreams = pgTable("mux_streams", {
  id: serial("id").primaryKey(),
  // Links to a webcast event or live roadshow meeting
  eventId: integer("event_id"),
  meetingId: integer("meeting_id"),
  // Mux-assigned stream ID (e.g. "abc123xyz")
  muxStreamId: varchar("mux_stream_id", { length: 100 }).notNull().unique(),
  // Mux-assigned playback ID for HLS delivery
  muxPlaybackId: varchar("mux_playback_id", { length: 100 }),
  // RTMP stream key (secret — operators paste this into OBS/vMix)
  streamKey: varchar("stream_key", { length: 200 }).notNull(),
  // RTMP ingest URL (always rtmps://global-live.mux.com:443/app)
  rtmpUrl: varchar("rtmp_url", { length: 300 }).default("rtmps://global-live.mux.com:443/app"),
  // Stream status: idle | active | disconnected | disabled
  status: varchar("status", { length: 50 }).notNull().default("idle"),
  // Human-readable label for this stream
  label: varchar("label", { length: 200 }),
  // Whether this stream is publicly accessible (vs. signed/gated)
  isPublic: boolean("is_public").default(true),
  // Whether recording is enabled for this stream
  recordingEnabled: boolean("recording_enabled").default(true),
  // Mux asset ID created when recording is complete
  muxAssetId: varchar("mux_asset_id", { length: 100 }),
  // Timestamps
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  startedAt: bigint("started_at", { mode: "number" }),
  endedAt: bigint("ended_at", { mode: "number" }),
});
export type MuxStream = typeof muxStreams.$inferSelect;
export type InsertMuxStream = typeof muxStreams.$inferInsert;

/**
 * Webphone sessions — records every WebRTC / PSTN call made via the softphone.
 */
export const webphoneSessions = pgTable("webphone_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conferenceId: integer("conference_id"),          // optional link to OCC conference
  carrier: varchar("carrier", { length: 64 }).notNull().default("twilio"),
  status: varchar("status", { length: 64 }).notNull().default("initiated"),
  direction: varchar("direction", { length: 64 }).notNull().default("outbound"),
  remoteNumber: varchar("remote_number", { length: 32 }),  // E.164 format
  callSid: varchar("call_sid", { length: 128 }),           // Twilio CallSid or Telnyx call_control_id
  durationSecs: integer("duration_secs"),
  recordingSid: varchar("recording_sid", { length: 128 }),  // Twilio RecordingSid
  recordingUrl: varchar("recording_url", { length: 512 }),  // Twilio recording URL
  recordingStatus: varchar("recording_status", { length: 64 }),
  // Voicemail fields
  isVoicemail: boolean("is_voicemail").notNull().default(false),
  voicemailUrl: varchar("voicemail_url", { length: 512 }),
  voicemailDuration: integer("voicemail_duration"),
  // Transcription fields
  transcription: text("transcription"),
  transcriptionLanguage: varchar("transcription_language", { length: 16 }),
  transcriptionStatus: varchar("transcription_status", { length: 64 }),
  // Transfer fields
  transferredTo: varchar("transferred_to", { length: 128 }),
  transferType: varchar("transfer_type", { length: 64 }),
  startedAt: bigint("started_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  endedAt: bigint("ended_at", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type WebphoneSession = typeof webphoneSessions.$inferSelect;
export type InsertWebphoneSession = typeof webphoneSessions.$inferInsert;

/**
 * Webphone carrier status — tracks health of Twilio and Telnyx for automatic failover.
 */
export const webphoneCarrierStatus = pgTable("webphone_carrier_status", {
  id: serial("id").primaryKey(),
  carrier: varchar("carrier", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 64 }).notNull().default("healthy"),
  failoverActive: boolean("failover_active").notNull().default(false),
  lastCheckedAt: bigint("last_checked_at", { mode: "number" }).$defaultFn(() => Date.now()),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type WebphoneCarrierStatus = typeof webphoneCarrierStatus.$inferSelect;

/**
 * Speaker pace analysis results — stores per-speaker WPM and coaching scores
 * for each event, enabling trend charts across multiple events.
 */
export const speakerPaceResults = pgTable("speaker_pace_results", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }).notNull(),
  speaker: varchar("speaker", { length: 255 }).notNull(),
  wpm: integer("wpm").notNull(),
  paceLabel: varchar("pace_label", { length: 32 }).notNull(),
  pauseScore: integer("pause_score").notNull(),
  fillerWordCount: integer("filler_word_count").notNull().default(0),
  overallScore: integer("overall_score").notNull(),
  analysedAt: bigint("analysed_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type SpeakerPaceResult = typeof speakerPaceResults.$inferSelect;
export type InsertSpeakerPaceResult = typeof speakerPaceResults.$inferInsert;

// ─── Event Customisation Portal ──────────────────────────────────────────────
/**
 * event_customisation — Per-event branding, registration page config, and booking form config.
 * Used by the Customisation Portal tab in the Operator Console.
 */
export const eventCustomisation = pgTable("event_customisation", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull().unique(), // references events.eventId or webcast slug

  // ── Brand Identity ──────────────────────────────────────────────────────────
  clientName: varchar("client_name", { length: 200 }).notNull().default("CuraLive"),
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 20 }).default("#c8a96e"),
  accentColor: varchar("accent_color", { length: 20 }).default("#10b981"),
  fontFamily: varchar("font_family", { length: 100 }).default("Space Grotesk"),
  showPoweredBy: boolean("show_powered_by").default(true),

  // ── Registration Page ───────────────────────────────────────────────────────
  regPageTitle: varchar("reg_page_title", { length: 300 }),
  regPageSubtitle: varchar("reg_page_subtitle", { length: 500 }),
  regHostName: varchar("reg_host_name", { length: 200 }),
  regHostTitle: varchar("reg_host_title", { length: 200 }),
  regHostOrg: varchar("reg_host_org", { length: 200 }),
  regEventDate: varchar("reg_event_date", { length: 100 }),
  regEventTime: varchar("reg_event_time", { length: 100 }),
  regEventTimezone: varchar("reg_event_timezone", { length: 64 }).default("SAST"),
  regDescription: text("reg_description"),
  regFeatures: text("reg_features"),       // JSON array of feature bullet strings
  regAgenda: text("reg_agenda"),           // JSON array of {time, title, speaker}
  regSpeakers: text("reg_speakers"),       // JSON array of {name, title, org, initials, color}
  regIndustryVertical: varchar("reg_industry_vertical", { length: 64 }).default("general"),
  regMaxAttendees: integer("reg_max_attendees").default(1000),
  regConsentText: text("reg_consent_text"),
  regSupportEmail: varchar("reg_support_email", { length: 320 }),
  // Form field toggles (which fields are shown/required)
  regFieldCompany: boolean("reg_field_company").default(true),
  regFieldJobTitle: boolean("reg_field_job_title").default(true),
  regFieldPhone: boolean("reg_field_phone").default(false),
  regFieldCountry: boolean("reg_field_country").default(false),
  regFieldLanguage: boolean("reg_field_language").default(true),
  regFieldDialIn: boolean("reg_field_dial_in").default(true),

  // ── Booking Form ────────────────────────────────────────────────────────────
  bookHeadline: varchar("book_headline", { length: 300 }),
  bookSubheadline: varchar("book_subheadline", { length: 500 }),
  bookFeatures: text("book_features"),     // JSON array of feature bullet strings
  bookServiceOptions: text("book_service_options"), // JSON array of service dropdown options
  bookReplyEmail: varchar("book_reply_email", { length: 320 }),
  bookButtonLabel: varchar("book_button_label", { length: 100 }).default("Submit Booking Request"),

  // ── Email Branding ──────────────────────────────────────────────────────────
  emailSenderName: varchar("email_sender_name", { length: 200 }).default("CuraLive"),
  emailSenderAddress: varchar("email_sender_address", { length: 320 }),
  emailHeaderColor: varchar("email_header_color", { length: 20 }).default("#0f172a"),
  emailButtonColor: varchar("email_button_color", { length: 20 }).default("#3b82f6"),
  emailButtonLabel: varchar("email_button_label", { length: 100 }).default("Join Event"),
  emailFooterText: varchar("email_footer_text", { length: 500 }),

  // ── Unique Links ────────────────────────────────────────────────────────────
  customSlug: varchar("custom_slug", { length: 128 }),  // override the default slug
  shortLinkEnabled: boolean("short_link_enabled").default(false),

  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type EventCustomisation = typeof eventCustomisation.$inferSelect;
export type InsertEventCustomisation = typeof eventCustomisation.$inferInsert;

// ─── CuraLive Direct — PIN Auto-Admit ────────────────────────────────────────
/**
 * direct_access_log — Audit trail for every PIN entry attempt on the IVR.
 * Records whether the caller was auto-admitted, sent to operator queue, or failed.
 */
export const directAccessLog = pgTable("direct_access_log", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id"),
  registrationId: integer("registration_id"),
  enteredPin: varchar("entered_pin", { length: 8 }).notNull(),
  callerNumber: varchar("caller_number", { length: 32 }),
  outcome: varchar("outcome", { length: 64 }).notNull().default("failed"),
  callSid: varchar("call_sid", { length: 128 }),
  dialInNumber: varchar("dial_in_number", { length: 32 }),
  attemptedAt: bigint("attempted_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type DirectAccessLog = typeof directAccessLog.$inferSelect;
export type InsertDirectAccessLog = typeof directAccessLog.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Quote & Billing System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * billing_clients — CuraLive's enterprise customers (companies).
 * One client can have many quotes and invoices.
 */
export const billingClients = pgTable("billing_clients", {
  id: serial("id").primaryKey(),
  // Company details
  companyName: varchar("company_name", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 128 }),
  vatNumber: varchar("vat_number", { length: 64 }),
  industry: varchar("industry", { length: 128 }),
  // Primary contact
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 320 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 64 }),
  contactJobTitle: varchar("contact_job_title", { length: 255 }),
  // Billing address
  billingAddress: text("billing_address"),
  billingCity: varchar("billing_city", { length: 128 }),
  billingCountry: varchar("billing_country", { length: 128 }).default("South Africa"),
  billingPostalCode: varchar("billing_postal_code", { length: 32 }),
  // Account settings
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  paymentTermsDays: integer("payment_terms_days").default(30).notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 64 }).default("prospect").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingClient = typeof billingClients.$inferSelect;
export type InsertBillingClient = typeof billingClients.$inferInsert;

/**
 * billing_quotes — Formal quotes sent to clients before invoicing.
 * Tracks the full lifecycle: draft → sent → accepted / declined → invoiced.
 */
export const billingQuotes = pgTable("billing_quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 32 }).notNull().unique(), // e.g. "QUO-2026-0001"
  clientId: integer("client_id").notNull(), // FK → billing_clients.id
  // Metadata
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Financials (stored in minor units, e.g. cents)
  subtotalCents: bigint("subtotal_cents", { mode: "number" }).default(0).notNull(),
  discountCents: bigint("discount_cents", { mode: "number" }).default(0).notNull(),
  taxPercent: integer("tax_percent").default(15).notNull(), // VAT %
  totalCents: bigint("total_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Status lifecycle
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  // Dates
  issuedAt: timestamp("issued_at"),
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  // Client-facing access token (for /quote/:token page)
  accessToken: varchar("access_token", { length: 64 }).unique(),
  // Terms and notes
  paymentTerms: text("payment_terms"),
  internalNotes: text("internal_notes"),
  clientNotes: text("client_notes"),
  // Created by
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingQuote = typeof billingQuotes.$inferSelect;
export type InsertBillingQuote = typeof billingQuotes.$inferInsert;

/**
 * billing_line_items — Individual line items on a quote or invoice.
 * Can be linked to a quote, an invoice, or both.
 */
export const billingLineItems = pgTable("billing_line_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id"),   // FK → billing_quotes.id (nullable if invoice-only)
  invoiceId: integer("invoice_id"), // FK → billing_invoices.id (nullable if quote-only)
  // Item details
  description: varchar("description", { length: 512 }).notNull(),
  category: varchar("category", { length: 128 }), // e.g. "Platform License", "Event Fee", "Setup"
  quantity: integer("quantity").default(1).notNull(),
  unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingLineItem = typeof billingLineItems.$inferSelect;
export type InsertBillingLineItem = typeof billingLineItems.$inferInsert;

/**
 * billing_invoices — Formal tax invoices raised against accepted quotes or directly.
 * Tracks payment status: unpaid → partial → paid → overdue → cancelled.
 */
export const billingInvoices = pgTable("billing_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 32 }).notNull().unique(), // e.g. "INV-2026-0001"
  clientId: integer("client_id").notNull(), // FK → billing_clients.id
  quoteId: integer("quote_id"),             // FK → billing_quotes.id (optional)
  // Metadata
  title: varchar("title", { length: 255 }).notNull(),
  // Financials
  subtotalCents: bigint("subtotal_cents", { mode: "number" }).default(0).notNull(),
  discountCents: bigint("discount_cents", { mode: "number" }).default(0).notNull(),
  taxPercent: integer("tax_percent").default(15).notNull(),
  taxCents: bigint("tax_cents", { mode: "number" }).default(0).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).default(0).notNull(),
  paidCents: bigint("paid_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Status
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  // Dates
  issuedAt: timestamp("issued_at"),
  dueAt: timestamp("due_at"),
  paidAt: timestamp("paid_at"),
  // Client-facing access token (for /invoice/:token page)
  accessToken: varchar("access_token", { length: 64 }).unique(),
  // Notes
  paymentTerms: text("payment_terms"),
  internalNotes: text("internal_notes"),
  clientNotes: text("client_notes"),
  bankDetails: text("bank_details"), // JSON string with bank account info
  // Created by
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type InsertBillingInvoice = typeof billingInvoices.$inferInsert;

/**
 * billing_payments — Records of payments received against an invoice.
 * Supports partial payments and multiple payment records per invoice.
 */
export const billingPayments = pgTable("billing_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(), // FK → billing_invoices.id
  clientId: integer("client_id").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  paymentMethod: varchar("payment_method", { length: 64 }).default("eft").notNull(),
  reference: varchar("reference", { length: 255 }), // bank reference or POP reference
  paidAt: timestamp("paid_at").notNull(),
  notes: text("notes"),
  recordedByUserId: integer("recorded_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingPayment = typeof billingPayments.$inferSelect;
export type InsertBillingPayment = typeof billingPayments.$inferInsert;

/**
 * billing_client_contacts — Multiple contacts per client.
 * One client can have many contacts (CFO, IR Manager, Legal, etc.)
 */
export const billingClientContacts = pgTable("billing_client_contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(), // FK → billing_clients.id
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  jobTitle: varchar("job_title", { length: 255 }),
  department: varchar("department", { length: 128 }), // e.g. "Finance", "Investor Relations", "Legal"
  isPrimary: boolean("is_primary").default(false).notNull(), // Primary billing contact
  receivesQuotes: boolean("receives_quotes").default(true).notNull(),
  receivesInvoices: boolean("receives_invoices").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingClientContact = typeof billingClientContacts.$inferSelect;
export type InsertBillingClientContact = typeof billingClientContacts.$inferInsert;

/**
 * billing_quote_versions — Tracks revisions of a quote (v1, v2, v3).
 * Each revision is a snapshot of the quote at a point in time.
 * The parent quote always reflects the latest version.
 */
export const billingQuoteVersions = pgTable("billing_quote_versions", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(), // FK → billing_quotes.id
  versionNumber: integer("version_number").notNull(), // 1, 2, 3...
  // Snapshot of financials at this version
  subtotalCents: bigint("subtotal_cents", { mode: "number" }).notNull(),
  discountCents: bigint("discount_cents", { mode: "number" }).default(0).notNull(),
  taxPercent: integer("tax_percent").default(15).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Snapshot of line items as JSON (denormalised for historical accuracy)
  lineItemsSnapshot: text("line_items_snapshot").notNull(), // JSON array
  // Change summary
  changeNotes: text("change_notes"), // e.g. "Reduced platform fee, added training line"
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingQuoteVersion = typeof billingQuoteVersions.$inferSelect;
export type InsertBillingQuoteVersion = typeof billingQuoteVersions.$inferInsert;

/**
 * billing_credit_notes — Credit notes issued against invoices.
 * Can be full or partial credits. Reduces the outstanding balance.
 */
export const billingCreditNotes = pgTable("billing_credit_notes", {
  id: serial("id").primaryKey(),
  creditNoteNumber: varchar("credit_note_number", { length: 32 }).notNull().unique(), // e.g. "CN-2026-0001"
  invoiceId: integer("invoice_id").notNull(), // FK → billing_invoices.id
  clientId: integer("client_id").notNull(),   // FK → billing_clients.id
  // Financials
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(), // Credit amount (before tax)
  taxPercent: integer("tax_percent").default(15).notNull(),
  taxCents: bigint("tax_cents", { mode: "number" }).default(0).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(), // Total credit including tax
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Details
  reason: text("reason").notNull(), // Why the credit was issued
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  // Client-facing access token
  accessToken: varchar("access_token", { length: 64 }).unique(),
  issuedAt: timestamp("issued_at"),
  appliedAt: timestamp("applied_at"),
  internalNotes: text("internal_notes"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingCreditNote = typeof billingCreditNotes.$inferSelect;
export type InsertBillingCreditNote = typeof billingCreditNotes.$inferInsert;

/**
 * billing_fx_rates — Cached live exchange rates for ZAR, USD, EUR.
 * Refreshed on demand via external API. Used for currency conversion on quotes/invoices.
 */
export const billingFxRates = pgTable("billing_fx_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("base_currency", { length: 8 }).notNull(), // e.g. "ZAR"
  targetCurrency: varchar("target_currency", { length: 8 }).notNull(), // e.g. "USD"
  rate: varchar("rate", { length: 32 }).notNull(), // stored as string to avoid float precision issues
  source: varchar("source", { length: 64 }).default("exchangerate-api").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export type BillingFxRate = typeof billingFxRates.$inferSelect;
export type InsertBillingFxRate = typeof billingFxRates.$inferInsert;

/**
 * billing_activity_log — Full audit trail for every quote and invoice event.
 * Records who did what and when, for both admin actions and client interactions.
 */
export const billingActivityLog = pgTable("billing_activity_log", {
  id: serial("id").primaryKey(),
  // Entity references (one of these will be set)
  quoteId: integer("quote_id"),     // FK → billing_quotes.id
  invoiceId: integer("invoice_id"), // FK → billing_invoices.id
  clientId: integer("client_id").notNull(),
  // Event details
  eventType: varchar("event_type", { length: 64 }).notNull(),
  // e.g. "quote.created", "quote.sent", "quote.viewed", "quote.accepted",
  //      "quote.version_created", "invoice.created", "invoice.sent",
  //      "invoice.viewed", "invoice.payment_recorded", "invoice.overdue",
  //      "credit_note.issued", "email.opened"
  description: text("description").notNull(), // Human-readable summary
  metadata: text("metadata"),  // JSON: extra context (e.g. old/new status, amount, IP)
  // Actor
  actorUserId: integer("actor_user_id"),   // CuraLive team member (null = system/client)
  actorType: varchar("actor_type", { length: 16 }).default("system").notNull(), // "admin" | "client" | "system"
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingActivityLog = typeof billingActivityLog.$inferSelect;
export type InsertBillingActivityLog = typeof billingActivityLog.$inferInsert;

/**
 * billing_line_item_templates — Saved reusable line item templates.
 * Operators can save frequently used line items and insert them into quotes with one click.
 */
export const billingLineItemTemplates = pgTable("billing_line_item_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Standard Earnings Call Package"
  description: text("description").notNull(),        // Default line item description
  category: varchar("category", { length: 128 }).notNull(),
  defaultUnitPriceCents: bigint("default_unit_price_cents", { mode: "number" }).notNull(),
  defaultCurrency: varchar("default_currency", { length: 8 }).default("ZAR").notNull(),
  // Package templates contain multiple line items (stored as JSON)
  isPackage: boolean("is_package").default(false).notNull(),
  packageItemsJson: text("package_items_json"), // JSON array of line items for package templates
  // Usage tracking
  usageCount: integer("usage_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingLineItemTemplate = typeof billingLineItemTemplates.$inferSelect;
export type InsertBillingLineItemTemplate = typeof billingLineItemTemplates.$inferInsert;

/**
 * billing_email_events — Email open and click tracking for quotes and invoices.
 * A 1x1 pixel is embedded in each email; when loaded it records an open event.
 */
export const billingEmailEvents = pgTable("billing_email_events", {
  id: serial("id").primaryKey(),
  // Tracking token (unique per email send)
  trackingToken: varchar("tracking_token", { length: 64 }).notNull().unique(),
  // Entity references
  quoteId: integer("quote_id"),
  invoiceId: integer("invoice_id"),
  creditNoteId: integer("credit_note_id"),
  clientId: integer("client_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
  // Email metadata
  emailType: varchar("email_type", { length: 32 }).notNull(),
  // "quote_sent" | "invoice_sent" | "credit_note_sent" | "payment_reminder" | "quote_expiry_reminder"
  subject: varchar("subject", { length: 512 }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  // Open tracking
  firstOpenedAt: timestamp("first_opened_at"),
  openCount: integer("open_count").default(0).notNull(),
  lastOpenedAt: timestamp("last_opened_at"),
  lastOpenIp: varchar("last_open_ip", { length: 64 }),
  lastOpenUserAgent: text("last_open_user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingEmailEvent = typeof billingEmailEvents.$inferSelect;
export type InsertBillingEmailEvent = typeof billingEmailEvents.$inferInsert;

/**
 * billing_recurring_templates — Recurring quote templates for retainer clients.
 * Defines a schedule and template; a job generates a new draft quote on each cycle.
 */
export const billingRecurringTemplates = pgTable("billing_recurring_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Nedbank Monthly Platform License"
  clientId: integer("client_id").notNull(),
  // Quote template fields
  titleTemplate: varchar("title_template", { length: 512 }).notNull(),
  // Supports tokens: {month}, {quarter}, {year} e.g. "Platform License — {month} {year}"
  lineItemsJson: text("line_items_json").notNull(), // JSON array of line items
  discountPercent: integer("discount_percent").default(0).notNull(),
  taxPercent: integer("tax_percent").default(15).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  paymentTerms: text("payment_terms"),
  // Schedule
  frequency: varchar("frequency", { length: 64 }).notNull(),
  dayOfMonth: integer("day_of_month").default(1).notNull(), // Day of month to generate (1–28)
  nextGenerationAt: timestamp("next_generation_at").notNull(),
  lastGeneratedAt: timestamp("last_generated_at"),
  // Control
  isActive: boolean("is_active").default(true).notNull(),
  autoDraft: boolean("auto_draft").default(true).notNull(), // true = auto-create draft; false = notify only
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BillingRecurringTemplate = typeof billingRecurringTemplates.$inferSelect;
export type InsertBillingRecurringTemplate = typeof billingRecurringTemplates.$inferInsert;

// ─── Training Mode Tables ─────────────────────────────────────────────────────

export const trainingModeSessions = pgTable("training_mode_sessions", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull(),
  operatorName: varchar("operator_name", { length: 255 }).notNull(),
  sessionName: varchar("session_name", { length: 255 }).notNull(),
  scenario: varchar("scenario", { length: 64 }).notNull(),
  mentorId: integer("mentor_id"),
  status: varchar("status", { length: 64 }).default("active").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TrainingModeSession = typeof trainingModeSessions.$inferSelect;
export type InsertTrainingModeSession = typeof trainingModeSessions.$inferInsert;

export const trainingConferences = pgTable("training_conferences", {
  id: serial("id").primaryKey(),
  trainingSessionId: integer("training_session_id").notNull(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  callId: varchar("call_id", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  product: varchar("product", { length: 128 }),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TrainingConference = typeof trainingConferences.$inferSelect;
export type InsertTrainingConference = typeof trainingConferences.$inferInsert;

export const trainingParticipants = pgTable("training_participants", {
  id: serial("id").primaryKey(),
  trainingConferenceId: integer("training_conference_id").notNull(),
  lineNumber: integer("line_number").notNull(),
  role: varchar("role", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 32 }),
  state: varchar("state", { length: 64 }).default("incoming").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingParticipant = typeof trainingParticipants.$inferSelect;
export type InsertTrainingParticipant = typeof trainingParticipants.$inferInsert;

export const trainingLounge = pgTable("training_lounge", {
  id: serial("id").primaryKey(),
  trainingSessionId: integer("training_session_id").notNull(),
  participantName: varchar("participant_name", { length: 255 }).notNull(),
  waitingSince: timestamp("waiting_since").defaultNow().notNull(),
  status: varchar("status", { length: 64 }).default("waiting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingLoungeEntry = typeof trainingLounge.$inferSelect;
export type InsertTrainingLoungeEntry = typeof trainingLounge.$inferInsert;

export const trainingCallLogs = pgTable("training_call_logs", {
  id: serial("id").primaryKey(),
  trainingSessionId: integer("training_session_id").notNull(),
  trainingConferenceId: integer("training_conference_id").notNull(),
  operatorId: integer("operator_id").notNull(),
  participantName: varchar("participant_name", { length: 255 }).notNull(),
  callDuration: integer("call_duration").default(0).notNull(),
  callQuality: varchar("call_quality", { length: 64 }).default("good").notNull(),
  operatorPerformance: text("operator_performance"),
  participantFeedback: text("participant_feedback"),
  recordingUrl: varchar("recording_url", { length: 1024 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingCallLog = typeof trainingCallLogs.$inferSelect;
export type InsertTrainingCallLog = typeof trainingCallLogs.$inferInsert;

export const trainingPerformanceMetrics = pgTable("training_performance_metrics", {
  id: serial("id").primaryKey(),
  trainingSessionId: integer("training_session_id").notNull(),
  operatorId: integer("operator_id").notNull(),
  totalCallsHandled: integer("total_calls_handled").default(0).notNull(),
  averageCallDuration: integer("average_call_duration").default(0).notNull(),
  callQualityScore: varchar("call_quality_score", { length: 8 }).default("0").notNull(),
  averageParticipantSatisfaction: varchar("average_participant_satisfaction", { length: 8 }).default("0").notNull(),
  communicationScore: varchar("communication_score", { length: 8 }).default("0").notNull(),
  problemSolvingScore: varchar("problem_solving_score", { length: 8 }).default("0").notNull(),
  professionalism: varchar("professionalism", { length: 8 }).default("0").notNull(),
  overallScore: varchar("overall_score", { length: 8 }).default("0").notNull(),
  readyForProduction: boolean("ready_for_production").default(false).notNull(),
  mentorNotes: text("mentor_notes"),
  evaluatedAt: timestamp("evaluated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TrainingPerformanceMetric = typeof trainingPerformanceMetrics.$inferSelect;
export type InsertTrainingPerformanceMetric = typeof trainingPerformanceMetrics.$inferInsert;

// ─── Post-Event AI Report ─────────────────────────────────────────────────────

export const postEventReports = pgTable("post_event_reports", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  generatedBy: integer("generated_by").notNull(),
  reportType: varchar("report_type", { length: 64 }).default("full").notNull(),
  status: varchar("status", { length: 64 }).default("generating").notNull(),
  aiSummary: text("ai_summary"),
  keyMoments: text("key_moments"),
  sentimentOverview: text("sentiment_overview"),
  qaSummary: text("qa_summary"),
  engagementMetrics: text("engagement_metrics"),
  complianceFlags: text("compliance_flags"),
  fullTranscriptUrl: text("full_transcript_url"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PostEventReport = typeof postEventReports.$inferSelect;
export type InsertPostEventReport = typeof postEventReports.$inferInsert;

// ─── Transcription Jobs ───────────────────────────────────────────────────────

export const transcriptionJobs = pgTable("transcription_jobs", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  source: varchar("source", { length: 64 }).default("forge_ai").notNull(),
  status: varchar("status", { length: 64 }).default("queued").notNull(),
  languageDetected: varchar("language_detected", { length: 16 }),
  languagesRequested: text("languages_requested"),
  audioUrl: text("audio_url"),
  durationSeconds: integer("duration_seconds"),
  wordCount: integer("word_count"),
  confidenceScore: varchar("confidence_score", { length: 8 }),
  speakerCount: integer("speaker_count"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TranscriptionJob = typeof transcriptionJobs.$inferSelect;
export type InsertTranscriptionJob = typeof transcriptionJobs.$inferInsert;

// ─── Live Polling ─────────────────────────────────────────────────────────────

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  createdBy: integer("created_by").notNull(),
  question: text("question").notNull(),
  pollType: varchar("poll_type", { length: 64 }).default("multiple_choice").notNull(),
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  allowMultiple: boolean("allow_multiple").default(false).notNull(),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;

export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  optionText: varchar("option_text", { length: 512 }).notNull(),
  optionOrder: integer("option_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollOption = typeof pollOptions.$inferInsert;

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  optionId: integer("option_id"),
  voterId: integer("voter_id"),
  voterSession: varchar("voter_session", { length: 128 }),
  textResponse: text("text_response"),
  ratingValue: integer("rating_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = typeof pollVotes.$inferInsert;

// ─── Event Scheduling & Calendar ─────────────────────────────────────────────

export const eventSchedules = pgTable("event_schedules", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg").notNull(),
  recurrenceRule: varchar("recurrence_rule", { length: 512 }),
  parentScheduleId: integer("parent_schedule_id"),
  setupMinutes: integer("setup_minutes").default(30).notNull(),
  teardownMinutes: integer("teardown_minutes").default(15).notNull(),
  status: varchar("status", { length: 64 }).default("tentative").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EventSchedule = typeof eventSchedules.$inferSelect;
export type InsertEventSchedule = typeof eventSchedules.$inferInsert;

export const operatorAvailability = pgTable("operator_availability", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  overrideDate: varchar("override_date", { length: 16 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OperatorAvailability = typeof operatorAvailability.$inferSelect;
export type InsertOperatorAvailability = typeof operatorAvailability.$inferInsert;

export const resourceAllocations = pgTable("resource_allocations", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceIdentifier: varchar("resource_identifier", { length: 256 }).notNull(),
  allocatedAt: timestamp("allocated_at").defaultNow().notNull(),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ResourceAllocation = typeof resourceAllocations.$inferSelect;
export type InsertResourceAllocation = typeof resourceAllocations.$inferInsert;

export const eventTemplates = pgTable("event_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  createdBy: integer("created_by").notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  defaultDurationMinutes: integer("default_duration_minutes").default(60).notNull(),
  defaultSetupMinutes: integer("default_setup_minutes").default(30).notNull(),
  defaultFeatures: text("default_features"),
  defaultPlatform: varchar("default_platform", { length: 64 }).default("pstn").notNull(),
  dialInCountries: text("dial_in_countries"),
  maxAttendees: integer("max_attendees").default(500).notNull(),
  requiresRegistration: boolean("requires_registration").default(true).notNull(),
  complianceEnabled: boolean("compliance_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EventTemplate = typeof eventTemplates.$inferSelect;
export type InsertEventTemplate = typeof eventTemplates.$inferInsert;

// ─── White-Label Client Portal ────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 16 }).default("#6c3fc5").notNull(),
  secondaryColor: varchar("secondary_color", { length: 16 }).default("#1a1a2e").notNull(),
  customDomain: varchar("custom_domain", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  billingTier: varchar("billing_tier", { length: 64 }).default("professional").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

export const clientPortals = pgTable("client_portals", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  customTitle: varchar("custom_title", { length: 512 }),
  customDescription: text("custom_description"),
  passwordProtected: boolean("password_protected").default(false).notNull(),
  accessCode: varchar("access_code", { length: 64 }),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ClientPortal = typeof clientPortals.$inferSelect;
export type InsertClientPortal = typeof clientPortals.$inferInsert;

// ─── Compliance Audit Trail ───────────────────────────────────────────────────

export const complianceFlags = pgTable("compliance_flags", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  statementText: text("statement_text").notNull(),
  timestamp: varchar("timestamp", { length: 16 }),
  speakerName: varchar("speaker_name", { length: 255 }),
  riskLevel: varchar("risk_level", { length: 64 }).default("low").notNull(),
  flagReason: text("flag_reason"),
  complianceStatus: varchar("compliance_status", { length: 64 }).default("flagged").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComplianceFlag = typeof complianceFlags.$inferSelect;
export type InsertComplianceFlag = typeof complianceFlags.$inferInsert;

export const complianceAuditLog = pgTable("compliance_audit_log", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  action: varchar("action", { length: 64 }).notNull(),
  userId: integer("user_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComplianceAuditLogEntry = typeof complianceAuditLog.$inferSelect;
export type InsertComplianceAuditLogEntry = typeof complianceAuditLog.$inferInsert;

// ─── Investor Follow-Up Workflow ──────────────────────────────────────────────

export const investorFollowups = pgTable("investor_followups", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  investorName: varchar("investor_name", { length: 255 }),
  investorEmail: varchar("investor_email", { length: 320 }),
  investorCompany: varchar("investor_company", { length: 255 }),
  questionText: text("question_text"),
  commitmentText: text("commitment_text"),
  followUpStatus: varchar("follow_up_status", { length: 64 }).default("pending").notNull(),
  crmContactId: varchar("crm_contact_id", { length: 128 }),
  crmActivityId: varchar("crm_activity_id", { length: 128 }),
  emailTemplate: text("email_template"),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InvestorFollowup = typeof investorFollowups.$inferSelect;
export type InsertInvestorFollowup = typeof investorFollowups.$inferInsert;

export const followupEmails = pgTable("followup_emails", {
  id: serial("id").primaryKey(),
  followupId: integer("followup_id").notNull(),
  emailBody: text("email_body"),
  recipientEmail: varchar("recipient_email", { length: 320 }),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FollowupEmail = typeof followupEmails.$inferSelect;
export type InsertFollowupEmail = typeof followupEmails.$inferInsert;

// ─── Real-Time Investor Sentiment ─────────────────────────────────────────────

export const sentimentSnapshots = pgTable("sentiment_snapshots", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull(),
  overallScore: integer("overall_score").default(50).notNull(),
  bullishCount: integer("bullish_count").default(0).notNull(),
  neutralCount: integer("neutral_count").default(0).notNull(),
  bearishCount: integer("bearish_count").default(0).notNull(),
  topSentimentDrivers: text("top_sentiment_drivers"),
  perSpeakerSentiment: text("per_speaker_sentiment"), // JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SentimentSnapshot = typeof sentimentSnapshots.$inferSelect;
export type InsertSentimentSnapshot = typeof sentimentSnapshots.$inferInsert;

export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  contentType: varchar("content_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  editedContent: text("edited_content"),
  status: varchar("status", { length: 32 }).default("generated").notNull(),
  recipients: text("recipients"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: integer("generated_by"),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  sentAt: timestamp("sent_at"),
  sentTo: text("sent_to"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAiGeneratedContent = typeof aiGeneratedContent.$inferInsert;

export const occTranscriptionSegments = pgTable("occ_transcription_segments", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id").notNull(),
  speakerName: varchar("speaker_name", { length: 255 }),
  speakerRole: varchar("speaker_role", { length: 64 }),
  text: text("text"),
  startTime: integer("start_time"),
  endTime: integer("end_time"),
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const occLiveRollingSummaries = pgTable("occ_live_rolling_summaries", {
  id: serial("id").primaryKey(),
  conferenceId: varchar("conference_id", { length: 128 }).notNull(),
  summary: text("summary").notNull(),
  segmentCount: integer("segment_count").default(0).notNull(),
  fromTimeMs: integer("from_time_ms"),
  toTimeMs: integer("to_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaAutoTriageResults = pgTable("qa_auto_triage_results", {
  id: serial("id").primaryKey(),
  qaId: integer("qa_id").notNull(),
  conferenceId: integer("conference_id"),
  classification: varchar("classification", { length: 32 }).notNull(),
  confidence: real("confidence"),
  reason: text("reason"),
  isSensitive: smallint("is_sensitive").default(0).notNull(),
  sensitivityFlags: text("sensitivity_flags"),
  triageScore: real("triage_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const speakingPaceAnalysis = pgTable("speaking_pace_analysis", {
  id: serial("id").primaryKey(),
  conferenceId: varchar("conference_id", { length: 128 }).notNull(),
  segmentId: integer("segment_id"),
  speakerName: varchar("speaker_name", { length: 255 }),
  wordsPerMinute: real("words_per_minute"),
  fillerWordCount: integer("filler_word_count").default(0).notNull(),
  pauseCount: integer("pause_count").default(0).notNull(),
  coachingFeedback: text("coaching_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const toxicityFilterResults = pgTable("toxicity_filter_results", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  contentType: varchar("content_type", { length: 32 }).default("qa").notNull(),
  toxicityScore: real("toxicity_score").default(0),
  categories: text("categories"),
  flagged: smallint("flagged").default(0).notNull(),
  actionTaken: varchar("action_taken", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcriptEdits = pgTable("transcript_edits", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id"),
  segmentId: integer("segment_id").default(0),
  transcriptionSegmentId: integer("transcription_segment_id"),
  operatorId: integer("operator_id"),
  operatorName: varchar("operator_name", { length: 255 }),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  editType: varchar("edit_type", { length: 64 }).notNull(),
  reason: text("reason"),
  confidence: real("confidence"),
  approved: boolean("approved").default(false),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transcriptVersions = pgTable("transcript_versions", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id"),
  versionNumber: integer("version_number").notNull(),
  fullTranscript: text("full_transcript").notNull(),
  editCount: integer("edit_count").default(0),
  changeDescription: text("change_description"),
  createdBy: integer("created_by"),
  createdByName: varchar("created_by_name", { length: 255 }),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcriptEditAuditLog = pgTable("transcript_edit_audit_log", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id"),
  editId: integer("edit_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  userId: integer("actor_id"),
  userName: varchar("actor_name", { length: 255 }),
  userRole: varchar("user_role", { length: 64 }),
  details: text("details"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventBriefResults = pgTable("event_brief_results", {
  id: serial("id").primaryKey(),
  conferenceId: varchar("conference_id", { length: 128 }),
  eventId: integer("event_id"),
  briefType: varchar("brief_type", { length: 64 }).notNull(),
  content: text("content").notNull(),
  operatorApproved: smallint("operator_approved").default(0),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentEngagementEvents = pgTable("content_engagement_events", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  eventData: text("event_data"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const contentPerformanceMetrics = pgTable("content_performance_metrics", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  eventId: integer("event_id").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  approvalStatus: varchar("approval_status", { length: 64 }).notNull().default("pending"),
  approvalTime: integer("approval_time"),
  approvalScore: varchar("approval_score", { length: 16 }),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  responseCount: integer("response_count").default(0),
  openRate: varchar("open_rate", { length: 16 }).default("0"),
  clickThroughRate: varchar("click_through_rate", { length: 16 }).default("0"),
  responseRate: varchar("response_rate", { length: 16 }).default("0"),
  engagementScore: varchar("engagement_score", { length: 16 }).default("0"),
  qualityScore: varchar("quality_score", { length: 16 }),
  relevanceScore: varchar("relevance_score", { length: 16 }),
  professionalismScore: varchar("professionalism_score", { length: 16 }),
  editsCount: integer("edits_count").default(0),
  rejectionReason: varchar("rejection_reason", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentTypePerformance = pgTable("content_type_performance", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type", { length: 64 }).notNull(),
  totalGenerated: integer("total_generated").default(0),
  approvalRate: varchar("approval_rate", { length: 16 }).default("0"),
  avgOpenRate: varchar("avg_open_rate", { length: 16 }).default("0"),
  avgClickThroughRate: varchar("avg_click_through_rate", { length: 16 }).default("0"),
  performanceRank: integer("performance_rank").default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const eventPerformanceSummary = pgTable("event_performance_summary", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  contentItemsGenerated: integer("content_items_generated").default(0),
  contentItemsApproved: integer("content_items_approved").default(0),
  contentItemsRejected: integer("content_items_rejected").default(0),
  overallApprovalRate: varchar("overall_approval_rate", { length: 16 }).default("0"),
  avgTimeToApproval: integer("avg_time_to_approval"),
  totalContentSent: integer("total_content_sent").default(0),
  totalEngagements: integer("total_engagements").default(0),
  avgEngagementRate: varchar("avg_engagement_rate", { length: 16 }).default("0"),
  bestPerformingType: varchar("best_performing_type", { length: 50 }),
  bestPerformingScore: varchar("best_performing_score", { length: 16 }),
  worstPerformingType: varchar("worst_performing_type", { length: 50 }),
  worstPerformingScore: varchar("worst_performing_score", { length: 16 }),
  avgContentQuality: varchar("avg_content_quality", { length: 16 }),
  operatorSatisfaction: varchar("operator_satisfaction", { length: 16 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * report_key_moments — Key moments extracted from an event for the post-event report.
 */
export const reportKeyMoments = pgTable("report_key_moments", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  timestampSeconds: integer("timestamp_seconds").notNull(),
  momentType: varchar("moment_type", { length: 64 }).notNull(),
  content: text("content").notNull(),
  speaker: varchar("speaker", { length: 255 }),
  severity: varchar("severity", { length: 64 }).default("low"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ReportKeyMoment = typeof reportKeyMoments.$inferSelect;
export type InsertReportKeyMoment = typeof reportKeyMoments.$inferInsert;

/**
 * compliance_certificates — Regulatory compliance certificates generated for events.
 */
export const complianceCertificates = pgTable("compliance_certificates", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  certificateId: varchar("certificate_id", { length: 64 }).notNull().unique(),
  pdfUrl: text("pdf_url").notNull(),
  generatedBy: integer("generated_by"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  signedBy: integer("signed_by"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComplianceCertificate = typeof complianceCertificates.$inferSelect;
export type InsertComplianceCertificate = typeof complianceCertificates.$inferInsert;

/**
 * push_subscriptions — Browser push notification subscriptions for users.
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // null for anonymous attendees
  eventId: varchar("event_id", { length: 128 }),
  endpoint: text("endpoint").notNull(),
  p256dhKey: varchar("p256dh_key", { length: 255 }).notNull(),
  authKey: varchar("auth_key", { length: 255 }).notNull(),
  deviceType: varchar("device_type", { length: 64 }).default("mobile"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * white_label_clients — Enterprise clients with custom branded portals.
 */
export const whiteLabelClients = pgTable("white_label_clients", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#000000"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#ffffff"),
  accentColor: varchar("accent_color", { length: 7 }).default("#007bff"),
  customDomain: varchar("custom_domain", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactName: varchar("contact_name", { length: 255 }),
  billingTier: varchar("billing_tier", { length: 64 }).default("starter").notNull(),
  maxConcurrentEvents: integer("max_concurrent_events").default(1),
  maxMonthlyEvents: integer("max_monthly_events").default(5),
  featuresEnabled: text("features_enabled"), // JSON array of enabled feature keys
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WhiteLabelClient = typeof whiteLabelClients.$inferSelect;
export type InsertWhiteLabelClient = typeof whiteLabelClients.$inferInsert;

/**
 * client_event_assignments — Maps events to white-label client portals.
 */
export const clientEventAssignments = pgTable("client_event_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  eventId: integer("event_id").notNull(), // maps to events.id
  displayOrder: integer("display_order").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  customTitle: varchar("custom_title", { length: 255 }),
  customDescription: text("custom_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientEventAssignment = typeof clientEventAssignments.$inferSelect;
export type InsertClientEventAssignment = typeof clientEventAssignments.$inferInsert;

/**
 * social_media_accounts — OAuth-linked social platform accounts per user.
 */
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountHandle: varchar("account_handle", { length: 255 }),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  linkedEvents: text("linked_events"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = typeof socialMediaAccounts.$inferInsert;

/**
 * social_posts — AI-generated or manual posts tied to events.
 */
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id"),
  createdBy: integer("created_by").notNull(),
  content: text("content").notNull(),
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  echoSource: varchar("echo_source", { length: 64 }),
  contentType: varchar("content_type", { length: 64 }).default("text").notNull(),
  platforms: text("platforms").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  moderationStatus: varchar("moderation_status", { length: 64 }).default("pending").notNull(),
  moderationNotes: text("moderation_notes"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

/**
 * social_post_platforms — Per-platform publish status for each post.
 */
export const socialPostPlatforms = pgTable("social_post_platforms", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  accountId: integer("account_id").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  externalPostId: varchar("external_post_id", { length: 255 }),
  publishStatus: varchar("publish_status", { length: 64 }).default("pending").notNull(),
  publishedAt: timestamp("published_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SocialPostPlatform = typeof socialPostPlatforms.$inferSelect;
export type InsertSocialPostPlatform = typeof socialPostPlatforms.$inferInsert;

/**
 * social_metrics — Engagement metrics per post with event ROI correlation.
 */
export const socialMetrics = pgTable("social_metrics", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  accountId: integer("account_id").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  comments: integer("comments").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  engagementRate: real("engagement_rate").default(0).notNull(),
  roiCorrelation: real("roi_correlation").default(0).notNull(),
  aiInsight: text("ai_insight"),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

export type SocialMetric = typeof socialMetrics.$inferSelect;
export type InsertSocialMetric = typeof socialMetrics.$inferInsert;

/**
 * social_audit_log — Immutable compliance trail for all social actions.
 */
export const socialAuditLog = pgTable("social_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id"),
  action: varchar("action", { length: 64 }).notNull(),
  platform: varchar("platform", { length: 32 }),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SocialAuditLogEntry = typeof socialAuditLog.$inferSelect;
export type InsertSocialAuditLogEntry = typeof socialAuditLog.$inferInsert;

/**
 * webcast_enhancements — per-event configuration for Intelligent Broadcaster features.
 */
export const webcastEnhancements = pgTable("webcast_enhancements", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  personalizationEnabled: boolean("personalization_enabled").default(true).notNull(),
  xrEnabled: boolean("xr_enabled").default(false).notNull(),
  languageDubbingEnabled: boolean("language_dubbing_enabled").default(false).notNull(),
  dubbingLanguage: varchar("dubbing_language", { length: 32 }).default("en").notNull(),
  sustainabilityScore: real("sustainability_score").default(0).notNull(),
  adIntegrationEnabled: boolean("ad_integration_enabled").default(false).notNull(),
  adPreRollEnabled: boolean("ad_pre_roll_enabled").default(false).notNull(),
  adMidRollEnabled: boolean("ad_mid_roll_enabled").default(false).notNull(),
  noiseEnhancementEnabled: boolean("noise_enhancement_enabled").default(true).notNull(),
  noiseGateEnabled: boolean("noise_gate_enabled").default(true).notNull(),
  echoCancellationEnabled: boolean("echo_cancellation_enabled").default(true).notNull(),
  autoGainEnabled: boolean("auto_gain_enabled").default(false).notNull(),
  podcastGeneratedAt: timestamp("podcast_generated_at"),
  podcastTitle: varchar("podcast_title", { length: 512 }),
  podcastScript: text("podcast_script"),
  recapGeneratedAt: timestamp("recap_generated_at"),
  recapBrief: text("recap_brief"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WebcastEnhancement = typeof webcastEnhancements.$inferSelect;
export type InsertWebcastEnhancement = typeof webcastEnhancements.$inferInsert;

/**
 * webcast_analytics — expanded ROI and sustainability analytics per event.
 */
export const webcastAnalyticsExpanded = pgTable("webcast_analytics_expanded", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  viewerEngagement: real("viewer_engagement").default(0).notNull(),
  roiUplift: real("roi_uplift").default(0).notNull(),
  carbonFootprintKg: real("carbon_footprint_kg").default(0).notNull(),
  carbonSavedKg: real("carbon_saved_kg").default(0).notNull(),
  attendeesTravelAvoided: integer("attendees_travel_avoided").default(0).notNull(),
  adRevenue: real("ad_revenue").default(0).notNull(),
  podcastListens: integer("podcast_listens").default(0).notNull(),
  recapViews: integer("recap_views").default(0).notNull(),
  sustainabilityGrade: varchar("sustainability_grade", { length: 4 }).default("B").notNull(),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

export type WebcastAnalyticsExpanded = typeof webcastAnalyticsExpanded.$inferSelect;
export type InsertWebcastAnalyticsExpanded = typeof webcastAnalyticsExpanded.$inferInsert;

export const interconnectionActivations = pgTable("interconnection_activations", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  userId: integer("user_id").default(0).notNull(),
  featureId: varchar("feature_id", { length: 64 }).notNull(),
  connectedFeatureId: varchar("connected_feature_id", { length: 64 }).notNull(),
  activationSource: varchar("activation_source", { length: 32 }).default("manual").notNull(),
  roiMultiplier: real("roi_multiplier").default(1.0).notNull(),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
});

export type InterconnectionActivation = typeof interconnectionActivations.$inferSelect;
export type InsertInterconnectionActivation = typeof interconnectionActivations.$inferInsert;

export const interconnectionAnalytics = pgTable("interconnection_analytics", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 16 }).notNull(),
  totalActivations: integer("total_activations").default(0).notNull(),
  uniqueFeatures: integer("unique_features").default(0).notNull(),
  avgConnectionsPerUser: real("avg_connections_per_user").default(0).notNull(),
  topFeatureId: varchar("top_feature_id", { length: 64 }),
  roiRealized: real("roi_realized").default(0).notNull(),
  workflowCompletionRate: real("workflow_completion_rate").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InterconnectionAnalyticsRow = typeof interconnectionAnalytics.$inferSelect;
export type InsertInterconnectionAnalytics = typeof interconnectionAnalytics.$inferInsert;

export const virtualStudios = pgTable("virtual_studios", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  bundleId: varchar("bundle_id", { length: 8 }).notNull(),
  studioName: varchar("studio_name", { length: 255 }).default("My Virtual Studio").notNull(),
  avatarStyle: varchar("avatar_style", { length: 32 }).default("professional").notNull(),
  primaryLanguage: varchar("primary_language", { length: 8 }).default("en").notNull(),
  dubbingLanguages: text("dubbing_languages"),
  esgEnabled: boolean("esg_enabled").default(false).notNull(),
  replayEnabled: boolean("replay_enabled").default(true).notNull(),
  overlaysConfig: text("overlays_config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VirtualStudio = typeof virtualStudios.$inferSelect;
export type InsertVirtualStudio = typeof virtualStudios.$inferInsert;

export const esgStudioFlags = pgTable("esg_studio_flags", {
  id: serial("id").primaryKey(),
  studioId: integer("studio_id").notNull(),
  flagType: varchar("flag_type", { length: 64 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 16 }).default("medium").notNull(),
  contentSnippet: text("content_snippet"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EsgStudioFlag = typeof esgStudioFlags.$inferSelect;
export type InsertEsgStudioFlag = typeof esgStudioFlags.$inferInsert;

export const studioInterconnections = pgTable("studio_interconnections", {
  id: serial("id").primaryKey(),
  studioId: integer("studio_id").notNull(),
  featureId: varchar("feature_id", { length: 64 }).notNull(),
  connectedFeatureId: varchar("connected_feature_id", { length: 64 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  activeAt: timestamp("active_at").defaultNow().notNull(),
});

export type StudioInterconnection = typeof studioInterconnections.$inferSelect;
export type InsertStudioInterconnection = typeof studioInterconnections.$inferInsert;

export const operatorLinkAnalytics = pgTable("operator_link_analytics", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id"),
  linkPath: varchar("link_path", { length: 255 }).notNull(),
  linkTitle: varchar("link_title", { length: 255 }),
  category: varchar("category", { length: 64 }),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id", { length: 128 }),
});

export type OperatorLinkAnalytic = typeof operatorLinkAnalytics.$inferSelect;
export type InsertOperatorLinkAnalytic = typeof operatorLinkAnalytics.$inferInsert;

export const operatorLinksMetadata = pgTable("operator_links_metadata", {
  id: serial("id").primaryKey(),
  linkPath: varchar("link_path", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  badgeType: varchar("badge_type", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OperatorLinksMetadatum = typeof operatorLinksMetadata.$inferSelect;
export type InsertOperatorLinksMetadatum = typeof operatorLinksMetadata.$inferInsert;

export const agenticAnalyses = pgTable("agentic_analyses", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 128 }),
  q1Role: varchar("q1_role", { length: 64 }).notNull(),
  q2Challenge: varchar("q2_challenge", { length: 64 }).notNull(),
  q3EventType: varchar("q3_event_type", { length: 64 }).notNull(),
  primaryBundle: varchar("primary_bundle", { length: 64 }).notNull(),
  bundleLetter: varchar("bundle_letter", { length: 4 }).notNull(),
  score: real("score").notNull(),
  aiAction: text("ai_action"),
  roiPreview: varchar("roi_preview", { length: 255 }),
  interconnections: text("interconnections"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgenticAnalysis = typeof agenticAnalyses.$inferSelect;
export type InsertAgenticAnalysis = typeof agenticAnalyses.$inferInsert;

export const autonomousInterventions = pgTable("autonomous_interventions", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  conferenceId: varchar("conference_id", { length: 128 }),
  ruleId: varchar("rule_id", { length: 64 }).notNull(),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  triggerValue: real("trigger_value"),
  threshold: real("threshold"),
  severity: varchar("severity", { length: 64 }).default("warning").notNull(),
  bundleTriggered: varchar("bundle_triggered", { length: 64 }),
  actionTaken: text("action_taken").notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AutonomousIntervention = typeof autonomousInterventions.$inferSelect;
export type InsertAutonomousIntervention = typeof autonomousInterventions.$inferInsert;

export const taggedMetrics = pgTable("tagged_metrics", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }),
  tagType: varchar("tag_type", { length: 64 }).notNull(),
  metricValue: real("metric_value").notNull(),
  label: varchar("label", { length: 255 }),
  detail: text("detail"),
  bundle: varchar("bundle", { length: 64 }),
  severity: varchar("severity", { length: 64 }).default("neutral").notNull(),
  source: varchar("source", { length: 64 }).default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaggedMetric = typeof taggedMetrics.$inferSelect;
export type InsertTaggedMetric = typeof taggedMetrics.$inferInsert;

export const shadowSessions = pgTable("shadow_sessions", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  platform: varchar("platform", { length: 64 }).default("zoom").notNull(),
  meetingUrl: varchar("meeting_url", { length: 1000 }).notNull(),
  recallBotId: varchar("recall_bot_id", { length: 255 }),
  ablyChannel: varchar("ably_channel", { length: 255 }),
  localTranscriptJson: text("local_transcript_json"),
  localRecordingPath: varchar("local_recording_path", { length: 1000 }),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  transcriptSegments: integer("transcript_segments").default(0),
  sentimentAvg: real("sentiment_avg"),
  complianceFlags: integer("compliance_flags").default(0),
  taggedMetricsGenerated: integer("tagged_metrics_generated").default(0),
  notes: text("notes"),
  startedAt: bigint("started_at", { mode: "number" }),
  endedAt: bigint("ended_at", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ShadowSession = typeof shadowSessions.$inferSelect;
export type InsertShadowSession = typeof shadowSessions.$inferInsert;

export const operatorActions = pgTable("operator_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  archiveId: integer("archive_id"),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  detail: text("detail"),
  operatorId: integer("operator_id"),
  operatorName: varchar("operator_name", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OperatorAction = typeof operatorActions.$inferSelect;

// ─── Operator Corrections (Self-Improving AI Loop) ───────────────────────────
export const operatorCorrections = pgTable("operator_corrections", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }),
  metricId: integer("metric_id"),
  correctionType: varchar("correction_type", { length: 64 }).notNull(),
  originalValue: real("original_value"),
  correctedValue: real("corrected_value"),
  originalLabel: varchar("original_label", { length: 255 }),
  correctedLabel: varchar("corrected_label", { length: 255 }),
  reason: text("reason"),
  eventType: varchar("event_type", { length: 64 }),
  clientName: varchar("client_name", { length: 255 }),
  operatorId: varchar("operator_id", { length: 255 }).default("operator"),
  appliedToModel: smallint("applied_to_model").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type OperatorCorrection = typeof operatorCorrections.$inferSelect;
export type InsertOperatorCorrection = typeof operatorCorrections.$inferInsert;

export const adaptiveThresholds = pgTable("adaptive_thresholds", {
  id: serial("id").primaryKey(),
  thresholdKey: varchar("threshold_key", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }),
  sector: varchar("sector", { length: 64 }),
  metricType: varchar("metric_type", { length: 64 }).notNull(),
  defaultValue: real("default_value").notNull(),
  learnedValue: real("learned_value").notNull(),
  sampleCount: integer("sample_count").default(0),
  lastCorrectionAt: timestamp("last_correction_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdaptiveThreshold = typeof adaptiveThresholds.$inferSelect;

export const complianceVocabulary = pgTable("compliance_vocabulary", {
  id: serial("id").primaryKey(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  source: varchar("source", { length: 64 }).default("system").notNull(),
  severityWeight: real("severity_weight").default(1.0),
  timesFlagged: integer("times_flagged").default(0),
  timesDismissed: integer("times_dismissed").default(0),
  effectiveWeight: real("effective_weight").default(1.0),
  sector: varchar("sector", { length: 64 }),
  addedBy: varchar("added_by", { length: 255 }).default("system"),
  active: smallint("active").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ComplianceKeyword = typeof complianceVocabulary.$inferSelect;

// ─── User Feedback ────────────────────────────────────────────────────────────
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  rating: integer("rating").notNull(),
  suggestion: text("suggestion"),
  email: varchar("email", { length: 255 }),
  userId: integer("user_id"),
  pageUrl: varchar("page_url", { length: 1000 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// ─── AI-AM Compliance Audit Trail ─────────────────────────────────────────────
// Separate table used by aiAmAuditTrail.ts (different schema from complianceAuditLog)
export const aiAmAuditLog = pgTable("ai_am_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  eventId: varchar("event_id", { length: 128 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  actionBy: varchar("action_by", { length: 128 }).notNull(),
  actionByRole: varchar("action_by_role", { length: 64 }),
  targetViolationId: varchar("target_violation_id", { length: 128 }),
  targetSpeaker: varchar("target_speaker", { length: 255 }),
  details: text("details"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 512 }),
  hash: varchar("hash", { length: 64 }).notNull(),
  previousHash: varchar("previous_hash", { length: 64 }),
});
export type AiAmAuditLog = typeof aiAmAuditLog.$inferSelect;
export type InsertAiAmAuditLog = typeof aiAmAuditLog.$inferInsert;

// ─── Compliance Violations ────────────────────────────────────────────────────
// Used by compliance.ts, aiAmAuditTrail.ts, aiAmAutoMuting.ts, and test files
export const complianceViolations = pgTable("compliance_violations", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  violationId: varchar("violation_id", { length: 128 }),
  conferenceId: integer("conference_id"),
  violationType: varchar("violation_type", { length: 128 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  confidence: real("confidence"),
  confidenceScore: real("confidence_score"),
  speaker: varchar("speaker", { length: 255 }),
  speakerName: varchar("speaker_name", { length: 255 }),
  speakerRole: varchar("speaker_role", { length: 128 }),
  transcript: text("transcript"),
  transcriptExcerpt: text("transcript_excerpt"),
  startTimeMs: integer("start_time_ms"),
  endTimeMs: integer("end_time_ms"),
  acknowledged: smallint("acknowledged").default(0),
  acknowledgedAt: timestamp("acknowledged_at"),
  actionTaken: varchar("action_taken", { length: 64 }).default("none"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ComplianceViolation = typeof complianceViolations.$inferSelect;
export type InsertComplianceViolation = typeof complianceViolations.$inferInsert;

// ─── Alert Preferences ────────────────────────────────────────────────────────
// Used by aiAmNotificationDispatch.ts and test files
export const alertPreferences = pgTable("alert_preferences", {
  id: serial("id").primaryKey(),
  operatorId: varchar("operator_id", { length: 128 }).notNull().unique(),
  eventId: varchar("event_id", { length: 128 }),
  emailNotificationsEnabled: smallint("email_notifications_enabled").default(1),
  smsNotificationsEnabled: smallint("sms_notifications_enabled").default(0),
  inAppNotificationsEnabled: smallint("in_app_notifications_enabled").default(1),
  emailAddress: varchar("email_address", { length: 320 }),
  phoneNumber: varchar("phone_number", { length: 32 }),
  criticalOnly: smallint("critical_only").default(0),
  quietHoursEnabled: smallint("quiet_hours_enabled").default(0),
  quietHoursStart: varchar("quiet_hours_start", { length: 8 }).default("22:00"),
  quietHoursEnd: varchar("quiet_hours_end", { length: 8 }).default("08:00"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  monitoredViolationTypes: text("monitored_violation_types"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = typeof alertPreferences.$inferInsert;

// ─── Alert History ────────────────────────────────────────────────────────────
// Used by aiAmNotificationDispatch.ts and compliance.ts
export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  operatorId: varchar("operator_id", { length: 128 }),
  eventId: varchar("event_id", { length: 128 }),
  violationId: varchar("violation_id", { length: 128 }),
  channel: varchar("channel", { length: 32 }),
  status: varchar("status", { length: 32 }),
  action: varchar("action", { length: 64 }),
  actorId: varchar("actor_id", { length: 128 }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// Post-Event Data — stores summaries, transcripts, analytics, and reports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Post-Event Data — stores AI summaries, compliance reports, and analytics for completed events.
 */
export const postEventData = pgTable("post_event_data", {
  id: serial("id").primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  conferenceId: integer("conferenceId"), // references occConferences.id if applicable
  // AI Summary
  aiSummary: text("aiSummary"), // LLM-generated executive summary
  keyTopics: text("keyTopics"), // JSON array of extracted topics
  sentimentTrends: text("sentimentTrends"), // JSON object with sentiment timeline
  keyQuotes: text("keyQuotes"), // JSON array of important quotes with timestamps
  // Transcription
  fullTranscript: text("fullTranscript"), // complete word-for-word transcript
  transcriptFormat: varchar("transcriptFormat", { length: 32 }).default("txt"), // txt, pdf, vtt, srt, json
  // Recording
  recordingUrl: varchar("recordingUrl", { length: 512 }), // S3 URL to recording
  recordingKey: varchar("recordingKey", { length: 512 }), // S3 key for retrieval
  recordingDurationSeconds: integer("recordingDurationSeconds"),
  // Compliance
  complianceScore: integer("complianceScore"), // 0-100 score
  flaggedItems: text("flaggedItems"), // JSON array of compliance violations
  // Analytics
  totalParticipants: integer("totalParticipants"),
  totalDuration: integer("totalDuration"), // seconds
  engagementScore: integer("engagementScore"), // 0-100 score
  analyticsData: text("analyticsData"), // JSON object with detailed metrics
  // Delivery Status
  deliveryStatus: varchar("deliveryStatus", { length: 64 }).default("pending").notNull(),
  deliveredAt: timestamp("deliveredAt"),
  // Timestamps
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PostEventData = typeof postEventData.$inferSelect;
export type InsertPostEventData = typeof postEventData.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Integration — payment processing for premium features
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stripe Customers — links users to their Stripe customer records.
 */
export const stripeCustomers = pgTable("stripe_customers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(), // references users.id
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }).notNull().unique(), // Stripe customer ID
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

/**
 * Stripe Subscriptions — tracks active subscriptions for premium features.
 */
export const stripeSubscriptions = pgTable("stripe_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // references users.id
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).notNull().unique(),
  stripePriceId: varchar("stripePriceId", { length: 128 }).notNull(),
  status: varchar("status", { length: 64 }).default("active").notNull(),
  tier: varchar("tier", { length: 64 }).default("basic").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

/**
 * Premium Features — tracks which features are enabled for each user based on subscription.
 */
export const premiumFeatures = pgTable("premium_features", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(), // references users.id
  // Feature flags
  advancedAnalytics: boolean("advancedAnalytics").default(false).notNull(),
  complianceReporting: boolean("complianceReporting").default(false).notNull(),
  whiteLabel: boolean("whiteLabel").default(false).notNull(),
  multiLanguageTranscription: boolean("multiLanguageTranscription").default(false).notNull(),
  customBranding: boolean("customBranding").default(false).notNull(),
  apiAccess: boolean("apiAccess").default(false).notNull(),
  // Limits
  maxEventsPerMonth: integer("maxEventsPerMonth").default(5),
  maxParticipantsPerEvent: integer("maxParticipantsPerEvent").default(500),
  storageGbPerMonth: integer("storageGbPerMonth").default(10),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PremiumFeature = typeof premiumFeatures.$inferSelect;
export type InsertPremiumFeature = typeof premiumFeatures.$inferInsert;

/**
 * Stripe Payment Events — audit log for all Stripe webhook events.
 */
export const stripePaymentEvents = pgTable("stripe_payment_events", {
  id: serial("id").primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 128 }).notNull().unique(),
  eventType: varchar("eventType", { length: 128 }).notNull(), // e.g. "payment_intent.succeeded"
  userId: integer("userId"), // references users.id if applicable
  data: text("data").notNull(), // JSON payload
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StripePaymentEvent = typeof stripePaymentEvents.$inferSelect;
export type InsertStripePaymentEvent = typeof stripePaymentEvents.$inferInsert;

// ─── Mailing Lists (from Replit sync) ────────────────────────────────────────
export const mailingLists = pgTable("mailing_lists", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).default("draft").notNull(),
  totalEntries: integer("total_entries").default(0).notNull(),
  processedEntries: integer("processed_entries").default(0).notNull(),
  emailedEntries: integer("emailed_entries").default(0).notNull(),
  registeredEntries: integer("registered_entries").default(0).notNull(),
  webhookUrl: varchar("webhook_url", { length: 512 }),
  defaultJoinMethod: varchar("default_join_method", { length: 64 }),
  preRegistered: boolean("pre_registered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type MailingList = typeof mailingLists.$inferSelect;
export type InsertMailingList = typeof mailingLists.$inferInsert;

export const mailingListEntries = pgTable("mailing_list_entries", {
  id: serial("id").primaryKey(),
  mailingListId: integer("mailing_list_id").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  accessPin: varchar("access_pin", { length: 8 }),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  joinMethod: varchar("join_method", { length: 64 }),
  registrationId: integer("registration_id"),
  confirmToken: varchar("confirm_token", { length: 64 }),
  emailSentAt: timestamp("email_sent_at"),
  clickedAt: timestamp("clicked_at"),
  registeredAt: timestamp("registered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MailingListEntry = typeof mailingListEntries.$inferSelect;
export type InsertMailingListEntry = typeof mailingListEntries.$inferInsert;

// ─── CRM API Keys (from Replit sync) ─────────────────────────────────────────
export const crmApiKeys = pgTable("crm_api_keys", {
  id: serial("id").primaryKey(),
  keyHash: varchar("key_hash", { length: 128 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  eventId: varchar("event_id", { length: 128 }),
  permissions: json("permissions").notNull(),
  active: boolean("active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CrmApiKey = typeof crmApiKeys.$inferSelect;

// ─── SOC 2 Controls ──────────────────────────────────────────────────────────
export const soc2Controls = pgTable("soc2_controls", {
  id: serial("id").primaryKey(),
  controlId: varchar("control_id", { length: 20 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 64 }).notNull().default("non_compliant"),
  ownerName: varchar("owner_name", { length: 100 }),
  notes: text("notes"),
  testingFrequency: varchar("testing_frequency", { length: 50 }),
  lastTestedAt: timestamp("last_tested_at"),
  evidenceUrls: json("evidence_urls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Soc2Control = typeof soc2Controls.$inferSelect;

// ─── ISO 27001 Controls ───────────────────────────────────────────────────────
export const iso27001Controls = pgTable("iso27001_controls", {
  id: serial("id").primaryKey(),
  controlId: varchar("control_id", { length: 20 }).notNull(),
  clause: varchar("clause", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 64 }).notNull().default("non_compliant"),
  ownerName: varchar("owner_name", { length: 100 }),
  notes: text("notes"),
  testingFrequency: varchar("testing_frequency", { length: 50 }),
  lastTestedAt: timestamp("last_tested_at"),
  evidenceUrls: json("evidence_urls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Iso27001Control = typeof iso27001Controls.$inferSelect;

// ─── Compliance Evidence Files ────────────────────────────────────────────────
export const complianceEvidenceFiles = pgTable("compliance_evidence_files", {
  id: serial("id").primaryKey(),
  controlType: varchar("control_type", { length: 64 }).notNull(),
  controlId: integer("control_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: integer("uploaded_by"),
  uploadedAt: bigint("uploaded_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }),
});
export type ComplianceEvidenceFile = typeof complianceEvidenceFiles.$inferSelect;

// ─── AI Compliance Engine — Threat Detection ──────────────────────────────────
export const complianceThreats = pgTable("compliance_threats", {
  id: serial("id").primaryKey(),
  threatType: varchar("threat_type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 64 }).notNull().default("medium"),
  status: varchar("status", { length: 64 }).notNull().default("detected"),
  eventId: varchar("event_id", { length: 128 }),
  sourceSystem: varchar("source_system", { length: 64 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  evidence: json("evidence"),
  affectedEntities: json("affected_entities"),
  aiConfidence: real("ai_confidence").default(0),
  aiReasoning: text("ai_reasoning"),
  remediationAction: varchar("remediation_action", { length: 255 }),
  remediationTakenAt: timestamp("remediation_taken_at"),
  detectedBy: varchar("detected_by", { length: 64 }).notNull().default("compliance_engine"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ComplianceThreat = typeof complianceThreats.$inferSelect;

export const complianceFrameworkChecks = pgTable("compliance_framework_checks", {
  id: serial("id").primaryKey(),
  framework: varchar("framework", { length: 64 }).notNull(),
  controlRef: varchar("control_ref", { length: 20 }).notNull(),
  controlName: varchar("control_name", { length: 255 }).notNull(),
  checkType: varchar("check_type", { length: 64 }).notNull().default("automated"),
  status: varchar("status", { length: 64 }).notNull().default("not_assessed"),
  lastCheckedAt: timestamp("last_checked_at"),
  details: text("details"),
  evidence: json("evidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ComplianceFrameworkCheck = typeof complianceFrameworkChecks.$inferSelect;

export const sustainabilityReports = pgTable("sustainability_reports", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  eventTitle: varchar("event_title", { length: 512 }).default(""),
  totalAttendees: integer("total_attendees").default(0).notNull(),
  durationHours: real("duration_hours").default(1).notNull(),
  isVirtual: boolean("is_virtual").default(true),
  physicalCo2Tonnes: real("physical_co2_tonnes").default(0).notNull(),
  virtualCo2Tonnes: real("virtual_co2_tonnes").default(0).notNull(),
  carbonSavedTonnes: real("carbon_saved_tonnes").default(0).notNull(),
  savingsPercent: real("savings_percent").default(0).notNull(),
  totalCostAvoidedUsd: real("total_cost_avoided_usd").default(0).notNull(),
  grade: varchar("grade", { length: 4 }).default("B").notNull(),
  breakdownJson: json("breakdown_json"),
  country: varchar("country", { length: 8 }).default("ZA"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SustainabilityReport = typeof sustainabilityReports.$inferSelect;

export const broadcastSessions = pgTable("broadcast_sessions", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  presenterName: varchar("presenter_name", { length: 256 }),
  avgWpm: real("avg_wpm").default(0),
  optimalWpmMin: integer("optimal_wpm_min").default(130),
  optimalWpmMax: integer("optimal_wpm_max").default(160),
  paceAlerts: integer("pace_alerts").default(0),
  fillerWordCount: integer("filler_word_count").default(0),
  keyMomentsJson: json("key_moments_json"),
  recapJson: json("recap_json"),
  recapGeneratedAt: timestamp("recap_generated_at"),
  durationSeconds: integer("duration_seconds").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type BroadcastSession = typeof broadcastSessions.$inferSelect;

export const studioSessions = pgTable("studio_sessions", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  activeLayout: varchar("active_layout", { length: 64 }).default("single-presenter"),
  feedSources: json("feed_sources"),
  lowerThirds: json("lower_thirds"),
  activeOverlays: json("active_overlays"),
  liveSentimentOverlay: boolean("live_sentiment_overlay").default(false),
  participantCountOverlay: boolean("participant_count_overlay").default(false),
  recordingStatus: varchar("recording_status", { length: 32 }).default("idle"),
  streamKey: varchar("stream_key", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type StudioSession = typeof studioSessions.$inferSelect;

export const archiveEvents = pgTable("archive_events", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  eventDate: varchar("event_date", { length: 32 }),
  platform: varchar("platform", { length: 64 }),
  transcriptText: text("transcript_text").notNull(),
  wordCount: integer("word_count").default(0),
  segmentCount: integer("segment_count").default(0),
  sentimentAvg: real("sentiment_avg"),
  complianceFlags: integer("compliance_flags").default(0),
  taggedMetricsGenerated: integer("tagged_metrics_generated").default(0),
  status: varchar("status", { length: 64 }).default("processing").notNull(),
  notes: text("notes"),
  aiReport: json("ai_report"),
  specialisedAnalysis: json("specialised_analysis"),
  specialisedAlgorithmsRun: integer("specialised_algorithms_run").default(0),
  specialisedSessionId: integer("specialised_session_id"),
  specialisedSessionType: varchar("specialised_session_type", { length: 32 }),
  recordingPath: varchar("recording_path", { length: 1000 }),
  transcriptFingerprint: varchar("transcript_fingerprint", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ArchiveEvent = typeof archiveEvents.$inferSelect;
export type InsertArchiveEvent = typeof archiveEvents.$inferInsert;

export const aiEvolutionObservations = pgTable("ai_evolution_observations", {
  id: serial("id").primaryKey(),
  sourceType: varchar("source_type", { length: 64 }).notNull(),
  sourceId: integer("source_id"),
  eventType: varchar("event_type", { length: 64 }),
  clientName: varchar("client_name", { length: 255 }),
  observationType: varchar("observation_type", { length: 64 }).notNull(),
  moduleName: varchar("module_name", { length: 128 }),
  observation: text("observation").notNull(),
  confidence: real("confidence").default(0.5),
  suggestedCapability: varchar("suggested_capability", { length: 255 }),
  rawContext: json("raw_context"),
  clusterId: integer("cluster_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiEvolutionObservation = typeof aiEvolutionObservations.$inferSelect;

export const aiToolProposals = pgTable("ai_tool_proposals", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  rationale: text("rationale").notNull(),
  evidenceCount: integer("evidence_count").default(0),
  avgConfidence: real("avg_confidence").default(0),
  observationIds: json("observation_ids"),
  status: varchar("status", { length: 64 }).default("emerging").notNull(),
  estimatedImpact: varchar("estimated_impact", { length: 64 }).default("medium"),
  promptTemplate: text("prompt_template"),
  moduleSpec: json("module_spec"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiToolProposal = typeof aiToolProposals.$inferSelect;

export const conferenceDialouts = pgTable("conference_dialouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  conferenceName: varchar("conference_name", { length: 128 }).notNull(),
  callerId: varchar("caller_id", { length: 32 }).notNull(),
  totalParticipants: integer("total_participants").notNull().default(0),
  connectedCount: integer("connected_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  endedAt: bigint("ended_at", { mode: "number" }),
});
export type ConferenceDialout = typeof conferenceDialouts.$inferSelect;

export const conferenceDialoutParticipants = pgTable("conference_dialout_participants", {
  id: serial("id").primaryKey(),
  dialoutId: integer("dialout_id").notNull(),
  phoneNumber: varchar("phone_number", { length: 32 }).notNull(),
  label: varchar("label", { length: 255 }),
  callSid: varchar("call_sid", { length: 128 }),
  status: varchar("status", { length: 64 }).default("queued").notNull(),
  durationSecs: integer("duration_secs"),
  answeredAt: bigint("answered_at", { mode: "number" }),
  endedAt: bigint("ended_at", { mode: "number" }),
  errorMessage: varchar("error_message", { length: 512 }),
});
export type ConferenceDialoutParticipant = typeof conferenceDialoutParticipants.$inferSelect;

export const agmResolutions = pgTable("agm_resolutions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  resolutionNumber: integer("resolution_number").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  category: varchar("category", { length: 64 }).default("ordinary").notNull(),
  proposedBy: varchar("proposed_by", { length: 255 }),
  sentimentDuringDebate: real("sentiment_during_debate"),
  predictedApprovalPct: real("predicted_approval_pct"),
  actualApprovalPct: real("actual_approval_pct"),
  predictionAccuracy: real("prediction_accuracy"),
  dissenterCount: integer("dissenter_count").default(0),
  complianceFlags: json("compliance_flags"),
  aiAnalysis: json("ai_analysis"),
  status: varchar("status", { length: 64 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type AgmResolution = typeof agmResolutions.$inferSelect;

export const agmIntelligenceSessions = pgTable("agm_intelligence_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  shadowSessionId: integer("shadow_session_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  agmTitle: varchar("agm_title", { length: 512 }).notNull(),
  agmDate: varchar("agm_date", { length: 32 }),
  jurisdiction: varchar("jurisdiction", { length: 64 }).default("south_africa").notNull(),
  totalResolutions: integer("total_resolutions").default(0),
  resolutionsCarried: integer("resolutions_carried").default(0),
  resolutionsDefeated: integer("resolutions_defeated").default(0),
  quorumMet: boolean("quorum_met").default(false),
  quorumPercentage: real("quorum_percentage"),
  attendanceCount: integer("attendance_count").default(0),
  proxyCount: integer("proxy_count").default(0),
  overallSentiment: real("overall_sentiment"),
  governanceScore: real("governance_score"),
  dissentIndex: real("dissent_index"),
  regulatoryAlerts: integer("regulatory_alerts").default(0),
  qaQuestionsTotal: integer("qa_questions_total").default(0),
  qaQuestionsGovernance: integer("qa_questions_governance").default(0),
  aiGovernanceReport: json("ai_governance_report"),
  evolutionObservationsGenerated: integer("evolution_observations_generated").default(0),
  status: varchar("status", { length: 64 }).default("setup").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type AgmIntelligenceSession = typeof agmIntelligenceSessions.$inferSelect;

export const agmDissentPatterns = pgTable("agm_dissent_patterns", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  patternType: varchar("pattern_type", { length: 64 }).notNull(),
  category: varchar("category", { length: 128 }),
  description: text("description").notNull(),
  frequency: integer("frequency").default(1),
  confidence: real("confidence").default(0.5),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  sessionIds: json("session_ids"),
  evidenceData: json("evidence_data"),
  actionRecommendation: text("action_recommendation"),
  decayedScore: real("decayed_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type AgmDissentPattern = typeof agmDissentPatterns.$inferSelect;

export const agmGovernanceObservations = pgTable("agm_governance_observations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  algorithmSource: varchar("algorithm_source", { length: 64 }).notNull(),
  observationType: varchar("observation_type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 64 }).default("info").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  detail: text("detail").notNull(),
  confidence: real("confidence").default(0.5),
  relatedResolutionId: integer("related_resolution_id"),
  rawData: json("raw_data"),
  fedToEvolution: boolean("fed_to_evolution").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AgmGovernanceObservation = typeof agmGovernanceObservations.$inferSelect;

export const lumiBookings = pgTable("lumi_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  agmTitle: varchar("agm_title", { length: 512 }).notNull(),
  agmDate: varchar("agm_date", { length: 32 }),
  agmTime: varchar("agm_time", { length: 16 }),
  jurisdiction: varchar("jurisdiction", { length: 64 }).default("south_africa").notNull(),
  expectedAttendees: integer("expected_attendees"),
  meetingUrl: varchar("meeting_url", { length: 1000 }),
  platform: varchar("platform", { length: 64 }).default("zoom").notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  lumiReference: varchar("lumi_reference", { length: 128 }),
  lumiRecipients: text("lumi_recipients"),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  dashboardToken: varchar("dashboard_token", { length: 64 }).notNull(),
  status: varchar("status", { length: 64 }).default("booked").notNull(),
  checklist: json("checklist"),
  shadowSessionId: integer("shadow_session_id"),
  agmSessionId: integer("agm_session_id"),
  notes: text("notes"),
  resolutionsJson: json("resolutions_json"),
  reportDelivered: boolean("report_delivered").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type LumiBooking = typeof lumiBookings.$inferSelect;

// ─── Bastion Capital Partners — Investor Intelligence Tables ─────────────────

export const bastionIntelligenceSessions = pgTable("bastion_intelligence_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  shadowSessionId: integer("shadow_session_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 512 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).default("earnings_call").notNull(),
  eventDate: varchar("event_date", { length: 32 }),
  sector: varchar("sector", { length: 128 }),
  ticker: varchar("ticker", { length: 32 }),
  overallSentiment: real("overall_sentiment"),
  managementToneScore: real("management_tone_score"),
  credibilityScore: real("credibility_score"),
  marketMovingStatements: integer("market_moving_statements").default(0),
  forwardGuidanceCount: integer("forward_guidance_count").default(0),
  analystQuestionsTotal: integer("analyst_questions_total").default(0),
  analystQuestionsHostile: integer("analyst_questions_hostile").default(0),
  investmentBrief: json("investment_brief"),
  evolutionObservationsGenerated: integer("evolution_observations_generated").default(0),
  status: varchar("status", { length: 64 }).default("setup").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type BastionIntelligenceSession = typeof bastionIntelligenceSessions.$inferSelect;

export const bastionInvestorObservations = pgTable("bastion_investor_observations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  algorithmSource: varchar("algorithm_source", { length: 64 }).notNull(),
  observationType: varchar("observation_type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 64 }).default("info").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  detail: text("detail").notNull(),
  confidence: real("confidence").default(0.5),
  rawData: json("raw_data"),
  fedToEvolution: boolean("fed_to_evolution").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BastionInvestorObservation = typeof bastionInvestorObservations.$inferSelect;

export const bastionGuidanceTracker = pgTable("bastion_guidance_tracker", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  ticker: varchar("ticker", { length: 32 }),
  sessionId: integer("session_id").notNull(),
  guidanceType: varchar("guidance_type", { length: 64 }).notNull(),
  statement: text("statement").notNull(),
  confidenceLevel: varchar("confidence_level", { length: 64 }).default("tentative").notNull(),
  numericValue: varchar("numeric_value", { length: 128 }),
  timeframe: varchar("timeframe", { length: 64 }),
  priorGuidanceId: integer("prior_guidance_id"),
  priorValue: varchar("prior_value", { length: 128 }),
  delta: varchar("delta", { length: 64 }),
  metOrMissed: varchar("met_or_missed", { length: 64 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BastionGuidanceEntry = typeof bastionGuidanceTracker.$inferSelect;

export const bastionBookings = pgTable("bastion_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 512 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).default("earnings_call").notNull(),
  eventDate: varchar("event_date", { length: 32 }),
  eventTime: varchar("event_time", { length: 16 }),
  sector: varchar("sector", { length: 128 }),
  ticker: varchar("ticker", { length: 32 }),
  expectedAttendees: integer("expected_attendees"),
  meetingUrl: varchar("meeting_url", { length: 1000 }),
  platform: varchar("platform", { length: 64 }).default("zoom").notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  bastionReference: varchar("bastion_reference", { length: 128 }),
  confirmationRecipients: text("confirmation_recipients"),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  dashboardToken: varchar("dashboard_token", { length: 64 }).notNull(),
  status: varchar("status", { length: 64 }).default("booked").notNull(),
  checklist: json("checklist"),
  shadowSessionId: integer("shadow_session_id"),
  bastionSessionId: integer("bastion_session_id"),
  notes: text("notes"),
  reportDelivered: boolean("report_delivered").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type BastionBooking = typeof bastionBookings.$inferSelect;

export const disclosureCertificates = pgTable("disclosure_certificates", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  sessionId: integer("session_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  transcriptHash: varchar("transcript_hash", { length: 128 }).notNull(),
  reportHash: varchar("report_hash", { length: 128 }).notNull(),
  complianceStatus: varchar("compliance_status", { length: 64 }).default("clean").notNull(),
  complianceFlags: integer("compliance_flags").default(0),
  jurisdictions: json("jurisdictions"),
  hashChain: json("hash_chain"),
  previousCertHash: varchar("previous_cert_hash", { length: 128 }),
  certificateHash: varchar("certificate_hash", { length: 128 }).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
});

export const crisisPredictions = pgTable("crisis_predictions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  eventId: varchar("event_id", { length: 128 }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  riskLevel: varchar("risk_level", { length: 64 }).default("low").notNull(),
  riskScore: real("risk_score").default(0),
  predictedCrisisType: varchar("predicted_crisis_type", { length: 128 }),
  indicators: json("indicators"),
  sentimentTrajectory: json("sentiment_trajectory"),
  holdingStatement: text("holding_statement"),
  regulatoryChecklist: json("regulatory_checklist"),
  alertSent: boolean("alert_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const valuationImpacts = pgTable("valuation_impacts", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  priorSentiment: real("prior_sentiment"),
  postSentiment: real("post_sentiment"),
  sentimentDelta: real("sentiment_delta"),
  predictedShareImpact: varchar("predicted_share_impact", { length: 64 }),
  fairValueGap: varchar("fair_value_gap", { length: 64 }),
  materialDisclosures: json("material_disclosures"),
  riskFactors: json("risk_factors"),
  analystConsensusImpact: varchar("analyst_consensus_impact", { length: 128 }),
  marketReactionPrediction: text("market_reaction_prediction"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  reportMonth: varchar("report_month", { length: 7 }).notNull(),
  clientName: varchar("client_name", { length: 255 }),
  totalEvents: integer("total_events").default(0),
  avgSentiment: real("avg_sentiment"),
  totalComplianceFlags: integer("total_compliance_flags").default(0),
  communicationHealthScore: real("communication_health_score"),
  reportData: json("report_data"),
  status: varchar("status", { length: 64 }).default("generating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const advisoryChatMessages = pgTable("advisory_chat_messages", {
  id: serial("id").primaryKey(),
  sessionKey: varchar("session_key", { length: 128 }).notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  content: text("content").notNull(),
  eventIds: json("event_ids"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evolutionAuditLog = pgTable("evolution_audit_log", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  proposalId: integer("proposal_id"),
  proposalTitle: varchar("proposal_title", { length: 255 }),
  details: json("details"),
  blockchainHash: varchar("blockchain_hash", { length: 128 }),
  previousHash: varchar("previous_hash", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const capabilityRoadmap = pgTable("capability_roadmap", {
  id: serial("id").primaryKey(),
  timeframe: varchar("timeframe", { length: 64 }).notNull(),
  capability: varchar("capability", { length: 255 }).notNull(),
  rationale: text("rationale"),
  gapScore: real("gap_score"),
  priority: varchar("priority", { length: 64 }).default("medium").notNull(),
  status: varchar("status", { length: 64 }).default("predicted").notNull(),
  proposalId: integer("proposal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const liveQaSessions = pgTable("live_qa_sessions", {
  id: serial("id").primaryKey(),
  sessionCode: varchar("session_code", { length: 20 }).notNull().unique(),
  shadowSessionId: integer("shadow_session_id"),
  eventName: varchar("event_name", { length: 500 }).notNull(),
  clientName: varchar("client_name", { length: 255 }),
  status: varchar("qa_session_status", { length: 64 }).default("active").notNull(),
  totalQuestions: integer("total_questions").default(0),
  totalApproved: integer("total_approved").default(0),
  totalRejected: integer("total_rejected").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const liveQaQuestions = pgTable("live_qa_questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionText: text("question_text").notNull(),
  submitterName: varchar("submitter_name", { length: 200 }),
  submitterEmail: varchar("submitter_email", { length: 255 }),
  submitterCompany: varchar("submitter_company", { length: 200 }),
  category: varchar("question_category", { length: 64 }).default("general").notNull(),
  status: varchar("question_status", { length: 64 }).default("pending").notNull(),
  upvotes: integer("upvotes").default(0),
  triageScore: real("triage_score"),
  triageClassification: varchar("triage_classification", { length: 32 }),
  triageReason: text("triage_reason"),
  complianceRiskScore: real("compliance_risk_score"),
  priorityScore: real("priority_score"),
  isAnonymous: boolean("is_anonymous").default(false),
  operatorNotes: text("operator_notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).$defaultFn(() => Date.now()),
});

export const liveQaAnswers = pgTable("live_qa_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  answerText: text("answer_text").notNull(),
  isAutoDraft: boolean("is_auto_draft").default(false),
  autoDraftReasoning: text("auto_draft_reasoning"),
  approvedByOperator: boolean("approved_by_operator").default(false),
  answeredAt: bigint("answered_at", { mode: "number" }).$defaultFn(() => Date.now()),
});

export const liveQaComplianceFlags = pgTable("live_qa_compliance_flags", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(),
  riskScore: real("risk_score").notNull(),
  riskType: varchar("risk_type", { length: 100 }).notNull(),
  riskDescription: text("risk_description"),
  recommendedAction: varchar("recommended_action", { length: 64 }).default("forward").notNull(),
  autoRemediationSuggestion: text("auto_remediation_suggestion"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveQaPlatformShares = pgTable("live_qa_platform_shares", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  shareType: varchar("share_type", { length: 64 }).default("link").notNull(),
  shareLink: varchar("share_link", { length: 1000 }).notNull(),
  whiteLabel: boolean("white_label").default(false),
  brandName: varchar("brand_name", { length: 255 }),
  brandColor: varchar("brand_color", { length: 7 }),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE CONSOLE — White-glove operator-assisted conference bridge
// ─────────────────────────────────────────────────────────────────────────────

export const bridgeEventPhaseEnum = pgEnum("bridge_event_phase", [
  "scheduled", "pre_call", "live", "ended"
]);

export const bridgeConfTypeEnum = pgEnum("bridge_conf_type", [
  "green_room", "main"
]);

export const bridgeConfPhaseEnum = pgEnum("bridge_conf_phase", [
  "waiting", "lobby", "live", "ended"
]);

export const bridgeParticipantStatusEnum = pgEnum("bridge_participant_status", [
  "invited", "dialing", "greeter_queue", "green_room",
  "lobby", "live", "muted", "hold", "left", "removed", "failed", "no_answer"
]);

export const bridgeParticipantRoleEnum = pgEnum("bridge_participant_role", [
  "presenter", "participant", "operator", "observer"
]);

export const bridgeGreeterStatusEnum = pgEnum("bridge_greeter_status", [
  "waiting", "admitted", "rejected", "timed_out"
]);

export const bridgeQaStatusEnum = pgEnum("bridge_qa_status", [
  "pending", "approved", "live", "answered", "dismissed", "skipped"
]);

export const bridgeQaMethodEnum = pgEnum("bridge_qa_method", [
  "phone_keypress", "web_button", "operator_added"
]);

export const bridgeEvents = pgTable("bridge_events", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  name: varchar("name", { length: 255 }).notNull(),
  organiserName: varchar("organiser_name", { length: 255 }),
  organiserEmail: varchar("organiser_email", { length: 255 }),
  scheduledAt: timestamp("scheduled_at"),
  status: varchar("status", { length: 50 }).default("scheduled").notNull(),
  bridgeEnabled: boolean("bridge_enabled").default(true).notNull(),
  accessCode: varchar("access_code", { length: 20 }),
  dialInNumber: varchar("dial_in_number", { length: 50 }),
  externalSources: text("external_sources"),
  recallBotIds: text("recall_bot_ids"),
  shadowSessionId: integer("shadow_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BridgeEvent = typeof bridgeEvents.$inferSelect;
export type InsertBridgeEvent = typeof bridgeEvents.$inferInsert;

export const bridgeConferences = pgTable("bridge_conferences", {
  id: serial("id").primaryKey(),
  bridgeEventId: integer("bridge_event_id").notNull(),
  twilioConfSid: varchar("twilio_conf_sid", { length: 100 }),
  twilioConfName: varchar("twilio_conf_name", { length: 255 }),
  type: varchar("type", { length: 50 }).default("main").notNull(),
  phase: varchar("phase", { length: 50 }).default("waiting").notNull(),
  isRecording: boolean("is_recording").default(false).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  qaActive: boolean("qa_active").default(false).notNull(),
  recordingSid: varchar("recording_sid", { length: 100 }),
  recordingUrl: varchar("recording_url", { length: 500 }),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BridgeConference = typeof bridgeConferences.$inferSelect;
export type InsertBridgeConference = typeof bridgeConferences.$inferInsert;

export const bridgeParticipants = pgTable("bridge_participants", {
  id: serial("id").primaryKey(),
  bridgeEventId: integer("bridge_event_id").notNull(),
  conferenceId: integer("conference_id"),
  name: varchar("name", { length: 255 }),
  organisation: varchar("organisation", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  role: varchar("role", { length: 50 }).default("participant").notNull(),
  status: varchar("status", { length: 50 }).default("invited").notNull(),
  connectionMethod: varchar("connection_method", { length: 20 }).default("phone"),
  twilioCallSid: varchar("twilio_call_sid", { length: 100 }),
  twilioParticipantSid: varchar("twilio_participant_sid", { length: 100 }),
  voiceCaptureUrl: varchar("voice_capture_url", { length: 500 }),
  isMuted: boolean("is_muted").default(true).notNull(),
  isOnHold: boolean("is_on_hold").default(false).notNull(),
  handRaised: boolean("hand_raised").default(false).notNull(),
  handRaisedAt: timestamp("hand_raised_at"),
  qaPosition: integer("qa_position"),
  notes: text("notes"),
  joinTime: timestamp("join_time"),
  leaveTime: timestamp("leave_time"),
  durationSeconds: integer("duration_seconds"),
  greeted: boolean("greeted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BridgeParticipant = typeof bridgeParticipants.$inferSelect;
export type InsertBridgeParticipant = typeof bridgeParticipants.$inferInsert;

export const bridgeGreeterQueue = pgTable("bridge_greeter_queue", {
  id: serial("id").primaryKey(),
  bridgeEventId: integer("bridge_event_id").notNull(),
  conferenceId: integer("conference_id"),
  twilioCallSid: varchar("twilio_call_sid", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  voiceNameUrl: varchar("voice_name_url", { length: 500 }),
  voiceOrgUrl: varchar("voice_org_url", { length: 500 }),
  transcribedName: varchar("transcribed_name", { length: 255 }),
  transcribedOrg: varchar("transcribed_org", { length: 255 }),
  status: varchar("status", { length: 50 }).default("waiting").notNull(),
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  admittedAt: timestamp("admitted_at"),
});

export type BridgeGreeterQueue = typeof bridgeGreeterQueue.$inferSelect;
export type InsertBridgeGreeterQueue = typeof bridgeGreeterQueue.$inferInsert;

export const bridgeQaQuestions = pgTable("bridge_qa_questions", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id").notNull(),
  participantId: integer("participant_id"),
  questionText: text("question_text"),
  method: varchar("method", { length: 20 }).default("phone_keypress"),
  queuePosition: integer("queue_position"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  raisedAt: timestamp("raised_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  wentLiveAt: timestamp("went_live_at"),
  answeredAt: timestamp("answered_at"),
  dismissedAt: timestamp("dismissed_at"),
  operatorNotes: text("operator_notes"),
});

export type BridgeQaQuestion = typeof bridgeQaQuestions.$inferSelect;
export type InsertBridgeQaQuestion = typeof bridgeQaQuestions.$inferInsert;

export const bridgeOperatorActions = pgTable("bridge_operator_actions", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id"),
  operatorId: varchar("operator_id", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  targetId: integer("target_id"),
  category: varchar("category", { length: 50 }).default("operator"),
  metadata: text("metadata"),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
});

export type BridgeOperatorAction = typeof bridgeOperatorActions.$inferSelect;
export type InsertBridgeOperatorAction = typeof bridgeOperatorActions.$inferInsert;

export const bridgeCallRecordings = pgTable("bridge_call_recordings", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id").notNull(),
  twilioRecSid: varchar("twilio_rec_sid", { length: 100 }),
  channels: integer("channels").default(2),
  durationSec: integer("duration_sec"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  storageUrl: varchar("storage_url", { length: 500 }),
  transcriptUrl: varchar("transcript_url", { length: 500 }),
  transcriptText: text("transcript_text"),
  status: varchar("status", { length: 50 }).default("processing").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BridgeCallRecording = typeof bridgeCallRecordings.$inferSelect;
export type InsertBridgeCallRecording = typeof bridgeCallRecordings.$inferInsert;

// ─── Board Intelligence Compass ─────────────────────────────────────────────
export const boardIntelligenceCompass = pgTable("board_intelligence_compass", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  eventId: integer("event_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priorCommitmentAudits = pgTable("prior_commitment_audits", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  commitmentType: varchar("commitment_type", { length: 100 }).notNull(),
  statement: text("statement").notNull(),
  source: varchar("source", { length: 255 }),
  eventDate: timestamp("event_date"),
  speaker: varchar("speaker", { length: 255 }),
  confidence: real("confidence"),
  riskLevel: varchar("risk_level", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const directorLiabilityMaps = pgTable("director_liability_maps", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  directorName: varchar("director_name", { length: 255 }).notNull(),
  liabilityArea: varchar("liability_area", { length: 100 }),
  exposureLevel: varchar("exposure_level", { length: 20 }),
  description: text("description"),
  mitigationSteps: text("mitigation_steps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analystExpectationAudits = pgTable("analyst_expectation_audits", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  analystName: varchar("analyst_name", { length: 255 }),
  consensusEps: real("consensus_eps"),
  consensusRevenue: real("consensus_revenue"),
  consensusGrowth: real("consensus_growth"),
  priorGuidance: text("prior_guidance"),
  surpriseRisk: varchar("surprise_risk", { length: 20 }),
  keyExpectations: text("key_expectations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const governanceCommunicationScores = pgTable("governance_communication_scores", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  clarity: real("clarity"),
  consistency: real("consistency"),
  completeness: real("completeness"),
  timeliness: real("timeliness"),
  overallScore: real("overall_score"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boardResolutions = pgTable("board_resolutions", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  actionType: varchar("action_type", { length: 100 }),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }),
  owner: varchar("owner", { length: 255 }),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const compassProvenance = pgTable("compass_provenance", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  outputType: varchar("output_type", { length: 100 }),
  source: varchar("source", { length: 255 }),
  timestamp: timestamp("timestamp"),
  confidence: real("confidence"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const compassActionHistory = pgTable("compass_action_history", {
  id: serial("id").primaryKey(),
  compassId: integer("compass_id").notNull(),
  action: varchar("action", { length: 255 }),
  actor: varchar("actor", { length: 255 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Pre-Event Intelligence Briefing ────────────────────────────────────────
export const preEventIntelligenceBriefings = pgTable("pre_event_intelligence_briefings", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  eventId: integer("event_id").notNull(),
  briefingDate: timestamp("briefing_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analystConsensusData = pgTable("analyst_consensus_data", {
  id: serial("id").primaryKey(),
  briefingId: integer("briefing_id").notNull(),
  metric: varchar("metric", { length: 100 }),
  consensusValue: real("consensus_value"),
  lowEstimate: real("low_estimate"),
  highEstimate: real("high_estimate"),
  numAnalysts: integer("num_analysts"),
  revisionTrend: varchar("revision_trend", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const predictedQaItems = pgTable("predicted_qa_items", {
  id: serial("id").primaryKey(),
  briefingId: integer("briefing_id").notNull(),
  topic: varchar("topic", { length: 255 }),
  predictedQuestion: text("predicted_question"),
  suggestedAnswer: text("suggested_answer"),
  probability: real("probability"),
  riskLevel: varchar("risk_level", { length: 20 }),
  source: varchar("source", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceHotspots = pgTable("compliance_hotspots", {
  id: serial("id").primaryKey(),
  briefingId: integer("briefing_id").notNull(),
  area: varchar("area", { length: 100 }),
  description: text("description"),
  riskLevel: varchar("risk_level", { length: 20 }),
  regulatoryBasis: varchar("regulatory_basis", { length: 255 }),
  recommendedAction: text("recommended_action"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readinessScores = pgTable("readiness_scores", {
  id: serial("id").primaryKey(),
  briefingId: integer("briefing_id").notNull(),
  category: varchar("category", { length: 100 }),
  score: real("score"),
  maxScore: real("max_score"),
  gaps: text("gaps"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const briefingProvenance = pgTable("briefing_provenance", {
  id: serial("id").primaryKey(),
  briefingId: integer("briefing_id").notNull(),
  dataPoint: varchar("data_point", { length: 255 }),
  source: varchar("source", { length: 255 }),
  timestamp: timestamp("timestamp"),
  confidence: real("confidence"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const briefingActionHistory = pgTable("briefing_action_history", {
  id: serial("id").primaryKey(),
  briefingId: integer("briefing_id").notNull(),
  action: varchar("action", { length: 255 }),
  actor: varchar("actor", { length: 255 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Regulatory Compliance Monitor ──────────────────────────────────────────
export const regulatoryComplianceMonitors = pgTable("regulatory_compliance_monitors", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  eventId: integer("event_id").notNull(),
  monitoringStarted: timestamp("monitoring_started").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const regulatoryFlags = pgTable("regulatory_flags", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  flagType: varchar("flag_type", { length: 100 }),
  jurisdiction: varchar("jurisdiction", { length: 50 }),
  ruleSet: varchar("rule_set", { length: 100 }),
  severity: varchar("severity", { length: 20 }),
  statement: text("statement"),
  speaker: varchar("speaker", { length: 255 }),
  segmentTimestamp: varchar("segment_timestamp", { length: 20 }),
  ruleBasis: text("rule_basis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const disclosureTriggers = pgTable("disclosure_triggers", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  filingType: varchar("filing_type", { length: 50 }),
  triggerReason: text("trigger_reason"),
  status: varchar("status", { length: 20 }).default("draft"),
  draftContent: text("draft_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jurisdictionProfiles = pgTable("jurisdiction_profiles", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).unique(),
  name: varchar("name", { length: 255 }),
  ruleSetVersion: varchar("rule_set_version", { length: 50 }),
  applicableRules: text("applicable_rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceActionItems = pgTable("compliance_action_items", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  actionType: varchar("action_type", { length: 100 }),
  description: text("description"),
  priority: varchar("priority", { length: 20 }),
  owner: varchar("owner", { length: 255 }),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceProvenance = pgTable("compliance_provenance", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  flagId: integer("flag_id"),
  source: varchar("source", { length: 255 }),
  timestamp: timestamp("timestamp"),
  confidence: real("confidence"),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complianceDetectionStats = pgTable("compliance_detection_stats", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  totalViolationsDetected: integer("total_violations_detected").default(0).notNull(),
  violationsByType: text("violations_by_type"),
  violationsBySeverity: text("violations_by_severity"),
  avgConfidenceScore: real("avg_confidence_score"),
  avgDetectionLatencyMs: integer("avg_detection_latency_ms"),
  falsePositiveRate: real("false_positive_rate"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export * from "./gaps.schema";
export * from "./partners.schema";
