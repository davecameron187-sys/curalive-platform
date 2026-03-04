import { boolean, int, mysqlEnum, mysqlTable, text, longtext, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

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
  // Stripe billing identifiers
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
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
  showChorusWatermark: boolean("show_chorus_watermark").default(true),
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
  botName: varchar("bot_name", { length: 200 }).default("Chorus.AI"),
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
