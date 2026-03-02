import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "operator"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table — stores event metadata including optional access code for password protection.
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull().unique(), // e.g. "q4-earnings-2026"
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["upcoming", "live", "completed"]).default("upcoming").notNull(),
  accessCode: varchar("accessCode", { length: 64 }), // null = no password required
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Attendee registrations table — persists sign-ups from the Registration page.
 */
export const attendeeRegistrations = mysqlTable("attendee_registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  language: varchar("language", { length: 64 }).default("English").notNull(),
  dialIn: boolean("dialIn").default(false).notNull(),
  accessGranted: boolean("accessGranted").default(false).notNull(),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendeeRegistration = typeof attendeeRegistrations.$inferSelect;
export type InsertAttendeeRegistration = typeof attendeeRegistrations.$inferInsert;

/**
 * IR contacts table — stores investor relations email contacts for post-event summaries.
 */
export const irContacts = mysqlTable("ir_contacts", {
  id: int("id").autoincrement().primaryKey(),
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
export const occConferences = mysqlTable("occ_conferences", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  callId: varchar("callId", { length: 64 }).notNull().unique(), // e.g. "CC-9921"
  subject: varchar("subject", { length: 255 }).notNull(),
  reseller: varchar("reseller", { length: 128 }).default("Chorus Call Inc.").notNull(),
  product: varchar("product", { length: 128 }).default("Event Conference").notNull(),
  moderatorCode: varchar("moderatorCode", { length: 32 }),
  participantCode: varchar("participantCode", { length: 32 }),
  securityCode: varchar("securityCode", { length: 32 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  webAccessCode: varchar("webAccessCode", { length: 32 }),
  status: mysqlEnum("status", ["pending", "running", "completed", "alarm"]).default("pending").notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  isRecording: boolean("isRecording").default(false).notNull(),
  waitingMusicEnabled: boolean("waitingMusicEnabled").default(true).notNull(),
  participantLimitEnabled: boolean("participantLimitEnabled").default(false).notNull(),
  participantLimit: int("participantLimit").default(500),
  requestsToSpeakEnabled: boolean("requestsToSpeakEnabled").default(true).notNull(),
  scheduledStart: timestamp("scheduledStart"),
  actualStart: timestamp("actualStart"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OccConference = typeof occConferences.$inferSelect;
export type InsertOccConference = typeof occConferences.$inferInsert;

/**
 * OCC Participants — every person in or associated with a conference.
 * State is updated in real-time by the telephony bridge and operator actions.
 */
export const occParticipants = mysqlTable("occ_participants", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(), // references occConferences.id
  lineNumber: int("lineNumber").notNull(), // position in the conference (1-based)
  role: mysqlEnum("role", ["moderator", "participant", "operator", "host"]).default("participant").notNull(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  location: varchar("location", { length: 128 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  voiceServer: varchar("voiceServer", { length: 32 }),
  // State
  state: mysqlEnum("state", [
    "free",
    "incoming",
    "connected",
    "muted",
    "parked",
    "speaking",
    "waiting_operator",
    "web_participant",
    "dropped",
  ]).default("incoming").notNull(),
  isSpeaking: boolean("isSpeaking").default(false).notNull(),
  isWebParticipant: boolean("isWebParticipant").default(false).notNull(),
  requestToSpeak: boolean("requestToSpeak").default(false).notNull(),
  requestToSpeakPosition: int("requestToSpeakPosition"),
  // Subconference
  subconferenceId: int("subconferenceId"), // null = main conference
  // Monitoring
  isMonitored: boolean("isMonitored").default(false).notNull(),
  monitoringOperatorId: int("monitoringOperatorId"),
  // Timestamps
  connectedAt: timestamp("connectedAt"),
  disconnectedAt: timestamp("disconnectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OccParticipant = typeof occParticipants.$inferSelect;
export type InsertOccParticipant = typeof occParticipants.$inferInsert;

/**
 * OCC Lounge — participants who have dialled in to an event conference
 * but are waiting to be admitted by an operator.
 */
export const occLounge = mysqlTable("occ_lounge", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  callId: varchar("callId", { length: 64 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  description: varchar("description", { length: 255 }),
  language: varchar("language", { length: 32 }).default("en"),
  arrivedAt: timestamp("arrivedAt").defaultNow().notNull(),
  pickedAt: timestamp("pickedAt"),
  pickedByOperatorId: int("pickedByOperatorId"),
  status: mysqlEnum("status", ["waiting", "picked", "admitted", "dropped"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccLounge = typeof occLounge.$inferSelect;
export type InsertOccLounge = typeof occLounge.$inferInsert;

/**
 * OCC Operator Requests — participants who pressed DTMF to request operator assistance.
 */
export const occOperatorRequests = mysqlTable("occ_operator_requests", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  participantId: int("participantId").notNull(),
  callId: varchar("callId", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  pickedAt: timestamp("pickedAt"),
  pickedByOperatorId: int("pickedByOperatorId"),
  status: mysqlEnum("status", ["pending", "picked", "resolved"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccOperatorRequest = typeof occOperatorRequests.$inferSelect;
export type InsertOccOperatorRequest = typeof occOperatorRequests.$inferInsert;

/**
 * OCC Operator Sessions — tracks each operator's current state and which
 * conference panels they have open. Used for presence and coordination.
 */
export const occOperatorSessions = mysqlTable("occ_operator_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // references users.id
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  state: mysqlEnum("state", ["absent", "present", "in_call", "break"]).default("absent").notNull(),
  activeConferenceId: int("activeConferenceId"), // conference currently being managed
  openConferenceIds: text("openConferenceIds"), // JSON array of open CCP conference IDs
  lastHeartbeat: timestamp("lastHeartbeat").defaultNow().notNull(),
  loginAt: timestamp("loginAt"),
  breakAt: timestamp("breakAt"),
  logoutAt: timestamp("logoutAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OccOperatorSession = typeof occOperatorSessions.$inferSelect;
export type InsertOccOperatorSession = typeof occOperatorSessions.$inferInsert;

/**
 * OCC Chat Messages — real-time chat between operator and conference participants.
 */
export const occChatMessages = mysqlTable("occ_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  senderType: mysqlEnum("senderType", ["operator", "participant", "moderator", "system"]).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderId: int("senderId"), // participantId or userId
  recipientType: mysqlEnum("recipientType", ["all", "hosts", "participant"]).default("all").notNull(),
  recipientId: int("recipientId"), // null = broadcast
  message: text("message").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccChatMessage = typeof occChatMessages.$inferSelect;
export type InsertOccChatMessage = typeof occChatMessages.$inferInsert;

/**
 * OCC Audio Files — pre-recorded audio files available for playback into a conference.
 */
export const occAudioFiles = mysqlTable("occ_audio_files", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId"), // null = global/shared
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  durationSeconds: int("durationSeconds"),
  isPlaying: boolean("isPlaying").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccAudioFile = typeof occAudioFiles.$inferSelect;
export type InsertOccAudioFile = typeof occAudioFiles.$inferInsert;

/**
 * OCC Participant History — timestamped event log for each participant line.
 * Records every state transition for audit and post-event review.
 */
export const occParticipantHistory = mysqlTable("occ_participant_history", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  participantId: int("participantId").notNull(),
  event: mysqlEnum("event", [
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
  ]).notNull(),
  triggeredBy: mysqlEnum("triggeredBy", ["system", "operator", "participant", "moderator"]).default("system").notNull(),
  operatorId: int("operatorId"),
  note: varchar("note", { length: 255 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccParticipantHistory = typeof occParticipantHistory.$inferSelect;
export type InsertOccParticipantHistory = typeof occParticipantHistory.$inferInsert;

/**
 * OCC Access Code Log — records every access code entry attempt for audit.
 */
export const occAccessCodeLog = mysqlTable("occ_access_code_log", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  callingNumber: varchar("callingNumber", { length: 32 }),
  calledNumber: varchar("calledNumber", { length: 32 }),
  accessCodeEntered: varchar("accessCodeEntered", { length: 64 }),
  isValid: boolean("isValid").notNull(),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccAccessCodeLog = typeof occAccessCodeLog.$inferSelect;
export type InsertOccAccessCodeLog = typeof occAccessCodeLog.$inferInsert;
