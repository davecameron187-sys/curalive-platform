import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, ShadingType, BorderStyle,
} from "docx";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public");
mkdirSync(outDir, { recursive: true });

const ORANGE = "C05621";
const GREEN  = "065F46";
const BLUE   = "1E3A8A";
const VIOLET = "5B21B6";
const RED    = "991B1B";
const DARK   = "1F2937";
const MID    = "374151";
const LIGHT  = "6B7280";

function hd(text, bg) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 26 })],
    shading: { type: ShadingType.SOLID, color: bg },
    spacing: { before: 320, after: 120 },
    indent: { left: 100 },
  });
}

function sub(text, bg) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 21 })],
    shading: { type: ShadingType.SOLID, color: bg },
    spacing: { before: 200, after: 80 },
    indent: { left: 200 },
  });
}

function p(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: DARK })],
    spacing: { before: 60, after: 60 },
    indent: { left: 280 },
  });
}

function b(text, indent = 360) {
  return new Paragraph({
    children: [new TextRun({ text: `\u2022  ${text}`, size: 20, color: DARK })],
    spacing: { before: 50, after: 50 },
    indent: { left: indent },
  });
}

function db(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "Database table: ", bold: true, size: 18, color: LIGHT }),
      new TextRun({ text, size: 18, color: LIGHT, italics: true }),
    ],
    spacing: { before: 30, after: 80 },
    indent: { left: 480 },
  });
}

function gap(text) {
  return new Paragraph({
    children: [new TextRun({ text: `\u26A0\uFE0F  ${text}`, size: 20, color: RED, bold: true })],
    spacing: { before: 80, after: 80 },
    indent: { left: 360 },
  });
}

function hr() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D1D5DB" } },
    spacing: { before: 160, after: 160 },
  });
}

