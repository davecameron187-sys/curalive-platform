/**
 * TestGuide.tsx — CuraLive Internal Testing Reference Card
 * Updated: March 2026 — v6 — includes full webcasting workflow and Recall.ai bot testing
 */
import { ExternalLink, CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";

const BASE_URL = "https://curalive.cc";

interface TestStep {
  step: number;
  action: string;
  url?: string;
  note: string;
}

interface Section {
  id: string;
  number: string;
  title: string;
  role: string;
  roleColor: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  steps: TestStep[];
}

const SECTIONS: Section[] = [
  // ─── QUICK START ──────────────────────────────────────────────────────────
  {
    id: "quickstart",
    number: "0",
    title: "Quick Start — Login & Setup",
    role: "All Roles",
    roleColor: "text-slate-400",
    dotColor: "bg-amber-400",
    badgeBg: "bg-amber-400/15",
    badgeText: "text-amber-400",
    steps: [
      {
        step: 1,
        action: "Log in to the platform",
        url: `${BASE_URL}`,
        note: "Click the 'Login' button in the top-right corner of the homepage. Use your account credentials. The platform owner (David Cameron) is automatically granted admin + operator access.",
      },
      {
        step: 2,
        action: "Verify your role in the Admin panel",
        url: `${BASE_URL}/admin/users`,
        note: "After logging in, open the Admin Users page. You should see your account listed with role 'admin'. This confirms you have full operator access to create events, manage the studio, and access all protected features.",
      },
      {
        step: 3,
        action: "Browse the Platform Links reference",
        url: `${BASE_URL}/platform-links`,
        note: "This page lists all 35+ URLs on the platform, organised by section. Use the search bar to find any page quickly. Bookmark this page — it is your navigation map for the entire platform.",
      },
    ],
  },

  // ─── WEBCASTING WORKFLOW ──────────────────────────────────────────────────
  {
    id: "webcast_create",
    number: "1",
    title: "Webcasting — Create a New Event",
    role: "Operator",
    roleColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    badgeBg: "bg-emerald-400/15",
    badgeText: "text-emerald-400",
    steps: [
      {
        step: 1,
        action: "Open the Webcasting Hub",
        url: `${BASE_URL}/live-video/webcasting`,
        note: "This is the main portal for all webcast events. You will see 8 demo events pre-loaded across different event types and industry verticals. The 'New Event' button is in the top-right corner.",
      },
      {
        step: 2,
        action: "Create a new event using the wizard",
        url: `${BASE_URL}/live-video/webcast/create`,
        note: "Step 1: Choose event type (try 'Webcast' or 'Capital Markets'). Step 2: Enter a title, description, date, time, and timezone. Step 3: Set branding (logo URL, primary colour). Step 4: Add agenda items and speakers. Step 5: Configure registration fields. Step 6: Click Publish. You must be logged in for this step.",
      },
      {
        step: 3,
        action: "Confirm the event appears in the Webcasting Hub",
        url: `${BASE_URL}/live-video/webcasting`,
        note: "After publishing, your new event should appear in the event list. Click the Studio button to open the Webcast Studio for that event.",
      },
    ],
  },

  {
    id: "webcast_studio",
    number: "2",
    title: "Webcasting — Operator Studio Console",
    role: "Operator",
    roleColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    badgeBg: "bg-emerald-400/15",
    badgeText: "text-emerald-400",
    steps: [
      {
        step: 1,
        action: "Open the Webcast Studio for a demo event",
        url: `${BASE_URL}/live-video/webcast/q4-2025-earnings-webcast`,
        note: "The studio has 7 tabs: Q&A, Polls, Chat, Translation, Analytics, Bot, Stream, and Reminders. This is the operator's control centre during a live event.",
      },
      {
        step: 2,
        action: "Test the Q&A moderation tab",
        note: "The Q&A tab shows incoming questions. Click 'Approve' to move a question to the approved queue, or 'Reject' to remove it. Approved questions are visible to attendees in real time via Ably.",
      },
      {
        step: 3,
        action: "Create and launch a live poll",
        note: "Go to the Polls tab. Click 'New Poll', enter a question and 2–4 answer options, then click 'Launch Poll'. The poll will appear in the attendee event room immediately.",
      },
      {
        step: 4,
        action: "Test the Stream tab — publish a recording",
        note: "In the Stream tab, scroll to the 'Publish Recording' section. Paste a publicly accessible MP4 URL (e.g. from YouTube or Vimeo) or a Mux Playback ID. Click 'Publish Recording'. This transitions the event to 'On Demand' status.",
      },
      {
        step: 5,
        action: "Check the Reminders tab",
        note: "The Reminders tab shows how many registrants have received 24-hour and 1-hour reminder emails. Use 'Send to Pending' to send reminders to anyone who hasn't received one yet.",
      },
      {
        step: 6,
        action: "Deploy a Recall.ai bot (if testing Teams/Zoom integration)",
        note: "Go to the Bot tab. Enter a Teams or Zoom meeting URL and click 'Deploy Bot'. The bot will join the meeting, start recording, and stream the transcript back to this panel in real time via Ably. See Section 9 for the full bot testing workflow.",
      },
    ],
  },

  {
    id: "webcast_register",
    number: "3",
    title: "Webcasting — Attendee Registration",
    role: "Attendee",
    roleColor: "text-blue-400",
    dotColor: "bg-blue-400",
    badgeBg: "bg-blue-400/15",
    badgeText: "text-blue-400",
    steps: [
      {
        step: 1,
        action: "Open the registration page for a demo event",
        url: `${BASE_URL}/live-video/webcast/q4-2025-earnings-webcast/register`,
        note: "This is the public-facing registration landing page. It shows event details, speakers, and the registration form. The page template adapts based on the event's industry vertical (Financial Services, Healthcare CME, Government, etc.).",
      },
      {
        step: 2,
        action: "Register as an attendee",
        note: "Fill in your name, email address, and company. Click 'Register'. You will receive a confirmation email with a personal join link and a calendar invite (.ics file). Check your inbox — the email comes from the Resend API.",
      },
      {
        step: 3,
        action: "Check the confirmation email",
        note: "The email contains: (1) event details, (2) a personal join link with your unique token, and (3) a .ics calendar invite. Click the join link to go directly to your personal attendee room.",
      },
      {
        step: 4,
        action: "Verify the registration appears in the Studio",
        url: `${BASE_URL}/live-video/webcast/q4-2025-earnings-webcast`,
        note: "In the Webcast Studio, the Analytics tab should show the new registration. The Reminders tab should show the updated registered count.",
      },
    ],
  },

  {
    id: "webcast_attend",
    number: "4",
    title: "Webcasting — Attendee Event Room",
    role: "Attendee",
    roleColor: "text-blue-400",
    dotColor: "bg-blue-400",
    badgeBg: "bg-blue-400/15",
    badgeText: "text-blue-400",
    steps: [
      {
        step: 1,
        action: "Enter the attendee event room via your personal join link",
        note: "Use the link from your confirmation email (format: /live-video/webcast/:slug/attend?token=...). This is the token-gated attendee room — each attendee has a unique URL.",
      },
      {
        step: 2,
        action: "Test the live transcript feed",
        note: "The transcript panel on the right side shows real-time transcription delivered via Ably. If a Recall.ai bot is active in a connected meeting, transcripts will appear here within 1–2 seconds of being spoken.",
      },
      {
        step: 3,
        action: "Submit a question via the Q&A panel",
        note: "Type a question and click Submit. The question will appear in the Webcast Studio Q&A tab for the operator to approve or reject. Test upvoting an existing question.",
      },
      {
        step: 4,
        action: "Respond to a live poll",
        note: "If the operator has launched a poll in the Studio, it will appear as an overlay in the event room. Select an answer and submit. The results update in real time.",
      },
      {
        step: 5,
        action: "Test the language selector",
        note: "Use the language dropdown (top right) to switch between 12 languages. The transcript display language changes immediately. Supported: English, Afrikaans, Zulu, Xhosa, French, Portuguese, Arabic, Swahili, German, Spanish, Mandarin, Hindi.",
      },
    ],
  },

  {
    id: "webcast_ondemand",
    number: "5",
    title: "Webcasting — On-Demand Recording Access",
    role: "Attendee",
    roleColor: "text-blue-400",
    dotColor: "bg-blue-400",
    badgeBg: "bg-blue-400/15",
    badgeText: "text-blue-400",
    steps: [
      {
        step: 1,
        action: "Access the on-demand watch page via your personal watch link",
        note: "After the operator publishes a recording in the Studio Stream tab, the event transitions to 'On Demand'. Your personal watch link (format: /live-video/webcast/:slug/watch?token=...) will show the recording player.",
      },
      {
        step: 2,
        action: "Test the on-demand watch page directly",
        url: `${BASE_URL}/live-video/webcast/q4-2025-earnings-webcast/watch`,
        note: "Without a token, the page shows a 'Request Access' prompt. With a valid token, it shows the video player, event metadata, and a share link. Test both states.",
      },
      {
        step: 3,
        action: "Browse the On-Demand Library",
        url: `${BASE_URL}/live-video/on-demand`,
        note: "This is the searchable library of all on-demand recordings. Filter by event type, industry vertical, or CPD/CME certification status.",
      },
    ],
  },

  {
    id: "webcast_report",
    number: "6",
    title: "Webcasting — Post-Event Report",
    role: "Operator",
    roleColor: "text-emerald-400",
    dotColor: "bg-violet-400",
    badgeBg: "bg-violet-400/15",
    badgeText: "text-violet-400",
    steps: [
      {
        step: 1,
        action: "Open the post-event report for a demo event",
        url: `${BASE_URL}/live-video/webcast/q4-2025-earnings-webcast/report`,
        note: "The report shows: attendance statistics (registered, joined, peak), poll results with vote counts, the full Q&A log (approved and rejected), an AI-generated event summary, and the recording link.",
      },
      {
        step: 2,
        action: "Review the AI summary",
        note: "The AI summary is generated by the LLM from the event transcript and Q&A data. It includes key themes, notable questions, and a brief overview of the event.",
      },
      {
        step: 3,
        action: "Check the poll results",
        note: "Each poll shows the question, all answer options, vote counts, and percentage breakdown. Results are final once the event ends.",
      },
    ],
  },

  // ─── CLASSIC EVENT ROOM WORKFLOW ─────────────────────────────────────────
  {
    id: "start",
    number: "7",
    title: "Classic Event Room — Home & Sales Demo",
    role: "All Roles",
    roleColor: "text-slate-400",
    dotColor: "bg-slate-400",
    badgeBg: "bg-slate-400/15",
    badgeText: "text-slate-400",
    steps: [
      {
        step: 1,
        action: "Open the main platform homepage",
        url: `${BASE_URL}`,
        note: "Review the hero section, watch the embedded 55-second demo video, and explore the platform module cards. The homepage is the public-facing landing page.",
      },
      {
        step: 2,
        action: "Open the Sales Demo page",
        url: `${BASE_URL}/demo`,
        note: "This is the page to share with prospects. Review all 6 platform module cards, the feature grid, and the download button.",
      },
      {
        step: 3,
        action: "Enter the classic live event room",
        url: `${BASE_URL}/event/q4-earnings-2026`,
        note: "The classic event room shows a simulated live stream with real-time transcript, sentiment analysis, and Q&A. This is the original demo room — separate from the new webcasting platform.",
      },
    ],
  },

  {
    id: "moderator",
    number: "8",
    title: "Classic Event Room — Moderator Console",
    role: "Moderator",
    roleColor: "text-amber-400",
    dotColor: "bg-amber-400",
    badgeBg: "bg-amber-400/15",
    badgeText: "text-amber-400",
    steps: [
      {
        step: 1,
        action: "Open the moderator console",
        url: `${BASE_URL}/moderator/q4-earnings-2026`,
        note: "You will see the incoming Q&A queue with AI priority scores, sentiment tags, and compliance flags.",
      },
      {
        step: 2,
        action: "Approve and reject questions",
        note: "Click Approve on a question to move it to the 'Approved' queue. Click Reject to remove it. Test the toxicity filter.",
      },
      {
        step: 3,
        action: "Launch a live poll",
        note: "Click 'New Poll', enter a question and 3 options, and click Launch. Verify the poll appears in the attendee event room simultaneously.",
      },
      {
        step: 4,
        action: "Monitor the live sentiment graph",
        note: "Observe the real-time sentiment indicator. Verify it updates as the transcript progresses.",
      },
    ],
  },

  // ─── RECALL.AI BOT TESTING ────────────────────────────────────────────────
  {
    id: "recall_bot",
    number: "9",
    title: "Recall.ai Bot — Teams/Zoom Transcription",
    role: "Operator",
    roleColor: "text-emerald-400",
    dotColor: "bg-primary",
    badgeBg: "bg-primary/15",
    badgeText: "text-primary",
    steps: [
      {
        step: 1,
        action: "Start a Microsoft Teams or Zoom meeting",
        note: "Create a new Teams meeting from your Microsoft 365 account, or start a Zoom meeting. Copy the meeting join URL (e.g. https://teams.microsoft.com/meet/... or https://zoom.us/j/...).",
      },
      {
        step: 2,
        action: "Open the Webcast Studio Bot tab",
        url: `${BASE_URL}/live-video/webcast/q4-2025-earnings-webcast`,
        note: "In the Webcast Studio, click the 'Bot' tab. You will see the Recall.ai bot deployment panel.",
      },
      {
        step: 3,
        action: "Deploy the bot to your meeting",
        note: "Paste your meeting URL into the 'Meeting URL' field and click 'Deploy Bot'. The bot will appear in your meeting as a participant named 'CuraLive Bot'. You may need to admit it from the waiting room.",
      },
      {
        step: 4,
        action: "Admit the bot from the waiting room",
        note: "In Teams: click 'Admit' when the bot appears in the lobby. In Zoom: click 'Admit' in the Participants panel. The bot status in the Studio will change from 'In Waiting Room' to 'Recording'.",
      },
      {
        step: 5,
        action: "Speak clearly for 30–60 seconds",
        note: "Say something like: 'This is a test of the CuraLive transcription service. We are testing the real-time transcript delivery via the Recall.ai bot integration.' Speak clearly and at a normal pace.",
      },
      {
        step: 6,
        action: "Verify real-time transcript appears in the Bot panel",
        note: "Within 1–3 seconds of speaking, your words should appear in the transcript panel in the Studio Bot tab. Each segment shows the speaker name and timestamp. A green 'Live' badge confirms the Ably connection is active.",
      },
      {
        step: 7,
        action: "End the meeting and check the post-call transcript",
        note: "End the Teams/Zoom meeting. After 1–2 minutes, the bot status will change to 'Done'. The full diarized transcript (with speaker names and word-level timestamps) is available via the 'Get Transcript' button in the Bot panel.",
      },
    ],
  },

  // ─── OCC OPERATOR CONSOLE ────────────────────────────────────────────────
  {
    id: "occ",
    number: "10",
    title: "OCC — Operator Conference Console",
    role: "Operator",
    roleColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    badgeBg: "bg-emerald-400/15",
    badgeText: "text-emerald-400",
    steps: [
      {
        step: 1,
        action: "Open the OCC (Operator Conference Console)",
        url: `${BASE_URL}/occ`,
        note: "The OCC is the traditional telephony operator console — modelled on the VIER/Contex platform. It requires login with operator or admin role. You will see the Conference Overview with running, pending, and planned conferences.",
      },
      {
        step: 2,
        action: "Open a Conference Control Panel",
        note: "Click any conference row in the Conference Overview to open its Control Panel. You will see the participant list with real-time state, the conference bar (Record, Lock, Mute All), and the feature tabs (Q&A, Chat, History, Audio Files).",
      },
      {
        step: 3,
        action: "Test participant management",
        note: "Click a participant row to select them. Use the action bar to Mute, Unmute, Park, or Disconnect. Test the 'Speak Next' button on a raised-hand participant.",
      },
      {
        step: 4,
        action: "Test the Dial-Out feature",
        note: "Click the Dial-Out button in the Conference Bar. Enter a name, company, and phone number. Click Dial. The participant will appear in the list with 'Dialling' status.",
      },
    ],
  },

  // ─── POST-EVENT INTELLIGENCE ─────────────────────────────────────────────
  {
    id: "postevent",
    number: "11",
    title: "Classic Post-Event Intelligence Report",
    role: "Post-Event",
    roleColor: "text-violet-400",
    dotColor: "bg-violet-400",
    badgeBg: "bg-violet-400/15",
    badgeText: "text-violet-400",
    steps: [
      {
        step: 1,
        action: "Open the classic post-event report",
        url: `${BASE_URL}/post-event/board-briefing`,
        note: "Review the AI executive summary, financial highlights, and key themes sections.",
      },
      {
        step: 2,
        action: "Download the full transcript",
        note: "Click 'Download Transcript'. Verify the PDF downloads correctly with all content.",
      },
      {
        step: 3,
        action: "Generate the press release",
        note: "Click 'Generate Press Release'. Verify the SENS/RNS-style draft is produced within 10 seconds.",
      },
      {
        step: 4,
        action: "Check JSE/IFRS compliance section",
        note: "Verify the regulatory flags and compliance disclaimer are visible at the bottom of the report.",
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
      title="Copy URL"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
      )}
    </button>
  );
}

function SectionCard({ section }: { section: Section }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const allDone = section.steps.every((s) => checked[s.step]);

  return (
    <div
      className={`rounded-xl border transition-all ${
        allDone
          ? "border-emerald-500/40 bg-emerald-950/20"
          : "border-white/8 bg-white/[0.03]"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${section.dotColor}`} />
        <span className="font-semibold text-white text-sm flex-1">
          {section.number}. {section.title}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${section.badgeBg} ${section.badgeText}`}
        >
          {section.role}
        </span>
        {allDone && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            Done
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="divide-y divide-white/5">
        {section.steps.map((step) => (
          <div
            key={step.step}
            className={`flex gap-3 px-5 py-3 transition-colors ${
              checked[step.step] ? "opacity-50" : ""
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() =>
                setChecked((prev) => ({ ...prev, [step.step]: !prev[step.step] }))
              }
              className="mt-0.5 flex-shrink-0"
            >
              <CheckCircle2
                className={`w-4 h-4 transition-colors ${
                  checked[step.step] ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"
                }`}
              />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-slate-600 mt-0.5 flex-shrink-0">
                  {String(step.step).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      checked[step.step] ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {step.action}
                  </p>
                  {step.url && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-sky-400 hover:text-sky-300 hover:underline truncate max-w-xs"
                      >
                        {step.url.replace("https://", "")}
                      </a>
                      <ExternalLink className="w-3 h-3 text-sky-500 flex-shrink-0" />
                      <CopyButton text={step.url} />
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.note}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestGuide() {
  const [filter, setFilter] = useState<string>("all");

  const roles = [
    { id: "all", label: "All Sections", color: "text-slate-300" },
    { id: "All Roles", label: "Setup", color: "text-amber-400" },
    { id: "Operator", label: "Operator", color: "text-emerald-400" },
    { id: "Attendee", label: "Attendee", color: "text-blue-400" },
    { id: "Moderator", label: "Moderator", color: "text-amber-400" },
    { id: "Post-Event", label: "Post-Event", color: "text-violet-400" },
  ];

  const filtered =
    filter === "all"
      ? SECTIONS
      : SECTIONS.filter((s) => s.role === filter);

  return (
    <div
      className="min-h-screen bg-[#0a0e1a] text-foreground"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-white/8 bg-[#0a0e1a]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              ← CuraLive
            </a>
            <span className="text-slate-700">/</span>
            <span className="text-sm font-semibold text-white">In-House Testing Guide</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
              Internal Use Only
            </span>
            <span className="text-[10px] text-slate-600 font-mono">v6 · March 2026</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            In-House Testing Guide
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step-by-step instructions for testing every module of the CuraLive platform.
            Tick off each step as you complete it. Start with Section 0 (Login & Setup) before anything else.
            Estimated time: <strong className="text-slate-300">60–90 minutes</strong> for the full platform.
          </p>
        </div>

        {/* Base URL bar */}
        <div className="flex items-center justify-between bg-[#0f1629] border border-[#1e3a5f] border-l-4 border-l-amber-400 rounded-lg px-5 py-3 mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Platform URL</div>
            <div className="font-mono text-sm text-sky-400 font-bold">{BASE_URL}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>All links below are relative to this address</span>
            <CopyButton text={BASE_URL} />
          </div>
        </div>

        {/* Quick links bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {[
            { label: "Platform Links", url: `${BASE_URL}/platform-links`, color: "text-sky-400" },
            { label: "Webcasting Hub", url: `${BASE_URL}/live-video/webcasting`, color: "text-emerald-400" },
            { label: "Create Event", url: `${BASE_URL}/live-video/webcast/create`, color: "text-primary" },
            { label: "Admin Users", url: `${BASE_URL}/admin/users`, color: "text-amber-400" },
          ].map(({ label, url, color }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2 hover:border-white/20 transition-colors"
            >
              <ExternalLink className={`w-3 h-3 flex-shrink-0 ${color}`} />
              <span className={`text-xs font-semibold ${color}`}>{label}</span>
            </a>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mr-1">Filter by role:</span>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setFilter(r.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === r.id
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Important note */}
        <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg px-5 py-3 mb-8 flex items-start gap-3">
          <div className="text-amber-400 text-lg flex-shrink-0 mt-0.5">⚠️</div>
          <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <p className="text-sm font-semibold text-amber-200 mb-1">Before you start: Login required for operator features</p>
            <p className="text-xs text-amber-400/70 leading-relaxed">
              Creating events, managing the Webcast Studio, deploying bots, and accessing the OCC all require you to be logged in with an operator or admin role. The platform owner (David Cameron) is automatically set to admin. Other team members must be promoted to 'operator' role via the <a href={`${BASE_URL}/admin/users`} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">Admin Users page</a> before they can access operator features.
            </p>
          </div>
        </div>

        {/* Section grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 border-t border-white/8 pt-6 flex items-center justify-between">
          <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
            CuraLive — Confidential · Internal Use Only · Do Not Distribute
          </p>
          <a
            href="/platform-links"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            View All Platform Links →
          </a>
        </div>
      </div>
    </div>
  );
}
