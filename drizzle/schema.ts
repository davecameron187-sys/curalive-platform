import { boolean, int, float, tinyint, json, mysqlEnum, mysqlTable, text, longtext, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

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
  // Profile customisation fields
  jobTitle: varchar("jobTitle", { length: 255 }),
  organisation: varchar("organisation", { length: 255 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  phone: varchar("phone", { length: 64 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg"),
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
  reseller: varchar("reseller", { length: 128 }).default("CuraLive").notNull(),
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
  // CuraLive Direct — when true, callers with valid PIN bypass operator queue
  autoAdmitEnabled: boolean("autoAdmitEnabled").default(false).notNull(),
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
  // CuraLive Direct — link to attendee_registrations for PIN actions
  registrationId: int("registrationId"), // null = no registration linked
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

/**
 * OCC Dial-Out History — records every multi-party dial-out session.
 * Each row is one session; entries are stored as JSON in the dialEntries column.
 */
export const occDialOutHistory = mysqlTable("occ_dial_out_history", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull(),
  operatorId: int("operatorId"),
  operatorName: varchar("operatorName", { length: 255 }),
  // JSON array of { name, company, phone, role, status }
  dialEntries: text("dialEntries").notNull(),
  successCount: int("successCount").default(0).notNull(),
  failCount: int("failCount").default(0).notNull(),
  totalCount: int("totalCount").default(0).notNull(),
  initiatedAt: timestamp("initiatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OccDialOutHistory = typeof occDialOutHistory.$inferSelect;
export type InsertOccDialOutHistory = typeof occDialOutHistory.$inferInsert;

/**
 * OCC Green Room — speaker sub-conference for pre-event preparation.
 * Linked to a main conference; speakers join here before being transferred.
 */
export const occGreenRooms = mysqlTable("occ_green_rooms", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conferenceId").notNull().unique(), // parent conference
  name: varchar("name", { length: 255 }).default("Speaker Green Room").notNull(),
  dialInNumber: varchar("dialInNumber", { length: 32 }),
  accessCode: varchar("accessCode", { length: 32 }),
  isActive: boolean("isActive").default(false).notNull(),
  isOpen: boolean("isOpen").default(false).notNull(), // visible in OCC
  transferredAt: timestamp("transferredAt"), // when Transfer All was triggered
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export const liveRoadshows = mysqlTable("live_roadshows", {
  id: int("id").autoincrement().primaryKey(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull().unique(), // e.g. "aggreko-sep-2026"
  title: varchar("title", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(), // company raising capital
  bank: varchar("bank", { length: 255 }), // e.g. "BofA Securities"
  serviceType: mysqlEnum("serviceType", [
    "capital_raising_1x1",
    "research_presentation",
    "earnings_call",
    "hybrid_conference",
  ]).default("capital_raising_1x1").notNull(),
  platform: mysqlEnum("platform", ["zoom", "teams", "webex", "mixed"]).default("zoom").notNull(),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  // Dates
  startDate: varchar("startDate", { length: 32 }), // ISO date string
  endDate: varchar("endDate", { length: 32 }),
  timezone: varchar("timezone", { length: 64 }).default("Europe/London").notNull(),
  // Branding / white-label
  brandingEnabled: boolean("brandingEnabled").default(true).notNull(),
  customLogoUrl: varchar("customLogoUrl", { length: 512 }),
  // Operator notes
  notes: text("notes"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveRoadshow = typeof liveRoadshows.$inferSelect;
export type InsertLiveRoadshow = typeof liveRoadshows.$inferInsert;

/**
 * Roadshow Meetings — individual meeting slots within a roadshow.
 * Each slot has its own video link, timeslot, and investor assignment.
 */
export const liveRoadshowMeetings = mysqlTable("live_roadshow_meetings", {
  id: int("id").autoincrement().primaryKey(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  meetingDate: varchar("meetingDate", { length: 32 }).notNull(), // ISO date
  startTime: varchar("startTime", { length: 8 }).notNull(), // "HH:MM"
  endTime: varchar("endTime", { length: 8 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Europe/London").notNull(),
  meetingType: mysqlEnum("meetingType", ["1x1", "group", "large_group"]).default("1x1").notNull(),
  platform: mysqlEnum("platform", ["zoom", "teams", "webex", "mixed"]).default("zoom").notNull(),
  videoLink: varchar("videoLink", { length: 512 }), // the Zoom/Teams join URL
  meetingId: varchar("meetingId", { length: 128 }), // platform meeting ID
  passcode: varchar("passcode", { length: 64 }),
  status: mysqlEnum("status", [
    "scheduled",
    "waiting_room_open",
    "in_progress",
    "completed",
    "cancelled",
  ]).default("scheduled").notNull(),
  // Operator notes for this slot
  operatorNotes: text("operatorNotes"),
  // Slide deck — S3 URL of uploaded PDF/PPTX
  slideDeckUrl: varchar("slideDeckUrl", { length: 1024 }),
  slideDeckName: varchar("slideDeckName", { length: 255 }),
  // Current slide index shown to presenter/attendees (0-based)
  currentSlideIndex: int("currentSlideIndex").default(0).notNull(),
  totalSlides: int("totalSlides").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveRoadshowMeeting = typeof liveRoadshowMeetings.$inferSelect;
export type InsertLiveRoadshowMeeting = typeof liveRoadshowMeetings.$inferInsert;

/**
 * Roadshow Investors — investors (buy-side) assigned to specific meeting slots.
 * One investor can be assigned to multiple slots across a roadshow.
 */
export const liveRoadshowInvestors = mysqlTable("live_roadshow_investors", {
  id: int("id").autoincrement().primaryKey(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  meetingId: int("meetingId").notNull(), // references liveRoadshowMeetings.id
  name: varchar("name", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  // Waiting room state
  waitingRoomStatus: mysqlEnum("waitingRoomStatus", [
    "not_arrived",
    "in_waiting_room",
    "admitted",
    "completed",
    "no_show",
  ]).default("not_arrived").notNull(),
  arrivedAt: timestamp("arrivedAt"),
  admittedAt: timestamp("admittedAt"),
  // Invite
  inviteSentAt: timestamp("inviteSentAt"),
  inviteToken: varchar("inviteToken", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiveRoadshowInvestor = typeof liveRoadshowInvestors.$inferSelect;
export type InsertLiveRoadshowInvestor = typeof liveRoadshowInvestors.$inferInsert;

/**
 * Live Meeting Summaries — AI-generated post-meeting summaries.
 */
export const liveMeetingSummaries = mysqlTable("live_meeting_summaries", {
  id: int("id").autoincrement().primaryKey(),
  meetingDbId: int("meetingDbId").notNull(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  summary: text("summary").notNull(),
  keyTopics: text("keyTopics"),
  actionItems: text("actionItems"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LiveMeetingSummary = typeof liveMeetingSummaries.$inferSelect;
export type InsertLiveMeetingSummary = typeof liveMeetingSummaries.$inferInsert;

/**
 * Slide Thumbnails — S3 URLs for per-page PDF thumbnail images.
 */
export const slideThumbnails = mysqlTable("slide_thumbnails", {
  id: int("id").autoincrement().primaryKey(),
  meetingDbId: int("meetingDbId").notNull(),
  slideIndex: int("slideIndex").notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SlideThumbnail = typeof slideThumbnails.$inferSelect;
export type InsertSlideThumbnail = typeof slideThumbnails.$inferInsert;

/**
 * Commitment Signals — AI-detected soft commitment language from meeting transcripts.
 */
export const commitmentSignals = mysqlTable("commitment_signals", {
  id: int("id").autoincrement().primaryKey(),
  meetingDbId: int("meetingDbId").notNull(),
  roadshowId: varchar("roadshowId", { length: 128 }).notNull(),
  investorId: int("investorId"), // references liveRoadshowInvestors.id (nullable if unknown)
  investorName: varchar("investorName", { length: 255 }),
  institution: varchar("institution", { length: 255 }),
  quote: text("quote").notNull(), // the detected phrase
  signalType: mysqlEnum("signalType", [
    "soft_commit",
    "interest",
    "objection",
    "question",
    "pricing_discussion",
    "size_discussion",
  ]).notNull(),
  confidenceScore: int("confidenceScore").default(0).notNull(), // 0-100
  indicatedAmount: varchar("indicatedAmount", { length: 64 }), // e.g. "$5m", "10% of deal"
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommitmentSignal = typeof commitmentSignals.$inferSelect;
export type InsertCommitmentSignal = typeof commitmentSignals.$inferInsert;

/**
 * Investor Briefing Packs — AI-generated pre-meeting briefing notes for presenters.
 */
export const investorBriefingPacks = mysqlTable("investor_briefing_packs", {
  id: int("id").autoincrement().primaryKey(),
  investorId: int("investorId").notNull(),
  meetingDbId: int("meetingDbId").notNull(),
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
export const eventBranding = mysqlTable("event_branding", {
  id: int("id").autoincrement().primaryKey(),
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
export const webcastEvents = mysqlTable("webcast_events", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("event_type", [
    "webinar",
    "webcast",
    "virtual_event",
    "hybrid_event",
    "on_demand",
    "simulive",
    "audio_conference",
    "capital_markets",
  ]).notNull().default("webinar"),
  industryVertical: mysqlEnum("industry_vertical", [
    "financial_services",
    "corporate_communications",
    "healthcare",
    "technology",
    "professional_services",
    "government",
    "education",
    "media_entertainment",
    "general",
  ]).notNull().default("general"),
  status: mysqlEnum("webcast_status", [
    "draft",
    "scheduled",
    "live",
    "ended",
    "on_demand",
    "cancelled",
  ]).notNull().default("draft"),
  startTime: bigint("start_time", { mode: "number" }),
  endTime: bigint("end_time", { mode: "number" }),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  maxAttendees: int("max_attendees").default(1000),
  registrationCount: int("registration_count").default(0),
  peakAttendees: int("peak_attendees").default(0),
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
export const webcastRegistrations = mysqlTable("webcast_registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
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
  watchTimeSeconds: int("watch_time_seconds").default(0),
  engagementScore: int("engagement_score").default(0),
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
export const webcastQa = mysqlTable("webcast_qa", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
  attendeeName: varchar("attendee_name", { length: 200 }).notNull(),
  attendeeEmail: varchar("attendee_email", { length: 255 }),
  attendeeCompany: varchar("attendee_company", { length: 200 }),
  question: text("question").notNull(),
  status: mysqlEnum("qa_status", [
    "pending",
    "approved",
    "answered",
    "dismissed",
    "flagged",
  ]).notNull().default("pending"),
  upvotes: int("upvotes").default(0),
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
export const webcastPolls = mysqlTable("webcast_polls", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
  question: varchar("question", { length: 500 }).notNull(),
  options: text("options").notNull(),
  results: text("results"),
  status: mysqlEnum("poll_status", ["draft", "live", "closed"]).notNull().default("draft"),
  allowMultiple: boolean("allow_multiple").default(false),
  showResultsToAttendees: boolean("show_results_to_attendees").default(true),
  totalVotes: int("total_votes").default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  closedAt: bigint("closed_at", { mode: "number" }),
});
export type WebcastPoll = typeof webcastPolls.$inferSelect;
export type InsertWebcastPoll = typeof webcastPolls.$inferInsert;

/**
 * recall_bots — Tracks Recall.ai meeting bot instances for live transcription.
 * Each row represents one bot deployed to a meeting (Zoom, Teams, Webex, etc.)
 */
export const recallBots = mysqlTable("recall_bots", {
  id: int("id").autoincrement().primaryKey(),
  // Links to either a webcast event or a live roadshow meeting
  eventId: int("event_id"),
  meetingId: int("meeting_id"),
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
  transcriptJson: longtext("transcript_json"),
  // AI-generated summary (populated after bot leaves)
  summary: text("summary"),
  // Recording URL from Recall.ai (if recording enabled)
  recordingUrl: text("recording_url"),
  // Error message if bot failed
  errorMessage: text("error_message"),
  // Timestamps
  startedAt: bigint("started_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  joinedAt: bigint("joined_at", { mode: "number" }),
  leftAt: bigint("left_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RecallBot = typeof recallBots.$inferSelect;
export type InsertRecallBot = typeof recallBots.$inferInsert;

/**
 * mux_streams — Tracks Mux Live Stream instances for RTMP ingest.
 * Each row represents one Mux live stream (one RTMP ingest endpoint + one HLS playback URL).
 * Operators use the stream key in OBS/vMix; attendees watch via the playback URL.
 */
export const muxStreams = mysqlTable("mux_streams", {
  id: int("id").autoincrement().primaryKey(),
  // Links to a webcast event or live roadshow meeting
  eventId: int("event_id"),
  meetingId: int("meeting_id"),
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
export const webphoneSessions = mysqlTable("webphone_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  conferenceId: int("conference_id"),          // optional link to OCC conference
  carrier: mysqlEnum("carrier", ["twilio", "telnyx"]).notNull().default("twilio"),
  status: mysqlEnum("status", ["initiated", "ringing", "in_progress", "completed", "failed", "no_answer"]).notNull().default("initiated"),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull().default("outbound"),
  remoteNumber: varchar("remote_number", { length: 32 }),  // E.164 format
  callSid: varchar("call_sid", { length: 128 }),           // Twilio CallSid or Telnyx call_control_id
  durationSecs: int("duration_secs"),
  recordingSid: varchar("recording_sid", { length: 128 }),  // Twilio RecordingSid
  recordingUrl: varchar("recording_url", { length: 512 }),  // Twilio recording URL
  recordingStatus: mysqlEnum("recording_status", ["pending", "completed", "failed"]),
  // Voicemail fields
  isVoicemail: boolean("is_voicemail").notNull().default(false),
  voicemailUrl: varchar("voicemail_url", { length: 512 }),
  voicemailDuration: int("voicemail_duration"),
  // Transcription fields
  transcription: text("transcription"),
  transcriptionLanguage: varchar("transcription_language", { length: 16 }),
  transcriptionStatus: mysqlEnum("transcription_status", ["pending", "processing", "completed", "failed"]),
  // Transfer fields
  transferredTo: varchar("transferred_to", { length: 128 }),
  transferType: mysqlEnum("transfer_type", ["blind", "warm"]),
  startedAt: bigint("started_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  endedAt: bigint("ended_at", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type WebphoneSession = typeof webphoneSessions.$inferSelect;
export type InsertWebphoneSession = typeof webphoneSessions.$inferInsert;

/**
 * Webphone carrier status — tracks health of Twilio and Telnyx for automatic failover.
 */
export const webphoneCarrierStatus = mysqlTable("webphone_carrier_status", {
  id: int("id").autoincrement().primaryKey(),
  carrier: mysqlEnum("carrier", ["twilio", "telnyx"]).notNull().unique(),
  status: mysqlEnum("status", ["healthy", "degraded", "down"]).notNull().default("healthy"),
  failoverActive: boolean("failover_active").notNull().default(false),
  lastCheckedAt: bigint("last_checked_at", { mode: "number" }).$defaultFn(() => Date.now()),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type WebphoneCarrierStatus = typeof webphoneCarrierStatus.$inferSelect;

/**
 * Speaker pace analysis results — stores per-speaker WPM and coaching scores
 * for each event, enabling trend charts across multiple events.
 */
export const speakerPaceResults = mysqlTable("speaker_pace_results", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }).notNull(),
  speaker: varchar("speaker", { length: 255 }).notNull(),
  wpm: int("wpm").notNull(),
  paceLabel: varchar("pace_label", { length: 32 }).notNull(),
  pauseScore: int("pause_score").notNull(),
  fillerWordCount: int("filler_word_count").notNull().default(0),
  overallScore: int("overall_score").notNull(),
  analysedAt: bigint("analysed_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type SpeakerPaceResult = typeof speakerPaceResults.$inferSelect;
export type InsertSpeakerPaceResult = typeof speakerPaceResults.$inferInsert;

// ─── Event Customisation Portal ──────────────────────────────────────────────
/**
 * event_customisation — Per-event branding, registration page config, and booking form config.
 * Used by the Customisation Portal tab in the Operator Console.
 */
export const eventCustomisation = mysqlTable("event_customisation", {
  id: int("id").autoincrement().primaryKey(),
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
  regMaxAttendees: int("reg_max_attendees").default(1000),
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
export const directAccessLog = mysqlTable("direct_access_log", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conference_id"),
  registrationId: int("registration_id"),
  enteredPin: varchar("entered_pin", { length: 8 }).notNull(),
  callerNumber: varchar("caller_number", { length: 32 }),
  outcome: mysqlEnum("outcome", [
    "admitted",
    "operator_queue",
    "no_conference",
    "failed",
  ]).notNull().default("failed"),
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
export const billingClients = mysqlTable("billing_clients", {
  id: int("id").autoincrement().primaryKey(),
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
  paymentTermsDays: int("payment_terms_days").default(30).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive", "prospect"]).default("prospect").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingClient = typeof billingClients.$inferSelect;
export type InsertBillingClient = typeof billingClients.$inferInsert;

/**
 * billing_quotes — Formal quotes sent to clients before invoicing.
 * Tracks the full lifecycle: draft → sent → accepted / declined → invoiced.
 */
export const billingQuotes = mysqlTable("billing_quotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteNumber: varchar("quote_number", { length: 32 }).notNull().unique(), // e.g. "QUO-2026-0001"
  clientId: int("client_id").notNull(), // FK → billing_clients.id
  // Metadata
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Financials (stored in minor units, e.g. cents)
  subtotalCents: bigint("subtotal_cents", { mode: "number" }).default(0).notNull(),
  discountCents: bigint("discount_cents", { mode: "number" }).default(0).notNull(),
  taxPercent: int("tax_percent").default(15).notNull(), // VAT %
  totalCents: bigint("total_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Status lifecycle
  status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "declined", "invoiced", "expired"]).default("draft").notNull(),
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
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingQuote = typeof billingQuotes.$inferSelect;
export type InsertBillingQuote = typeof billingQuotes.$inferInsert;

/**
 * billing_line_items — Individual line items on a quote or invoice.
 * Can be linked to a quote, an invoice, or both.
 */
export const billingLineItems = mysqlTable("billing_line_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quote_id"),   // FK → billing_quotes.id (nullable if invoice-only)
  invoiceId: int("invoice_id"), // FK → billing_invoices.id (nullable if quote-only)
  // Item details
  description: varchar("description", { length: 512 }).notNull(),
  category: varchar("category", { length: 128 }), // e.g. "Platform License", "Event Fee", "Setup"
  quantity: int("quantity").default(1).notNull(),
  unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingLineItem = typeof billingLineItems.$inferSelect;
export type InsertBillingLineItem = typeof billingLineItems.$inferInsert;

/**
 * billing_invoices — Formal tax invoices raised against accepted quotes or directly.
 * Tracks payment status: unpaid → partial → paid → overdue → cancelled.
 */
export const billingInvoices = mysqlTable("billing_invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 32 }).notNull().unique(), // e.g. "INV-2026-0001"
  clientId: int("client_id").notNull(), // FK → billing_clients.id
  quoteId: int("quote_id"),             // FK → billing_quotes.id (optional)
  // Metadata
  title: varchar("title", { length: 255 }).notNull(),
  // Financials
  subtotalCents: bigint("subtotal_cents", { mode: "number" }).default(0).notNull(),
  discountCents: bigint("discount_cents", { mode: "number" }).default(0).notNull(),
  taxPercent: int("tax_percent").default(15).notNull(),
  taxCents: bigint("tax_cents", { mode: "number" }).default(0).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).default(0).notNull(),
  paidCents: bigint("paid_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Status
  status: mysqlEnum("status", ["draft", "sent", "viewed", "unpaid", "partial", "paid", "overdue", "cancelled"]).default("draft").notNull(),
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
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type InsertBillingInvoice = typeof billingInvoices.$inferInsert;

/**
 * billing_payments — Records of payments received against an invoice.
 * Supports partial payments and multiple payment records per invoice.
 */
export const billingPayments = mysqlTable("billing_payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoice_id").notNull(), // FK → billing_invoices.id
  clientId: int("client_id").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  paymentMethod: mysqlEnum("payment_method", ["eft", "bank_transfer", "cheque", "credit_card", "other"]).default("eft").notNull(),
  reference: varchar("reference", { length: 255 }), // bank reference or POP reference
  paidAt: timestamp("paid_at").notNull(),
  notes: text("notes"),
  recordedByUserId: int("recorded_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingPayment = typeof billingPayments.$inferSelect;
export type InsertBillingPayment = typeof billingPayments.$inferInsert;

/**
 * billing_client_contacts — Multiple contacts per client.
 * One client can have many contacts (CFO, IR Manager, Legal, etc.)
 */
export const billingClientContacts = mysqlTable("billing_client_contacts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id").notNull(), // FK → billing_clients.id
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingClientContact = typeof billingClientContacts.$inferSelect;
export type InsertBillingClientContact = typeof billingClientContacts.$inferInsert;

/**
 * billing_quote_versions — Tracks revisions of a quote (v1, v2, v3).
 * Each revision is a snapshot of the quote at a point in time.
 * The parent quote always reflects the latest version.
 */
export const billingQuoteVersions = mysqlTable("billing_quote_versions", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quote_id").notNull(), // FK → billing_quotes.id
  versionNumber: int("version_number").notNull(), // 1, 2, 3...
  // Snapshot of financials at this version
  subtotalCents: bigint("subtotal_cents", { mode: "number" }).notNull(),
  discountCents: bigint("discount_cents", { mode: "number" }).default(0).notNull(),
  taxPercent: int("tax_percent").default(15).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Snapshot of line items as JSON (denormalised for historical accuracy)
  lineItemsSnapshot: text("line_items_snapshot").notNull(), // JSON array
  // Change summary
  changeNotes: text("change_notes"), // e.g. "Reduced platform fee, added training line"
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BillingQuoteVersion = typeof billingQuoteVersions.$inferSelect;
export type InsertBillingQuoteVersion = typeof billingQuoteVersions.$inferInsert;

/**
 * billing_credit_notes — Credit notes issued against invoices.
 * Can be full or partial credits. Reduces the outstanding balance.
 */
export const billingCreditNotes = mysqlTable("billing_credit_notes", {
  id: int("id").autoincrement().primaryKey(),
  creditNoteNumber: varchar("credit_note_number", { length: 32 }).notNull().unique(), // e.g. "CN-2026-0001"
  invoiceId: int("invoice_id").notNull(), // FK → billing_invoices.id
  clientId: int("client_id").notNull(),   // FK → billing_clients.id
  // Financials
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(), // Credit amount (before tax)
  taxPercent: int("tax_percent").default(15).notNull(),
  taxCents: bigint("tax_cents", { mode: "number" }).default(0).notNull(),
  totalCents: bigint("total_cents", { mode: "number" }).notNull(), // Total credit including tax
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  // Details
  reason: text("reason").notNull(), // Why the credit was issued
  status: mysqlEnum("status", ["draft", "issued", "applied", "cancelled"]).default("draft").notNull(),
  // Client-facing access token
  accessToken: varchar("access_token", { length: 64 }).unique(),
  issuedAt: timestamp("issued_at"),
  appliedAt: timestamp("applied_at"),
  internalNotes: text("internal_notes"),
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingCreditNote = typeof billingCreditNotes.$inferSelect;
export type InsertBillingCreditNote = typeof billingCreditNotes.$inferInsert;

/**
 * billing_fx_rates — Cached live exchange rates for ZAR, USD, EUR.
 * Refreshed on demand via external API. Used for currency conversion on quotes/invoices.
 */
export const billingFxRates = mysqlTable("billing_fx_rates", {
  id: int("id").autoincrement().primaryKey(),
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
export const billingActivityLog = mysqlTable("billing_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  // Entity references (one of these will be set)
  quoteId: int("quote_id"),     // FK → billing_quotes.id
  invoiceId: int("invoice_id"), // FK → billing_invoices.id
  clientId: int("client_id").notNull(),
  // Event details
  eventType: varchar("event_type", { length: 64 }).notNull(),
  // e.g. "quote.created", "quote.sent", "quote.viewed", "quote.accepted",
  //      "quote.version_created", "invoice.created", "invoice.sent",
  //      "invoice.viewed", "invoice.payment_recorded", "invoice.overdue",
  //      "credit_note.issued", "email.opened"
  description: text("description").notNull(), // Human-readable summary
  metadata: text("metadata"),  // JSON: extra context (e.g. old/new status, amount, IP)
  // Actor
  actorUserId: int("actor_user_id"),   // CuraLive team member (null = system/client)
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
export const billingLineItemTemplates = mysqlTable("billing_line_item_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Standard Earnings Call Package"
  description: text("description").notNull(),        // Default line item description
  category: varchar("category", { length: 128 }).notNull(),
  defaultUnitPriceCents: bigint("default_unit_price_cents", { mode: "number" }).notNull(),
  defaultCurrency: varchar("default_currency", { length: 8 }).default("ZAR").notNull(),
  // Package templates contain multiple line items (stored as JSON)
  isPackage: boolean("is_package").default(false).notNull(),
  packageItemsJson: text("package_items_json"), // JSON array of line items for package templates
  // Usage tracking
  usageCount: int("usage_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingLineItemTemplate = typeof billingLineItemTemplates.$inferSelect;
export type InsertBillingLineItemTemplate = typeof billingLineItemTemplates.$inferInsert;

/**
 * billing_email_events — Email open and click tracking for quotes and invoices.
 * A 1x1 pixel is embedded in each email; when loaded it records an open event.
 */
export const billingEmailEvents = mysqlTable("billing_email_events", {
  id: int("id").autoincrement().primaryKey(),
  // Tracking token (unique per email send)
  trackingToken: varchar("tracking_token", { length: 64 }).notNull().unique(),
  // Entity references
  quoteId: int("quote_id"),
  invoiceId: int("invoice_id"),
  creditNoteId: int("credit_note_id"),
  clientId: int("client_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
  // Email metadata
  emailType: varchar("email_type", { length: 32 }).notNull(),
  // "quote_sent" | "invoice_sent" | "credit_note_sent" | "payment_reminder" | "quote_expiry_reminder"
  subject: varchar("subject", { length: 512 }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  // Open tracking
  firstOpenedAt: timestamp("first_opened_at"),
  openCount: int("open_count").default(0).notNull(),
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
export const billingRecurringTemplates = mysqlTable("billing_recurring_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Nedbank Monthly Platform License"
  clientId: int("client_id").notNull(),
  // Quote template fields
  titleTemplate: varchar("title_template", { length: 512 }).notNull(),
  // Supports tokens: {month}, {quarter}, {year} e.g. "Platform License — {month} {year}"
  lineItemsJson: text("line_items_json").notNull(), // JSON array of line items
  discountPercent: int("discount_percent").default(0).notNull(),
  taxPercent: int("tax_percent").default(15).notNull(),
  currency: varchar("currency", { length: 8 }).default("ZAR").notNull(),
  paymentTerms: text("payment_terms"),
  // Schedule
  frequency: mysqlEnum("frequency", ["monthly", "quarterly", "annually"]).notNull(),
  dayOfMonth: int("day_of_month").default(1).notNull(), // Day of month to generate (1–28)
  nextGenerationAt: timestamp("next_generation_at").notNull(),
  lastGeneratedAt: timestamp("last_generated_at"),
  // Control
  isActive: boolean("is_active").default(true).notNull(),
  autoDraft: boolean("auto_draft").default(true).notNull(), // true = auto-create draft; false = notify only
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BillingRecurringTemplate = typeof billingRecurringTemplates.$inferSelect;
export type InsertBillingRecurringTemplate = typeof billingRecurringTemplates.$inferInsert;

// ─── Training Mode Tables ─────────────────────────────────────────────────────

export const trainingModeSessions = mysqlTable("training_mode_sessions", {
  id: int("id").autoincrement().primaryKey(),
  operatorId: int("operator_id").notNull(),
  operatorName: varchar("operator_name", { length: 255 }).notNull(),
  sessionName: varchar("session_name", { length: 255 }).notNull(),
  scenario: varchar("scenario", { length: 64 }).notNull(),
  mentorId: int("mentor_id"),
  status: mysqlEnum("status", ["active", "completed", "paused"]).default("active").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TrainingModeSession = typeof trainingModeSessions.$inferSelect;
export type InsertTrainingModeSession = typeof trainingModeSessions.$inferInsert;

export const trainingConferences = mysqlTable("training_conferences", {
  id: int("id").autoincrement().primaryKey(),
  trainingSessionId: int("training_session_id").notNull(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  callId: varchar("call_id", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  product: varchar("product", { length: 128 }),
  status: mysqlEnum("status", ["pending", "active", "completed"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TrainingConference = typeof trainingConferences.$inferSelect;
export type InsertTrainingConference = typeof trainingConferences.$inferInsert;

export const trainingParticipants = mysqlTable("training_participants", {
  id: int("id").autoincrement().primaryKey(),
  trainingConferenceId: int("training_conference_id").notNull(),
  lineNumber: int("line_number").notNull(),
  role: varchar("role", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 32 }),
  state: mysqlEnum("state", ["incoming", "connected", "disconnected"]).default("incoming").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingParticipant = typeof trainingParticipants.$inferSelect;
export type InsertTrainingParticipant = typeof trainingParticipants.$inferInsert;

export const trainingLounge = mysqlTable("training_lounge", {
  id: int("id").autoincrement().primaryKey(),
  trainingSessionId: int("training_session_id").notNull(),
  participantName: varchar("participant_name", { length: 255 }).notNull(),
  waitingSince: timestamp("waiting_since").defaultNow().notNull(),
  status: mysqlEnum("status", ["waiting", "admitted", "left"]).default("waiting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingLoungeEntry = typeof trainingLounge.$inferSelect;
export type InsertTrainingLoungeEntry = typeof trainingLounge.$inferInsert;

export const trainingCallLogs = mysqlTable("training_call_logs", {
  id: int("id").autoincrement().primaryKey(),
  trainingSessionId: int("training_session_id").notNull(),
  trainingConferenceId: int("training_conference_id").notNull(),
  operatorId: int("operator_id").notNull(),
  participantName: varchar("participant_name", { length: 255 }).notNull(),
  callDuration: int("call_duration").default(0).notNull(),
  callQuality: mysqlEnum("call_quality", ["poor", "fair", "good", "excellent"]).default("good").notNull(),
  operatorPerformance: text("operator_performance"),
  participantFeedback: text("participant_feedback"),
  recordingUrl: varchar("recording_url", { length: 1024 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrainingCallLog = typeof trainingCallLogs.$inferSelect;
export type InsertTrainingCallLog = typeof trainingCallLogs.$inferInsert;

export const trainingPerformanceMetrics = mysqlTable("training_performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  trainingSessionId: int("training_session_id").notNull(),
  operatorId: int("operator_id").notNull(),
  totalCallsHandled: int("total_calls_handled").default(0).notNull(),
  averageCallDuration: int("average_call_duration").default(0).notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TrainingPerformanceMetric = typeof trainingPerformanceMetrics.$inferSelect;
export type InsertTrainingPerformanceMetric = typeof trainingPerformanceMetrics.$inferInsert;

// ─── Post-Event AI Report ─────────────────────────────────────────────────────

export const postEventReports = mysqlTable("post_event_reports", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  generatedBy: int("generated_by").notNull(),
  reportType: mysqlEnum("report_type", ["full", "executive", "compliance"]).default("full").notNull(),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  aiSummary: longtext("ai_summary"),
  keyMoments: longtext("key_moments"),
  sentimentOverview: longtext("sentiment_overview"),
  qaSummary: longtext("qa_summary"),
  engagementMetrics: longtext("engagement_metrics"),
  complianceFlags: longtext("compliance_flags"),
  fullTranscriptUrl: text("full_transcript_url"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PostEventReport = typeof postEventReports.$inferSelect;
export type InsertPostEventReport = typeof postEventReports.$inferInsert;

// ─── Transcription Jobs ───────────────────────────────────────────────────────

export const transcriptionJobs = mysqlTable("transcription_jobs", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  source: mysqlEnum("source", ["forge_ai", "whisper", "manual"]).default("forge_ai").notNull(),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed"]).default("queued").notNull(),
  languageDetected: varchar("language_detected", { length: 16 }),
  languagesRequested: text("languages_requested"),
  audioUrl: text("audio_url"),
  durationSeconds: int("duration_seconds"),
  wordCount: int("word_count"),
  confidenceScore: varchar("confidence_score", { length: 8 }),
  speakerCount: int("speaker_count"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TranscriptionJob = typeof transcriptionJobs.$inferSelect;
export type InsertTranscriptionJob = typeof transcriptionJobs.$inferInsert;

// ─── Live Polling ─────────────────────────────────────────────────────────────

export const polls = mysqlTable("polls", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  createdBy: int("created_by").notNull(),
  question: text("question").notNull(),
  pollType: mysqlEnum("poll_type", ["multiple_choice", "rating_scale", "word_cloud", "yes_no"]).default("multiple_choice").notNull(),
  status: mysqlEnum("status", ["draft", "active", "closed", "archived"]).default("draft").notNull(),
  allowMultiple: boolean("allow_multiple").default(false).notNull(),
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
  displayOrder: int("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;

export const pollOptions = mysqlTable("poll_options", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("poll_id").notNull(),
  optionText: varchar("option_text", { length: 512 }).notNull(),
  optionOrder: int("option_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollOption = typeof pollOptions.$inferInsert;

export const pollVotes = mysqlTable("poll_votes", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("poll_id").notNull(),
  optionId: int("option_id"),
  voterId: int("voter_id"),
  voterSession: varchar("voter_session", { length: 128 }),
  textResponse: text("text_response"),
  ratingValue: int("rating_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = typeof pollVotes.$inferInsert;

// ─── Event Scheduling & Calendar ─────────────────────────────────────────────

export const eventSchedules = mysqlTable("event_schedules", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Johannesburg").notNull(),
  recurrenceRule: varchar("recurrence_rule", { length: 512 }),
  parentScheduleId: int("parent_schedule_id"),
  setupMinutes: int("setup_minutes").default(30).notNull(),
  teardownMinutes: int("teardown_minutes").default(15).notNull(),
  status: mysqlEnum("status", ["tentative", "confirmed", "cancelled"]).default("tentative").notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EventSchedule = typeof eventSchedules.$inferSelect;
export type InsertEventSchedule = typeof eventSchedules.$inferInsert;

export const operatorAvailability = mysqlTable("operator_availability", {
  id: int("id").autoincrement().primaryKey(),
  operatorId: int("operator_id").notNull(),
  dayOfWeek: int("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  overrideDate: varchar("override_date", { length: 16 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type OperatorAvailability = typeof operatorAvailability.$inferSelect;
export type InsertOperatorAvailability = typeof operatorAvailability.$inferInsert;

export const resourceAllocations = mysqlTable("resource_allocations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  resourceType: mysqlEnum("resource_type", ["dial_in_number", "rtmp_key", "mux_stream", "recall_bot", "ably_channel"]).notNull(),
  resourceIdentifier: varchar("resource_identifier", { length: 256 }).notNull(),
  allocatedAt: timestamp("allocated_at").defaultNow().notNull(),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ResourceAllocation = typeof resourceAllocations.$inferSelect;
export type InsertResourceAllocation = typeof resourceAllocations.$inferInsert;

export const eventTemplates = mysqlTable("event_templates", {
  id: int("id").autoincrement().primaryKey(),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  createdBy: int("created_by").notNull(),
  eventType: mysqlEnum("event_type", ["earnings_call", "investor_day", "roadshow", "webcast", "audio_bridge", "board_briefing"]).notNull(),
  defaultDurationMinutes: int("default_duration_minutes").default(60).notNull(),
  defaultSetupMinutes: int("default_setup_minutes").default(30).notNull(),
  defaultFeatures: text("default_features"),
  defaultPlatform: mysqlEnum("default_platform", ["zoom", "teams", "webex", "rtmp", "pstn"]).default("pstn").notNull(),
  dialInCountries: text("dial_in_countries"),
  maxAttendees: int("max_attendees").default(500).notNull(),
  requiresRegistration: boolean("requires_registration").default(true).notNull(),
  complianceEnabled: boolean("compliance_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EventTemplate = typeof eventTemplates.$inferSelect;
export type InsertEventTemplate = typeof eventTemplates.$inferInsert;

// ─── White-Label Client Portal ────────────────────────────────────────────────

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 16 }).default("#6c3fc5").notNull(),
  secondaryColor: varchar("secondary_color", { length: 16 }).default("#1a1a2e").notNull(),
  customDomain: varchar("custom_domain", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  billingTier: mysqlEnum("billing_tier", ["starter", "professional", "enterprise"]).default("professional").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

export const clientPortals = mysqlTable("client_portals", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id").notNull(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  customTitle: varchar("custom_title", { length: 512 }),
  customDescription: text("custom_description"),
  passwordProtected: boolean("password_protected").default(false).notNull(),
  accessCode: varchar("access_code", { length: 64 }),
  viewCount: int("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientPortal = typeof clientPortals.$inferSelect;
export type InsertClientPortal = typeof clientPortals.$inferInsert;

// ─── Compliance Audit Trail ───────────────────────────────────────────────────

export const complianceFlags = mysqlTable("compliance_flags", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  statementText: text("statement_text").notNull(),
  timestamp: varchar("timestamp", { length: 16 }),
  speakerName: varchar("speaker_name", { length: 255 }),
  riskLevel: mysqlEnum("risk_level", ["low", "medium", "high"]).default("low").notNull(),
  flagReason: text("flag_reason"),
  complianceStatus: mysqlEnum("compliance_status", ["flagged", "reviewed", "approved", "disclosed"]).default("flagged").notNull(),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComplianceFlag = typeof complianceFlags.$inferSelect;
export type InsertComplianceFlag = typeof complianceFlags.$inferInsert;

export const complianceAuditLog = mysqlTable("compliance_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  action: mysqlEnum("action", ["flagged", "reviewed", "approved", "disclosed", "certificate_generated", "exported"]).notNull(),
  userId: int("user_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComplianceAuditLogEntry = typeof complianceAuditLog.$inferSelect;
export type InsertComplianceAuditLogEntry = typeof complianceAuditLog.$inferInsert;

// ─── Investor Follow-Up Workflow ──────────────────────────────────────────────

export const investorFollowups = mysqlTable("investor_followups", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  investorName: varchar("investor_name", { length: 255 }),
  investorEmail: varchar("investor_email", { length: 320 }),
  investorCompany: varchar("investor_company", { length: 255 }),
  questionText: text("question_text"),
  commitmentText: text("commitment_text"),
  followUpStatus: mysqlEnum("follow_up_status", ["pending", "contacted", "resolved", "dismissed"]).default("pending").notNull(),
  crmContactId: varchar("crm_contact_id", { length: 128 }),
  crmActivityId: varchar("crm_activity_id", { length: 128 }),
  emailTemplate: text("email_template"),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type InvestorFollowup = typeof investorFollowups.$inferSelect;
export type InsertInvestorFollowup = typeof investorFollowups.$inferInsert;

export const followupEmails = mysqlTable("followup_emails", {
  id: int("id").autoincrement().primaryKey(),
  followupId: int("followup_id").notNull(),
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

export const sentimentSnapshots = mysqlTable("sentiment_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull(),
  overallScore: int("overall_score").default(50).notNull(),
  bullishCount: int("bullish_count").default(0).notNull(),
  neutralCount: int("neutral_count").default(0).notNull(),
  bearishCount: int("bearish_count").default(0).notNull(),
  topSentimentDrivers: text("top_sentiment_drivers"),
  perSpeakerSentiment: text("per_speaker_sentiment"), // JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SentimentSnapshot = typeof sentimentSnapshots.$inferSelect;
export type InsertSentimentSnapshot = typeof sentimentSnapshots.$inferInsert;

export const aiGeneratedContent = mysqlTable("ai_generated_content", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
  contentType: varchar("content_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  editedContent: text("edited_content"),
  status: varchar("status", { length: 32 }).default("generated").notNull(),
  recipients: text("recipients"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: int("generated_by"),
  approvedAt: timestamp("approved_at"),
  approvedBy: int("approved_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  sentAt: timestamp("sent_at"),
  sentTo: text("sent_to"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAiGeneratedContent = typeof aiGeneratedContent.$inferInsert;

export const occTranscriptionSegments = mysqlTable("occ_transcription_segments", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conference_id").notNull(),
  speakerName: varchar("speaker_name", { length: 255 }),
  speakerRole: varchar("speaker_role", { length: 64 }),
  text: text("text"),
  startTime: int("start_time"),
  endTime: int("end_time"),
  confidence: float("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const occLiveRollingSummaries = mysqlTable("occ_live_rolling_summaries", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: varchar("conference_id", { length: 128 }).notNull(),
  summary: text("summary").notNull(),
  segmentCount: int("segment_count").default(0).notNull(),
  fromTimeMs: int("from_time_ms"),
  toTimeMs: int("to_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaAutoTriageResults = mysqlTable("qa_auto_triage_results", {
  id: int("id").autoincrement().primaryKey(),
  qaId: int("qa_id").notNull(),
  conferenceId: int("conference_id"),
  classification: varchar("classification", { length: 32 }).notNull(),
  confidence: float("confidence"),
  reason: text("reason"),
  isSensitive: tinyint("is_sensitive").default(0).notNull(),
  sensitivityFlags: text("sensitivity_flags"),
  triageScore: float("triage_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const speakingPaceAnalysis = mysqlTable("speaking_pace_analysis", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: varchar("conference_id", { length: 128 }).notNull(),
  segmentId: int("segment_id"),
  speakerName: varchar("speaker_name", { length: 255 }),
  wordsPerMinute: float("words_per_minute"),
  fillerWordCount: int("filler_word_count").default(0).notNull(),
  pauseCount: int("pause_count").default(0).notNull(),
  coachingFeedback: text("coaching_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const toxicityFilterResults = mysqlTable("toxicity_filter_results", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("content_id").notNull(),
  contentType: varchar("content_type", { length: 32 }).default("qa").notNull(),
  toxicityScore: float("toxicity_score").default(0),
  categories: text("categories"),
  flagged: tinyint("flagged").default(0).notNull(),
  actionTaken: varchar("action_taken", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcriptEdits = mysqlTable("transcript_edits", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conference_id"),
  segmentId: int("segment_id").default(0),
  transcriptionSegmentId: int("transcription_segment_id"),
  operatorId: int("operator_id"),
  operatorName: varchar("operator_name", { length: 255 }),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  editType: varchar("edit_type", { length: 64 }).notNull(),
  reason: text("reason"),
  confidence: float("confidence"),
  approved: boolean("approved").default(false),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transcriptVersions = mysqlTable("transcript_versions", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conference_id"),
  versionNumber: int("version_number").notNull(),
  fullTranscript: text("full_transcript").notNull(),
  editCount: int("edit_count").default(0),
  changeDescription: text("change_description"),
  createdBy: int("created_by"),
  createdByName: varchar("created_by_name", { length: 255 }),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcriptEditAuditLog = mysqlTable("transcript_edit_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: int("conference_id"),
  editId: int("edit_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  userId: int("actor_id"),
  userName: varchar("actor_name", { length: 255 }),
  userRole: varchar("user_role", { length: 64 }),
  details: text("details"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventBriefResults = mysqlTable("event_brief_results", {
  id: int("id").autoincrement().primaryKey(),
  conferenceId: varchar("conference_id", { length: 128 }),
  eventId: int("event_id"),
  briefType: varchar("brief_type", { length: 64 }).notNull(),
  content: text("content").notNull(),
  operatorApproved: tinyint("operator_approved").default(0),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentEngagementEvents = mysqlTable("content_engagement_events", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("content_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  eventType: mysqlEnum("event_type", ["sent", "opened", "clicked", "responded", "bounced", "unsubscribed"]).notNull(),
  eventData: text("event_data"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const contentPerformanceMetrics = mysqlTable("content_performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("content_id").notNull(),
  eventId: int("event_id").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  approvalStatus: mysqlEnum("approval_status", ["approved", "rejected", "pending"]).notNull().default("pending"),
  approvalTime: int("approval_time"),
  approvalScore: varchar("approval_score", { length: 16 }),
  recipientCount: int("recipient_count").default(0),
  sentCount: int("sent_count").default(0),
  openCount: int("open_count").default(0),
  clickCount: int("click_count").default(0),
  responseCount: int("response_count").default(0),
  openRate: varchar("open_rate", { length: 16 }).default("0"),
  clickThroughRate: varchar("click_through_rate", { length: 16 }).default("0"),
  responseRate: varchar("response_rate", { length: 16 }).default("0"),
  engagementScore: varchar("engagement_score", { length: 16 }).default("0"),
  qualityScore: varchar("quality_score", { length: 16 }),
  relevanceScore: varchar("relevance_score", { length: 16 }),
  professionalismScore: varchar("professionalism_score", { length: 16 }),
  editsCount: int("edits_count").default(0),
  rejectionReason: varchar("rejection_reason", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentTypePerformance = mysqlTable("content_type_performance", {
  id: int("id").autoincrement().primaryKey(),
  contentType: varchar("content_type", { length: 64 }).notNull(),
  totalGenerated: int("total_generated").default(0),
  approvalRate: varchar("approval_rate", { length: 16 }).default("0"),
  avgOpenRate: varchar("avg_open_rate", { length: 16 }).default("0"),
  avgClickThroughRate: varchar("avg_click_through_rate", { length: 16 }).default("0"),
  performanceRank: int("performance_rank").default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const eventPerformanceSummary = mysqlTable("event_performance_summary", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
  contentItemsGenerated: int("content_items_generated").default(0),
  contentItemsApproved: int("content_items_approved").default(0),
  contentItemsRejected: int("content_items_rejected").default(0),
  overallApprovalRate: varchar("overall_approval_rate", { length: 16 }).default("0"),
  avgTimeToApproval: int("avg_time_to_approval"),
  totalContentSent: int("total_content_sent").default(0),
  totalEngagements: int("total_engagements").default(0),
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
export const reportKeyMoments = mysqlTable("report_key_moments", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id").notNull(),
  timestampSeconds: int("timestamp_seconds").notNull(),
  momentType: mysqlEnum("moment_type", ["insight", "action_item", "question", "highlight", "disclaimer"]).notNull(),
  content: text("content").notNull(),
  speaker: varchar("speaker", { length: 255 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ReportKeyMoment = typeof reportKeyMoments.$inferSelect;
export type InsertReportKeyMoment = typeof reportKeyMoments.$inferInsert;

/**
 * compliance_certificates — Regulatory compliance certificates generated for events.
 */
export const complianceCertificates = mysqlTable("compliance_certificates", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  certificateId: varchar("certificate_id", { length: 64 }).notNull().unique(),
  pdfUrl: text("pdf_url").notNull(),
  generatedBy: int("generated_by"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  signedBy: int("signed_by"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComplianceCertificate = typeof complianceCertificates.$inferSelect;
export type InsertComplianceCertificate = typeof complianceCertificates.$inferInsert;

/**
 * push_subscriptions — Browser push notification subscriptions for users.
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"), // null for anonymous attendees
  eventId: varchar("event_id", { length: 128 }),
  endpoint: text("endpoint").notNull(),
  p256dhKey: varchar("p256dh_key", { length: 255 }).notNull(),
  authKey: varchar("auth_key", { length: 255 }).notNull(),
  deviceType: mysqlEnum("device_type", ["mobile", "desktop", "tablet"]).default("mobile"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * white_label_clients — Enterprise clients with custom branded portals.
 */
export const whiteLabelClients = mysqlTable("white_label_clients", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#000000"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#ffffff"),
  accentColor: varchar("accent_color", { length: 7 }).default("#007bff"),
  customDomain: varchar("custom_domain", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactName: varchar("contact_name", { length: 255 }),
  billingTier: mysqlEnum("billing_tier", ["starter", "professional", "enterprise"]).default("starter").notNull(),
  maxConcurrentEvents: int("max_concurrent_events").default(1),
  maxMonthlyEvents: int("max_monthly_events").default(5),
  featuresEnabled: text("features_enabled"), // JSON array of enabled feature keys
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WhiteLabelClient = typeof whiteLabelClients.$inferSelect;
export type InsertWhiteLabelClient = typeof whiteLabelClients.$inferInsert;

/**
 * client_event_assignments — Maps events to white-label client portals.
 */
export const clientEventAssignments = mysqlTable("client_event_assignments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id").notNull(),
  eventId: int("event_id").notNull(), // maps to events.id
  displayOrder: int("display_order").default(0).notNull(),
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
export const socialMediaAccounts = mysqlTable("social_media_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "facebook", "instagram", "tiktok"]).notNull(),
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = typeof socialMediaAccounts.$inferInsert;

/**
 * social_posts — AI-generated or manual posts tied to events.
 */
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id"),
  createdBy: int("created_by").notNull(),
  content: longtext("content").notNull(),
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  echoSource: varchar("echo_source", { length: 64 }),
  contentType: mysqlEnum("content_type", ["text", "image", "video", "link"]).default("text").notNull(),
  platforms: text("platforms").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "scheduled", "published", "failed"]).default("draft").notNull(),
  moderationStatus: mysqlEnum("moderation_status", ["pending", "approved", "flagged", "rejected"]).default("pending").notNull(),
  moderationNotes: text("moderation_notes"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

/**
 * social_post_platforms — Per-platform publish status for each post.
 */
export const socialPostPlatforms = mysqlTable("social_post_platforms", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("post_id").notNull(),
  accountId: int("account_id").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "facebook", "instagram", "tiktok"]).notNull(),
  externalPostId: varchar("external_post_id", { length: 255 }),
  publishStatus: mysqlEnum("publish_status", ["pending", "published", "failed"]).default("pending").notNull(),
  publishedAt: timestamp("published_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SocialPostPlatform = typeof socialPostPlatforms.$inferSelect;
export type InsertSocialPostPlatform = typeof socialPostPlatforms.$inferInsert;

/**
 * social_metrics — Engagement metrics per post with event ROI correlation.
 */
export const socialMetrics = mysqlTable("social_metrics", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("post_id").notNull(),
  accountId: int("account_id").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "facebook", "instagram", "tiktok"]).notNull(),
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  engagementRate: float("engagement_rate").default(0).notNull(),
  roiCorrelation: float("roi_correlation").default(0).notNull(),
  aiInsight: text("ai_insight"),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

export type SocialMetric = typeof socialMetrics.$inferSelect;
export type InsertSocialMetric = typeof socialMetrics.$inferInsert;

/**
 * social_audit_log — Immutable compliance trail for all social actions.
 */
export const socialAuditLog = mysqlTable("social_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  postId: int("post_id"),
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
export const webcastEnhancements = mysqlTable("webcast_enhancements", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  personalizationEnabled: boolean("personalization_enabled").default(true).notNull(),
  xrEnabled: boolean("xr_enabled").default(false).notNull(),
  languageDubbingEnabled: boolean("language_dubbing_enabled").default(false).notNull(),
  dubbingLanguage: varchar("dubbing_language", { length: 32 }).default("en").notNull(),
  sustainabilityScore: float("sustainability_score").default(0).notNull(),
  adIntegrationEnabled: boolean("ad_integration_enabled").default(false).notNull(),
  adPreRollEnabled: boolean("ad_pre_roll_enabled").default(false).notNull(),
  adMidRollEnabled: boolean("ad_mid_roll_enabled").default(false).notNull(),
  noiseEnhancementEnabled: boolean("noise_enhancement_enabled").default(true).notNull(),
  noiseGateEnabled: boolean("noise_gate_enabled").default(true).notNull(),
  echoCancellationEnabled: boolean("echo_cancellation_enabled").default(true).notNull(),
  autoGainEnabled: boolean("auto_gain_enabled").default(false).notNull(),
  podcastGeneratedAt: timestamp("podcast_generated_at"),
  podcastTitle: varchar("podcast_title", { length: 512 }),
  podcastScript: longtext("podcast_script"),
  recapGeneratedAt: timestamp("recap_generated_at"),
  recapBrief: longtext("recap_brief"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WebcastEnhancement = typeof webcastEnhancements.$inferSelect;
export type InsertWebcastEnhancement = typeof webcastEnhancements.$inferInsert;

/**
 * webcast_analytics — expanded ROI and sustainability analytics per event.
 */
export const webcastAnalyticsExpanded = mysqlTable("webcast_analytics_expanded", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  viewerEngagement: float("viewer_engagement").default(0).notNull(),
  roiUplift: float("roi_uplift").default(0).notNull(),
  carbonFootprintKg: float("carbon_footprint_kg").default(0).notNull(),
  carbonSavedKg: float("carbon_saved_kg").default(0).notNull(),
  attendeesTravelAvoided: int("attendees_travel_avoided").default(0).notNull(),
  adRevenue: float("ad_revenue").default(0).notNull(),
  podcastListens: int("podcast_listens").default(0).notNull(),
  recapViews: int("recap_views").default(0).notNull(),
  sustainabilityGrade: varchar("sustainability_grade", { length: 4 }).default("B").notNull(),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

export type WebcastAnalyticsExpanded = typeof webcastAnalyticsExpanded.$inferSelect;
export type InsertWebcastAnalyticsExpanded = typeof webcastAnalyticsExpanded.$inferInsert;

export const interconnectionActivations = mysqlTable("interconnection_activations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  userId: int("user_id").default(0).notNull(),
  featureId: varchar("feature_id", { length: 64 }).notNull(),
  connectedFeatureId: varchar("connected_feature_id", { length: 64 }).notNull(),
  activationSource: varchar("activation_source", { length: 32 }).default("manual").notNull(),
  roiMultiplier: float("roi_multiplier").default(1.0).notNull(),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
});

export type InterconnectionActivation = typeof interconnectionActivations.$inferSelect;
export type InsertInterconnectionActivation = typeof interconnectionActivations.$inferInsert;

export const interconnectionAnalytics = mysqlTable("interconnection_analytics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 16 }).notNull(),
  totalActivations: int("total_activations").default(0).notNull(),
  uniqueFeatures: int("unique_features").default(0).notNull(),
  avgConnectionsPerUser: float("avg_connections_per_user").default(0).notNull(),
  topFeatureId: varchar("top_feature_id", { length: 64 }),
  roiRealized: float("roi_realized").default(0).notNull(),
  workflowCompletionRate: float("workflow_completion_rate").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InterconnectionAnalyticsRow = typeof interconnectionAnalytics.$inferSelect;
export type InsertInterconnectionAnalytics = typeof interconnectionAnalytics.$inferInsert;

export const virtualStudios = mysqlTable("virtual_studios", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  bundleId: varchar("bundle_id", { length: 8 }).notNull(),
  studioName: varchar("studio_name", { length: 255 }).default("My Virtual Studio").notNull(),
  avatarStyle: varchar("avatar_style", { length: 32 }).default("professional").notNull(),
  primaryLanguage: varchar("primary_language", { length: 8 }).default("en").notNull(),
  dubbingLanguages: text("dubbing_languages"),
  esgEnabled: boolean("esg_enabled").default(false).notNull(),
  replayEnabled: boolean("replay_enabled").default(true).notNull(),
  overlaysConfig: longtext("overlays_config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VirtualStudio = typeof virtualStudios.$inferSelect;
export type InsertVirtualStudio = typeof virtualStudios.$inferInsert;

export const esgStudioFlags = mysqlTable("esg_studio_flags", {
  id: int("id").autoincrement().primaryKey(),
  studioId: int("studio_id").notNull(),
  flagType: varchar("flag_type", { length: 64 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 16 }).default("medium").notNull(),
  contentSnippet: text("content_snippet"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EsgStudioFlag = typeof esgStudioFlags.$inferSelect;
export type InsertEsgStudioFlag = typeof esgStudioFlags.$inferInsert;

export const studioInterconnections = mysqlTable("studio_interconnections", {
  id: int("id").autoincrement().primaryKey(),
  studioId: int("studio_id").notNull(),
  featureId: varchar("feature_id", { length: 64 }).notNull(),
  connectedFeatureId: varchar("connected_feature_id", { length: 64 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  activeAt: timestamp("active_at").defaultNow().notNull(),
});

export type StudioInterconnection = typeof studioInterconnections.$inferSelect;
export type InsertStudioInterconnection = typeof studioInterconnections.$inferInsert;

export const operatorLinkAnalytics = mysqlTable("operator_link_analytics", {
  id: int("id").autoincrement().primaryKey(),
  operatorId: int("operator_id"),
  linkPath: varchar("link_path", { length: 255 }).notNull(),
  linkTitle: varchar("link_title", { length: 255 }),
  category: varchar("category", { length: 64 }),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  timeSpentSeconds: int("time_spent_seconds"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  sessionId: varchar("session_id", { length: 128 }),
});

export type OperatorLinkAnalytic = typeof operatorLinkAnalytics.$inferSelect;
export type InsertOperatorLinkAnalytic = typeof operatorLinkAnalytics.$inferInsert;

export const operatorLinksMetadata = mysqlTable("operator_links_metadata", {
  id: int("id").autoincrement().primaryKey(),
  linkPath: varchar("link_path", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  badgeType: varchar("badge_type", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  clickCount: int("click_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type OperatorLinksMetadatum = typeof operatorLinksMetadata.$inferSelect;
export type InsertOperatorLinksMetadatum = typeof operatorLinksMetadata.$inferInsert;

export const agenticAnalyses = mysqlTable("agentic_analyses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("session_id", { length: 128 }),
  q1Role: varchar("q1_role", { length: 64 }).notNull(),
  q2Challenge: varchar("q2_challenge", { length: 64 }).notNull(),
  q3EventType: varchar("q3_event_type", { length: 64 }).notNull(),
  primaryBundle: varchar("primary_bundle", { length: 64 }).notNull(),
  bundleLetter: varchar("bundle_letter", { length: 4 }).notNull(),
  score: float("score").notNull(),
  aiAction: longtext("ai_action"),
  roiPreview: varchar("roi_preview", { length: 255 }),
  interconnections: text("interconnections"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgenticAnalysis = typeof agenticAnalyses.$inferSelect;
export type InsertAgenticAnalysis = typeof agenticAnalyses.$inferInsert;

export const autonomousInterventions = mysqlTable("autonomous_interventions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  conferenceId: varchar("conference_id", { length: 128 }),
  ruleId: varchar("rule_id", { length: 64 }).notNull(),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  triggerValue: float("trigger_value"),
  threshold: float("threshold"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning").notNull(),
  bundleTriggered: varchar("bundle_triggered", { length: 64 }),
  actionTaken: text("action_taken").notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AutonomousIntervention = typeof autonomousInterventions.$inferSelect;
export type InsertAutonomousIntervention = typeof autonomousInterventions.$inferInsert;

export const taggedMetrics = mysqlTable("tagged_metrics", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }),
  tagType: mysqlEnum("tag_type", ["sentiment", "compliance", "scaling", "engagement", "qa", "intervention"]).notNull(),
  metricValue: float("metric_value").notNull(),
  label: varchar("label", { length: 255 }),
  detail: text("detail"),
  bundle: varchar("bundle", { length: 64 }),
  severity: mysqlEnum("severity", ["positive", "neutral", "negative", "critical"]).default("neutral").notNull(),
  source: varchar("source", { length: 64 }).default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaggedMetric = typeof taggedMetrics.$inferSelect;
export type InsertTaggedMetric = typeof taggedMetrics.$inferInsert;

export const shadowSessions = mysqlTable("shadow_sessions", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: mysqlEnum("event_type", ["earnings_call", "interim_results", "agm", "capital_markets_day", "ceo_town_hall", "board_meeting", "webcast", "investor_day", "roadshow", "special_call", "other"]).notNull(),
  platform: mysqlEnum("platform", ["zoom", "teams", "meet", "webex", "choruscall", "other"]).default("zoom").notNull(),
  meetingUrl: varchar("meeting_url", { length: 1000 }).notNull(),
  recallBotId: varchar("recall_bot_id", { length: 255 }),
  ablyChannel: varchar("ably_channel", { length: 255 }),
  localTranscriptJson: text("local_transcript_json"),
  localRecordingPath: varchar("local_recording_path", { length: 1000 }),
  status: mysqlEnum("status", ["pending", "bot_joining", "live", "processing", "completed", "failed"]).default("pending").notNull(),
  transcriptSegments: int("transcript_segments").default(0),
  sentimentAvg: float("sentiment_avg"),
  complianceFlags: int("compliance_flags").default(0),
  taggedMetricsGenerated: int("tagged_metrics_generated").default(0),
  notes: text("notes"),
  startedAt: bigint("started_at", { mode: "number" }),
  endedAt: bigint("ended_at", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ShadowSession = typeof shadowSessions.$inferSelect;
export type InsertShadowSession = typeof shadowSessions.$inferInsert;

// ─── Operator Corrections (Self-Improving AI Loop) ───────────────────────────
export const operatorCorrections = mysqlTable("operator_corrections", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 255 }),
  metricId: int("metric_id"),
  correctionType: mysqlEnum("correction_type", ["sentiment_override", "compliance_dismiss", "compliance_add", "severity_change", "threshold_adjust"]).notNull(),
  originalValue: float("original_value"),
  correctedValue: float("corrected_value"),
  originalLabel: varchar("original_label", { length: 255 }),
  correctedLabel: varchar("corrected_label", { length: 255 }),
  reason: text("reason"),
  eventType: varchar("event_type", { length: 64 }),
  clientName: varchar("client_name", { length: 255 }),
  operatorId: varchar("operator_id", { length: 255 }).default("operator"),
  appliedToModel: tinyint("applied_to_model").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type OperatorCorrection = typeof operatorCorrections.$inferSelect;
export type InsertOperatorCorrection = typeof operatorCorrections.$inferInsert;

export const adaptiveThresholds = mysqlTable("adaptive_thresholds", {
  id: int("id").autoincrement().primaryKey(),
  thresholdKey: varchar("threshold_key", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }),
  sector: varchar("sector", { length: 64 }),
  metricType: mysqlEnum("metric_type", ["sentiment", "compliance", "engagement"]).notNull(),
  defaultValue: float("default_value").notNull(),
  learnedValue: float("learned_value").notNull(),
  sampleCount: int("sample_count").default(0),
  lastCorrectionAt: timestamp("last_correction_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdaptiveThreshold = typeof adaptiveThresholds.$inferSelect;

export const complianceVocabulary = mysqlTable("compliance_vocabulary", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  source: mysqlEnum("source", ["system", "operator", "learned"]).default("system").notNull(),
  severityWeight: float("severity_weight").default(1.0),
  timesFlagged: int("times_flagged").default(0),
  timesDismissed: int("times_dismissed").default(0),
  effectiveWeight: float("effective_weight").default(1.0),
  sector: varchar("sector", { length: 64 }),
  addedBy: varchar("added_by", { length: 255 }).default("system"),
  active: tinyint("active").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ComplianceKeyword = typeof complianceVocabulary.$inferSelect;

// ─── User Feedback ────────────────────────────────────────────────────────────
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  rating: int("rating").notNull(),
  suggestion: text("suggestion"),
  email: varchar("email", { length: 255 }),
  userId: int("user_id"),
  pageUrl: varchar("page_url", { length: 1000 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// ─── AI-AM Compliance Audit Trail ─────────────────────────────────────────────
// Separate table used by aiAmAuditTrail.ts (different schema from complianceAuditLog)
export const aiAmAuditLog = mysqlTable("ai_am_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  eventId: varchar("event_id", { length: 128 }).notNull(),
  action: mysqlEnum("action", [
    "violation_detected",
    "violation_acknowledged",
    "violation_muted",
    "violation_unmuted",
    "alert_sent",
    "rule_updated",
    "preferences_changed",
  ]).notNull(),
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
export const complianceViolations = mysqlTable("compliance_violations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  violationId: varchar("violation_id", { length: 128 }),
  conferenceId: int("conference_id"),
  violationType: varchar("violation_type", { length: 128 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  confidence: float("confidence"),
  confidenceScore: float("confidence_score"),
  speaker: varchar("speaker", { length: 255 }),
  speakerName: varchar("speaker_name", { length: 255 }),
  speakerRole: varchar("speaker_role", { length: 128 }),
  transcript: text("transcript"),
  transcriptExcerpt: text("transcript_excerpt"),
  startTimeMs: int("start_time_ms"),
  endTimeMs: int("end_time_ms"),
  acknowledged: tinyint("acknowledged").default(0),
  acknowledgedAt: timestamp("acknowledged_at"),
  actionTaken: varchar("action_taken", { length: 64 }).default("none"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ComplianceViolation = typeof complianceViolations.$inferSelect;
export type InsertComplianceViolation = typeof complianceViolations.$inferInsert;

// ─── Alert Preferences ────────────────────────────────────────────────────────
// Used by aiAmNotificationDispatch.ts and test files
export const alertPreferences = mysqlTable("alert_preferences", {
  id: int("id").autoincrement().primaryKey(),
  operatorId: varchar("operator_id", { length: 128 }).notNull().unique(),
  eventId: varchar("event_id", { length: 128 }),
  emailNotificationsEnabled: tinyint("email_notifications_enabled").default(1),
  smsNotificationsEnabled: tinyint("sms_notifications_enabled").default(0),
  inAppNotificationsEnabled: tinyint("in_app_notifications_enabled").default(1),
  emailAddress: varchar("email_address", { length: 320 }),
  phoneNumber: varchar("phone_number", { length: 32 }),
  criticalOnly: tinyint("critical_only").default(0),
  quietHoursEnabled: tinyint("quiet_hours_enabled").default(0),
  quietHoursStart: varchar("quiet_hours_start", { length: 8 }).default("22:00"),
  quietHoursEnd: varchar("quiet_hours_end", { length: 8 }).default("08:00"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  monitoredViolationTypes: text("monitored_violation_types"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = typeof alertPreferences.$inferInsert;

// ─── Alert History ────────────────────────────────────────────────────────────
// Used by aiAmNotificationDispatch.ts and compliance.ts
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
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
export const postEventData = mysqlTable("post_event_data", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(), // references events.eventId
  conferenceId: int("conferenceId"), // references occConferences.id if applicable
  // AI Summary
  aiSummary: text("aiSummary"), // LLM-generated executive summary
  keyTopics: text("keyTopics"), // JSON array of extracted topics
  sentimentTrends: text("sentimentTrends"), // JSON object with sentiment timeline
  keyQuotes: text("keyQuotes"), // JSON array of important quotes with timestamps
  // Transcription
  fullTranscript: longtext("fullTranscript"), // complete word-for-word transcript
  transcriptFormat: varchar("transcriptFormat", { length: 32 }).default("txt"), // txt, pdf, vtt, srt, json
  // Recording
  recordingUrl: varchar("recordingUrl", { length: 512 }), // S3 URL to recording
  recordingKey: varchar("recordingKey", { length: 512 }), // S3 key for retrieval
  recordingDurationSeconds: int("recordingDurationSeconds"),
  // Compliance
  complianceScore: int("complianceScore"), // 0-100 score
  flaggedItems: text("flaggedItems"), // JSON array of compliance violations
  // Analytics
  totalParticipants: int("totalParticipants"),
  totalDuration: int("totalDuration"), // seconds
  engagementScore: int("engagementScore"), // 0-100 score
  analyticsData: text("analyticsData"), // JSON object with detailed metrics
  // Delivery Status
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "failed"]).default("pending").notNull(),
  deliveredAt: timestamp("deliveredAt"),
  // Timestamps
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostEventData = typeof postEventData.$inferSelect;
export type InsertPostEventData = typeof postEventData.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Integration — payment processing for premium features
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stripe Customers — links users to their Stripe customer records.
 */
export const stripeCustomers = mysqlTable("stripe_customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // references users.id
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }).notNull().unique(), // Stripe customer ID
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

/**
 * Stripe Subscriptions — tracks active subscriptions for premium features.
 */
export const stripeSubscriptions = mysqlTable("stripe_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // references users.id
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }).notNull().unique(),
  stripePriceId: varchar("stripePriceId", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["active", "past_due", "unpaid", "canceled", "incomplete"]).default("active").notNull(),
  tier: mysqlEnum("tier", ["basic", "professional", "enterprise"]).default("basic").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

/**
 * Premium Features — tracks which features are enabled for each user based on subscription.
 */
export const premiumFeatures = mysqlTable("premium_features", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // references users.id
  // Feature flags
  advancedAnalytics: boolean("advancedAnalytics").default(false).notNull(),
  complianceReporting: boolean("complianceReporting").default(false).notNull(),
  whiteLabel: boolean("whiteLabel").default(false).notNull(),
  multiLanguageTranscription: boolean("multiLanguageTranscription").default(false).notNull(),
  customBranding: boolean("customBranding").default(false).notNull(),
  apiAccess: boolean("apiAccess").default(false).notNull(),
  // Limits
  maxEventsPerMonth: int("maxEventsPerMonth").default(5),
  maxParticipantsPerEvent: int("maxParticipantsPerEvent").default(500),
  storageGbPerMonth: int("storageGbPerMonth").default(10),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PremiumFeature = typeof premiumFeatures.$inferSelect;
export type InsertPremiumFeature = typeof premiumFeatures.$inferInsert;

/**
 * Stripe Payment Events — audit log for all Stripe webhook events.
 */
export const stripePaymentEvents = mysqlTable("stripe_payment_events", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 128 }).notNull().unique(),
  eventType: varchar("eventType", { length: 128 }).notNull(), // e.g. "payment_intent.succeeded"
  userId: int("userId"), // references users.id if applicable
  data: text("data").notNull(), // JSON payload
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StripePaymentEvent = typeof stripePaymentEvents.$inferSelect;
export type InsertStripePaymentEvent = typeof stripePaymentEvents.$inferInsert;

// ─── Mailing Lists (from Replit sync) ────────────────────────────────────────
export const mailingLists = mysqlTable("mailing_lists", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "processing", "ready", "sending", "sent"]).default("draft").notNull(),
  totalEntries: int("total_entries").default(0).notNull(),
  processedEntries: int("processed_entries").default(0).notNull(),
  emailedEntries: int("emailed_entries").default(0).notNull(),
  registeredEntries: int("registered_entries").default(0).notNull(),
  webhookUrl: varchar("webhook_url", { length: 512 }),
  defaultJoinMethod: mysqlEnum("default_join_method", ["phone", "teams", "zoom", "web"]),
  preRegistered: boolean("pre_registered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type MailingList = typeof mailingLists.$inferSelect;
export type InsertMailingList = typeof mailingLists.$inferInsert;

export const mailingListEntries = mysqlTable("mailing_list_entries", {
  id: int("id").autoincrement().primaryKey(),
  mailingListId: int("mailing_list_id").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  accessPin: varchar("access_pin", { length: 8 }),
  status: mysqlEnum("status", ["pending", "pin_assigned", "emailed", "clicked", "registered"]).default("pending").notNull(),
  joinMethod: mysqlEnum("join_method", ["phone", "teams", "zoom", "web"]),
  registrationId: int("registration_id"),
  confirmToken: varchar("confirm_token", { length: 64 }),
  emailSentAt: timestamp("email_sent_at"),
  clickedAt: timestamp("clicked_at"),
  registeredAt: timestamp("registered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MailingListEntry = typeof mailingListEntries.$inferSelect;
export type InsertMailingListEntry = typeof mailingListEntries.$inferInsert;

// ─── CRM API Keys (from Replit sync) ─────────────────────────────────────────
export const crmApiKeys = mysqlTable("crm_api_keys", {
  id: int("id").autoincrement().primaryKey(),
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
export const soc2Controls = mysqlTable("soc2_controls", {
  id: int("id").autoincrement().primaryKey(),
  controlId: varchar("control_id", { length: 20 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["compliant", "partial", "non_compliant", "not_applicable"]).notNull().default("non_compliant"),
  ownerName: varchar("owner_name", { length: 100 }),
  notes: text("notes"),
  testingFrequency: varchar("testing_frequency", { length: 50 }),
  lastTestedAt: timestamp("last_tested_at"),
  evidenceUrls: json("evidence_urls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Soc2Control = typeof soc2Controls.$inferSelect;

// ─── ISO 27001 Controls ───────────────────────────────────────────────────────
export const iso27001Controls = mysqlTable("iso27001_controls", {
  id: int("id").autoincrement().primaryKey(),
  controlId: varchar("control_id", { length: 20 }).notNull(),
  clause: varchar("clause", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["compliant", "partial", "non_compliant", "not_applicable"]).notNull().default("non_compliant"),
  ownerName: varchar("owner_name", { length: 100 }),
  notes: text("notes"),
  testingFrequency: varchar("testing_frequency", { length: 50 }),
  lastTestedAt: timestamp("last_tested_at"),
  evidenceUrls: json("evidence_urls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Iso27001Control = typeof iso27001Controls.$inferSelect;

// ─── Compliance Evidence Files ────────────────────────────────────────────────
export const complianceEvidenceFiles = mysqlTable("compliance_evidence_files", {
  id: int("id").autoincrement().primaryKey(),
  controlType: mysqlEnum("control_type", ["soc2", "iso27001"]).notNull(),
  controlId: int("control_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: int("uploaded_by"),
  uploadedAt: bigint("uploaded_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }),
});
export type ComplianceEvidenceFile = typeof complianceEvidenceFiles.$inferSelect;

// ─── AI Compliance Engine — Threat Detection ──────────────────────────────────
export const complianceThreats = mysqlTable("compliance_threats", {
  id: int("id").autoincrement().primaryKey(),
  threatType: mysqlEnum("threat_type", ["fraud", "access_anomaly", "data_exfiltration", "policy_violation", "regulatory_breach", "predictive_warning"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull().default("medium"),
  status: mysqlEnum("status", ["detected", "investigating", "confirmed", "mitigated", "false_positive"]).notNull().default("detected"),
  eventId: varchar("event_id", { length: 128 }),
  sourceSystem: varchar("source_system", { length: 64 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  evidence: json("evidence"),
  affectedEntities: json("affected_entities"),
  aiConfidence: float("ai_confidence").default(0),
  aiReasoning: text("ai_reasoning"),
  remediationAction: varchar("remediation_action", { length: 255 }),
  remediationTakenAt: timestamp("remediation_taken_at"),
  detectedBy: varchar("detected_by", { length: 64 }).notNull().default("compliance_engine"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ComplianceThreat = typeof complianceThreats.$inferSelect;

export const complianceFrameworkChecks = mysqlTable("compliance_framework_checks", {
  id: int("id").autoincrement().primaryKey(),
  framework: mysqlEnum("framework", ["iso27001", "soc2"]).notNull(),
  controlRef: varchar("control_ref", { length: 20 }).notNull(),
  controlName: varchar("control_name", { length: 255 }).notNull(),
  checkType: mysqlEnum("check_type", ["automated", "manual", "ai_assessed"]).notNull().default("automated"),
  status: mysqlEnum("status", ["passing", "failing", "warning", "not_assessed"]).notNull().default("not_assessed"),
  lastCheckedAt: timestamp("last_checked_at"),
  details: text("details"),
  evidence: json("evidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ComplianceFrameworkCheck = typeof complianceFrameworkChecks.$inferSelect;

export const sustainabilityReports = mysqlTable("sustainability_reports", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  eventTitle: varchar("event_title", { length: 512 }).default(""),
  totalAttendees: int("total_attendees").default(0).notNull(),
  durationHours: float("duration_hours").default(1).notNull(),
  isVirtual: boolean("is_virtual").default(true),
  physicalCo2Tonnes: float("physical_co2_tonnes").default(0).notNull(),
  virtualCo2Tonnes: float("virtual_co2_tonnes").default(0).notNull(),
  carbonSavedTonnes: float("carbon_saved_tonnes").default(0).notNull(),
  savingsPercent: float("savings_percent").default(0).notNull(),
  totalCostAvoidedUsd: float("total_cost_avoided_usd").default(0).notNull(),
  grade: varchar("grade", { length: 4 }).default("B").notNull(),
  breakdownJson: json("breakdown_json"),
  country: varchar("country", { length: 8 }).default("ZA"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SustainabilityReport = typeof sustainabilityReports.$inferSelect;

export const broadcastSessions = mysqlTable("broadcast_sessions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  presenterName: varchar("presenter_name", { length: 256 }),
  avgWpm: float("avg_wpm").default(0),
  optimalWpmMin: int("optimal_wpm_min").default(130),
  optimalWpmMax: int("optimal_wpm_max").default(160),
  paceAlerts: int("pace_alerts").default(0),
  fillerWordCount: int("filler_word_count").default(0),
  keyMomentsJson: json("key_moments_json"),
  recapJson: json("recap_json"),
  recapGeneratedAt: timestamp("recap_generated_at"),
  durationSeconds: int("duration_seconds").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type BroadcastSession = typeof broadcastSessions.$inferSelect;

export const studioSessions = mysqlTable("studio_sessions", {
  id: int("id").autoincrement().primaryKey(),
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
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type StudioSession = typeof studioSessions.$inferSelect;

export const archiveEvents = mysqlTable("archive_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: mysqlEnum("event_type", [
    "earnings_call", "interim_results", "agm", "capital_markets_day",
    "ceo_town_hall", "board_meeting", "webcast", "investor_day", "roadshow", "special_call", "other",
  ]).notNull(),
  eventDate: varchar("event_date", { length: 32 }),
  platform: varchar("platform", { length: 64 }),
  transcriptText: longtext("transcript_text").notNull(),
  wordCount: int("word_count").default(0),
  segmentCount: int("segment_count").default(0),
  sentimentAvg: float("sentiment_avg"),
  complianceFlags: int("compliance_flags").default(0),
  taggedMetricsGenerated: int("tagged_metrics_generated").default(0),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  notes: text("notes"),
  aiReport: json("ai_report"),
  specialisedAnalysis: json("specialised_analysis"),
  specialisedAlgorithmsRun: int("specialised_algorithms_run").default(0),
  specialisedSessionId: int("specialised_session_id"),
  specialisedSessionType: varchar("specialised_session_type", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ArchiveEvent = typeof archiveEvents.$inferSelect;
export type InsertArchiveEvent = typeof archiveEvents.$inferInsert;

export const aiEvolutionObservations = mysqlTable("ai_evolution_observations", {
  id: int("id").autoincrement().primaryKey(),
  sourceType: mysqlEnum("source_type", ["live_session", "archive_upload", "transcript_paste"]).notNull(),
  sourceId: int("source_id"),
  eventType: varchar("event_type", { length: 64 }),
  clientName: varchar("client_name", { length: 255 }),
  observationType: mysqlEnum("observation_type", [
    "weak_module", "missing_capability", "repeated_pattern",
    "operator_friction", "data_gap", "cross_event_trend",
  ]).notNull(),
  moduleName: varchar("module_name", { length: 128 }),
  observation: text("observation").notNull(),
  confidence: float("confidence").default(0.5),
  suggestedCapability: varchar("suggested_capability", { length: 255 }),
  rawContext: json("raw_context"),
  clusterId: int("cluster_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiEvolutionObservation = typeof aiEvolutionObservations.$inferSelect;

export const aiToolProposals = mysqlTable("ai_tool_proposals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "analysis", "tracking", "automation", "reporting", "integration",
  ]).notNull(),
  rationale: text("rationale").notNull(),
  evidenceCount: int("evidence_count").default(0),
  avgConfidence: float("avg_confidence").default(0),
  observationIds: json("observation_ids"),
  status: mysqlEnum("status", [
    "emerging", "proposed", "approved", "building", "live", "rejected",
  ]).default("emerging").notNull(),
  estimatedImpact: mysqlEnum("estimated_impact", ["low", "medium", "high", "transformative"]).default("medium"),
  promptTemplate: text("prompt_template"),
  moduleSpec: json("module_spec"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AiToolProposal = typeof aiToolProposals.$inferSelect;

export const conferenceDialouts = mysqlTable("conference_dialouts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  conferenceName: varchar("conference_name", { length: 128 }).notNull(),
  callerId: varchar("caller_id", { length: 32 }).notNull(),
  totalParticipants: int("total_participants").notNull().default(0),
  connectedCount: int("connected_count").notNull().default(0),
  failedCount: int("failed_count").notNull().default(0),
  status: mysqlEnum("status", ["pending", "dialling", "active", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  endedAt: bigint("ended_at", { mode: "number" }),
});
export type ConferenceDialout = typeof conferenceDialouts.$inferSelect;

export const conferenceDialoutParticipants = mysqlTable("conference_dialout_participants", {
  id: int("id").autoincrement().primaryKey(),
  dialoutId: int("dialout_id").notNull(),
  phoneNumber: varchar("phone_number", { length: 32 }).notNull(),
  label: varchar("label", { length: 255 }),
  callSid: varchar("call_sid", { length: 128 }),
  status: mysqlEnum("status", [
    "queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "cancelled",
  ]).default("queued").notNull(),
  durationSecs: int("duration_secs"),
  answeredAt: bigint("answered_at", { mode: "number" }),
  endedAt: bigint("ended_at", { mode: "number" }),
  errorMessage: varchar("error_message", { length: 512 }),
});
export type ConferenceDialoutParticipant = typeof conferenceDialoutParticipants.$inferSelect;

export const agmResolutions = mysqlTable("agm_resolutions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  resolutionNumber: int("resolution_number").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  category: mysqlEnum("category", [
    "ordinary", "special", "advisory",
    "remuneration", "board_election", "auditor_appointment",
    "share_repurchase", "dividend", "esg", "other",
  ]).default("ordinary").notNull(),
  proposedBy: varchar("proposed_by", { length: 255 }),
  sentimentDuringDebate: float("sentiment_during_debate"),
  predictedApprovalPct: float("predicted_approval_pct"),
  actualApprovalPct: float("actual_approval_pct"),
  predictionAccuracy: float("prediction_accuracy"),
  dissenterCount: int("dissenter_count").default(0),
  complianceFlags: json("compliance_flags"),
  aiAnalysis: json("ai_analysis"),
  status: mysqlEnum("status", ["pending", "debating", "voted", "carried", "defeated", "withdrawn"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AgmResolution = typeof agmResolutions.$inferSelect;

export const agmIntelligenceSessions = mysqlTable("agm_intelligence_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  shadowSessionId: int("shadow_session_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  agmTitle: varchar("agm_title", { length: 512 }).notNull(),
  agmDate: varchar("agm_date", { length: 32 }),
  jurisdiction: mysqlEnum("jurisdiction", [
    "south_africa", "united_kingdom", "united_states", "australia", "other",
  ]).default("south_africa").notNull(),
  totalResolutions: int("total_resolutions").default(0),
  resolutionsCarried: int("resolutions_carried").default(0),
  resolutionsDefeated: int("resolutions_defeated").default(0),
  quorumMet: boolean("quorum_met").default(false),
  quorumPercentage: float("quorum_percentage"),
  attendanceCount: int("attendance_count").default(0),
  proxyCount: int("proxy_count").default(0),
  overallSentiment: float("overall_sentiment"),
  governanceScore: float("governance_score"),
  dissentIndex: float("dissent_index"),
  regulatoryAlerts: int("regulatory_alerts").default(0),
  qaQuestionsTotal: int("qa_questions_total").default(0),
  qaQuestionsGovernance: int("qa_questions_governance").default(0),
  aiGovernanceReport: json("ai_governance_report"),
  evolutionObservationsGenerated: int("evolution_observations_generated").default(0),
  status: mysqlEnum("status", ["setup", "live", "processing", "completed", "failed"]).default("setup").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AgmIntelligenceSession = typeof agmIntelligenceSessions.$inferSelect;

export const agmDissentPatterns = mysqlTable("agm_dissent_patterns", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  patternType: mysqlEnum("pattern_type", [
    "recurring_dissenter", "category_dissent", "threshold_breach",
    "institutional_block", "cross_client_trend", "emerging_risk",
  ]).notNull(),
  category: varchar("category", { length: 128 }),
  description: text("description").notNull(),
  frequency: int("frequency").default(1),
  confidence: float("confidence").default(0.5),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  sessionIds: json("session_ids"),
  evidenceData: json("evidence_data"),
  actionRecommendation: text("action_recommendation"),
  decayedScore: float("decayed_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AgmDissentPattern = typeof agmDissentPatterns.$inferSelect;

export const agmGovernanceObservations = mysqlTable("agm_governance_observations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  algorithmSource: mysqlEnum("algorithm_source", [
    "resolution_sentiment", "dissent_pattern", "qa_governance_triage",
    "quorum_intelligence", "regulatory_guardian", "governance_report",
  ]).notNull(),
  observationType: mysqlEnum("observation_type", [
    "prediction_made", "risk_detected", "compliance_flag",
    "pattern_identified", "benchmark_deviation", "intervention_suggested",
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "low", "medium", "high", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  detail: text("detail").notNull(),
  confidence: float("confidence").default(0.5),
  relatedResolutionId: int("related_resolution_id"),
  rawData: json("raw_data"),
  fedToEvolution: boolean("fed_to_evolution").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AgmGovernanceObservation = typeof agmGovernanceObservations.$inferSelect;

export const lumiBookings = mysqlTable("lumi_bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  agmTitle: varchar("agm_title", { length: 512 }).notNull(),
  agmDate: varchar("agm_date", { length: 32 }),
  agmTime: varchar("agm_time", { length: 16 }),
  jurisdiction: mysqlEnum("jurisdiction", ["south_africa", "united_kingdom", "united_states", "australia", "other"]).default("south_africa").notNull(),
  expectedAttendees: int("expected_attendees"),
  meetingUrl: varchar("meeting_url", { length: 1000 }),
  platform: mysqlEnum("platform", ["zoom", "teams", "meet", "webex", "webphone", "other"]).default("zoom").notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  lumiReference: varchar("lumi_reference", { length: 128 }),
  lumiRecipients: text("lumi_recipients"),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  dashboardToken: varchar("dashboard_token", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["booked", "setup", "ready", "live", "completed", "cancelled"]).default("booked").notNull(),
  checklist: json("checklist"),
  shadowSessionId: int("shadow_session_id"),
  agmSessionId: int("agm_session_id"),
  notes: text("notes"),
  resolutionsJson: json("resolutions_json"),
  reportDelivered: boolean("report_delivered").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type LumiBooking = typeof lumiBookings.$inferSelect;

// ─── Bastion Capital Partners — Investor Intelligence Tables ─────────────────

export const bastionIntelligenceSessions = mysqlTable("bastion_intelligence_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  shadowSessionId: int("shadow_session_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 512 }).notNull(),
  eventType: mysqlEnum("event_type", [
    "earnings_call", "agm", "investor_day", "roadshow", "capital_markets_day", "special_call", "other",
  ]).default("earnings_call").notNull(),
  eventDate: varchar("event_date", { length: 32 }),
  sector: varchar("sector", { length: 128 }),
  ticker: varchar("ticker", { length: 32 }),
  overallSentiment: float("overall_sentiment"),
  managementToneScore: float("management_tone_score"),
  credibilityScore: float("credibility_score"),
  marketMovingStatements: int("market_moving_statements").default(0),
  forwardGuidanceCount: int("forward_guidance_count").default(0),
  analystQuestionsTotal: int("analyst_questions_total").default(0),
  analystQuestionsHostile: int("analyst_questions_hostile").default(0),
  investmentBrief: json("investment_brief"),
  evolutionObservationsGenerated: int("evolution_observations_generated").default(0),
  status: mysqlEnum("status", ["setup", "live", "processing", "completed", "failed"]).default("setup").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type BastionIntelligenceSession = typeof bastionIntelligenceSessions.$inferSelect;

export const bastionInvestorObservations = mysqlTable("bastion_investor_observations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  algorithmSource: mysqlEnum("algorithm_source", [
    "earnings_sentiment", "forward_guidance", "analyst_question_intel",
    "credibility_scorer", "market_moving_detector", "investment_brief",
  ]).notNull(),
  observationType: mysqlEnum("observation_type", [
    "prediction_made", "risk_detected", "compliance_flag",
    "pattern_identified", "benchmark_deviation", "intervention_suggested",
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "low", "medium", "high", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  detail: text("detail").notNull(),
  confidence: float("confidence").default(0.5),
  rawData: json("raw_data"),
  fedToEvolution: boolean("fed_to_evolution").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BastionInvestorObservation = typeof bastionInvestorObservations.$inferSelect;

export const bastionGuidanceTracker = mysqlTable("bastion_guidance_tracker", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  ticker: varchar("ticker", { length: 32 }),
  sessionId: int("session_id").notNull(),
  guidanceType: mysqlEnum("guidance_type", [
    "revenue", "earnings", "margins", "capex", "headcount", "market_share", "other",
  ]).notNull(),
  statement: text("statement").notNull(),
  confidenceLevel: mysqlEnum("confidence_level", ["firm", "tentative", "aspirational"]).default("tentative").notNull(),
  numericValue: varchar("numeric_value", { length: 128 }),
  timeframe: varchar("timeframe", { length: 64 }),
  priorGuidanceId: int("prior_guidance_id"),
  priorValue: varchar("prior_value", { length: 128 }),
  delta: varchar("delta", { length: 64 }),
  metOrMissed: mysqlEnum("met_or_missed", ["met", "missed", "exceeded", "pending"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BastionGuidanceEntry = typeof bastionGuidanceTracker.$inferSelect;

export const bastionBookings = mysqlTable("bastion_bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventTitle: varchar("event_title", { length: 512 }).notNull(),
  eventType: mysqlEnum("event_type", [
    "earnings_call", "agm", "investor_day", "roadshow", "capital_markets_day", "special_call", "other",
  ]).default("earnings_call").notNull(),
  eventDate: varchar("event_date", { length: 32 }),
  eventTime: varchar("event_time", { length: 16 }),
  sector: varchar("sector", { length: 128 }),
  ticker: varchar("ticker", { length: 32 }),
  expectedAttendees: int("expected_attendees"),
  meetingUrl: varchar("meeting_url", { length: 1000 }),
  platform: mysqlEnum("platform", ["zoom", "teams", "meet", "webex", "webphone", "other"]).default("zoom").notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  bastionReference: varchar("bastion_reference", { length: 128 }),
  confirmationRecipients: text("confirmation_recipients"),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  dashboardToken: varchar("dashboard_token", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["booked", "setup", "ready", "live", "completed", "cancelled"]).default("booked").notNull(),
  checklist: json("checklist"),
  shadowSessionId: int("shadow_session_id"),
  bastionSessionId: int("bastion_session_id"),
  notes: text("notes"),
  reportDelivered: boolean("report_delivered").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type BastionBooking = typeof bastionBookings.$inferSelect;

export const disclosureCertificates = mysqlTable("disclosure_certificates", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  sessionId: int("session_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  transcriptHash: varchar("transcript_hash", { length: 128 }).notNull(),
  reportHash: varchar("report_hash", { length: 128 }).notNull(),
  complianceStatus: mysqlEnum("compliance_status", ["clean", "flagged", "review_required"]).default("clean").notNull(),
  complianceFlags: int("compliance_flags").default(0),
  jurisdictions: json("jurisdictions"),
  hashChain: json("hash_chain"),
  previousCertHash: varchar("previous_cert_hash", { length: 128 }),
  certificateHash: varchar("certificate_hash", { length: 128 }).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
});

export const crisisPredictions = mysqlTable("crisis_predictions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id"),
  eventId: varchar("event_id", { length: 128 }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  riskLevel: mysqlEnum("risk_level", ["low", "moderate", "elevated", "high", "critical"]).default("low").notNull(),
  riskScore: float("risk_score").default(0),
  predictedCrisisType: varchar("predicted_crisis_type", { length: 128 }),
  indicators: json("indicators"),
  sentimentTrajectory: json("sentiment_trajectory"),
  holdingStatement: text("holding_statement"),
  regulatoryChecklist: json("regulatory_checklist"),
  alertSent: boolean("alert_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const valuationImpacts = mysqlTable("valuation_impacts", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  priorSentiment: float("prior_sentiment"),
  postSentiment: float("post_sentiment"),
  sentimentDelta: float("sentiment_delta"),
  predictedShareImpact: varchar("predicted_share_impact", { length: 64 }),
  fairValueGap: varchar("fair_value_gap", { length: 64 }),
  materialDisclosures: json("material_disclosures"),
  riskFactors: json("risk_factors"),
  analystConsensusImpact: varchar("analyst_consensus_impact", { length: 128 }),
  marketReactionPrediction: text("market_reaction_prediction"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  reportMonth: varchar("report_month", { length: 7 }).notNull(),
  clientName: varchar("client_name", { length: 255 }),
  totalEvents: int("total_events").default(0),
  avgSentiment: float("avg_sentiment"),
  totalComplianceFlags: int("total_compliance_flags").default(0),
  communicationHealthScore: float("communication_health_score"),
  reportData: json("report_data"),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const advisoryChatMessages = mysqlTable("advisory_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("session_key", { length: 128 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  eventIds: json("event_ids"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evolutionAuditLog = mysqlTable("evolution_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  actionType: mysqlEnum("action_type", [
    "tool_proposed", "shadow_test_started", "shadow_test_passed", "shadow_test_failed",
    "tool_deployed", "tool_deactivated", "tool_promoted", "roadmap_updated"
  ]).notNull(),
  proposalId: int("proposal_id"),
  proposalTitle: varchar("proposal_title", { length: 255 }),
  details: json("details"),
  blockchainHash: varchar("blockchain_hash", { length: 128 }),
  previousHash: varchar("previous_hash", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const capabilityRoadmap = mysqlTable("capability_roadmap", {
  id: int("id").autoincrement().primaryKey(),
  timeframe: mysqlEnum("timeframe", ["30_days", "60_days", "90_days"]).notNull(),
  capability: varchar("capability", { length: 255 }).notNull(),
  rationale: text("rationale"),
  gapScore: float("gap_score"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["predicted", "in_progress", "completed", "dismissed"]).default("predicted").notNull(),
  proposalId: int("proposal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const liveQaSessions = mysqlTable("live_qa_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionCode: varchar("session_code", { length: 20 }).notNull().unique(),
  shadowSessionId: int("shadow_session_id"),
  eventName: varchar("event_name", { length: 500 }).notNull(),
  clientName: varchar("client_name", { length: 255 }),
  status: mysqlEnum("qa_session_status", ["active", "paused", "closed"]).default("active").notNull(),
  totalQuestions: int("total_questions").default(0),
  totalApproved: int("total_approved").default(0),
  totalRejected: int("total_rejected").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const liveQaQuestions = mysqlTable("live_qa_questions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  questionText: text("question_text").notNull(),
  submitterName: varchar("submitter_name", { length: 200 }),
  submitterEmail: varchar("submitter_email", { length: 255 }),
  submitterCompany: varchar("submitter_company", { length: 200 }),
  category: mysqlEnum("question_category", ["financial", "operational", "esg", "governance", "strategy", "general"]).default("general").notNull(),
  status: mysqlEnum("question_status", ["pending", "triaged", "approved", "answered", "rejected", "flagged"]).default("pending").notNull(),
  upvotes: int("upvotes").default(0),
  triageScore: float("triage_score"),
  triageClassification: varchar("triage_classification", { length: 32 }),
  triageReason: text("triage_reason"),
  complianceRiskScore: float("compliance_risk_score"),
  priorityScore: float("priority_score"),
  isAnonymous: boolean("is_anonymous").default(false),
  operatorNotes: text("operator_notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).$defaultFn(() => Date.now()),
});

export const liveQaAnswers = mysqlTable("live_qa_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("question_id").notNull(),
  answerText: text("answer_text").notNull(),
  isAutoDraft: boolean("is_auto_draft").default(false),
  autoDraftReasoning: text("auto_draft_reasoning"),
  approvedByOperator: boolean("approved_by_operator").default(false),
  answeredAt: bigint("answered_at", { mode: "number" }).$defaultFn(() => Date.now()),
});

export const liveQaComplianceFlags = mysqlTable("live_qa_compliance_flags", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("question_id").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(),
  riskScore: float("risk_score").notNull(),
  riskType: varchar("risk_type", { length: 100 }).notNull(),
  riskDescription: text("risk_description"),
  recommendedAction: mysqlEnum("recommended_action", ["forward", "route_to_bot", "legal_review", "delay_24h"]).default("forward").notNull(),
  autoRemediationSuggestion: text("auto_remediation_suggestion"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveQaPlatformShares = mysqlTable("live_qa_platform_shares", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  platform: mysqlEnum("platform", ["zoom", "teams", "webex", "meet", "generic"]).notNull(),
  shareType: mysqlEnum("share_type", ["link", "embed", "widget"]).default("link").notNull(),
  shareLink: varchar("share_link", { length: 1000 }).notNull(),
  whiteLabel: boolean("white_label").default(false),
  brandName: varchar("brand_name", { length: 255 }),
  brandColor: varchar("brand_color", { length: 7 }),
  clickCount: int("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