const doc = new Document({
  creator: "CuraLive Platform",
  title: "CuraLive Platform Architecture",
  description: "Infrastructure & Data Flow Technical Reference",
  sections: [{
    properties: {},
    children: [
      // ── Title block
      new Paragraph({
        children: [new TextRun({ text: "CuraLive Platform Architecture", bold: true, size: 44, color: "FFFFFF" })],
        shading: { type: ShadingType.SOLID, color: "1D4ED8" },
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Infrastructure & Data Flow  \u2014  Technical Reference Document", size: 22, color: "DBEAFE", italics: true })],
        shading: { type: ShadingType.SOLID, color: "1E40AF" },
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 360 },
      }),

      // ── OVERVIEW
      hd("OVERVIEW", BLUE),
      p("CuraLive is a real-time investor events platform. The Operator Console (OCC) is the central engine — all dial-in calls, dial-out calls, event management, participant control, chat, Q&A, recording, and post-event intelligence flow through it. Booking forms and registration forms feed into the OCC from either side."),
      hr(),

      // ── BOOKING FORMS
      hd("BOOKING FORMS — How Events Are Created & Loaded Into the OCC", ORANGE),

      sub("Step 1 — Create Event Wizard  (/create-event)", ORANGE),
      b("Operators build the event on the CuraLive platform"),
      b("Sets: event name, type, date, dial-in numbers, speakers, schedule"),
      b("Also configures: branding, registration page layout, webcast settings"),
      db("events — stores eventId, name, type, date, all core event fields"),
      db("event_customisation — per-event branding, registration config, booking form settings"),

      sub("Step 2 — Event Stored in Database", ORANGE),
      b("Every event gets a unique eventId"),
      b("This eventId is the key that links everything: OCC conference, participants, recordings, analytics, invoices"),
      b("The event_customisation table holds the booking form configuration for that event"),

      sub("Step 3 — OCC Loads Event for the Day", ORANGE),
      b("Operator opens the OCC and selects the event for the session"),
      b("OCC creates an occ_conferences record linked to the eventId"),
      b("All participants, dial-in/out, chat, and recordings attach to that conference record"),
      db("occ_conferences — the live conference record created when the OCC session starts"),

      sub("Outstanding — What Needs Building", RED),
      gap("A Booking Form panel inside the OCC so operators can view the day's event details without leaving the console"),
      gap("Ability to view and edit event configuration from within the OCC operator view"),
      hr(),

      // ── REGISTRATION FORMS
      hd("REGISTRATION FORMS — How Attendees Sign Up & Are Managed", VIOLET),

      sub("How Attendees Register", VIOLET),
      b("Attendees visit /registration or /webcast-register pages"),
      b("They fill in: name, email, company, and event-specific fields"),
      b("On submission a 5-digit PIN is auto-assigned — used to authenticate on the telephone bridge"),
      db("attendee_registrations — stores all registrations for telephone / video events"),
      db("webcast_registrations — stores all registrations for webcast / webinar events"),

      sub("Where Registrations Are Stored", VIOLET),
      b("Both tables store: eventId, full name, email, company, PIN, registration timestamp"),
      b("The PIN in attendee_registrations is what the IVR validates when the attendee calls in"),
      b("Both tables are linked to the events table via eventId"),

      sub("How Registrations Are Accessed", VIOLET),
      b("The OCC participant list reads directly from attendee_registrations for the active event"),
      b("Operators see all registrants, their status (admitted / waiting / holding), and can resend PINs"),
      b("Webcast registrations are accessible via the Webcasting Hub and OCC webcast panel"),
      db("occ_participants — created when a registered attendee actually joins the call"),

      sub("Outstanding — What Needs Building", RED),
      gap("A Registrations Management panel inside the OCC: browse, filter, search, manage all sign-ups for the day's event"),
      gap("Export to CSV capability for post-event records"),
      hr(),

      // ── OCC
      hd("OCC — OPERATOR CONSOLE  (Central Driving Engine)", GREEN),

      sub("Conference Room", GREEN),
      b("The core of every event — all participants, audio, and controls live here"),
      b("Operator sees who is waiting, who is live, who is on hold"),
      b("Admits participants from the waiting queue (dial-in callers)"),
      db("occ_conferences, occ_participants"),

      sub("Green Room & Lounge", GREEN),
      b("Speakers and panellists join the Green Room before the event starts"),
      b("Operator can speak privately with speakers before moving them live"),
      b("The Lounge is a virtual waiting space for attendees before admittance"),
      db("occ_green_rooms, occ_lounge"),

      sub("Chat & Q&A Moderation", GREEN),
      b("Operators see and moderate all live chat during the event"),
      b("Q&A questions submitted by attendees appear in a dedicated queue"),
      b("Operators can flag, answer, or dismiss questions"),
      db("occ_chat_messages, occ_operator_requests"),

      sub("Audio Recording", GREEN),
      b("All conference calls are recorded automatically via Twilio"),
      b("Recordings stored and accessible for post-event intelligence processing"),
      db("occ_audio_files"),

      sub("Post-Event Actions", GREEN),
      b("After the event ends, OCC triggers: analytics, post-event reports, invoicing"),
      b("All intelligence data (sentiment, compliance, transcript) is processed from the recording"),
      db("post_event_reports, webcast_events, billing_invoices"),

      sub("Access Management", GREEN),
      b("OCC manages PIN validation — each inbound caller's PIN is checked against registrations"),
      b("Logs every access attempt (successful and failed)"),
      db("occ_access_code_log"),
      hr(),

      // ── TELEPHONY
      hd("TELEPHONY — Dial-In & Dial-Out  (Twilio / Telnyx)", BLUE),

      sub("DIAL-IN FLOW", "1E40AF"),
      b("Attendee dials the Twilio number provided on the event confirmation email"),
      b("IVR greets the caller and asks them to enter their 5-digit PIN followed by #"),
      b("PIN is validated against the attendee_registrations table"),
      b("If valid — OCC is notified of the inbound call"),
      b("Operator sees the call in the queue and clicks Admit"),
      b("Attendee is connected to the live conference"),
      db("occ_participants record created on admit"),

      sub("DIAL-OUT FLOW", "92400E"),
      b("Operator enters a phone number in the OCC Dial Out panel"),
      b("Twilio (primary carrier) or Telnyx (failover) places the outbound call"),
      b("The participant's phone rings — when they answer, they are connected to the conference"),
      b("Carrier health is monitored — auto-failover to Telnyx if Twilio is degraded"),
      db("occ_dial_out_history — logs carrier, status, duration for every outbound call"),
      db("webphone_sessions — tracks all operator call sessions"),

      sub("CCAudioOnly BRIDGE DIAL-OUT", ORANGE),
      b("Used when the event takes place on an external telephone conference bridge"),
      b("Operator logs the bridge dial-in number, conference ID, and access code in Shadow Mode"),
      b("Clicking 'Connect to Bridge' triggers the CuraLive server to call the bridge via Twilio"),
      b("DTMF tones are sent automatically to enter the conference ID and access code"),
      b("The platform joins the bridge as a silent listener and records the audio"),
      db("bridge_calls — tracks call SID, status, duration, session ID for every bridge connection"),
      hr(),

      // ── AI LAYER
      hd("AI INTELLIGENCE LAYER — Shadow Mode & Analytics", VIOLET),

      sub("Shadow Mode  (Recall.ai)", VIOLET),
      b("A Recall.ai bot joins Zoom, Microsoft Teams, or Google Meet meetings invisibly"),
      b("Clients see it as a regular participant — they do not know it is a bot"),
      b("Captures live audio and generates a real-time transcript, segmented every few seconds"),
      db("shadow_sessions, recall_bots"),

      sub("CCAudioOnly AI Capture", VIOLET),
      b("For telephone-only events, the bridge dial-out records the audio"),
      b("After the call, the recording is uploaded via Event Recording for AI processing"),
      b("Full pipeline: transcription \u2192 sentiment scoring \u2192 compliance flagging \u2192 database tagging"),

      sub("Intelligence Terminal  (/intelligence-terminal)", VIOLET),
      b("Bloomberg-style terminal with 4 tabs: Concern Intelligence, Market Signals, Exec Benchmarks, CICI Index"),
      b("Powered by GPT-4o analysis of tagged metrics across all events"),
      db("tagged_metrics, shadow_sessions, recall_bots"),

      sub("Post-Event Intelligence", VIOLET),
      b("Every event produces: sentiment trend, compliance flags, investor engagement score"),
      b("Anonymised data feeds the industry benchmarking dataset (CIPC patent strategy)"),
      b("Used by Lumi Global and Bastion Capital partner integrations"),
      hr(),

      // ── OUTSTANDING
      hd("OUTSTANDING ITEMS — What Needs to Be Built Next", RED),
      gap("Booking Form Panel inside OCC: operators view the day's event details without leaving the console"),
      gap("Registrations Management inside OCC: browse, filter, manage all sign-ups; export to CSV"),
      p("Both features connect directly to the events and attendee_registrations tables that already exist in the database."),

      // Footer
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        children: [new TextRun({
          text: `CuraLive Platform  \u2014  Confidential Technical Reference  |  Generated ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(outDir, "CuraLive_Platform_Architecture.docx"), buf);
console.log("Done.");
